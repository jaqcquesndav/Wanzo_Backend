import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserEventsConsumer } from './consumers/user-events.consumer';
import { EventsService } from './events.service';
import { InstitutionModule } from '../institution/institution.module';
import { ProspectionModule } from '../prospection/prospection.module';

// Import le module Kafka producer et sa constante
import { KafkaProducerModule, PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE } from './kafka-producer.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => InstitutionModule),
    forwardRef(() => ProspectionModule),
    KafkaProducerModule,
  ],  controllers: [UserEventsConsumer],
  providers: [
    UserEventsConsumer,
    {
      provide: EventsService,
      useFactory: (kafkaClient) => new EventsService(kafkaClient),
      inject: [PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE],
    },
  ],
  exports: [
    KafkaProducerModule,
    EventsService,
  ],
})
export class EventsModule {}
