import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, KafkaOptions, Transport } from '@nestjs/microservices';
import { getKafkaConfig } from '@wanzobe/shared';

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
            // Utiliser la fonction partagée getKafkaConfig
            const baseKafkaConfig = getKafkaConfig(configService) as KafkaOptions;
            const brokers = configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(',');

            return {
              ...baseKafkaConfig,
              options: {
                ...baseKafkaConfig.options,
                client: {
                  ...(baseKafkaConfig.options?.client || {}),
                  clientId: 'admin-service-producer',
                  brokers: baseKafkaConfig.options?.client?.brokers || brokers,
                },
                // S'assurer que la configuration du consommateur est toujours présente
                consumer: {
                  ...(baseKafkaConfig.options?.consumer || {}),
                  groupId: configService.get<string>('KAFKA_GROUP_ID', 'admin-service-group'),
                  allowAutoTopicCreation: true,
                },
              },
            };
          }          // Return a placeholder config with minimal required fields
          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'admin-service-dummy',
                brokers: ['localhost:9092'],
              },
              consumer: {
                groupId: 'admin-service-dummy-group',
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
