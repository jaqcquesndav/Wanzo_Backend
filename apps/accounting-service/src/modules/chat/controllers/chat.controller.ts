import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import { 
  CreateChatDto, 
  CreateMessageDto, 
  ChatFilterDto, 
  ChatRequestDto, 
  SendMessageDto,
  ChatResponseDto,
  ConversationDto,
  AiModelDto
} from '../dtos/chat.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AccountingStandard } from '../../../common/enums/accounting.enum';
import { MessageRole } from '../entities/chat-message.entity';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @Roles('admin', 'accountant', 'user')
  @ApiOperation({ summary: 'Send message to chat' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async sendMessage(@Body() chatRequestDto: ChatRequestDto, @Req() req: any) {
    let conversationId = chatRequestDto.conversationId;
    const userId = req.user.id;
    const companyId = req.user.companyId;

    // Si pas de conversationId, on crée une nouvelle conversation
    if (!conversationId) {
      const createChatDto = new CreateChatDto();
      createChatDto.title = "Nouvelle conversation";
      createChatDto.isActive = true;
      createChatDto.context = {
        modelId: chatRequestDto.modelId || 'adha-1',
        context: chatRequestDto.context || [],
        writeMode: chatRequestDto.writeMode || false
      };
      
      const newChat = await this.chatService.create(createChatDto, userId);
      conversationId = newChat.id;
    }

    // Créer le message utilisateur
    const messageDto = new CreateMessageDto();
    messageDto.role = MessageRole.USER;
    messageDto.content = chatRequestDto.message.content;
    
    // Traiter la pièce jointe si présente
    if (chatRequestDto.message.attachment) {
      messageDto.metadata = {
        attachment: {
          name: chatRequestDto.message.attachment.name,
          type: chatRequestDto.message.attachment.type,
          content: chatRequestDto.message.attachment.content
        }
      };
    }

    const userMessage = await this.chatService.addMessage(conversationId, messageDto, userId);
    
    // Générer une réponse de l'IA
    const chat = await this.chatService.findById(conversationId);
    const writeMode = chat.context?.writeMode || chatRequestDto.writeMode || false;
    
    const aiMessageDto = new CreateMessageDto();
    aiMessageDto.role = MessageRole.ASSISTANT;
    
    // Si mode d'écriture activé, générer une proposition d'écriture comptable
    if (writeMode) {
      aiMessageDto.content = `J'ai analysé votre message et je propose l'écriture comptable suivante :`;
      
      // Exemple d'écriture comptable (à remplacer par un vrai service d'IA comptable)
      aiMessageDto.metadata = {
        journalEntry: {
          id: `agent-${Math.random().toString(36).substring(2, 11)}`,
          date: new Date().toISOString().split('T')[0],
          journalType: 'purchases',
          reference: `AUTO-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          description: `Écriture générée depuis le message: ${chatRequestDto.message.content.substring(0, 30)}...`,
          status: 'draft',
          source: 'agent',
          agentId: chat.context?.modelId || 'adha-1',
          validationStatus: 'pending',
          lines: [
            {
              accountCode: '626100',
              accountName: 'Frais de télécommunication',
              debit: 100.00,
              credit: 0,
              description: 'Frais de télécommunication HT'
            },
            {
              accountCode: '445660',
              accountName: 'TVA déductible sur autres biens et services',
              debit: 20.00,
              credit: 0,
              description: 'TVA déductible'
            },
            {
              accountCode: '401100',
              accountName: 'Fournisseurs - achats de biens ou prestations de services',
              debit: 0,
              credit: 120.00,
              description: 'Dette fournisseur'
            }
          ],
          totalDebit: 120.00,
          totalCredit: 120.00,
          totalVat: 20.00
        }
      };
    } else {
      aiMessageDto.content = `Réponse automatique à: ${chatRequestDto.message.content}`;
    }
    
    const aiMessage = await this.chatService.addMessage(conversationId, aiMessageDto, userId);
    
    // Format de la réponse
    const response: any = {
      id: aiMessage.id,
      sender: 'bot',
      content: aiMessage.content,
      timestamp: aiMessage.timestamp,
      conversationId: conversationId
    };
    
    // Ajouter l'écriture comptable si en mode d'écriture
    if (writeMode && aiMessage.metadata?.journalEntry) {
      response.journalEntry = aiMessage.metadata.journalEntry;
    }
    
    return response;
  }

  @Post('message')
  @Roles('admin', 'accountant', 'user')
  @ApiOperation({ summary: 'Send message to chat (API specification endpoint)' })
  @ApiResponse({ status: 200, description: 'Message sent successfully', type: ChatResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendMessageToChat(@Body() sendMessageDto: SendMessageDto, @Req() req: any): Promise<ChatResponseDto> {
    let conversationId = sendMessageDto.conversationId;
    const userId = req.user.id;
    const companyId = req.user.companyId;

    // Si pas de conversationId, on crée une nouvelle conversation
    if (!conversationId) {
      const createChatDto = new CreateChatDto();
      createChatDto.title = "Nouvelle conversation";
      createChatDto.isActive = true;
      createChatDto.context = {
        modelId: sendMessageDto.modelId,
        context: sendMessageDto.context || [],
        writeMode: sendMessageDto.writeMode || false
      };
      
      const newChat = await this.chatService.create(createChatDto, userId);
      conversationId = newChat.id;
    }

    // Créer le message utilisateur
    const messageDto = new CreateMessageDto();
    messageDto.role = MessageRole.USER;
    messageDto.content = sendMessageDto.message.content;
    
    // Traiter la pièce jointe si présente
    if (sendMessageDto.message.attachment) {
      messageDto.metadata = {
        attachment: {
          name: sendMessageDto.message.attachment.name,
          type: sendMessageDto.message.attachment.type,
          content: sendMessageDto.message.attachment.content
        }
      };
    }

    const userMessage = await this.chatService.addMessage(conversationId, messageDto, userId);
    
    // Générer une réponse de l'IA
    const chat = await this.chatService.findById(conversationId);
    const writeMode = sendMessageDto.writeMode || false;
    
    const aiResponse = await this.chatService.generateAIResponse(
      sendMessageDto.message.content,
      sendMessageDto.modelId,
      writeMode,
      sendMessageDto.context || []
    );
    
    const aiMessageDto = new CreateMessageDto();
    aiMessageDto.role = MessageRole.ASSISTANT;
    aiMessageDto.content = aiResponse.content;
    aiMessageDto.metadata = aiResponse.metadata;
    
    const aiMessage = await this.chatService.addMessage(conversationId, aiMessageDto, userId);
    
    // Format de la réponse conforme à la documentation
    const response: ChatResponseDto = {
      success: true,
      data: {
        message: {
          id: aiMessage.id,
          sender: 'bot',
          content: aiMessage.content,
          timestamp: aiMessage.timestamp.toISOString(),
          likes: aiMessage.likes,
          dislikes: aiMessage.dislikes
        },
        conversationId: conversationId,
        ...(aiResponse.journalEntry ? { journalEntry: aiResponse.journalEntry } : {})
      }
    };
    
    return response;
  }

  @Get('conversations')
  @Roles('admin', 'accountant', 'user')
  @ApiOperation({ summary: 'Get all chat conversations' })
  @ApiResponse({ status: 200, description: 'Conversations retrieved successfully' })
  async getConversations(@Req() req: any) {
    const filters = new ChatFilterDto();
    // Si l'utilisateur n'est pas admin, forcer le filtrage par son entreprise
    if (req.user.role !== 'admin') {
      filters.companyId = req.user.companyId;
    }
    filters.userId = req.user.id;

    const result = await this.chatService.findAll(filters, 1, 100);
    
    // Modèles disponibles (devrait être configuré via base de données)
    const getModelInfo = (modelId: string) => {
      const models = {
        'adha-1': {
          id: 'adha-1',
          name: 'Adha 1',
          description: 'Modèle de base pour la comptabilité générale',
          capabilities: ['Comptabilité générale', 'Écritures simples', 'Rapprochements'],
          contextLength: 4096
        },
        'adha-fisk': {
          id: 'adha-fisk',
          name: 'Adha Fisk',
          description: 'Spécialisé en fiscalité et déclarations',
          capabilities: ['Fiscalité', 'TVA', 'Déclarations fiscales', 'Optimisation fiscale'],
          contextLength: 8192
        },
        'adha-o1': {
          id: 'adha-o1',
          name: 'Adha O1',
          description: 'Version avancée pour l\'analyse financière',
          capabilities: ['Analyse financière', 'Ratios', 'Prévisions', 'Tableaux de bord'],
          contextLength: 16384
        }
      };
      return models[modelId] || models['adha-1'];
    };
    
    // Format API attendu
    return {
      success: true,
      data: result.chats.map(chat => ({
        id: chat.id,
        title: chat.title,
        timestamp: chat.updatedAt.toISOString(),
        isActive: chat.isActive,
        model: getModelInfo(chat.context?.modelId || 'adha-1'),
        context: chat.context?.context || [],
        messages: [] // Messages non inclus dans la liste, seulement dans le détail
      }))
    };
  }

  @Get('conversations/:id')
  @Roles('admin', 'accountant', 'user')
  @ApiOperation({ summary: 'Get conversation history' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversationHistory(@Param('id') id: string, @Req() req: any) {
    const chat = await this.chatService.findById(id);
    
    // Vérifier les droits d'accès
    if (req.user.role !== 'admin' && chat.userId !== req.user.id) {
      throw new Error('Access denied to this conversation');
    }
    
    const messages = await this.chatService.getHistory(id);
    
    // Modèle info helper
    const getModelInfo = (modelId: string) => {
      const models = {
        'adha-1': {
          id: 'adha-1',
          name: 'Adha 1',
          description: 'Modèle de base pour la comptabilité générale',
          capabilities: ['Comptabilité générale', 'Écritures simples', 'Rapprochements'],
          contextLength: 4096
        },
        'adha-fisk': {
          id: 'adha-fisk',
          name: 'Adha Fisk',
          description: 'Spécialisé en fiscalité et déclarations',
          capabilities: ['Fiscalité', 'TVA', 'Déclarations fiscales', 'Optimisation fiscale'],
          contextLength: 8192
        },
        'adha-o1': {
          id: 'adha-o1',
          name: 'Adha O1',
          description: 'Version avancée pour l\'analyse financière',
          capabilities: ['Analyse financière', 'Ratios', 'Prévisions', 'Tableaux de bord'],
          contextLength: 16384
        }
      };
      return models[modelId] || models['adha-1'];
    };
    
    // Format API attendu conforme à la documentation
    return {
      success: true,
      data: {
        id: chat.id,
        title: chat.title,
        timestamp: chat.updatedAt.toISOString(),
        isActive: chat.isActive,
        model: getModelInfo(chat.context?.modelId || 'adha-1'),
        context: chat.context?.context || [],
        messages: messages.map(msg => ({
          id: msg.id,
          sender: msg.role === MessageRole.USER ? 'user' : 'bot',
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
          likes: msg.likes || 0,
          dislikes: msg.dislikes || 0,
          ...(msg.metadata?.journalEntry ? { journalEntry: msg.metadata.journalEntry } : {}),
          ...(msg.attachment ? { attachment: msg.attachment } : {})
        }))
      }
    };
  }

  @Get('models')
  @Roles('admin', 'accountant', 'user')
  @ApiOperation({ summary: 'Get available AI models' })
  @ApiResponse({ status: 200, description: 'AI models retrieved successfully' })
  async getModels() {
    // Liste des modèles conforme à la documentation
    return {
      success: true,
      data: [
        {
          id: 'adha-1',
          name: 'Adha 1',
          description: 'Modèle de base pour la comptabilité générale',
          capabilities: ['Comptabilité générale', 'Écritures simples', 'Rapprochements'],
          contextLength: 4096
        },
        {
          id: 'adha-fisk',
          name: 'Adha Fisk',
          description: 'Spécialisé en fiscalité et déclarations',
          capabilities: ['Fiscalité', 'TVA', 'Déclarations fiscales', 'Optimisation fiscale'],
          contextLength: 8192
        },
        {
          id: 'adha-o1',
          name: 'Adha O1',
          description: 'Version avancée pour l\'analyse financière',
          capabilities: ['Analyse financière', 'Ratios', 'Prévisions', 'Tableaux de bord'],
          contextLength: 16384
        }
      ]
    };
  }

  @Post(':id/message')
  @Roles('admin', 'accountant', 'user')
  @ApiOperation({ summary: 'Add message to chat (DEPRECATED - use POST /chat instead)' })
  @ApiParam({ name: 'id', description: 'Chat ID' })
  @ApiResponse({ status: 201, description: 'Message added successfully' })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  async addMessage(
    @Param('id') id: string,
    @Body() createMessageDto: CreateMessageDto,
    @Req() req: any,
  ) {
    const message = await this.chatService.addMessage(id, createMessageDto, req.user.id);
    return {
      success: true,
      message,
    };
  }

  @Get(':id/history')
  @Roles('admin', 'accountant', 'user')
  @ApiOperation({ summary: 'Get chat history (DEPRECATED - use GET /chat/conversations/:id instead)' })
  @ApiParam({ name: 'id', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Chat history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  async getHistory(@Param('id') id: string) {
    const messages = await this.chatService.getHistory(id);
    return {
      success: true,
      messages,
    };
  }

  @Delete('conversations/:id')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Delete conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async deleteConversation(@Param('id') id: string) {
    const result = await this.chatService.delete(id);
    return {
      success: result.success,
      message: result.message
    };
  }

  @Get(':id/usage')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Get token usage statistics (DEPRECATED)' })
  @ApiParam({ name: 'id', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Token usage statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Chat session not found' })
  async getTokenUsage(@Param('id') id: string) {
    const usage = await this.chatService.getTokenUsage(id);
    return {
      success: true,
      usage,
    };
  }

  @Get('context/:companyId')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Get accounting context for AI (DEPRECATED)' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiQuery({ name: 'fiscalYear', required: true, type: String, description: 'Fiscal Year' })
  @ApiQuery({ name: 'accountingStandard', required: true, enum: AccountingStandard, description: 'Accounting Standard', type: String })
  @ApiResponse({ status: 200, description: 'Accounting context retrieved successfully' })
  async getAccountingContext(
    @Param('companyId') companyId: string,
    @Query('fiscalYear') fiscalYear: string,
    @Query('accountingStandard') accountingStandard: AccountingStandard,
  ) {
    const context = await this.chatService.getAccountingContext(companyId, fiscalYear, accountingStandard);
    return {
      success: true,
      context,
    };
  }
}