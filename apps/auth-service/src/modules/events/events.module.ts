import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { getKafkaConfig } from '@wanzo/shared/events/kafka-config';
import { UserEventsConsumer } from './consumers/user-events.consumer';
import { EventsService } from '@/modules/events/events.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenBlacklist } from '@wanzo/shared/security/token-blacklist.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([TokenBlacklist]),
    ClientsModule.registerAsync([
      {
        name: 'EVENTS_SERVICE',
        useFactory: (configService: ConfigService) => getKafkaConfig(configService),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [EventsService, UserEventsConsumer],
  exports: [EventsService],
})
export class EventsModule {}
