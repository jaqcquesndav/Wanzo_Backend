import { Transport, KafkaOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

/**
 * Configuration Kafka locale pour le service portfolio-institution
 * @param configService Service de configuration NestJS
 * @returns Configuration Kafka pour NestJS
 */
export const getLocalKafkaConfig = (configService: ConfigService): KafkaOptions => {
  const clientId = 'portfolio-institution-service';
  const groupId = 'portfolio-institution-group';
  const brokers = [configService.get<string>('KAFKA_BROKER', 'localhost:9092')];

  console.log(`Configuring Kafka with: clientId=${clientId}, groupId=${groupId}, brokers=${brokers}`);

  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId,
        brokers,
        retry: {
          initialRetryTime: 100,
          retries: 8,
          maxRetryTime: 30000,
        },
      },
      consumer: {
        groupId,
        allowAutoTopicCreation: true,
      },
      producer: {
        allowAutoTopicCreation: true,
      },
    },
  };
};

/**
 * Topics des événements pour la communication avec Adha AI
 */
export enum PortfolioAIEventTopics {
  ANALYSIS_REQUEST = 'portfolio.analysis.request',
  ANALYSIS_RESPONSE = 'portfolio.analysis.response',
  CHAT_MESSAGE = 'portfolio.chat.message',
  CHAT_RESPONSE = 'portfolio.chat.response',
}
