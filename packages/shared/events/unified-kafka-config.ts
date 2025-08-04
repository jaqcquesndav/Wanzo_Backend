import { KafkaOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

/**
 * Configuration Kafka unifiée et robuste pour tous les microservices
 */
export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  retries: number;
  connectionTimeout: number;
  requestTimeout: number;
  retry: {
    initialRetryTime: number;
    retries: number;
    maxRetryTime: number;
  };
}

/**
 * Configuration Kafka centralisée avec gestion d'environnement
 */
export const getUnifiedKafkaConfig = (configService: ConfigService, clientId: string): KafkaOptions => {
  const isDocker = process.env.NODE_ENV === 'docker' || process.env.KAFKA_ENV === 'docker';
  
  // Configuration robuste avec retry et timeouts
  const baseConfig: KafkaConfig = {
    brokers: isDocker 
      ? [configService.get<string>('KAFKA_BROKER_INTERNAL', 'kafka:29092')]
      : [configService.get<string>('KAFKA_BROKER_EXTERNAL', 'localhost:9092')],
    clientId,
    retries: 5,
    connectionTimeout: 45000,
    requestTimeout: 30000,
    retry: {
      initialRetryTime: 100,
      retries: 8,
      maxRetryTime: 30000,
    },
  };

  return {
    transport: Transport.KAFKA,
    options: {
      client: baseConfig,
      consumer: {
        groupId: `${clientId}-group`,
        allowAutoTopicCreation: true,
        retry: {
          retries: 5,
          initialRetryTime: 300,
          maxRetryTime: 30000,
        },
      },
      producer: {
        allowAutoTopicCreation: true,
        retry: {
          retries: 5,
          initialRetryTime: 300,
          maxRetryTime: 30000,
        },
        idempotent: true,
        maxInFlightRequests: 1,
      },
    },
  };
};

/**
 * Topics Kafka standardisés
 */
export enum StandardKafkaTopics {
  // Commerce Operations
  COMMERCE_OPERATION_CREATED = 'commerce.operation.created',
  COMMERCE_OPERATION_UPDATED = 'commerce.operation.updated',
  COMMERCE_OPERATION_DELETED = 'commerce.operation.deleted',
  
  // Accounting
  ACCOUNTING_JOURNAL_ENTRY = 'accounting.journal.entry',
  ACCOUNTING_JOURNAL_STATUS = 'accounting.journal.status',
  
  // Portfolio
  PORTFOLIO_ANALYSIS_REQUEST = 'portfolio.analysis.request',
  PORTFOLIO_ANALYSIS_RESPONSE = 'portfolio.analysis.response',
  PORTFOLIO_CHAT_MESSAGE = 'portfolio.chat.message',
  PORTFOLIO_CHAT_RESPONSE = 'portfolio.chat.response',
  
  // Adha AI General
  ADHA_AI_EVENTS = 'adha-ai-events',
  
  // Dead Letter Queue
  DLQ_FAILED_MESSAGES = 'dlq.failed.messages',
}

/**
 * Configuration pour Dead Letter Queue
 */
export interface DLQConfig {
  enabled: boolean;
  topic: string;
  maxRetries: number;
  retryDelayMs: number;
}

export const getDLQConfig = (): DLQConfig => ({
  enabled: process.env.DLQ_ENABLED === 'true',
  topic: StandardKafkaTopics.DLQ_FAILED_MESSAGES,
  maxRetries: parseInt(process.env.DLQ_MAX_RETRIES || '3'),
  retryDelayMs: parseInt(process.env.DLQ_RETRY_DELAY_MS || '5000'),
});

/**
 * Interface pour les métadonnées de corrélation
 */
export interface MessageMetadata {
  correlationId: string;
  timestamp: string;
  source: string;
  version: string;
  retryCount?: number;
}

/**
 * Message standardisé avec métadonnées
 */
export interface StandardMessage<T = any> {
  id: string;
  data: T;
  metadata: MessageMetadata;
}

/**
 * Utilitaire pour créer un message standardisé
 */
export const createStandardMessage = <T>(
  data: T,
  source: string,
  correlationId?: string
): StandardMessage<T> => ({
  id: require('uuid').v4(),
  data,
  metadata: {
    correlationId: correlationId || require('uuid').v4(),
    timestamp: new Date().toISOString(),
    source,
    version: '1.0.0',
    retryCount: 0,
  },
});
