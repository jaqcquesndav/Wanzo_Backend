import { IsString, IsBoolean, IsOptional, IsObject, IsEnum, IsUUID, IsArray, IsNumber, IsDate, IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageRole } from '../entities/chat-message.entity';

export class CreateChatDto {
  @ApiProperty({ description: 'Chat title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Chat active status' })
  @IsBoolean()
  isActive!: boolean;

  @ApiPropertyOptional({ description: 'Accounting context for AI' })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateMessageDto {
  @ApiProperty({ description: 'Message role', enum: MessageRole })
  @IsEnum(MessageRole)
  role!: MessageRole;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: 'Information source' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ChatFilterDto {
  @ApiPropertyOptional({ description: 'Filter by company ID' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class AttachmentDto {
  @ApiProperty({ description: 'Attachment name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Attachment MIME type' })
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Attachment content (base64 encoded)' })
  @IsString()
  content!: string;
}

export class MessageRequestDto {
  @ApiProperty({ description: 'Message content' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: 'Message attachment' })
  @IsOptional()
  attachment?: AttachmentDto;
}

export class ChatRequestDto {
  @ApiPropertyOptional({ description: 'Existing conversation ID' })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({ description: 'Message to send' })
  message!: MessageRequestDto;

  @ApiPropertyOptional({ description: 'AI model ID (for new conversations)' })
  @IsOptional()
  @IsString()
  modelId?: string;

  @ApiPropertyOptional({ description: 'Context for the conversation' })
  @IsOptional()
  @IsArray()
  context?: string[];
  
  @ApiPropertyOptional({ description: 'Activate ADHA write mode for accounting entries' })
  @IsOptional()
  @IsBoolean()
  writeMode?: boolean;
}

// DTO pour l'endpoint POST /chat/message conforme à la documentation
export class SendMessageDto {
  @ApiPropertyOptional({ description: 'Existing conversation ID' })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({ description: 'Message to send' })
  message!: MessageRequestDto;

  @ApiProperty({ description: 'AI model ID' })
  @IsString()
  modelId!: string;

  @ApiPropertyOptional({ description: 'Activate ADHA write mode for accounting entries' })
  @IsOptional()
  @IsBoolean()
  writeMode?: boolean;

  @ApiPropertyOptional({ description: 'Context for the conversation' })
  @IsOptional()
  @IsArray()
  context?: string[];
}

export class AiModelDto {
  @ApiProperty({ description: 'Model ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Model name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Model description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Model capabilities' })
  @IsArray()
  capabilities!: string[];

  @ApiProperty({ description: 'Model context length' })
  @IsNumber()
  contextLength!: number;
}

export class JournalEntryLineDto {
  @ApiProperty({ description: 'Account code' })
  @IsString()
  accountCode!: string;

  @ApiProperty({ description: 'Account name' })
  @IsString()
  accountName!: string;

  @ApiProperty({ description: 'Debit amount' })
  @IsNumber()
  debit!: number;

  @ApiProperty({ description: 'Credit amount' })
  @IsNumber()
  credit!: number;

  @ApiPropertyOptional({ description: 'Line description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class JournalEntryDto {
  @ApiProperty({ description: 'Entry ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Entry date' })
  @IsDateString()
  date!: string;

  @ApiProperty({ description: 'Journal type' })
  @IsString()
  journalType!: string;

  @ApiProperty({ description: 'Reference' })
  @IsString()
  reference!: string;

  @ApiProperty({ description: 'Description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Status' })
  @IsString()
  status!: string;

  @ApiProperty({ description: 'Source (agent, manual, etc.)' })
  @IsString()
  source!: string;

  @ApiProperty({ description: 'Agent ID that created this entry' })
  @IsString()
  agentId!: string;

  @ApiProperty({ description: 'Validation status' })
  @IsString()
  validationStatus!: string;

  @ApiProperty({ description: 'Journal entry lines', type: [JournalEntryLineDto] })
  @IsArray()
  lines!: JournalEntryLineDto[];

  @ApiProperty({ description: 'Total debit amount' })
  @IsNumber()
  totalDebit!: number;

  @ApiProperty({ description: 'Total credit amount' })
  @IsNumber()
  totalCredit!: number;

  @ApiProperty({ description: 'Total VAT amount' })
  @IsNumber()
  totalVat!: number;
}

// DTO pour les réponses de message
export class MessageResponseDto {
  @ApiProperty({ description: 'Message ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Sender type' })
  @IsString()
  sender!: 'user' | 'bot';

  @ApiProperty({ description: 'Message content' })
  @IsString()
  content!: string;

  @ApiProperty({ description: 'Message timestamp' })
  @IsString()
  timestamp!: string;

  @ApiPropertyOptional({ description: 'Number of likes' })
  @IsOptional()
  @IsNumber()
  likes?: number;

  @ApiPropertyOptional({ description: 'Number of dislikes' })
  @IsOptional()
  @IsNumber()
  dislikes?: number;
}

// DTO pour les réponses de chat
export class ChatResponseDto {
  @ApiProperty({ description: 'Success status' })
  @IsBoolean()
  success!: boolean;

  @ApiProperty({ description: 'Response data' })
  data!: {
    message: MessageResponseDto;
    conversationId: string;
    journalEntry?: JournalEntryDto;
  };
}

// DTO pour les conversations
export class ConversationDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Conversation title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Last update timestamp' })
  @IsString()
  timestamp!: string;

  @ApiProperty({ description: 'Is conversation active' })
  @IsBoolean()
  isActive!: boolean;

  @ApiProperty({ description: 'AI model used' })
  model!: AiModelDto;

  @ApiProperty({ description: 'Conversation context' })
  @IsArray()
  context!: string[];

  @ApiPropertyOptional({ description: 'Conversation messages' })
  @IsOptional()
  @IsArray()
  messages?: MessageResponseDto[];
}

export class ValidateJournalEntryDto {
  @ApiPropertyOptional({ description: 'Updated journal entry lines' })
  @IsOptional()
  @IsArray()
  lines?: JournalEntryLineDto[];

  @ApiPropertyOptional({ description: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;
}