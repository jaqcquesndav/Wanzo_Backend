import { Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { ADHA_AI_KAFKA_SERVICE } from './adha-ai-integration.module';

/**
 * Service de gestion des messages en échec pour les envoyer vers une DLQ
 */
@Injectable()
export class DlqService {
  private readonly logger = new Logger('DlqService');
  private readonly DLQ_TOPIC = 'dlq.failed.messages';

  constructor(
    @Inject(ADHA_AI_KAFKA_SERVICE) private readonly kafkaClient: ClientKafka
  ) {}

  /**
   * Envoie un message vers la Dead Letter Queue
   * 
   * @param message Message original qui a échoué
   * @param error Erreur rencontrée
   * @param source Source de l'erreur (service ou module)
   */
  async sendToDlq(message: any, error: Error | string, source: string): Promise<void> {
    try {
      const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
      const errorStack = typeof error === 'string' ? undefined : error.stack;
      
      // Préparer le message pour la DLQ
      const dlqMessage = {
        originalMessage: message,
        error: {
          message: errorMessage,
          stack: errorStack,
          timestamp: new Date().toISOString(),
        },
        source,
        service: 'portfolio-institution-service',
      };
      
      // Envoyer à la DLQ
      await this.kafkaClient.emit(this.DLQ_TOPIC, dlqMessage).toPromise();
      
      this.logger.warn(`Message sent to DLQ: ${JSON.stringify({
        id: message?.id || 'unknown',
        error: errorMessage
      })}`);
    } catch (dlqError: any) {
      this.logger.error(
        `Failed to send message to DLQ: ${dlqError.message || 'Unknown error'}`,
        dlqError.stack || 'No stack trace'
      );
    }
  }
}
