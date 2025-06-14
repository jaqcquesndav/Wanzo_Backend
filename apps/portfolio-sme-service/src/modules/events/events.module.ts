import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaProducerModule, SME_KAFKA_PRODUCER_SERVICE } from './kafka-producer.module';
import { UserEventsConsumer } from './consumers/user-events.consumer';
import { PortfoliosModule } from '../portfolios/portfolios.module';
import { EventsService } from './events.service';

@Module({
  imports: [
    ConfigModule,
    KafkaProducerModule,
    PortfoliosModule,
  ],  controllers: [UserEventsConsumer],
  providers: [
    UserEventsConsumer,
    {
      provide: EventsService,
      useFactory: (kafkaClient) => new EventsService(kafkaClient),
      inject: [SME_KAFKA_PRODUCER_SERVICE],
    },
  ],
  exports: [EventsService, KafkaProducerModule],
})
export class EventsModule {}
