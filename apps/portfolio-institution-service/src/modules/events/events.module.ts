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
    KafkaClientModule, // Export the module instead of the token
  ],
})
export class EventsModule {}

// Re-export the constant for external use
export { PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE } from './kafka-client.module';
