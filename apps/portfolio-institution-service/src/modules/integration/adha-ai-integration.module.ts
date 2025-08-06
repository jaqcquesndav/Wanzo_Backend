import { Module, forwardRef } from '@nestjs/common';
import { AdhaAIIntegrationService } from './adha-ai-integration.service';
import { AdhaAIIntegrationController } from './adha-ai-integration.controller';
import { ChatModule } from '../chat/chat.module';
import { DlqService } from './dlq.service';
import { SharedServicesModule, ADHA_AI_KAFKA_SERVICE } from '../shared/shared-services.module';

@Module({
  imports: [
    forwardRef(() => ChatModule), // Référence forward à ChatModule pour résoudre la dépendance circulaire
    SharedServicesModule, // Use the shared services module for Kafka client
  ],
  providers: [AdhaAIIntegrationService, DlqService],
  controllers: [AdhaAIIntegrationController],
  exports: [AdhaAIIntegrationService, DlqService],
})
export class AdhaAIIntegrationModule {}
