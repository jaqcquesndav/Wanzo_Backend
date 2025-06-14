import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, KafkaOptions } from '@nestjs/microservices';
import { getKafkaConfigWithFallback } from '@wanzo/shared/events/kafka-config-fallback';

// Define a unique injection token for the Kafka producer client in this service
export const ADMIN_KAFKA_PRODUCER_SERVICE = 'ADMIN_KAFKA_PRODUCER_SERVICE';

/**
 * This module is solely responsible for providing Kafka client configuration
 * to avoid circular dependencies.
 */
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: ADMIN_KAFKA_PRODUCER_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService): KafkaOptions => {
          // Only register Kafka client if USE_KAFKA is true
          const useKafka = configService.get<string>('USE_KAFKA', 'false') === 'true';
          if (useKafka) {
            const baseKafkaConfig = getKafkaConfigWithFallback(configService) as KafkaOptions;
            return {
              ...baseKafkaConfig,
              options: {
                ...baseKafkaConfig.options,
                client: {
                  ...(baseKafkaConfig.options?.client || {}),
                  clientId: 'admin-service-producer',
                  brokers: baseKafkaConfig.options?.client?.brokers || [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
                },
              },
            };
          }
          // Return a placeholder config that won't be used (needed for the module)
          return { options: {} } as KafkaOptions;
        },
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaProducerModule {}
