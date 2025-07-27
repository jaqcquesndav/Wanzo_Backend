import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, KafkaOptions } from '@nestjs/microservices';
import { getKafkaConfig } from '../../../../../packages/shared/events/kafka-config';
import { UserEventsConsumer } from './consumers/user-events.consumer';
import { EventsService } from './events.service';
import { MockEventsService } from './mock-events.service';
import { InstitutionModule } from '../institution/institution.module';
import { ProspectionModule } from '../prospection/prospection.module';

export const PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE = 'PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => InstitutionModule),
    forwardRef(() => ProspectionModule),
    ClientsModule.registerAsync([
      {
        name: PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const baseKafkaConfig = getKafkaConfig(configService) as KafkaOptions;
          return {
            ...baseKafkaConfig,
            options: {
              ...baseKafkaConfig.options,
              client: {
                ...(baseKafkaConfig.options?.client || {}),
                clientId: 'portfolio-institution-service-producer',
                brokers: baseKafkaConfig.options?.client?.brokers || [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
              },
              producer: {
                ...(baseKafkaConfig.options?.producer || {}),
                allowAutoTopicCreation: true,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [UserEventsConsumer],
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
    ClientsModule,
    EventsService,
  ],
})
export class EventsModule {}
