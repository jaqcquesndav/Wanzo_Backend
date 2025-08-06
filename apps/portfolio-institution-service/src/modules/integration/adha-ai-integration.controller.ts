import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AdhaAIIntegrationService, PortfolioAIEventTopics } from './adha-ai-integration.service';
import { DlqService } from './dlq.service';

// Duplicate the enum here to avoid import issues
// This ensures we have the constants defined directly in this file
const PORTFOLIO_AI_TOPICS = {
  ANALYSIS_RESPONSE: 'portfolio.analysis.response',
  CHAT_RESPONSE: 'portfolio.chat.response'
};

/**
 * Contrôleur pour gérer les événements Kafka provenant d'Adha AI
 */
@Controller()
export class AdhaAIIntegrationController {
  private readonly logger = new Logger('AdhaAIIntegrationController');

  constructor(
    private readonly adhaAIIntegrationService: AdhaAIIntegrationService,
    private readonly dlqService: DlqService
  ) {}

  /**
   * Gestionnaire des réponses d'analyse de portfolio
   */
  @EventPattern(PORTFOLIO_AI_TOPICS.ANALYSIS_RESPONSE)
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
      
      // Envoyer le message à la DLQ
      await this.dlqService.sendToDlq(data, error, 'AdhaAIIntegrationController.handleAnalysisResponse');
    }
  }

  /**
   * Gestionnaire des réponses de chat
   */
  @EventPattern(PORTFOLIO_AI_TOPICS.CHAT_RESPONSE)
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
      
      // Envoyer le message à la DLQ
      await this.dlqService.sendToDlq(data, error, 'AdhaAIIntegrationController.handleChatResponse');
    }
  }
}
