import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PublicChatAdhaService } from '../services/public-chat-adha.service';
import { 
  SendMessageDto, 
  CreateConversationDto, 
  MessageResponseDto,
  ConversationResponseDto,
  ChatHealthResponseDto
} from '../dto/chat.dto';

@ApiTags('Chat Adha Public')
@Controller()
export class PublicChatAdhaController {
  constructor(
    private readonly chatService: PublicChatAdhaService
  ) {}

  /**
   * Vérifier l'état de santé de la connexion Adha AI
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Vérifier la connexion IA',
    description: 'Vérifie l\'état de santé de la connexion avec le service Adha AI'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'État de santé récupéré avec succès',
    type: ChatHealthResponseDto
  })
  async healthCheck(): Promise<ChatHealthResponseDto> {
    return await this.chatService.getHealth();
  }

  /**
   * Envoyer un message à Adha AI
   */
  @Post('chat/message')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Envoyer un message',
    description: 'Envoie un message à l\'assistant Adha AI avec contexte et historique'
  })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Message envoyé et réponse générée avec succès',
    type: MessageResponseDto
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  async sendMessage(
    @Request() req: any,
    @Body() sendMessageDto: SendMessageDto
  ): Promise<MessageResponseDto> {
    const userId = req.user.id;
    return await this.chatService.sendMessage(sendMessageDto, userId);
  }

  /**
   * Récupérer l'historique d'une conversation
   */
  @Get('chat/conversations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Historique conversation',
    description: 'Récupère l\'historique complet d\'une conversation spécifique'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la conversation',
    example: 'conv-123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Historique récupéré avec succès',
    type: ConversationResponseDto
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  async getConversationHistory(
    @Request() req: any,
    @Param('id') conversationId: string
  ): Promise<ConversationResponseDto> {
    const userId = req.user.id;
    return await this.chatService.getConversation(conversationId, userId);
  }

  /**
   * Créer une nouvelle conversation
   */
  @Post('chat/conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Créer conversation',
    description: 'Crée une nouvelle conversation de chat avec Adha AI'
  })
  @ApiBody({ type: CreateConversationDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Conversation créée avec succès',
    type: ConversationResponseDto
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async createConversation(
    @Request() req: any,
    @Body() createConversationDto: CreateConversationDto
  ): Promise<ConversationResponseDto> {
    const userId = req.user.id;
    return await this.chatService.createConversation(createConversationDto, userId);
  }

  /**
   * Supprimer une conversation
   */
  @Delete('chat/conversations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Supprimer conversation',
    description: 'Supprime définitivement une conversation et tous ses messages'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la conversation à supprimer',
    example: 'conv-123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Conversation supprimée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Conversation deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  async deleteConversation(
    @Request() req: any,
    @Param('id') conversationId: string
  ): Promise<{ success: boolean; message: string }> {
    const userId = req.user.id;
    await this.chatService.deleteConversation(conversationId, userId);
    return { success: true, message: 'Conversation supprimée avec succès' };
  }

  /**
   * Lister les conversations de l'utilisateur
   */
  @Get('chat/conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Lister conversations',
    description: 'Récupère la liste des conversations de l\'utilisateur connecté'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    description: 'Numéro de page',
    example: 1 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Nombre d\'éléments par page',
    example: 20 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des conversations récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        conversations: { 
          type: 'array', 
          items: { $ref: '#/components/schemas/ConversationResponseDto' }
        },
        total: { type: 'number', example: 25 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getConversations(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ): Promise<{
    conversations: ConversationResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const userId = req.user.id;
    const conversations = await this.chatService.getUserConversations(userId);
    
    // Pagination simple
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedConversations = conversations.slice(startIndex, endIndex);
    
    return {
      conversations: paginatedConversations,
      total: conversations.length,
      page,
      limit
    };
  }
}