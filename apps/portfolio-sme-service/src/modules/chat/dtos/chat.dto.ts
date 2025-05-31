import { IsString, IsBoolean, IsOptional, IsObject, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageRole } from '../entities/chat-message.entity';

export class CreateChatDto {
  @ApiProperty({ description: 'Titre du chat' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Statut actif du chat' })
  @IsBoolean()
  isActive!: boolean;

  @ApiPropertyOptional({ description: 'Contexte agrégé (données portefeuille et rapport)' })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Métadonnées supplémentaires' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateMessageDto {
  @ApiProperty({ description: 'Rôle du message', enum: MessageRole })
  @IsEnum(MessageRole)
  role!: MessageRole;

  @ApiProperty({ description: 'Contenu du message' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: 'Source d’information' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Métadonnées supplémentaires' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ChatFilterDto {
  @ApiPropertyOptional({ description: 'Filtrer par company ID' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par user ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par statut actif' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Terme de recherche' })
  @IsOptional()
  @IsString()
  search?: string;
}
