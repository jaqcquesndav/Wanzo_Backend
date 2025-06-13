import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport, KafkaOptions } from '@nestjs/microservices'; // Import KafkaOptions
import { getKafkaConfig } from '../../../../../packages/shared/events/kafka-config'; // Adjusted path
import { UserEventsConsumer } from './consumers/user-events.consumer';
import { PortfoliosModule } from '../portfolios/portfolios.module'; // Import PortfoliosModule
// Import other services needed by the consumer if any, e.g., PortfolioService, OrganizationService (if it exists here)

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'PORTFOLIO_SME_KAFKA_SERVICE', // Renamed for clarity, can be used for both producer/consumer injection if needed
        imports: [ConfigModule],
        useFactory: (configService: ConfigService): KafkaOptions => { // Explicitly type return as KafkaOptions
          const baseKafkaConfig = getKafkaConfig(configService) as KafkaOptions;
          return {
            transport: Transport.KAFKA, // Ensure transport is explicitly set
            options: {
              ...baseKafkaConfig.options,
              client: {
                ...(baseKafkaConfig.options?.client || {}),
                clientId: 'portfolio-sme-service-client', // Client ID for this service
                brokers: baseKafkaConfig.options?.client?.brokers || [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
              },
              consumer: {
                ...(baseKafkaConfig.options?.consumer || {}),
                groupId: 'portfolio-sme-consumer-group', // Specific group ID for this service's consumers
              },
              // producer: { // Optional: Add producer specific config if this module will also produce messages
              //   allowAutoTopicCreation: baseKafkaConfig.options?.producer?.allowAutoTopicCreation ?? true,
              // },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
    PortfoliosModule, // Add PortfoliosModule to imports
    // Import modules that provide services injected into UserEventsConsumer, e.g., PortfoliosModule
  ],
  controllers: [UserEventsConsumer], // Consumers are often controllers in NestJS microservice setup
  providers: [
    // UserEventsConsumer, // Provider registration might not be needed if it's a controller
    // Add any services that UserEventsConsumer depends on and are local to this module or re-exported
  ],
  exports: [ClientsModule], // Export ClientsModule if you plan to inject the Kafka client elsewhere
})
export class EventsModule {}
