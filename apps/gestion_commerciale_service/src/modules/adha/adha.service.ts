import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { AdhaConversation } from './entities/adha-conversation.entity';
import { AdhaMessage, AdhaMessageSender } from './entities/adha-message.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { ListConversationsDto } from './dto/list-conversations.dto';
import { GetConversationHistoryDto } from './dto/get-conversation-history.dto';
import { User } from '../auth/entities/user.entity';
// import { OpenAIService } from '../openai/openai.service'; // Assuming an OpenAI service for AI responses

@Injectable()
export class AdhaService {
  private readonly logger = new Logger(AdhaService.name);

  constructor(
    @InjectRepository(AdhaConversation) private conversationsRepository: Repository<AdhaConversation>,
    @InjectRepository(AdhaMessage) private messagesRepository: Repository<AdhaMessage>,
    // private readonly openaiService: OpenAIService, // Inject AI service
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

    const userMessage = this.messagesRepository.create({
      conversationId: conversation.id,
      text: sendMessageDto.text,
      sender: AdhaMessageSender.USER,
      timestamp: new Date(sendMessageDto.timestamp),
      contextInfo: sendMessageDto.contextInfo,
    });
    await this.messagesRepository.save(userMessage);

    // Simulate AI response for now
    // const aiReplyText = await this.openaiService.generateReply(sendMessageDto.text, sendMessageDto.contextInfo);
    const aiReplyText = `This is a simulated AI reply to: "${sendMessageDto.text}". Context: ${JSON.stringify(sendMessageDto.contextInfo)}`;
    this.logger.log(`Simulated AI reply for conversation ${conversation.id}: ${aiReplyText}`);

    const aiMessage = this.messagesRepository.create({
      conversationId: conversation.id,
      text: aiReplyText,
      sender: AdhaMessageSender.AI,
      timestamp: new Date(),
      // contextUsed: { ... } // Optionally log context used by AI for this specific reply
    });
    await this.messagesRepository.save(aiMessage);

    conversation.lastMessageTimestamp = aiMessage.timestamp;
    await this.conversationsRepository.save(conversation);

    return {
      replyText: aiMessage.text,
      conversationId: conversation.id,
      messageId: aiMessage.id,
      timestamp: aiMessage.timestamp,
    };
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
