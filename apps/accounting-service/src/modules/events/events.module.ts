import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Added ConfigService
import { ClientsModule, KafkaOptions } from '@nestjs/microservices'; // Added ClientsModule, KafkaOptions
import { getKafkaConfig } from '../../../../../packages/shared/events/kafka-config'; // Added for producer
import { UserEventsConsumer } from './consumers/user-events.consumer';
import { AccountsModule } from '@/modules/accounts/accounts.module';
import { OrganizationModule } from '@/modules/organization/organization.module';
import { EventsService } from './events.service'; // Added EventsService

// Define a unique injection token for the Kafka producer client in this service
export const ACCOUNTING_KAFKA_PRODUCER_SERVICE = 'ACCOUNTING_KAFKA_PRODUCER_SERVICE';

@Module({
  imports: [
    ConfigModule,
    AccountsModule,
    OrganizationModule,
    ClientsModule.registerAsync([
      {
        name: ACCOUNTING_KAFKA_PRODUCER_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService): KafkaOptions => {
          const baseKafkaConfig = getKafkaConfig(configService) as KafkaOptions;
          return {
            ...baseKafkaConfig,
            options: {
              ...baseKafkaConfig.options,
              client: {
                ...(baseKafkaConfig.options?.client || {}),
                clientId: 'accounting-service-producer',
                brokers: baseKafkaConfig.options?.client?.brokers || [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [
    UserEventsConsumer,
    EventsService, // Added EventsService
  ],
  exports: [EventsService], // Export EventsService so it can be injected into SettingsService
})
export class EventsModule {}
