import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Not, IsNull } from 'typeorm';
import { ChatSession, ChatMessage, ChatAttachment, ChatTypingEvent, ChatSessionStatus, ChatMessageSender, MessageStatus } from '../entities';
import {
  GetChatSessionsQueryDto,
  CreateChatSessionDto,
  GetChatMessagesQueryDto,
  SendMessageDto,
  TypingEventDto,
  ChatSessionDto,
  ChatMessageDto,
  ChatStatsDto,
  ChatAttachmentDto,
  ChatSessionsResponseDto,
  ChatMessagesResponseDto
} from '../dto';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession) 
    private chatSessionRepository: Repository<ChatSession>,
    
    @InjectRepository(ChatMessage) 
    private chatMessageRepository: Repository<ChatMessage>,
    
    @InjectRepository(ChatAttachment) 
    private chatAttachmentRepository: Repository<ChatAttachment>,
    
    @InjectRepository(ChatTypingEvent) 
    private chatTypingEventRepository: Repository<ChatTypingEvent>,
  ) {}

  // Chat Session Management
  async getAllChatSessions(query: GetChatSessionsQueryDto, user: any): Promise<ChatSessionsResponseDto> {
    const { status, page = 1, limit = 10 } = query;
    
    // Build query based on user role
    const options: FindManyOptions<ChatSession> = {
      relations: ['user', 'agent'],
      skip: (page - 1) * limit,
      take: limit,
      order: { startedAt: 'DESC' },
    };
    
    // Add status filter if provided
    if (status) {
      options.where = { ...options.where, status };
    }

    // Non-admin users can only see their own sessions
    if (user.role !== 'admin' && user.role !== 'agent') {
      options.where = { ...options.where, userId: user.id };
    }
    
    // Agents can see sessions assigned to them
    if (user.role === 'agent') {
      options.where = { 
        ...options.where,
        agentId: user.id
      };
    }

    const [sessions, totalCount] = await this.chatSessionRepository.findAndCount(options);
    
    return { 
      sessions: sessions.map(s => this.mapChatSessionToDto(s)), 
      totalCount 
    };
  }

  async getChatSessionById(sessionId: string, user: any): Promise<ChatSessionDto> {
    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['user', 'agent']
    });
    
    if (!session) {
      throw new NotFoundException(`Chat session with ID ${sessionId} not found`);
    }
    
    // Check if user has permission to view this session
    const canAccess = this.canAccessSession(session, user);
    if (!canAccess) {
      throw new ForbiddenException('You do not have permission to view this session');
    }
    
    return this.mapChatSessionToDto(session);
  }

  async createNewChatSession(createDto: CreateChatSessionDto, user: any): Promise<ChatSessionDto> {
    // Determine the user ID
    const userId = createDto.userId || user.id;
    
    // Admin users can create sessions for other users
    if (createDto.userId && user.role !== 'admin') {
      throw new ForbiddenException('Only admins can create sessions for other users');
    }
    
    const newSession = this.chatSessionRepository.create({
      ...createDto,
      userId,
      status: ChatSessionStatus.ACTIVE,
    });
    
    const savedSession = await this.chatSessionRepository.save(newSession);
    return this.mapChatSessionToDto(savedSession);
  }

  async closeChatSession(sessionId: string, user: any): Promise<ChatSessionDto> {
    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['user', 'agent']
    });
    
    if (!session) {
      throw new NotFoundException(`Chat session with ID ${sessionId} not found`);
    }
    
    // Check if user has permission to close this session
    const canModify = this.canModifySession(session, user);
    if (!canModify) {
      throw new ForbiddenException('You do not have permission to close this session');
    }
    
    if (session.status === ChatSessionStatus.CLOSED) {
      throw new ConflictException('Session is already closed');
    }
    
    session.status = ChatSessionStatus.CLOSED;
    session.endedAt = new Date();
    
    const updatedSession = await this.chatSessionRepository.save(session);
    return this.mapChatSessionToDto(updatedSession);
  }

  async assignAgentToChatSession(sessionId: string, agentId: string, user: any): Promise<ChatSessionDto> {
    // Only admins can assign agents
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can assign agents to sessions');
    }
    
    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['user', 'agent']
    });
    
    if (!session) {
      throw new NotFoundException(`Chat session with ID ${sessionId} not found`);
    }
    
    if (session.status === ChatSessionStatus.CLOSED) {
      throw new ConflictException('Cannot assign agent to a closed session');
    }
    
    // TODO: Validate that agentId exists and is an agent
    
    if (session.agentId && session.agentId === agentId) {
      throw new ConflictException('Agent is already assigned to this session');
    }
    
    session.agentId = agentId;
    const updatedSession = await this.chatSessionRepository.save(session);
    
    return this.mapChatSessionToDto(updatedSession);
  }

  // Chat Messages
  async getMessagesForSession(
    sessionId: string,
    query: GetChatMessagesQueryDto,
    user: any
  ): Promise<ChatMessagesResponseDto> {
    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId }
    });
    
    if (!session) {
      throw new NotFoundException(`Chat session with ID ${sessionId} not found`);
    }
    
    // Check if user has permission to view messages
    const canAccess = this.canAccessSession(session, user);
    if (!canAccess) {
      throw new ForbiddenException('You do not have permission to view messages in this session');
    }
    
    const { before, limit = 20 } = query;
    
    // Build query to get messages
    const qb = this.chatMessageRepository.createQueryBuilder('message')
      .leftJoinAndSelect('message.attachments', 'attachment')
      .where('message.sessionId = :sessionId', { sessionId })
      .orderBy('message.timestamp', 'DESC')
      .take(limit + 1); // Fetch one extra to check if there are more
    
    // If 'before' parameter is provided, paginate from that message
    if (before) {
      const beforeMessage = await this.chatMessageRepository.findOne({
        where: { id: before }
      });
      
      if (beforeMessage) {
        qb.andWhere('message.timestamp < :timestamp', { timestamp: beforeMessage.timestamp });
      }
    }
    
    const messages = await qb.getMany();
    
    // Check if there are more messages
    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop(); // Remove the extra message
    }
    
    // Get total count
    const totalCount = await this.chatMessageRepository.count({
      where: { sessionId }
    });
    
    return {
      messages: messages.map(m => this.mapChatMessageToDto(m)).reverse(), // Reverse to show oldest first
      totalCount,
      hasMore,
    };
  }

  async sendMessageInSession(
    sessionId: string,
    sendMessageDto: SendMessageDto,
    files: Array<Express.Multer.File>,
    senderId: string,
    senderType: ChatMessageSender,
  ): Promise<ChatMessageDto> {
    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId }
    });
    
    if (!session) {
      throw new NotFoundException(`Chat session with ID ${sessionId} not found`);
    }
    
    if (session.status === ChatSessionStatus.CLOSED) {
      throw new ConflictException('Cannot send messages to a closed session');
    }
    
    // Create and save the message
    const message = this.chatMessageRepository.create({
      sessionId,
      content: sendMessageDto.content,
      sender: senderType,
      status: MessageStatus.SENT,
      timestamp: new Date(),
      read: false,
    });
    
    const savedMessage = await this.chatMessageRepository.save(message);
    
    // Process attachments if any
    if (files && files.length > 0) {
      const attachments: ChatAttachment[] = [];
      
      for (const file of files) {
        // Create metadata based on file type
        let metadata = {};
        
        // For images, you might want to extract dimensions (using a library like sharp)
        // For audio/video, you might want to extract duration
        // This is a placeholder for that functionality
        
        const attachment = this.chatAttachmentRepository.create({
          messageId: savedMessage.id,
          url: `/uploads/chat-attachments/${file.filename}`,
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
          metadata,
        });
        
        attachments.push(await this.chatAttachmentRepository.save(attachment));
      }
      
      savedMessage.attachments = attachments;
    }
    
    // In a real implementation, you would emit this message via WebSockets here
    
    return this.mapChatMessageToDto(savedMessage);
  }

  async markMessagesAsRead(sessionId: string, messageIds: string[], user: any): Promise<void> {
    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId }
    });
    
    if (!session) {
      throw new NotFoundException(`Chat session with ID ${sessionId} not found`);
    }
    
    // Check if user has permission to mark messages
    const canAccess = this.canAccessSession(session, user);
    if (!canAccess) {
      throw new ForbiddenException('You do not have permission to mark messages in this session');
    }
    
    // Determine which sender type's messages to mark as read
    const senderType = this.getOtherSenderType(session, user.id);
    
    await this.chatMessageRepository
      .createQueryBuilder()
      .update(ChatMessage)
      .set({ read: true, status: MessageStatus.READ })
      .where('sessionId = :sessionId AND id IN (:...messageIds) AND sender = :senderType', {
        sessionId,
        messageIds,
        senderType,
      })
      .execute();
    
    // In a real implementation, you would emit this update via WebSockets
  }

  async downloadAttachment(attachmentId: string, user: any): Promise<any> {
    const attachment = await this.chatAttachmentRepository.findOne({
      where: { id: attachmentId },
      relations: ['message', 'message.session']
    });
    
    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${attachmentId} not found`);
    }
    
    // Check if user has permission to download this attachment
    const canAccess = this.canAccessSession(attachment.message.session, user);
    if (!canAccess) {
      throw new ForbiddenException('You do not have permission to download this attachment');
    }
    
    // In a real cloud implementation, you'd generate a signed URL or stream from storage
    // This is a local file system implementation
    const filePath = path.join(process.cwd(), attachment.url);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Attachment file not found');
    }
    
    const fileStream = fs.createReadStream(filePath);
    
    return {
      fileStream,
      contentType: attachment.type,
      fileName: attachment.name,
    };
  }

  async sendTypingEvent(sessionId: string, typingEventDto: TypingEventDto, user: any): Promise<void> {
    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId }
    });
    
    if (!session) {
      throw new NotFoundException(`Chat session with ID ${sessionId} not found`);
    }
    
    // Check if user has permission to send typing events
    const canAccess = this.canAccessSession(session, user);
    if (!canAccess) {
      throw new ForbiddenException('You do not have permission to send typing events in this session');
    }
    
    // Create typing event record
    const typingEvent = this.chatTypingEventRepository.create({
      sessionId,
      userId: user.id,
      isTyping: typingEventDto.isTyping,
    });
    
    await this.chatTypingEventRepository.save(typingEvent);
    
    // In a real implementation, you would emit this event via WebSockets
    console.log(`User ${user.id} is ${typingEventDto.isTyping ? 'typing' : 'stopped typing'} in session ${sessionId}`);
  }

  // Chat Statistics
  async getChatStatistics(user: any): Promise<ChatStatsDto> {
    // Only admins and agents can see statistics
    if (user.role !== 'admin' && user.role !== 'agent') {
      throw new ForbiddenException('You do not have permission to view chat statistics');
    }
    
    // Get basic statistics
    const totalSessions = await this.chatSessionRepository.count();
    const activeSessions = await this.chatSessionRepository.count({
      where: { status: ChatSessionStatus.ACTIVE }
    });
    const messagesExchanged = await this.chatMessageRepository.count();
    
    // Calculate average response time
    // This is a simplified calculation and would be more complex in a real application
    const averageResponseTime = await this.calculateAverageResponseTime();
    
    return {
      totalSessions,
      activeSessions,
      messagesExchanged,
      averageResponseTime,
    };
  }

  // Helper methods
  private async calculateAverageResponseTime(): Promise<number> {
    // This is a placeholder for a more complex calculation
    // In a real implementation, you would calculate the time between a user message
    // and the first support response, then average across all sessions
    return 5; // Return a placeholder value of 5 minutes
  }

  private canAccessSession(session: ChatSession, user: any): boolean {
    // Admins can access all sessions
    if (user.role === 'admin') {
      return true;
    }
    
    // Agents can access sessions assigned to them
    if (user.role === 'agent' && session.agentId === user.id) {
      return true;
    }
    
    // Users can access their own sessions
    if (session.userId === user.id) {
      return true;
    }
    
    return false;
  }

  private canModifySession(session: ChatSession, user: any): boolean {
    // Admins can modify all sessions
    if (user.role === 'admin') {
      return true;
    }
    
    // Agents can modify sessions assigned to them
    if (user.role === 'agent' && session.agentId === user.id) {
      return true;
    }
    
    // Users can modify their own sessions if they're the owner
    if (session.userId === user.id) {
      return true;
    }
    
    return false;
  }

  private getOtherSenderType(session: ChatSession, userId: string): ChatMessageSender {
    // If the user is the session owner, mark support messages as read
    if (session.userId === userId) {
      return ChatMessageSender.SUPPORT;
    }
    
    // Otherwise, mark user messages as read
    return ChatMessageSender.USER;
  }

  // Mapper methods
  private mapChatSessionToDto(session: ChatSession): ChatSessionDto {
    return {
      id: session.id,
      userId: session.userId,
      agentId: session.agentId,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      subject: session.subject,
      priority: session.priority,
      tags: session.tags,
    };
  }

  private mapChatMessageToDto(message: ChatMessage): ChatMessageDto {
    return {
      id: message.id,
      content: message.content,
      sender: message.sender,
      timestamp: message.timestamp,
      read: message.read,
      status: message.status,
      attachments: message.attachments?.map(att => this.mapChatAttachmentToDto(att)),
    };
  }

  private mapChatAttachmentToDto(attachment: ChatAttachment): ChatAttachmentDto {
    return {
      id: attachment.id,
      url: attachment.url,
      type: attachment.type,
      name: attachment.name,
      size: attachment.size,
      metadata: attachment.metadata,
    };
  }
}
