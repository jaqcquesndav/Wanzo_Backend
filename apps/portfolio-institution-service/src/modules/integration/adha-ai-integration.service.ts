import { Injectable, Logger, Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';
import { lastValueFrom } from 'rxjs';
import { ADHA_AI_KAFKA_SERVICE } from '../shared/shared-services.module';

// Portfolio AI Event Topics
export enum PortfolioAIEventTopics {
  ANALYSIS_REQUEST = 'portfolio.analysis.request',
  ANALYSIS_RESPONSE = 'portfolio.analysis.response',
  CHAT_MESSAGE = 'portfolio.chat.message',
  CHAT_RESPONSE = 'portfolio.chat.response',
}

// Portfolio Analysis Types
export enum PortfolioAnalysisType {
  FINANCIAL = 'financial',
  MARKET = 'market',
  OPERATIONAL = 'operational',
  RISK = 'risk',
}

// Event interfaces
export interface PortfolioAnalysisRequestEvent {
  id: string;
  portfolioId: string;
  institutionId: string;
  userId: string;
  userRole: string;
  timestamp: string;
  analysisTypes: PortfolioAnalysisType[];
  contextInfo: {
    source: string;
    mode: string;
    portfolioType: string;
  };
}

export interface ChatMessageEvent {
  id: string;
  chatId: string;
  userId: string;
  userRole: string;
  content: string;
  timestamp: string;
  contextInfo: Record<string, any>;
}

/**
 * Service d'intégration avec Adha AI pour le service de portfolio institution
 * Ce service gère les communications avec l'IA pour l'analyse de portfolio et le chat
 */
@Injectable()
export class AdhaAIIntegrationService implements OnModuleInit {
  private readonly logger = new Logger('AdhaAIIntegrationService');

  constructor(
    @Inject(ADHA_AI_KAFKA_SERVICE) private readonly kafkaClient: ClientKafka
  ) {}
  
  async onModuleInit() {
    try {
      // Trying to connect with timeout to avoid blocking app startup
      const connectPromise = this.kafkaClient.connect();
      
      // Set a timeout for the Kafka connection to not block service startup
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Kafka connection timeout')), 5000)
      );
      
      await Promise.race([connectPromise, timeout])
        .then(() => {
          this.logger.log('Connected to Kafka broker for Adha AI integration');
          
          // S'assurer que tous les topics sont enregistrés
          Object.values(PortfolioAIEventTopics).forEach(topic => {
            this.kafkaClient.subscribeToResponseOf(topic);
          });
        })
        .catch((err) => {
          throw err;
        });
    } catch (error: any) {
      this.logger.warn(`Failed to connect to Kafka: ${error.message || 'Unknown error'}. Service will continue without Kafka integration.`);
      // Don't rethrow the error - allow the service to start even without Kafka
    }
  }

  /**
   * Envoie une demande d'analyse de portefeuille à Adha AI
   * 
   * @param portfolioId ID du portefeuille à analyser
   * @param institutionId ID de l'institution
   * @param userId ID de l'utilisateur demandant l'analyse
   * @param userRole Rôle de l'utilisateur
   * @param portfolioType Type de portefeuille (crédit, épargne, etc.)
   * @param analysisTypes Types d'analyses à effectuer
   * @returns ID de la demande d'analyse
   */
  async requestPortfolioAnalysis(
    portfolioId: string,
    institutionId: string,
    userId: string,
    userRole: string,
    portfolioType: string,
    analysisTypes: PortfolioAnalysisType[] = [
      PortfolioAnalysisType.FINANCIAL,
      PortfolioAnalysisType.RISK
    ],
  ): Promise<string> {
    const analysisRequestId = uuidv4();
    
    // Créer l'événement de demande d'analyse
    const analysisRequest: PortfolioAnalysisRequestEvent = {
      id: analysisRequestId,
      portfolioId,
      institutionId,
      userId,
      userRole: userRole, 
      timestamp: new Date().toISOString(),
      analysisTypes,
      contextInfo: {
        source: 'portfolio_institution',
        mode: 'analysis',
        portfolioType
      }
    };
    
    try {
      // Publier la demande sur Kafka
      await lastValueFrom(
        this.kafkaClient.emit(
          PortfolioAIEventTopics.ANALYSIS_REQUEST,
          analysisRequest
        )
      );
      
      this.logger.log(
        `Analysis request ${analysisRequestId} sent for portfolio ${portfolioId}`
      );
      
      return analysisRequestId;
    } catch (error: any) {
      this.logger.error(
        `Failed to send analysis request for portfolio ${portfolioId}: ${error.message || 'Unknown error'}`,
        error.stack || 'No stack trace'
      );
      throw error;
    }
  }
  
  /**
   * Envoie un message de chat à Adha AI
   * 
   * @param chatId ID de la conversation
   * @param userId ID de l'utilisateur
   * @param userRole Rôle de l'utilisateur
   * @param content Contenu du message
   * @param contextInfo Informations contextuelles
   * @returns ID du message
   */
  async sendChatMessage(
    chatId: string,
    userId: string,
    userRole: string,
    content: string,
    contextInfo: Record<string, any> = {}
  ): Promise<string> {
    const messageId = uuidv4();
    
    // Créer l'événement de message de chat
    const chatMessage: ChatMessageEvent = {
      id: messageId,
      chatId,
      userId,
      userRole: userRole,
      content,
      timestamp: new Date().toISOString(),
      contextInfo: {
        source: 'portfolio_institution',
        mode: 'chat',
        ...contextInfo
      }
    };
    
    try {
      // Publier le message sur Kafka
      await lastValueFrom(
        this.kafkaClient.emit(
          PortfolioAIEventTopics.CHAT_MESSAGE,
          chatMessage
        )
      );
      
      this.logger.log(
        `Chat message ${messageId} sent for chat ${chatId}`
      );
      
      return messageId;
    } catch (error: any) {
      this.logger.error(
        `Failed to send chat message for chat ${chatId}: ${error.message || 'Unknown error'}`,
        error.stack || 'No stack trace'
      );
      throw error;
    }
  }
  
  /**
   * Configure les consommateurs Kafka pour recevoir les réponses d'Adha AI
   * 
   * @param analysisCallback Fonction appelée lors de la réception d'une réponse d'analyse
   * @param chatCallback Fonction appelée lors de la réception d'une réponse de chat
   */
  /**
   * Configure les callbacks pour les messages de Kafka
   * Note: Cette méthode ne configure pas les consumers directement
   * car ClientKafka n'expose pas d'API pour ça. Les event patterns 
   * doivent être configurés dans le module NestJS.
   * 
   * @param analysisCallback Fonction appelée lors de la réception d'une réponse d'analyse
   * @param chatCallback Fonction appelée lors de la réception d'une réponse de chat
   */
  setupConsumers(
    analysisCallback: Function,
    chatCallback: Function
  ): void {
    // Store the callbacks for later use
    this.handleAnalysisResponse = async (message: any) => {
      try {
        this.logger.log(`Received analysis response: ${JSON.stringify(message.id || 'unknown')}`);
        await analysisCallback(message);
      } catch (error: any) {
        this.logger.error(
          `Error processing analysis response: ${error.message || 'Unknown error'}`,
          error.stack || 'No stack trace'
        );
      }
    };
    
    this.handleChatResponse = async (message: any) => {
      try {
        this.logger.log(`Received chat response: ${JSON.stringify(message.id || 'unknown')}`);
        await chatCallback(message);
      } catch (error: any) {
        this.logger.error(
          `Error processing chat response: ${error.message || 'Unknown error'}`,
          error.stack || 'No stack trace'
        );
      }
    };
    
    // The actual event handling is managed through the @EventPattern decorator
    // in a dedicated controller or through the kafka client's message handler
    this.logger.log('Consumer callbacks registered successfully');
  }
  
  // Callback handlers stored as class properties
  private handleAnalysisResponse: (message: any) => Promise<void> = async () => {
    // Default empty implementation
  };
  
  private handleChatResponse: (message: any) => Promise<void> = async () => {
    // Default empty implementation
  };
}
