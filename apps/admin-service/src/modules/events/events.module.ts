import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { getKafkaConfigWithFallback } from '@wanzo/shared/events/kafka-config-fallback';
import { EventsService } from './events.service';
import { MockEventsService } from './mock-events-service';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'EVENTS_SERVICE',
        useFactory: (configService: ConfigService) => {
          // Only register Kafka client if USE_KAFKA is true
          const useKafka = configService.get<string>('USE_KAFKA', 'false') === 'true';
          if (useKafka) {
            return getKafkaConfigWithFallback(configService);
          }
          // Return a placeholder config that won't be used (needed for the module)
          return { options: {} };
        },
        inject: [ConfigService],
      },
    ]),
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
      inject: [ConfigService, 'EVENTS_SERVICE'],
    },
  ],
  exports: [EventsService],
})
export class EventsModule {}
