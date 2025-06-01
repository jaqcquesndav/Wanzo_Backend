import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { ChatSession, ChatMessage, ChatAttachment, ChatSessionStatus, ChatMessageSender } from '../entities';
import {
  GetChatSessionsQueryDto,
  CreateChatSessionDto,
  GetChatMessagesQueryDto,
  SendMessageDto,
  MarkMessagesAsReadDto,
  TypingEventDto,
  ChatSessionDto,
  ChatMessageDto,
  ChatStatsDto,
  ChatAttachmentDto
} from '../dto';
// import { User } from '../../users/entities'; // Assuming User entity exists
// import { FileStorageService } from '../../file-storage/file-storage.service'; // For handling attachments

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession) private chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage) private chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(ChatAttachment) private chatAttachmentRepository: Repository<ChatAttachment>,
    // private readonly fileStorageService: FileStorageService, // Inject if using a separate service for uploads
  ) {}

  async getAllChatSessions(query: GetChatSessionsQueryDto /*, currentUser: User */): Promise<{ sessions: ChatSessionDto[], totalCount: number }> {
    // TODO: Add permission checks (e.g., only admins or support agents can see all)
    const { status, page = 1, limit = 10 } = query;
    const options: FindManyOptions<ChatSession> = {
      relations: ['user', 'agent'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    };
    if (status) {
      options.where = { status };
    }
    const [sessions, totalCount] = await this.chatSessionRepository.findAndCount(options);
    return { sessions: sessions.map(s => this.mapChatSessionToDto(s)), totalCount };
  }

  async getChatSessionById(sessionId: string /*, currentUser: User */): Promise<ChatSessionDto> {
    const session = await this.chatSessionRepository.findOne({ where: { id: sessionId }, relations: ['user', 'agent', 'messages'] });
    if (!session) {
      throw new NotFoundException(`Chat session with ID ${sessionId} not found`);
    }
    // TODO: Add permission checks (user can see their own, admin/agent can see assigned/all)
    return this.mapChatSessionToDto(session);
  }

  async createNewChatSession(createDto: CreateChatSessionDto, userId: string): Promise<ChatSessionDto> {
    const newSession = this.chatSessionRepository.create({
      ...createDto,
      userId,
      status: ChatSessionStatus.ACTIVE,
    });
    const savedSession = await this.chatSessionRepository.save(newSession);
    return this.mapChatSessionToDto(savedSession);
  }

  async closeChatSession(sessionId: string, userId: string /* actingUser: User */): Promise<ChatSessionDto> {
    const session = await this.chatSessionRepository.findOneBy({ id: sessionId });
    if (!session) {
      throw new NotFoundException(`Chat session with ID ${sessionId} not found`);
    }
    // TODO: Permission check: only user who owns it, assigned agent, or admin can close.
    // if (session.userId !== userId && session.agentId !== userId && !actingUser.isAdmin) {
    //   throw new ForbiddenException('You do not have permission to close this session.');
    // }
    if (session.status === ChatSessionStatus.CLOSED) {
      throw new BadRequestException('Session is already closed.');
    }
    session.status = ChatSessionStatus.CLOSED;
    session.endedAt = new Date();
    const updatedSession = await this.chatSessionRepository.save(session);
    return this.mapChatSessionToDto(updatedSession);
  }

  async assignAgentToChatSession(sessionId: string, agentId: string, adminId: string): Promise<ChatSessionDto> {
    // TODO: Permission check: only admin or supervisor role can assign.
    const session = await this.chatSessionRepository.findOneBy({ id: sessionId });
    if (!session) {
      throw new NotFoundException(`Chat session with ID ${sessionId} not found`);
    }
    if (session.status === ChatSessionStatus.CLOSED) {
      throw new BadRequestException('Cannot assign agent to a closed session.');
    }
    // TODO: Validate agentId exists and is an agent user
    session.agentId = agentId;
    const updatedSession = await this.chatSessionRepository.save(session);
    return this.mapChatSessionToDto(updatedSession);
  }

  async getMessagesForSession(
    sessionId: string,
    query: GetChatMessagesQueryDto,
    userId: string,
  ): Promise<{ messages: ChatMessageDto[], totalCount: number, hasMore: boolean }> {
    const session = await this.chatSessionRepository.findOneBy({ id: sessionId });
    if (!session) {
      throw new NotFoundException(`Chat session with ID ${sessionId} not found`);
    }
    // TODO: Permission check: user must be part of session or admin/agent

    const { before, limit = 20 } = query;
    const qb = this.chatMessageRepository.createQueryBuilder('message')
      .leftJoinAndSelect('message.attachments', 'attachment')
      .where('message.sessionId = :sessionId', { sessionId })
      .orderBy('message.timestamp', 'DESC')
      .take(limit + 1); // Fetch one extra to check if there are more

    if (before) {
      // Assuming 'before' is a message ID, get its timestamp to paginate
      const beforeMessage = await this.chatMessageRepository.findOneBy({ id: before });
      if (beforeMessage) {
        qb.andWhere('message.timestamp < :timestamp', { timestamp: beforeMessage.timestamp });
      }
    }

    const messages = await qb.getMany();
    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop(); // Remove the extra one
    }

    const totalCount = await this.chatMessageRepository.count({ where: { sessionId } });

    return {
      messages: messages.map(m => this.mapChatMessageToDto(m)).reverse(), // Reverse to show oldest first in the batch
      totalCount,
      hasMore,
    };
  }

  async sendMessageInSession(
    sessionId: string,
    sendMessageDto: SendMessageDto,
    files: Array<Express.Multer.File>,
    senderId: string, // ID of the user or agent sending
    senderType: ChatMessageSender,
  ): Promise<ChatMessageDto> {
    const session = await this.chatSessionRepository.findOneBy({ id: sessionId });
    if (!session) {
      throw new NotFoundException(`Chat session with ID ${sessionId} not found`);
    }
    if (session.status === ChatSessionStatus.CLOSED) {
      throw new BadRequestException('Cannot send messages to a closed session.');
    }
    // TODO: Permission check: sender must be part of session or an agent/admin

    const message = this.chatMessageRepository.create({
      sessionId,
      content: sendMessageDto.content,
      sender: senderType,
      // senderId: senderId, // If you need to store who specifically sent it beyond type
      timestamp: new Date(),
    });

    const savedMessage = await this.chatMessageRepository.save(message);

    if (files && files.length > 0) {
      const attachments: ChatAttachment[] = [];
      for (const file of files) {
        // const storedFile = await this.fileStorageService.upload(file, `chat/${sessionId}/attachments`);
        const attachment = this.chatAttachmentRepository.create({
          messageId: savedMessage.id,
          // url: storedFile.url,
          // name: storedFile.name,
          // type: storedFile.type,
          // size: storedFile.size,
          // Dummy data for now if FileStorageService is not integrated
          url: `temp/url/${file.originalname}`,
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
        });
        attachments.push(await this.chatAttachmentRepository.save(attachment));
      }
      savedMessage.attachments = attachments;
    }
    // TODO: Emit message via WebSocket
    return this.mapChatMessageToDto(savedMessage);
  }

  async markMessagesAsRead(sessionId: string, messageIds: string[], userId: string): Promise<void> {
    // TODO: Permission check: user must be part of session
    await this.chatMessageRepository
      .createQueryBuilder()
      .update(ChatMessage)
      .set({ read: true })
      .where('sessionId = :sessionId AND id IN (:...messageIds) AND sender != :senderType', {
        sessionId,
        messageIds,
        // senderType: userId === session.userId ? ChatMessageSender.SUPPORT : ChatMessageSender.USER // Mark messages from other party as read
      })
      .execute();
    // TODO: Emit read status via WebSocket
  }

  async downloadAttachment(attachmentId: string, userId: string): Promise<any> { // Should return stream or file path
    const attachment = await this.chatAttachmentRepository.findOneBy({ id: attachmentId });
    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${attachmentId} not found.`);
    }
    // TODO: Permission check: user must have access to the chat session of this attachment.
    // const message = await this.chatMessageRepository.findOne({where: {id: attachment.messageId}, relations: ['session']});
    // if (message.session.userId !== userId && message.session.agentId !== userId) throw new ForbiddenException();

    // return this.fileStorageService.download(attachment.url); // Or however file is served
    // Placeholder for actual file streaming logic
    // For now, this would require a proper file storage service integration
    // This is a simplified example; in a real app, you'd stream the file from storage.
    throw new Error('File download not implemented yet. Integrate FileStorageService.');
  }

  async sendTypingEvent(sessionId: string, typingEventDto: TypingEventDto, userId: string): Promise<void> {
    // TODO: Permission check
    // TODO: Emit typing event via WebSocket: { sessionId, userId, isTyping: typingEventDto.isTyping }
    console.log(`User ${userId} is ${typingEventDto.isTyping ? 'typing' : 'stopped typing'} in session ${sessionId}`);
  }

  async getChatStatistics(adminId: string): Promise<ChatStatsDto> {
    // TODO: Permission check: only admin
    const totalSessions = await this.chatSessionRepository.count();
    const activeSessions = await this.chatSessionRepository.count({ where: { status: ChatSessionStatus.ACTIVE } });
    const messagesExchanged = await this.chatMessageRepository.count();
    // averageResponseTime would require more complex calculation, e.g., analyzing message timestamps

    return {
      totalSessions,
      activeSessions,
      messagesExchanged,
      averageResponseTime: 0, // Placeholder
    };
  }

  // Mapper functions (consider moving to a dedicated mapper class or using libraries like class-transformer)
  private mapChatSessionToDto(session: ChatSession): ChatSessionDto {
    return {
      id: session.id,
      subject: session.subject,
      status: session.status,
      priority: session.priority,
      tags: session.tags,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      userId: session.userId,
      agentId: session.agentId,
      // user: session.user ? { id: session.user.id, name: session.user.name } : undefined, // Map user DTO as needed
      // agent: session.agent ? { id: session.agent.id, name: session.agent.name } : undefined, // Map agent DTO as needed
    };
  }

  private mapChatMessageToDto(message: ChatMessage): ChatMessageDto {
    return {
      id: message.id,
      content: message.content,
      sender: message.sender,
      timestamp: message.timestamp,
      read: message.read,
      sessionId: message.sessionId,
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
    };
  }
}
