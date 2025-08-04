import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MicroserviceIntegrationService } from './services/microservice-integration.service';
import { IntegrationHealthController } from './controllers/integration-health.controller';
import { KafkaConsumerModule } from '../kafka-consumer/kafka-consumer.module';

@Module({
  imports: [
    ConfigModule,
    KafkaConsumerModule,
    ClientsModule.registerAsync([
      {
        name: 'CUSTOMER_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('CUSTOMER_SERVICE_HOST', 'localhost'),
            port: configService.get<number>('CUSTOMER_SERVICE_PORT', 3001),
            retryAttempts: 3,
            retryDelay: 1000,
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'PORTFOLIO_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('PORTFOLIO_SERVICE_HOST', 'localhost'),
            port: configService.get<number>('PORTFOLIO_SERVICE_PORT', 3002),
            retryAttempts: 3,
            retryDelay: 1000,
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'GESTION_COMMERCIALE_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('GESTION_COMMERCIALE_SERVICE_HOST', 'localhost'),
            port: configService.get<number>('GESTION_COMMERCIALE_SERVICE_PORT', 3006),
            retryAttempts: 3,
            retryDelay: 1000,
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'ACCOUNTING_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('ACCOUNTING_SERVICE_HOST', 'localhost'),
            port: configService.get<number>('ACCOUNTING_SERVICE_PORT', 3007),
            retryAttempts: 3,
            retryDelay: 1000,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [IntegrationHealthController],
  providers: [MicroserviceIntegrationService],
  exports: [MicroserviceIntegrationService],
})
export class IntegrationModule {}
