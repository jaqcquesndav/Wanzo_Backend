import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { getKafkaConfig } from '@wanzo/shared/events/kafka-config';
import { EventsService } from './events.service';
import { UserEventsConsumer } from './consumers/user-events.consumer';
import { SubscriptionEventsConsumer } from './consumers/subscription-events.consumer';
import { TokenEventsConsumer } from './consumers/token-events.consumer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, UserSubscription]),
    ClientsModule.registerAsync([
      {
        name: 'EVENTS_SERVICE',
        useFactory: (configService: ConfigService) => getKafkaConfig(configService),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [EventsService, UserEventsConsumer, SubscriptionEventsConsumer, TokenEventsConsumer],
  exports: [EventsService],
})
export class EventsModule {}
