import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsService } from './events.service';
import { KafkaProducerModule, APP_MOBILE_KAFKA_PRODUCER_SERVICE } from './kafka-producer.module';

/**
 * This module contains the core functionality of the EventsModule without
 * dependencies on other modules, to avoid circular dependencies.
 * It now uses KafkaProducerModule to handle the Kafka client configuration.
 */
@Module({
  imports: [
    ConfigModule,
    KafkaProducerModule,
  ],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsCoreModule {}
