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
}

export class JournalEntryDto {
  @ApiProperty({ description: 'Entry ID' })
  @IsString()
  entryId!: string;

  @ApiProperty({ description: 'Entry date' })
  @IsDateString()
  date!: string;

  @ApiProperty({ description: 'Journal code' })
  @IsString()
  journalCode!: string;

  @ApiProperty({ description: 'Reference' })
  @IsString()
  reference!: string;

  @ApiProperty({ description: 'Description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Journal entry lines', type: [JournalEntryLineDto] })
  @IsArray()
  lines!: JournalEntryLineDto[];

  @ApiProperty({ description: 'Status', enum: ['pending', 'validated', 'rejected'] })
  @IsString()
  status!: string;

  @ApiPropertyOptional({ description: 'Attachment ID' })
  @IsOptional()
  @IsString()
  attachmentId?: string;
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