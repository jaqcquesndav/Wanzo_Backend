import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Chat } from '../entities/chat.entity';
import { ChatMessage, MessageRole } from '../entities/chat-message.entity';
import { CreateChatDto, CreateMessageDto, ChatFilterDto } from '../dtos/chat.dto';
import { JournalService } from '../../journals/services/journal.service';
import { AccountService } from '../../accounts/services/account.service';
import { AccountingStandard } from '../../../common/enums/accounting.enum'; // Added import

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
    private journalService: JournalService,
    private accountService: AccountService,
  ) {}

  async create(createChatDto: CreateChatDto, userId: string): Promise<Chat> {
    const kiotaId = `KIOTA-CHT-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;

    const chat = this.chatRepository.create({
      ...createChatDto,
      kiotaId,
      userId,
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

  async addMessage(
    chatId: string,
    createMessageDto: CreateMessageDto,
    userId: string,
  ): Promise<ChatMessage> {
    const chat = await this.findById(chatId);

    const message = this.messageRepository.create({
      ...createMessageDto,
      chatId: chat.id,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update chat's updatedAt
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

    // Soft delete - just mark as inactive
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

  // Méthodes spécifiques au service de comptabilité
  async getAccountingContext(companyId: string, fiscalYear: string, accountingStandard: AccountingStandard): Promise<Record<string, any>> {
    const [accounts, journals] = await Promise.all([
      this.accountService.findAll({ companyId }), // Filtres supportés par AccountFilterDto
      this.journalService.findAll({ companyId }, 1, 10), // Filtres supportés par JournalFilterDto
    ]);

    return {
      accounts: accounts.accounts.map(acc => ({
        code: acc.code,
        name: acc.name,
        type: acc.type,
      })),
      recentJournals: journals.journals.map(journal => ({
        journalType: journal.journalType,
        description: journal.description,
        amount: journal.totalDebit,
      })),
      fiscalYear,
      accountingStandard,
    };
  }

  /**
   * Find a chat message by its ID
   */
  async findMessageById(id: string): Promise<ChatMessage> {
    const message = await this.messageRepository.findOne({
      where: { id }
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return message;
  }

  /**
   * Update a chat message
   */
  async updateMessage(message: ChatMessage): Promise<ChatMessage> {
    return await this.messageRepository.save(message);
  }

  /**
   * Generate AI response for chat messages
   */
  async generateAIResponse(
    userMessage: string,
    modelId: string,
    writeMode: boolean,
    context: string[]
  ): Promise<{
    content: string;
    metadata?: any;
    journalEntry?: any;
  }> {
    // Cette méthode simulera une réponse d'IA jusqu'à intégration d'un vrai service d'IA
    
    if (writeMode) {
      // Mode écriture - générer une proposition d'écriture comptable
      const journalEntry = {
        id: `agent-${Math.random().toString(36).substring(2, 11)}`,
        date: new Date().toISOString().split('T')[0],
        journalType: 'purchases',
        reference: `AUTO-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        description: `Écriture générée: ${userMessage.substring(0, 50)}...`,
        status: 'draft',
        source: 'agent',
        agentId: modelId,
        validationStatus: 'pending',
        lines: [
          {
            accountCode: '626100',
            accountName: 'Frais de télécommunication',
            debit: 100.00,
            credit: 0,
            description: 'Frais HT'
          },
          {
            accountCode: '445660',
            accountName: 'TVA déductible',
            debit: 20.00,
            credit: 0,
            description: 'TVA 20%'
          },
          {
            accountCode: '401100',
            accountName: 'Fournisseurs',
            debit: 0,
            credit: 120.00,
            description: 'Dette fournisseur'
          }
        ],
        totalDebit: 120.00,
        totalCredit: 120.00,
        totalVat: 20.00
      };

      return {
        content: 'J\'ai analysé votre facture et propose cette écriture comptable :',
        metadata: { journalEntry },
        journalEntry
      };
    } else {
      // Mode conversation normal
      const responses = [
        `Pour répondre à votre question sur "${userMessage.substring(0, 30)}...", voici les éléments importants à considérer en comptabilité SYSCOHADA.`,
        `D'après les normes SYSCOHADA, concernant "${userMessage.substring(0, 30)}...", il faut suivre les procédures suivantes.`,
        `Votre demande sur "${userMessage.substring(0, 30)}..." nécessite une approche spécifique selon le référentiel comptable OHADA.`
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      return {
        content: randomResponse,
        metadata: {
          modelUsed: modelId,
          contextApplied: context,
          generatedAt: new Date().toISOString()
        }
      };
    }
  }
}
