import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, KafkaOptions } from '@nestjs/microservices';
import { getKafkaConfig } from '@wanzo/shared/events/kafka-config';

// Define a unique injection token for the Kafka producer client in this service
export const GESTION_COMMERCIALE_KAFKA_PRODUCER_SERVICE = 'GESTION_COMMERCIALE_KAFKA_PRODUCER_SERVICE';

/**
 * This module is solely responsible for providing Kafka client to avoid circular dependencies.
 * It contains no business logic and depends only on ConfigModule.
 */
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: GESTION_COMMERCIALE_KAFKA_PRODUCER_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          // Get the base Kafka configuration
          const baseKafkaConfig = getKafkaConfig(configService) as KafkaOptions;

          // Override the clientId for this specific producer
          const producerSpecificOptions: KafkaOptions = {
            ...baseKafkaConfig,
            options: {
              ...baseKafkaConfig.options,
              client: {
                ...(baseKafkaConfig.options?.client || {}),
                clientId: 'gestion-commerciale-service-producer',
                brokers: baseKafkaConfig.options?.client?.brokers || [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
              },
            },
          };
          return producerSpecificOptions;
        },
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaProducerModule {}
