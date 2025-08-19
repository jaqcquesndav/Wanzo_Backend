import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaProducerService } from './kafka-producer.service';
// Import the shared config function
import { getKafkaConfig } from '@wanzobe/shared';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_PRODUCER_SERVICE', // This is the main client for admin-service's own events
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const kafkaOptions = getKafkaConfig(configService);
          return {
            ...kafkaOptions,
            options: {
              ...kafkaOptions.options,
              client: {
                ...kafkaOptions.options.client,
                clientId: configService.get<string>('KAFKA_CLIENT_ID_ADMIN_PRODUCER', 'admin-service-producer'),
              },
              producer: {
                allowAutoTopicCreation: configService.get<boolean>('KAFKA_PRODUCER_ALLOW_AUTO_TOPIC_CREATION', true),
              },
              // S'assurer que la configuration du consommateur est toujours présente
              consumer: {
                ...(kafkaOptions.options?.consumer || {}),
                groupId: configService.get<string>('KAFKA_GROUP_ID', 'admin-service-group'),
                allowAutoTopicCreation: true,
              },
            }
          };
        },
        inject: [ConfigService],
      },
      // If admin-service needs to use the shared TokenService,
      // it must also provide a ClientKafka named 'EVENTS_SERVICE'
      {
        name: 'EVENTS_SERVICE', // For the shared TokenService from packages/shared/events/token.service.ts
        imports: [ConfigModule],        useFactory: (configService: ConfigService) => {
          const kafkaOptions = getKafkaConfig(configService);
          return {
            ...kafkaOptions,
            options: {
              ...kafkaOptions.options,
              client: {
                ...kafkaOptions.options.client,
                clientId: configService.get<string>('KAFKA_CLIENT_ID_EVENTS_PROXY', 'admin-events-proxy-producer'),
              },
              producer: {
                allowAutoTopicCreation: configService.get<boolean>('KAFKA_PRODUCER_ALLOW_AUTO_TOPIC_CREATION', true),
              },
              // S'assurer que la configuration du consommateur est toujours présente
              consumer: {
                ...(kafkaOptions.options?.consumer || {}),
                groupId: configService.get<string>('KAFKA_GROUP_ID', 'admin-events-proxy-group'),
                allowAutoTopicCreation: true,
              },
            }
          };
        },
        inject: [ConfigService],
      }
    ]),
  ],
  providers: [KafkaProducerService],
  exports: [KafkaProducerService],
})
export class KafkaModule {}
