import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AdhaAIIntegrationService } from './adha-ai-integration.service';
import { AdhaAIIntegrationController } from './adha-ai-integration.controller';

export const ADHA_AI_KAFKA_SERVICE = 'ADHA_AI_KAFKA_SERVICE';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: ADHA_AI_KAFKA_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'portfolio-institution-adha-ai-client',
                brokers: [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
              },
              consumer: {
                groupId: 'portfolio-institution-adha-ai-group',
              },
              producer: {
                allowAutoTopicCreation: true,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [AdhaAIIntegrationService],
  controllers: [AdhaAIIntegrationController],
  exports: [AdhaAIIntegrationService],
})
export class AdhaAIIntegrationModule {}
