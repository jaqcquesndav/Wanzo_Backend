import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Chat } from '../entities/chat.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { CreateChatDto, CreateMessageDto, ChatFilterDto } from '../dtos/chat.dto';
import { PortfolioService } from '../../portfolios/services/portfolio.service';
import { ProspectService } from '../../prospection/services/prospect.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
    private portfolioService: PortfolioService,
    private prospectService: ProspectService,
  ) {}

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

  async addMessage(chatId: string, createMessageDto: CreateMessageDto, _userId: string): Promise<ChatMessage> {
    const chat = await this.findById(chatId);

    const message = this.messageRepository.create({
      ...createMessageDto,
      chatId: chat.id,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Mise à jour de la date de dernière modification du chat
    chat.updatedAt = new Date();
    await this.chatRepository.save(chat);

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
    const prospectData = await this.prospectService.findAll({ institutionId }, 1, 10);

    return {
      portfolio: {
        portfolios: portfolioData.portfolios.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          riskProfile: p.riskProfile,
        })),
        total: portfolioData.total,
      },
      prospection: {
        prospects: prospectData.prospects.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          sector: p.sector,
        })),
        total: prospectData.total,
      },
    };
  }
}
