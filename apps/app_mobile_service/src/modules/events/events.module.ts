import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport, KafkaOptions } from '@nestjs/microservices'; // Import KafkaOptions
import { getKafkaConfig } from '@wanzo/shared/events/kafka-config';
import { EventsService } from './events.service';
import { UserEventsConsumer } from './consumers/user-events.consumer';
import { SubscriptionEventsConsumer } from './consumers/subscription-events.consumer';
import { TokenEventsConsumer } from './consumers/token-events.consumer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';

export const APP_MOBILE_KAFKA_PRODUCER_SERVICE = 'APP_MOBILE_KAFKA_PRODUCER_SERVICE';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, UserSubscription]),
    ClientsModule.registerAsync([
      {
        name: APP_MOBILE_KAFKA_PRODUCER_SERVICE,
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
                clientId: 'app-mobile-service-producer',
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
  providers: [EventsService, UserEventsConsumer, SubscriptionEventsConsumer, TokenEventsConsumer],
  exports: [EventsService],
})
export class EventsModule {}
