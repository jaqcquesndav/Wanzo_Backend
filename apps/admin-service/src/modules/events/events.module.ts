import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ADMIN_KAFKA_PRODUCER_SERVICE, KafkaProducerModule } from './kafka-producer.module';
import { EventsService } from './events.service';
import { MockEventsService } from './mock-events-service';

@Module({
  imports: [
    ConfigModule,
    KafkaProducerModule,
  ],
  providers: [
    {
      provide: EventsService,
      useFactory: (configService: ConfigService, kafkaClient: any) => {
        const useKafka = configService.get<string>('USE_KAFKA', 'false') === 'true';
        if (useKafka) {
          return new EventsService(kafkaClient, configService);
        } else {
          return new MockEventsService();
        }
      },
      inject: [ConfigService, ADMIN_KAFKA_PRODUCER_SERVICE],
    },
  ],
  exports: [EventsService],
})
export class EventsModule {}
