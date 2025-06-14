import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport, KafkaOptions } from '@nestjs/microservices';
import { getKafkaConfig } from '@wanzo/shared/events/kafka-config';

// Define a unique injection token for the Kafka producer client in this service
export const AUTH_KAFKA_PRODUCER_SERVICE = 'AUTH_KAFKA_PRODUCER_SERVICE';

/**
 * This module is solely responsible for providing Kafka client configuration
 * to avoid circular dependencies.
 */
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: AUTH_KAFKA_PRODUCER_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const baseKafkaConfig = getKafkaConfig(configService);
          return {
            transport: Transport.KAFKA,
            options: {
              ...baseKafkaConfig.options!,
              client: {
                ...baseKafkaConfig.options!.client!,
                clientId: 'auth-service-producer',
                brokers: baseKafkaConfig.options?.client?.brokers || [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
              },
              consumer: {
                ...baseKafkaConfig.options!.consumer!,
                groupId: `auth-service-producer-group`,
              }
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
