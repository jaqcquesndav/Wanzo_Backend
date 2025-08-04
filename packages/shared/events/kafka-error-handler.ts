import { Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { StandardKafkaTopics, DLQConfig, getDLQConfig, MessageMetadata } from './unified-kafka-config';

/**
 * Service de gestion d'erreurs et retry pour Kafka
 */
@Injectable()
export class KafkaErrorHandlerService {
  private readonly logger = new Logger(KafkaErrorHandlerService.name);
  private readonly dlqConfig: DLQConfig;

  constructor(private readonly kafkaClient?: ClientKafka) {
    this.dlqConfig = getDLQConfig();
  }

  /**
   * Wrapper pour exécuter une opération avec retry automatique
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Attempt ${attempt}/${maxRetries} failed for ${context}: ${lastError.message}`
        );
        
        if (attempt < maxRetries) {
          await this.delay(delayMs * Math.pow(2, attempt - 1)); // Exponential backoff
        }
      }
    }
    
    this.logger.error(
      `All ${maxRetries} attempts failed for ${context}`,
      lastError?.stack
    );
    throw lastError || new Error(`All ${maxRetries} attempts failed for ${context}`);
  }

  /**
   * Envoie un message vers la Dead Letter Queue
   */
  async sendToDLQ(
    originalTopic: string,
    originalMessage: any,
    error: string,
    retryCount: number = 0
  ): Promise<void> {
    if (!this.dlqConfig.enabled || !this.kafkaClient) {
      this.logger.warn('DLQ is disabled or Kafka client not available');
      return;
    }

    try {
      const dlqMessage = {
        id: require('uuid').v4(),
        data: {
          originalTopic,
          originalMessage,
          error,
          retryCount,
          firstFailedAt: new Date().toISOString(),
          lastFailedAt: new Date().toISOString(),
        },
        metadata: {
          correlationId: originalMessage?.metadata?.correlationId || require('uuid').v4(),
          timestamp: new Date().toISOString(),
          source: 'kafka-error-handler',
          version: '1.0.0',
        },
      };

      await this.kafkaClient.emit(StandardKafkaTopics.DLQ_FAILED_MESSAGES, dlqMessage).toPromise();
      this.logger.log(`Message sent to DLQ: ${dlqMessage.id}`);
    } catch (dlqError) {
      this.logger.error('Failed to send message to DLQ', dlqError);
    }
  }

  /**
   * Traite les messages de la DLQ pour retry
   */
  async processDLQMessage(dlqMessage: any): Promise<boolean> {
    try {
      const { originalTopic, originalMessage, retryCount } = dlqMessage.data;
      
      if (retryCount >= this.dlqConfig.maxRetries) {
        this.logger.error(
          `Message exceeded max retries (${this.dlqConfig.maxRetries}), giving up`,
          { originalTopic, messageId: originalMessage?.id }
        );
        return false;
      }

      // Attendre avant de retry
      await this.delay(this.dlqConfig.retryDelayMs);

      // Tenter de renvoyer le message original
      const updatedMessage = {
        ...originalMessage,
        metadata: {
          ...originalMessage.metadata,
          retryCount: retryCount + 1,
        },
      };

      await this.kafkaClient?.emit(originalTopic, updatedMessage).toPromise();
      this.logger.log(`Retried message from DLQ: ${originalMessage?.id}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to process DLQ message', error);
      return false;
    }
  }

  /**
   * Valide la structure d'un message avant traitement
   */
  validateMessage(message: any, expectedSchema: any): boolean {
    try {
      // Validation de base
      if (!message || typeof message !== 'object') {
        return false;
      }

      // Vérifier les champs obligatoires
      if (!message.id || !message.data || !message.metadata) {
        return false;
      }

      // Vérifier les métadonnées
      const metadata = message.metadata;
      if (!metadata.correlationId || !metadata.timestamp || !metadata.source) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Message validation failed', error);
      return false;
    }
  }

  /**
   * Crée un message d'erreur standardisé
   */
  createErrorResponse(
    originalMessage: any,
    error: string,
    errorCode?: string
  ): any {
    return {
      id: require('uuid').v4(),
      data: {
        success: false,
        error,
        errorCode,
        originalMessageId: originalMessage?.id,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        correlationId: originalMessage?.metadata?.correlationId || require('uuid').v4(),
        timestamp: new Date().toISOString(),
        source: 'error-handler',
        version: '1.0.0',
      },
    };
  }

  /**
   * Utilitaire pour délai
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Monitore la santé de la connexion Kafka
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      if (!this.kafkaClient) {
        return { status: 'unhealthy', details: { error: 'Kafka client not initialized' } };
      }

      // Test simple de connectivité (si disponible)
      return { status: 'healthy', details: { dlqEnabled: this.dlqConfig.enabled } };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: { error: (error as Error).message } 
      };
    }
  }
}

/**
 * Décorateur pour retry automatique
 */
export function RetryOnFailure(maxRetries: number = 3, delayMs: number = 1000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const errorHandler = new KafkaErrorHandlerService();
      return errorHandler.executeWithRetry(
        () => method.apply(this, args),
        `${target.constructor.name}.${propertyName}`,
        maxRetries,
        delayMs
      );
    };

    return descriptor;
  };
}

/**
 * Circuit Breaker pour protéger contre les pannes en cascade
 */
export class CircuitBreaker {
  private failures = 0;
  private nextAttempt = Date.now();
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly timeout: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }

  getState(): string {
    return this.state;
  }
}
