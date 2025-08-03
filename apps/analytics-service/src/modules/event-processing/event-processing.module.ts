import { Module } from '@nestjs/common';
import { KafkaConsumerService } from './services/kafka-consumer.service';
import { EventProcessingController } from './controllers/event-processing.controller';

@Module({
  controllers: [EventProcessingController],
  providers: [KafkaConsumerService],
  exports: [KafkaConsumerService],
})
export class EventProcessingModule {}
