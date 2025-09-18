import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventsService } from './events.service';
import { MockEventsService } from './mock-events.service';
import { KafkaClientModule, PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE } from './kafka-client.module';

@Module({
  imports: [
    ConfigModule,
    KafkaClientModule,
  ],
  providers: [
    {
      provide: EventsService,
      useFactory: (configService: ConfigService, kafkaClient: any) => {
        const useKafka = configService.get<string>('USE_KAFKA', 'false') === 'true';
        return useKafka ? new EventsService(kafkaClient) : new MockEventsService();
      },
      inject: [ConfigService, PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE],
    },
  ],
  exports: [
    EventsService,
  ],
})
export class EventsModule {}
