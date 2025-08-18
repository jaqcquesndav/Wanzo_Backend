import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, KafkaOptions } from '@nestjs/microservices';
import { getKafkaConfig } from '@wanzobe/shared/events/kafka-config';

// Define a unique injection token for the Kafka producer client in this service
export const ACCOUNTING_KAFKA_PRODUCER_SERVICE = 'ACCOUNTING_KAFKA_PRODUCER_SERVICE';

/**
 * This module is solely responsible for providing Kafka client configuration
 * to avoid circular dependencies.
 */
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: ACCOUNTING_KAFKA_PRODUCER_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService): KafkaOptions => {
          const baseKafkaConfig = getKafkaConfig(configService) as KafkaOptions;
          return {
            ...baseKafkaConfig,
            options: {
              ...baseKafkaConfig.options,
              client: {
                ...(baseKafkaConfig.options?.client || {}),
                clientId: 'accounting-service-producer',
                brokers: baseKafkaConfig.options?.client?.brokers || [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
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
