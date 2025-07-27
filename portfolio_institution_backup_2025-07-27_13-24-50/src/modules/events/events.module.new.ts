import { Module, forwardRef } from '@nestjs/common'; // Import forwardRef
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, KafkaOptions } from '@nestjs/microservices';
import { getKafkaConfig } from '@wanzo/shared/events/kafka-config';
import { UserEventsConsumer } from './consumers/user-events.consumer';
import { EventsService } from './events.service'; // Import EventsService
import { MockEventsService } from './mock-events.service'; // Import MockEventsService
// Import modules providing services needed by consumers using forwardRef
import { InstitutionModule } from '../institution/institution.module';
import { ProspectionModule } from '../prospection/prospection.module';

export const PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE = 'PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => InstitutionModule), // Use forwardRef to break cycle
    forwardRef(() => ProspectionModule), // Use forwardRef to break cycle
    ClientsModule.registerAsync([
      {
        name: PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE, // For producing events
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const baseKafkaConfig = getKafkaConfig(configService) as KafkaOptions;
          return {
            ...baseKafkaConfig, // Spread base config which includes transport: Transport.KAFKA
            options: {
              ...baseKafkaConfig.options,
              client: {
                ...(baseKafkaConfig.options?.client || {}),
                clientId: 'portfolio-institution-service-producer', // Specific client ID for producer
                brokers: baseKafkaConfig.options?.client?.brokers || [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
              },
              // Producer specific configurations can be added here if needed
              // producer: {
              //   allowAutoTopicCreation: baseKafkaConfig.options?.producer?.allowAutoTopicCreation ?? true,
              // },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [UserEventsConsumer], // Consumers are controllers that listen to topics
  providers: [
    UserEventsConsumer,
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
    ClientsModule, // Export ClientsModule so KAFKA_PRODUCER_SERVICE can be injected
    EventsService, // Export EventsService
  ],
})
export class EventsModule {}
