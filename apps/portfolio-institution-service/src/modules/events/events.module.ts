import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { getKafkaConfig } from '@wanzo/shared/events/kafka-config';
import { EventsService } from './events.service';
import { UserEventsConsumer } from './consumers/user-events.consumer';
import { SubscriptionEventsConsumer } from './consumers/subscription-events.consumer';
import { TokenEventsConsumer } from './consumers/token-events.consumer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstitutionUser } from '../institution/entities/institution-user.entity';
import { Institution } from '../institution/entities/institution.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([InstitutionUser, Institution]),
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
