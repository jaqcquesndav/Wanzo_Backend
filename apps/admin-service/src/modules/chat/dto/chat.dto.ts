import { IsString, IsOptional, IsEnum, IsArray, IsUUID, IsBoolean } from 'class-validator';
import { ChatSessionStatus, ChatPriority, ChatMessageSender } from '../entities';

export class ChatSessionDto {
  id: string;
  userId: string;
  agentId?: string;
  status: ChatSessionStatus;
  startedAt: Date;
  endedAt?: Date;
  subject?: string;
  priority: ChatPriority;
  tags?: string[];
}

export class GetChatSessionsQueryDto {
  @IsOptional()
  @IsEnum(ChatSessionStatus)
  status?: ChatSessionStatus;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

export class CreateChatSessionDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsEnum(ChatPriority)
  priority?: ChatPriority;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // userId might be inferred or explicitly set by an admin
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class AssignAgentDto {
  @IsUUID()
  agentId: string;
}

export class ChatAttachmentDto {
  id: string;
  url: string;
  type: string;
  name: string;
  size: number;
}

export class ChatMessageDto {
  id: string;
  content: string;
  sender: ChatMessageSender;
  timestamp: Date;
  read: boolean;
  attachments?: ChatAttachmentDto[];
  sessionId: string; // Added sessionId for context
}

export class GetChatMessagesQueryDto {
  @IsOptional()
  @IsString()
  before?: string; // messageId

  @IsOptional()
  limit?: number;
}

export class SendMessageDto {
  @IsString()
  content: string;

  // Attachments would be handled via multipart/form-data, not directly in DTO for validation here
  // but can be represented for response or internal handling if needed.
  @IsOptional()
  @IsArray()
  attachments?: any[]; // Placeholder for how attachments might be processed
}

export class MarkMessagesAsReadDto {
  @IsArray()
  @IsUUID('all', { each: true })
  messageIds: string[];
}

export class TypingEventDto {
  @IsBoolean()
  isTyping: boolean;
  // userId might be inferred
}

export class ChatStatsDto {
  totalSessions: number;
  activeSessions: number;
  averageResponseTime: number;
  messagesExchanged: number;
}
