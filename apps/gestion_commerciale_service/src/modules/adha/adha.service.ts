import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { AdhaConversation } from './entities/adha-conversation.entity';
import { AdhaMessage, AdhaMessageSender } from './entities/adha-message.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { ListConversationsDto } from './dto/list-conversations.dto';
import { GetConversationHistoryDto } from './dto/get-conversation-history.dto';
import { User, UserRole } from '../auth/entities/user.entity';
import { AdhaAiService } from './services/adha-ai.service';

@Injectable()
export class AdhaService {
  private readonly logger = new Logger(AdhaService.name);

  constructor(
    @InjectRepository(AdhaConversation) private conversationsRepository: Repository<AdhaConversation>,
    @InjectRepository(AdhaMessage) private messagesRepository: Repository<AdhaMessage>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly adhaAiService: AdhaAiService, // Inject Adha AI service
  ) {}

  async sendMessage(userId: string, sendMessageDto: SendMessageDto): Promise<{ replyText: string; conversationId: string; messageId: string; timestamp: Date }> {
    let conversation: AdhaConversation | null; // Changed type to allow null

    if (sendMessageDto.conversationId) {
      conversation = await this.conversationsRepository.findOne({ where: { id: sendMessageDto.conversationId, userId } });
      if (!conversation) {
        throw new NotFoundException(`Conversation with ID ${sendMessageDto.conversationId} not found for this user.`);
      }
    } else {
      conversation = this.conversationsRepository.create({
        userId,
        title: sendMessageDto.text.substring(0, 50), // Basic title from first message part
      });
      await this.conversationsRepository.save(conversation);
    }

    // Enregistrer le message de l'utilisateur
    const userMessage = this.messagesRepository.create({
      conversationId: conversation.id,
      text: sendMessageDto.text,
      sender: AdhaMessageSender.USER,
      timestamp: new Date(sendMessageDto.timestamp),
      contextInfo: sendMessageDto.contextInfo,
    });
    await this.messagesRepository.save(userMessage);

    // Récupérer des informations sur l'utilisateur pour le contexte
    const user = await this.getUserDetails(userId);

    try {
      // Envoyer le message à Adha AI via Kafka et récupérer la réponse
      const aiResponse = await this.adhaAiService.sendMessage(
        sendMessageDto.text,
        conversation.id,
        sendMessageDto.contextInfo || {},
        userId,
        user.companyId,
        user.role,
      );

      // Enregistrer la réponse de l'IA
      const aiMessage = this.messagesRepository.create({
        conversationId: conversation.id,
        text: aiResponse.response,
        sender: AdhaMessageSender.AI,
        timestamp: new Date(),
        contextInfo: {
          relevantEntries: aiResponse.relevantEntries,
          processingDetails: aiResponse.metadata,
        }
      });
      await this.messagesRepository.save(aiMessage);

      // Mettre à jour la date du dernier message dans la conversation
      conversation.lastMessageTimestamp = aiMessage.timestamp;
      await this.conversationsRepository.save(conversation);

      return {
        replyText: aiMessage.text,
        conversationId: conversation.id,
        messageId: aiMessage.id,
        timestamp: aiMessage.timestamp,
      };
    } catch (error) {
      const errorDetail = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error getting AI response: ${errorDetail}`, errorStack);
      
      // En cas d'erreur, envoyer un message d'erreur générique
      const errorMessage = "Je suis désolé, mais je rencontre des difficultés techniques. Veuillez réessayer dans quelques instants.";
      
      const aiMessage = this.messagesRepository.create({
        conversationId: conversation.id,
        text: errorMessage,
        sender: AdhaMessageSender.AI,
        timestamp: new Date(),
      });
      await this.messagesRepository.save(aiMessage);
      
      conversation.lastMessageTimestamp = aiMessage.timestamp;
      await this.conversationsRepository.save(conversation);
      
      return {
        replyText: errorMessage,
        conversationId: conversation.id,
        messageId: aiMessage.id,
        timestamp: aiMessage.timestamp,
      };
    }
  }

  async listConversations(userId: string, listConversationsDto: ListConversationsDto): Promise<{ data: AdhaConversation[], total: number, page: number, limit: number }> {
    const { page = 1, limit = 10, sortBy = 'lastMessageTimestamp', sortOrder = 'DESC' } = listConversationsDto;
    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions<AdhaConversation> = {
      where: { userId },
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    };

    const [data, total] = await this.conversationsRepository.findAndCount(findOptions);
    return { data, total, page, limit };
  }
  
  /**
   * Récupère les détails de l'utilisateur nécessaires pour le contexte
   * @param userId ID de l'utilisateur
   * @returns Informations sur l'utilisateur
   */
  private async getUserDetails(userId: string): Promise<{ companyId: string; role: UserRole }> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      
      return {
        companyId: user.companyId || 'default',
        role: user.role || UserRole.STAFF, // STAFF en tant que rôle par défaut
      };
    } catch (error) {
      this.logger.error(`Error fetching user details: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Renvoyer des valeurs par défaut en cas d'erreur
      return {
        companyId: 'default',
        role: UserRole.STAFF, // STAFF en tant que rôle par défaut
      };
    }
  }

  async getConversationHistory(userId: string, conversationId: string, getConversationHistoryDto: GetConversationHistoryDto): Promise<{data: AdhaMessage[], total: number, page: number, limit: number}> {
    const conversation = await this.conversationsRepository.findOne({ where: { id: conversationId, userId } });
    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found for this user.`);
    }

    const { page = 1, limit = 20 } = getConversationHistoryDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.messagesRepository.findAndCount({
      where: { conversationId },
      order: { timestamp: 'ASC' }, // Typically messages are ordered chronologically
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }
}
