import { IsString, IsBoolean, IsOptional, IsObject, IsEnum, IsUUID, IsInt, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageRole } from '../entities/chat-message.entity';
import { Type } from 'class-transformer';

export class AIModelDto {
  @ApiProperty({ description: 'Model ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Model name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Model description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Model capabilities', type: [String] })
  @IsArray()
  @IsString({ each: true })
  capabilities!: string[];

  @ApiProperty({ description: 'Context length' })
  @IsInt()
  contextLength!: number;
}

export class AttachmentDto {
  @ApiProperty({ description: 'Attachment name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Attachment type' })
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Attachment content' })
  @IsString()
  content!: string;
}

export class CreateChatDto {
  @ApiProperty({ description: 'Chat title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Chat active status' })
  @IsBoolean()
  isActive!: boolean;

  @ApiProperty({ description: 'AI Model' })
  @ValidateNested()
  @Type(() => AIModelDto)
  model!: AIModelDto;

  @ApiPropertyOptional({ description: 'Aggregated context for portfolio and prospection' })
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

  @ApiPropertyOptional({ description: 'Likes count' })
  @IsOptional()
  @IsInt()
  likes?: number;

  @ApiPropertyOptional({ description: 'Dislikes count' })
  @IsOptional()
  @IsInt()
  dislikes?: number;

  @ApiPropertyOptional({ description: 'Attachment' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AttachmentDto)
  attachment?: AttachmentDto;

  @ApiPropertyOptional({ description: 'Error flag' })
  @IsOptional()
  @IsBoolean()
  error?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ChatFilterDto {
  @ApiPropertyOptional({ description: 'Filter by institution ID' })
  @IsOptional()
  @IsUUID()
  institutionId?: string;

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
