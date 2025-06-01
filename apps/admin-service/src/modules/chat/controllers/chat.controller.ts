import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, UploadedFiles, UseInterceptors, Res, Req } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChatService } from '@/modules/chat/services/chat.service';
import {
  GetChatSessionsQueryDto,
  CreateChatSessionDto,
  AssignAgentDto,
  GetChatMessagesQueryDto,
  SendMessageDto,
  MarkMessagesAsReadDto,
  TypingEventDto,
  ChatSessionDto,
  ChatMessageDto,
  ChatStatsDto
} from '../dto';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { ChatMessageSender } from '../entities';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Chat Session Management
  @Get('sessions')
  async getAllChatSessions(@Query() query: GetChatSessionsQueryDto): Promise<{ sessions: ChatSessionDto[], totalCount: number }> {
    // Assuming service handles permissions based on a potential currentUser passed or global context
    return this.chatService.getAllChatSessions(query);
  }

  @Get('sessions/:sessionId')
  async getChatSessionById(@Param('sessionId') sessionId: string): Promise<ChatSessionDto> {
    // Assuming service handles permissions
    return this.chatService.getChatSessionById(sessionId);
  }

  @Post('sessions')
  async createNewChatSession(@Body() createChatSessionDto: CreateChatSessionDto, @Req() req: Request): Promise<ChatSessionDto> {
    return this.chatService.createNewChatSession(createChatSessionDto, req.user.id);
  }

  @Put('sessions/:sessionId/close')
  async closeChatSession(@Param('sessionId') sessionId: string, @Req() req: Request): Promise<ChatSessionDto> {
    return this.chatService.closeChatSession(sessionId, req.user.id);
  }

  @Put('sessions/:sessionId/assign')
  async assignAgentToChatSession(
    @Param('sessionId') sessionId: string,
    @Body() assignAgentDto: AssignAgentDto,
    @Req() req: Request,
  ): Promise<ChatSessionDto> {
    return this.chatService.assignAgentToChatSession(sessionId, assignAgentDto.agentId, req.user.id);
  }

  // Chat Messages
  @Get('sessions/:sessionId/messages')
  async getMessagesForSession(
    @Param('sessionId') sessionId: string,
    @Query() query: GetChatMessagesQueryDto,
    @Req() req: Request,
  ): Promise<{ messages: ChatMessageDto[], totalCount: number, hasMore: boolean }> {
    return this.chatService.getMessagesForSession(sessionId, query, req.user.id);
  }

  @Post('sessions/:sessionId/messages')
  @UseInterceptors(FilesInterceptor('attachments[]'))
  async sendMessageInSession(
    @Param('sessionId') sessionId: string,
    @Body() sendMessageDto: SendMessageDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: Request,
  ): Promise<ChatMessageDto> {
    const senderId = req.user.id;
    // Corrected to use ChatMessageSender.SUPPORT for admin/agent roles
    const senderType = req.user.role === 'admin' || req.user.role === 'agent' ? ChatMessageSender.SUPPORT : ChatMessageSender.USER;
    return this.chatService.sendMessageInSession(sessionId, sendMessageDto, files, senderId, senderType);
  }

  @Put('sessions/:sessionId/read')
  async markMessagesAsRead(
    @Param('sessionId') sessionId: string,
    @Body() markMessagesAsReadDto: MarkMessagesAsReadDto,
    @Req() req: Request,
  ): Promise<void> {
    return this.chatService.markMessagesAsRead(sessionId, markMessagesAsReadDto.messageIds, req.user.id);
  }

  // Attachments
  @Get('attachments/:attachmentId')
  async downloadAttachment(@Param('attachmentId') attachmentId: string, @Res() res: Response, @Req() req: Request): Promise<void> {
    const { fileStream, contentType, fileName } = await this.chatService.downloadAttachment(attachmentId, req.user.id);
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    if (fileName) {
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    }
    fileStream.pipe(res);
  }

  // Real-time Events (Conceptual HTTP endpoint for typing, actual events via WebSockets)
  @Post('sessions/:sessionId/typing')
  async sendTypingEvent(
    @Param('sessionId') sessionId: string,
    @Body() typingEventDto: TypingEventDto,
    @Req() req: Request,
  ): Promise<void> {
    return this.chatService.sendTypingEvent(sessionId, typingEventDto, req.user.id);
  }

  // Chat Statistics
  @Get('stats')
  async getChatStatistics(@Req() req: Request): Promise<ChatStatsDto> {
    return this.chatService.getChatStatistics(req.user.id);
  }
}
