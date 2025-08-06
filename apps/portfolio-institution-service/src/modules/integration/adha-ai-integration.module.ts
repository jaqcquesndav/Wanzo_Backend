import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AdhaAIIntegrationService } from './adha-ai-integration.service';
import { AdhaAIIntegrationController } from './adha-ai-integration.controller';
import { ChatModule } from '../chat/chat.module';
import { DlqService } from './dlq.service';

export const ADHA_AI_KAFKA_SERVICE = 'ADHA_AI_KAFKA_SERVICE';

@Module({
  imports: [
    forwardRef(() => ChatModule), // Référence forward à ChatModule pour résoudre la dépendance circulaire
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
  providers: [AdhaAIIntegrationService, DlqService],
  controllers: [AdhaAIIntegrationController],
  exports: [AdhaAIIntegrationService, DlqService],
})
export class AdhaAIIntegrationModule {}
