import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete,
  Param, 
  Body, 
  Query, 
  UseGuards, 
  UploadedFiles, 
  UseInterceptors, 
  Res, 
  Req,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  NotFoundException,
  BadRequestException,
  ConflictException
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChatService } from '../services/chat.service';
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
  ChatStatsDto,
  ChatSessionsResponseDto,
  ChatMessagesResponseDto
} from '../dto';
import { Response, Request } from 'express';
import { ChatMessageSender } from '../entities';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Chat Session Management
  @ApiOperation({ summary: 'Get all chat sessions' })
  @ApiQuery({ name: 'status', enum: ['active', 'closed'], required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Return all chat sessions', type: ChatSessionsResponseDto })
  @Get('sessions')  async getAllChatSessions(
    @Query() query: GetChatSessionsQueryDto, 
    @CurrentUser() user: any
  ): Promise<ChatSessionsResponseDto> {
    return this.chatService.getAllChatSessions(query, user);
  }

  @ApiOperation({ summary: 'Get chat session by ID' })
  @ApiParam({ name: 'sessionId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Return the chat session', type: ChatSessionDto })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @Get('sessions/:sessionId')  async getChatSessionById(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @CurrentUser() user: any
  ): Promise<ChatSessionDto> {
    return this.chatService.getChatSessionById(sessionId, user);
  }

  @ApiOperation({ summary: 'Create new chat session' })
  @ApiBody({ type: CreateChatSessionDto })
  @ApiResponse({ status: 201, description: 'The session has been created', type: ChatSessionDto })
  @Post('sessions')
  @HttpCode(201)  async createNewChatSession(
    @Body() createChatSessionDto: CreateChatSessionDto, 
    @CurrentUser() user: any
  ): Promise<ChatSessionDto> {
    return this.chatService.createNewChatSession(createChatSessionDto, user);
  }

  @ApiOperation({ summary: 'Close chat session' })
  @ApiParam({ name: 'sessionId', type: 'string' })
  @ApiResponse({ status: 200, description: 'The session has been closed', type: ChatSessionDto })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 409, description: 'Session is already closed' })
  @Put('sessions/:sessionId/close')  async closeChatSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string, 
    @CurrentUser() user: any
  ): Promise<ChatSessionDto> {
    return this.chatService.closeChatSession(sessionId, user);
  }

  @ApiOperation({ summary: 'Assign agent to chat session' })
  @ApiParam({ name: 'sessionId', type: 'string' })
  @ApiBody({ type: AssignAgentDto })
  @ApiResponse({ status: 200, description: 'The agent has been assigned', type: ChatSessionDto })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 409, description: 'Session is already assigned or closed' })
  @Roles('admin')
  @Put('sessions/:sessionId/assign')  async assignAgentToChatSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() assignAgentDto: AssignAgentDto,
    @CurrentUser() user: any
  ): Promise<ChatSessionDto> {
    return this.chatService.assignAgentToChatSession(sessionId, assignAgentDto.agentId, user);
  }

  // Chat Messages
  @ApiOperation({ summary: 'Get messages for a session' })
  @ApiParam({ name: 'sessionId', type: 'string' })
  @ApiQuery({ name: 'before', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Return messages for the session', type: ChatMessagesResponseDto })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @Get('sessions/:sessionId/messages')  async getMessagesForSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Query() query: GetChatMessagesQueryDto,
    @CurrentUser() user: any
  ): Promise<ChatMessagesResponseDto> {
    return this.chatService.getMessagesForSession(sessionId, query, user);
  }

  @ApiOperation({ summary: 'Send message in a session' })
  @ApiParam({ name: 'sessionId', type: 'string' })
  @ApiResponse({ status: 200, description: 'The message has been sent', type: ChatMessageDto })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 409, description: 'Session is closed' })
  @Post('sessions/:sessionId/messages')
  @UseInterceptors(
    FilesInterceptor('attachments', 10, {
      storage: diskStorage({
        destination: './uploads/chat-attachments',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Optional: Add file type validation here
        cb(null, true);
      },
      limits: {
        fileSize: 1024 * 1024 * 10, // 10MB
      },
    }),
  )  async sendMessageInSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() sendMessageDto: SendMessageDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @CurrentUser() user: any
  ): Promise<ChatMessageDto> {
    const senderType = user.role === 'admin' || user.role === 'agent' 
      ? ChatMessageSender.SUPPORT 
      : ChatMessageSender.USER;
    
    return this.chatService.sendMessageInSession(sessionId, sendMessageDto, files, user.id, senderType);
  }

  @ApiOperation({ summary: 'Download attachment' })
  @ApiParam({ name: 'attachmentId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Return the attachment file' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  @Get('attachments/:attachmentId')  async downloadAttachment(
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string, 
    @Res() res: Response, 
    @CurrentUser() user: any
  ): Promise<void> {
    const { fileStream, contentType, fileName } = await this.chatService.downloadAttachment(attachmentId, user);
    
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    if (fileName) {
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    }
    
    fileStream.pipe(res);
  }

  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiParam({ name: 'sessionId', type: 'string' })
  @ApiBody({ type: MarkMessagesAsReadDto })
  @ApiResponse({ status: 204, description: 'Messages marked as read' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @Put('sessions/:sessionId/read')
  @HttpCode(204)  async markMessagesAsRead(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() markMessagesAsReadDto: MarkMessagesAsReadDto,
    @CurrentUser() user: any
  ): Promise<void> {
    await this.chatService.markMessagesAsRead(sessionId, markMessagesAsReadDto.messageIds, user);
  }

  @ApiOperation({ summary: 'Send typing event' })
  @ApiParam({ name: 'sessionId', type: 'string' })
  @ApiBody({ type: TypingEventDto })
  @ApiResponse({ status: 204, description: 'Typing event sent' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @Post('sessions/:sessionId/typing')
  @HttpCode(204)  async sendTypingEvent(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() typingEventDto: TypingEventDto,
    @CurrentUser() user: any
  ): Promise<void> {
    await this.chatService.sendTypingEvent(sessionId, typingEventDto, user);
  }

  // Chat Statistics
  @ApiOperation({ summary: 'Get chat statistics' })
  @ApiResponse({ status: 200, description: 'Return chat statistics', type: ChatStatsDto })
  @Roles('admin', 'agent')
  @Get('stats')
  async getChatStatistics(@CurrentUser() user: any): Promise<ChatStatsDto> {
    return this.chatService.getChatStatistics(user);
  }
}
