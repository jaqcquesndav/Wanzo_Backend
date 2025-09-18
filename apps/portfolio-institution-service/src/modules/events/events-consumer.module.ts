import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, KafkaOptions } from '@nestjs/microservices';
import { getKafkaConfig } from '@wanzobe/shared';
import { UserEventsConsumer } from './consumers/user-events.consumer';
import { InstitutionModule } from '../institution/institution.module';
import { ProspectionModule } from '../prospection/prospection.module';

export const PORTFOLIO_INSTITUTION_KAFKA_CONSUMER_SERVICE = 'PORTFOLIO_INSTITUTION_KAFKA_CONSUMER_SERVICE';

@Module({
  imports: [
    ConfigModule,
    InstitutionModule, // Import direct sans forwardRef
    ProspectionModule, // Import direct sans forwardRef
    ClientsModule.registerAsync([
      {
        name: PORTFOLIO_INSTITUTION_KAFKA_CONSUMER_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const baseKafkaConfig = getKafkaConfig(configService) as KafkaOptions;
          return {
            ...baseKafkaConfig,
            options: {
              ...baseKafkaConfig.options,
              client: {
                ...(baseKafkaConfig.options?.client || {}),
                clientId: 'portfolio-institution-service-consumer',
                brokers: baseKafkaConfig.options?.client?.brokers || [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
              },
              consumer: {
                ...(baseKafkaConfig.options?.consumer || {}),
                groupId: 'portfolio-institution-service-group',
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [UserEventsConsumer],
  providers: [UserEventsConsumer],
  exports: [UserEventsConsumer],
})
export class EventsConsumerModule {}