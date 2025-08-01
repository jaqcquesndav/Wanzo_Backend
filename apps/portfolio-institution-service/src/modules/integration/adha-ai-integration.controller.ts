import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AdhaAIIntegrationService, PortfolioAIEventTopics } from './adha-ai-integration.service';

/**
 * Contrôleur pour gérer les événements Kafka provenant d'Adha AI
 */
@Controller()
export class AdhaAIIntegrationController {
  private readonly logger = new Logger('AdhaAIIntegrationController');

  constructor(private readonly adhaAIIntegrationService: AdhaAIIntegrationService) {}

  /**
   * Gestionnaire des réponses d'analyse de portfolio
   */
  @EventPattern(PortfolioAIEventTopics.ANALYSIS_RESPONSE)
  async handleAnalysisResponse(@Payload() data: any): Promise<void> {
    this.logger.log(`Received analysis response: ${JSON.stringify(data.id || 'unknown')}`);
    
    try {
      // Déléguer au service pour traitement
      // Le service transmet ensuite au callback enregistré via setupConsumers
      if (this.adhaAIIntegrationService['handleAnalysisResponse']) {
        await this.adhaAIIntegrationService['handleAnalysisResponse'](data);
      } else {
        this.logger.warn('Analysis response handler not registered');
      }
    } catch (error: any) {
      this.logger.error(
        `Error handling analysis response: ${error.message || 'Unknown error'}`,
        error.stack || 'No stack trace'
      );
    }
  }

  /**
   * Gestionnaire des réponses de chat
   */
  @EventPattern(PortfolioAIEventTopics.CHAT_RESPONSE)
  async handleChatResponse(@Payload() data: any): Promise<void> {
    this.logger.log(`Received chat response: ${JSON.stringify(data.id || 'unknown')}`);
    
    try {
      // Déléguer au service pour traitement
      // Le service transmet ensuite au callback enregistré via setupConsumers
      if (this.adhaAIIntegrationService['handleChatResponse']) {
        await this.adhaAIIntegrationService['handleChatResponse'](data);
      } else {
        this.logger.warn('Chat response handler not registered');
      }
    } catch (error: any) {
      this.logger.error(
        `Error handling chat response: ${error.message || 'Unknown error'}`,
        error.stack || 'No stack trace'
      );
    }
  }
}
