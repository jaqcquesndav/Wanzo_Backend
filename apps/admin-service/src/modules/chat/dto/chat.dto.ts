import { IsString, IsOptional, IsEnum, IsArray, IsUUID, IsBoolean, IsObject, IsNumber, IsDate, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ChatSessionStatus, ChatPriority, ChatMessageSender, MessageStatus } from '../entities';

// Chat Session DTOs
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

export class ChatSessionsResponseDto {
  sessions: ChatSessionDto[];
  totalCount: number;
}

export class GetChatSessionsQueryDto {
  @IsOptional()
  @IsEnum(ChatSessionStatus)
  status?: ChatSessionStatus;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class CreateChatSessionDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsEnum(ChatPriority)
  priority?: ChatPriority = ChatPriority.MEDIUM;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class AssignAgentDto {
  @IsUUID()
  agentId: string;
}

// Chat Message DTOs
export class ChatAttachmentMetadataDto {
  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;
  // Index signature should not have decorators
  [key: string]: any;
}

export class ChatAttachmentDto {
  id: string;
  url: string;
  type: string;
  name: string;
  size: number;
  metadata?: ChatAttachmentMetadataDto;
}

export class ChatMessageDto {
  id: string;
  content: string;
  sender: ChatMessageSender;
  timestamp: Date;
  read: boolean;
  status: MessageStatus;
  attachments?: ChatAttachmentDto[];
}

export class ChatMessagesResponseDto {
  messages: ChatMessageDto[];
  totalCount: number;
  hasMore: boolean;
}

export class GetChatMessagesQueryDto {
  @IsOptional()
  @IsString()
  before?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class SendMessageDto {
  @IsString()
  content: string;
}

export class MarkMessagesAsReadDto {
  @IsArray()
  @IsUUID('all', { each: true })
  messageIds: string[];
}

// Typing Events
export class TypingEventDto {
  @IsBoolean()
  isTyping: boolean;
}

export class ChatTypingEventDto {
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}

// Statistics
export class ChatStatsDto {
  totalSessions: number;
  activeSessions: number;
  averageResponseTime: number;
  messagesExchanged: number;
}

// WebSocket Events
export class WebSocketMessageEventDto {
  type: 'message';
  data: ChatMessageDto;
}

export class WebSocketTypingEventDto {
  type: 'typing';
  data: ChatTypingEventDto;
}

export class WebSocketSessionUpdateEventDto {
  type: 'session_update';
  data: ChatSessionDto;
}
