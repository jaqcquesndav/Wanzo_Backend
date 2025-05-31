import { IsString, IsBoolean, IsOptional, IsObject, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageRole } from '../entities/chat-message.entity';

export class CreateChatDto {
  @ApiProperty({ description: 'Chat title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Chat active status' })
  @IsBoolean()
  isActive!: boolean;

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
