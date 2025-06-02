import { Controller, Post, Body, Get, Param, Query, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { AdhaService } from './adha.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ListConversationsDto } from './dto/list-conversations.dto';
import { GetConversationHistoryDto } from './dto/get-conversation-history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';

@Controller('adha')
@UseGuards(JwtAuthGuard)
export class AdhaController {
  constructor(private readonly adhaService: AdhaService) {}

  @Post('message')
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
