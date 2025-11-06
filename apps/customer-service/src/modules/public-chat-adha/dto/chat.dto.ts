import { IsString, IsNotEmpty, IsOptional, IsObject, MaxLength, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums réutilisés depuis les entités
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  ERROR = 'error'
}

export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export class SendMessageDto {
  @ApiProperty({ 
    description: 'Contenu du message à envoyer à Adha',
    example: 'Bonjour, pouvez-vous m\'aider avec ma comptabilité ?' 
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content!: string;

  @ApiPropertyOptional({ 
    description: 'ID de la conversation (optionnel pour nouveau chat)',
    example: 'conv-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsOptional()
  conversationId?: string;

  @ApiPropertyOptional({ 
    description: 'ID du modèle Adha à utiliser',
    example: 'adha-1',
    default: 'adha-1'
  })
  @IsString()
  @IsOptional()
  modelId?: string;

  @ApiPropertyOptional({
    description: 'Contexte additionnel pour la conversation',
    example: { userAgent: 'Mozilla/5.0...', sessionId: 'sess_123' }
  })
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}

export class MessageResponseDto {
  @ApiProperty({ description: 'ID unique du message' })
  id!: string;

  @ApiProperty({ description: 'ID de la conversation' })
  conversationId!: string;

  @ApiProperty({ description: 'Contenu du message' })
  content!: string;

  @ApiProperty({ 
    enum: MessageRole,
    description: 'Rôle de l\'expéditeur du message' 
  })
  role!: MessageRole;

  @ApiProperty({ 
    enum: MessageStatus,
    description: 'Statut du message' 
  })
  status!: MessageStatus;

  @ApiProperty({ description: 'Date de création du message' })
  createdAt!: string;

  @ApiPropertyOptional({ description: 'Métadonnées du message' })
  metadata?: Record<string, any>;
}

export class ConversationResponseDto {
  @ApiProperty({ description: 'ID unique de la conversation' })
  id!: string;

  @ApiProperty({ description: 'Titre de la conversation' })
  title!: string;

  @ApiProperty({ 
    enum: ConversationStatus,
    description: 'Statut de la conversation' 
  })
  status!: ConversationStatus;

  @ApiPropertyOptional({ description: 'ID du modèle utilisé' })
  modelId?: string;

  @ApiProperty({ description: 'Date de création de la conversation' })
  createdAt!: string;

  @ApiProperty({ description: 'Date du dernier message' })
  updatedAt!: string;

  @ApiProperty({ description: 'Nombre de messages dans la conversation' })
  messageCount!: number;

  @ApiPropertyOptional({ description: 'Métadonnées de la conversation' })
  metadata?: Record<string, any>;

  @ApiProperty({
    type: [MessageResponseDto],
    description: 'Liste des messages de la conversation'
  })
  messages!: MessageResponseDto[];
}

export class CreateConversationDto {
  @ApiProperty({ 
    description: 'Titre de la conversation',
    example: 'Nouvelle conversation avec Adha'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ 
    description: 'ID du modèle Adha à utiliser',
    example: 'adha-1',
    default: 'adha-1'
  })
  @IsString()
  @IsOptional()
  modelId?: string;

  @ApiPropertyOptional({
    description: 'Métadonnées initiales de la conversation',
    example: { tags: ['finance', 'comptabilité'] }
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ChatHealthResponseDto {
  @ApiProperty({ 
    description: 'Statut de santé du service',
    enum: ['healthy', 'unhealthy'],
    example: 'healthy'
  })
  status!: string;

  @ApiProperty({ 
    description: 'Timestamp de la vérification',
    example: '2024-01-15T10:30:00Z'
  })
  timestamp!: string;

  @ApiProperty({ 
    description: 'Statuts des services',
    example: { database: 'connected', openai: 'connected', adha: 'ready' }
  })
  services!: Record<string, string>;

  @ApiProperty({ 
    description: 'Version du service',
    example: '1.0.0'
  })
  version!: string;

  @ApiPropertyOptional({ 
    description: 'Message d\'erreur si applicable',
    example: 'Service temporairement indisponible'
  })
  error?: string;
}