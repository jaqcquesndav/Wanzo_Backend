import { Module, forwardRef } from '@nestjs/common'; // Import forwardRef
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, KafkaOptions } from '@nestjs/microservices';
import { getKafkaConfig } from '@wanzo/shared/events/kafka-config';
import { UserEventsConsumer } from './consumers/user-events.consumer';
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
      // Note: Consumer connection is typically handled globally in main.ts by app.connectMicroservice(kafkaConfig)
      // If this module's consumers need a very specific Kafka client instance (e.g., different groupId not covered by global),
      // then you would register another client here. Otherwise, the global setup is sufficient.
    ]),
  ],
  controllers: [UserEventsConsumer], // Consumers are controllers that listen to topics
  providers: [
    UserEventsConsumer,
    // EventsService, // If you add an EventsService to abstract producer logic
  ],
  exports: [
    ClientsModule, // Export ClientsModule so KAFKA_PRODUCER_SERVICE can be injected
    // EventsService,
  ],
})
export class EventsModule {}
