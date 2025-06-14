import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserEventsConsumer } from './consumers/user-events.consumer';
import { EventsService } from '@/modules/events/events.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenBlacklist } from '@wanzo/shared/security/token-blacklist.entity';
import { KafkaProducerModule, AUTH_KAFKA_PRODUCER_SERVICE } from './kafka-producer.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([TokenBlacklist]),
    KafkaProducerModule,
  ],  providers: [
    {
      provide: EventsService,
      useFactory: (kafkaClient) => {
        return new EventsService(kafkaClient);
      },
      inject: [AUTH_KAFKA_PRODUCER_SERVICE],
    },
    UserEventsConsumer,
  ],
  exports: [EventsService],
})
export class EventsModule {}
