import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Chat } from '../entities/chat.entity';
import { ChatMessage, MessageRole } from '../entities/chat-message.entity';
import { CreateChatDto, CreateMessageDto, ChatFilterDto } from '../dtos/chat.dto';
import { PortfolioService } from '../../portfolios/services/portfolio.service';
import { ReportService } from '../../reports/services/report.service';
import { ReportType, ReportPeriod, ReportFormat } from '../../reports/dtos/report.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
    private portfolioService: PortfolioService,
    private reportService: ReportService,
  ) {}

  async create(createChatDto: CreateChatDto, userId: string, companyId?: string): Promise<Chat> {
    const kiotaId = `KIOTA-CHT-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;
    const chat = this.chatRepository.create({
      ...createChatDto,
      kiotaId,
      userId,
      companyId,
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
    if (filters.companyId) {
      where.companyId = filters.companyId;
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
    return { chats, total, page, perPage };
  }

  async findById(id: string): Promise<Chat> {
    const chat = await this.chatRepository.findOne({ where: { id }, relations: ['messages'] });
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
    chat.isActive = false;
    await this.chatRepository.save(chat);
    return { success: true, message: 'Chat deleted successfully' };
  }

  async getTokenUsage(chatId: string): Promise<{
    totalTokens: number;
    messageCount: number;
    averageTokensPerMessage: number;
  }> {
    const messages = await this.messageRepository.find({ where: { chatId } });
    const totalTokens = messages.reduce((sum, msg) => sum + msg.tokensUsed, 0);
    const messageCount = messages.length;
    return {
      totalTokens,
      messageCount,
      averageTokensPerMessage: messageCount > 0 ? totalTokens / messageCount : 0,
    };
  }

  // Méthode pour récupérer un contexte agrégé à partir des données portefeuille et rapport
  async getAggregatedContext(companyId: string): Promise<Record<string, any>> {
    // Récupérer les portefeuilles associés à l'entreprise
    const portfolioData = await this.portfolioService.findAll({ companyId }, 1, 10);

    // Définir une période par défaut (dernier mois)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date();
    const reportPeriod: ReportPeriod = { startDate, endDate };

    // Générer un rapport synthétique de type PORTFOLIO_SUMMARY en PDF
    const report = await this.reportService.generateReport(
      companyId,
      ReportType.PORTFOLIO_SUMMARY,
      reportPeriod,
      ReportFormat.PDF
    );

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
      report,
    };
  }
}
