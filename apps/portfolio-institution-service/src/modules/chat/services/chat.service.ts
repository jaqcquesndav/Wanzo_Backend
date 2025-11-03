import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Chat } from '../entities/chat.entity';
import { ChatMessage, MessageDirection, MessageRole } from '../entities/chat-message.entity';
import { CreateChatDto, CreateMessageDto, ChatFilterDto } from '../dtos/chat.dto';
import { PortfolioService } from '../../portfolios/services/portfolio.service';
import { ProspectionService } from '../../prospection/services/prospection.service';
import { AdhaAIIntegrationService } from '../../integration/adha-ai-integration.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
    private portfolioService: PortfolioService,
    private prospectionService: ProspectionService,
    @Inject(forwardRef(() => AdhaAIIntegrationService))
    private adhaAIService: AdhaAIIntegrationService,
    private eventEmitter: EventEmitter2,
  ) {
    // Configuration des consommateurs pour les réponses d'Adha AI
    this.setupAdhaAIConsumers();
  }
  
  /**
   * Configure les consommateurs Kafka pour recevoir les réponses d'Adha AI
   */
  private setupAdhaAIConsumers(): void {
    this.adhaAIService.setupConsumers(
      // Callback pour les réponses d'analyse (non utilisé directement ici)
      async (analysisResponse: any) => {
        this.eventEmitter.emit('adha.analysis.response', analysisResponse);
      },
      // Callback pour les réponses de chat
      async (chatResponse: any) => {
        try {
          const { chatId, content, requestId } = chatResponse;
          
          // Créer un nouveau message pour la réponse d'Adha AI
          const message = this.messageRepository.create({
            chatId,
            content,
            direction: MessageDirection.INCOMING, // Message entrant (depuis Adha AI)
            role: MessageRole.ASSISTANT,
            contentType: 'text',
            timestamp: new Date(),
            tokensUsed: chatResponse.tokensUsed || 0,
            metadata: {
              requestId,
              aiProcessed: true,
              processingTime: chatResponse.processingTime
            }
          });
          
          await this.messageRepository.save(message);
          
          // Mettre à jour la date de dernière modification du chat
          const chat = await this.chatRepository.findOne({ where: { id: chatId } });
          if (chat) {
            chat.updatedAt = new Date();
            await this.chatRepository.save(chat);
          }
          
          // Émettre un événement pour notifier les clients en temps réel
          this.eventEmitter.emit('chat.message.received', message);
        } catch (error) {
          this.logger.error(`Error processing AI chat response: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
        }
      }
    );
  }

  async create(createChatDto: CreateChatDto, userId: string, institutionId?: string): Promise<Chat> {
    const kiotaId = `KIOTA-CHT-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;

    const chat = this.chatRepository.create({
      ...createChatDto,
      kiotaId,
      userId,
      institutionId,
    });

    return await this.chatRepository.save(chat);
  }

  async findAll(
    filters: ChatFilterDto,
    page = 1,
    perPage = 20,
  ): Promise<{
    chats: Chat[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const where: any = {};

    if (filters.institutionId) {
      where.institutionId = filters.institutionId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.title = Like(`%${filters.search}%`);
    }

    const [chats, total] = await this.chatRepository.findAndCount({
      where,
      relations: ['messages'],
      skip: (page - 1) * perPage,
      take: perPage,
      order: { updatedAt: 'DESC' },
    });

    return {
      chats,
      total,
      page,
      perPage,
    };
  }

  async findById(id: string): Promise<Chat> {
    const chat = await this.chatRepository.findOne({
      where: { id },
      relations: ['messages'],
    });

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${id} not found`);
    }

    return chat;
  }

  async addMessage(chatId: string, createMessageDto: CreateMessageDto, userId: string): Promise<ChatMessage> {
    const chat = await this.findById(chatId);

    const message = this.messageRepository.create({
      ...createMessageDto,
      chatId: chat.id,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Mise à jour de la date de dernière modification du chat
    chat.updatedAt = new Date();
    await this.chatRepository.save(chat);

    // Si le message provient de l'utilisateur, l'envoyer à Adha AI
    if (message.direction === 'outgoing') {
      await this.sendMessageToAdhaAI(chat, message, userId);
    }

    return savedMessage;
  }

  async getHistory(chatId: string): Promise<ChatMessage[]> {
    const chat = await this.findById(chatId);

    return await this.messageRepository.find({
      where: { chatId: chat.id },
      order: { timestamp: 'ASC' },
    });
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const chat = await this.findById(id);

    // Suppression logique : on marque le chat comme inactif
    chat.isActive = false;
    await this.chatRepository.save(chat);

    return {
      success: true,
      message: 'Chat deleted successfully',
    };
  }

  async getTokenUsage(chatId: string): Promise<{
    totalTokens: number;
    messageCount: number;
    averageTokensPerMessage: number;
  }> {
    const messages = await this.messageRepository.find({
      where: { chatId },
    });

    const totalTokens = messages.reduce((sum, msg) => sum + msg.tokensUsed, 0);
    const messageCount = messages.length;

    return {
      totalTokens,
      messageCount,
      averageTokensPerMessage: messageCount > 0 ? totalTokens / messageCount : 0,
    };
  }

  // Méthode pour récupérer le contexte agrégé du chat (données portfolio et prospection)
  async getAggregatedContext(institutionId: string): Promise<Record<string, any>> {
    const portfolioData = await this.portfolioService.findAll({ institutionId }, 1, 10);
    const prospectData = await this.prospectionService.getOpportunities({}, institutionId);

    return {
      portfolio: {
        portfolios: portfolioData.portfolios.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          riskProfile: p.risk_profile,
        })),
        total: portfolioData.total,
      },
      prospection: {
        opportunities: prospectData.data.map(opp => ({
          id: opp.id,
          companyName: opp.companyName,
          status: opp.status,
          sector: opp.sector,
        })),
        total: prospectData.meta.total,
      },
    };
  }

  /**
   * Envoie un message au service Adha AI pour obtenir une réponse
   * 
   * @param chat Le chat auquel appartient le message
   * @param message Le message à envoyer
   * @param userId L'ID de l'utilisateur qui envoie le message
   * @returns L'ID de la requête envoyée à Adha AI
   */
  private async sendMessageToAdhaAI(chat: Chat, message: ChatMessage, userId: string): Promise<string> {
    try {
      // Récupérer le contexte pour enrichir le message
      let contextInfo: Record<string, any> = {};
      
      if (chat.institutionId) {
        const aggregatedContext = await this.getAggregatedContext(chat.institutionId);
        contextInfo = {
          ...aggregatedContext,
          chatTitle: chat.title,
          chatMetadata: chat.metadata || {}
        };
      }
      
      // Déterminer le rôle de l'utilisateur (à adapter selon votre modèle)
      const userRole = 'INSTITUTION_USER'; 
      
      // Envoyer le message à Adha AI via le service d'intégration
      const requestId = await this.adhaAIService.sendChatMessage(
        chat.id,
        userId,
        userRole,
        message.content,
        contextInfo
      );
      
      // Mettre à jour les métadonnées du message avec l'ID de la requête
      message.metadata = {
        ...(message.metadata || {}),
        requestId,
        sentToAI: true,
        sentAt: new Date().toISOString()
      };
      
      await this.messageRepository.save(message);
      
      return requestId;
    } catch (error: any) {
      this.logger.error(`Error sending message to Adha AI: ${error.message || 'Unknown error'}`, error.stack);
      
      // Mettre à jour le message pour indiquer l'erreur
      message.error = true;
      message.metadata = {
        ...(message.metadata || {}),
        error: error.message || 'Unknown error',
        errorTimestamp: new Date().toISOString()
      };
      
      await this.messageRepository.save(message);
      throw error;
    }
  }
}
