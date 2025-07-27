import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport, KafkaOptions } from '@nestjs/microservices';
import { getKafkaConfig } from '../../../../../packages/shared/events/kafka-config';

// Define a unique injection token for the Kafka producer client in this service
export const PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE = 'PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE';

/**
 * This module is solely responsible for providing Kafka client configuration
 * to avoid circular dependencies.
 */
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService): KafkaOptions => {
          const baseKafkaConfig = getKafkaConfig(configService) as KafkaOptions;
          return {
            transport: Transport.KAFKA,
            options: {
              ...baseKafkaConfig.options,
              client: {
                ...(baseKafkaConfig.options?.client || {}),
                clientId: 'portfolio-institution-service-producer',
                brokers: baseKafkaConfig.options?.client?.brokers || [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
              },
              producer: {
                ...(baseKafkaConfig.options?.producer || {}),
                allowAutoTopicCreation: true,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaProducerModule {}
