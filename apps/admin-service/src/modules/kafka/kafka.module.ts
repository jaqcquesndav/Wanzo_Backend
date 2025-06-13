import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaProducerService } from './kafka-producer.service';
// Import the shared config function
import { getKafkaConfig } from '../../../../../packages/shared/events/kafka-config';

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
              // Remove consumer part from shared config if it exists, as this is a producer client
              consumer: undefined,
            }
          };
        },
        inject: [ConfigService],
      },
      // If admin-service needs to use the shared TokenService,
      // it must also provide a ClientKafka named 'EVENTS_SERVICE'
      {
        name: 'EVENTS_SERVICE', // For the shared TokenService from packages/shared/events/token.service.ts
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
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
              consumer: undefined, // Ensure this client is configured as a producer
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
