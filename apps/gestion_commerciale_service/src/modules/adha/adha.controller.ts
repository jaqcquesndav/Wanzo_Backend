import { Controller, Post, Body, Get, Param, Query, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { AdhaService } from './adha.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ListConversationsDto } from './dto/list-conversations.dto';
import { GetConversationHistoryDto } from './dto/get-conversation-history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('adha')
@ApiBearerAuth('JWT-auth')
@Controller('adha')
@UseGuards(JwtAuthGuard)
export class AdhaController {
  constructor(private readonly adhaService: AdhaService) {}

  @Post('message')
  @ApiOperation({ summary: 'Envoyer un message à Adha', description: 'Envoie un message à l\'assistant Adha et reçoit une réponse' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ status: 200, description: 'Message envoyé et réponse générée avec succès', schema: {
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Reply successfully generated.' },
      data: { type: 'object' },
      statusCode: { type: 'number', example: 200 }
    }
  }})
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  async sendMessage(@CurrentUser() user: User, @Body() sendMessageDto: SendMessageDto) {
    const result = await this.adhaService.sendMessage(user.id, sendMessageDto);
    return {
      success: true,
      message: 'Reply successfully generated.',
      data: result,
      statusCode: 200,
    };
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Lister les conversations', description: 'Récupère la liste des conversations de l\'utilisateur avec Adha' })
  @ApiQuery({ type: ListConversationsDto })
  @ApiResponse({ status: 200, description: 'Conversations récupérées avec succès', schema: {
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Conversations fetched successfully.' },
      data: { type: 'array', items: { type: 'object' } },
      pagination: {
        type: 'object',
        properties: {
          total: { type: 'number', example: 10 },
          page: { type: 'number', example: 1 },
          limit: { type: 'number', example: 10 },
          totalPages: { type: 'number', example: 1 }
        }
      },
      statusCode: { type: 'number', example: 200 }
    }
  }})
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  async listConversations(@CurrentUser() user: User, @Query() listConversationsDto: ListConversationsDto) {
    const { data, total, page, limit } = await this.adhaService.listConversations(user.id, listConversationsDto);
    return {
      success: true,
      message: 'Conversations fetched successfully.',
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      statusCode: 200,
    };
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Récupérer l\'historique d\'une conversation', description: 'Récupère les messages d\'une conversation spécifique entre l\'utilisateur et Adha' })
  @ApiParam({ name: 'conversationId', description: 'ID unique de la conversation', type: 'string' })
  @ApiQuery({ type: GetConversationHistoryDto })
  @ApiResponse({ status: 200, description: 'Historique de conversation récupéré avec succès', schema: {
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Conversation history fetched.' },
      data: { type: 'array', items: { type: 'object' } },
      pagination: {
        type: 'object',
        properties: {
          total: { type: 'number', example: 25 },
          page: { type: 'number', example: 1 },
          limit: { type: 'number', example: 20 },
          totalPages: { type: 'number', example: 2 }
        }
      },
      statusCode: { type: 'number', example: 200 }
    }
  }})
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  async getConversationHistory(
    @CurrentUser() user: User,
    @Param('conversationId') conversationId: string,
    @Query() getConversationHistoryDto: GetConversationHistoryDto,
  ) {
    const { data, total, page, limit } = await this.adhaService.getConversationHistory(user.id, conversationId, getConversationHistoryDto);
    return {
      success: true,
      message: 'Conversation history fetched.',
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      statusCode: 200,
    };
  }
}
