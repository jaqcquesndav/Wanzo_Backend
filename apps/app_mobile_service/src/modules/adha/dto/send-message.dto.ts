import { IsString, IsOptional, IsUUID, IsDateString, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum InteractionType {
  GENERIC_CARD_ANALYSIS = 'generic_card_analysis',
  DIRECT_INITIATION = 'direct_initiation',
  FOLLOW_UP = 'follow_up',
}

class BaseContextDto {
  // Define structure based on API_DOCUMENTATION.md
  // Example:
  // @ValidateNested()
  // @Type(() => OperationJournalSummaryDto)
  // operationJournalSummary: OperationJournalSummaryDto;

  // @ValidateNested()
  // @Type(() => BusinessProfileDto)
  // businessProfile: BusinessProfileDto;
  // For now, using any to keep it simple, refine later
  @ApiProperty({
    description: 'Résumé du journal des opérations',
    example: { /* Exemple de résumé */ },
    required: true
  })
  operationJournalSummary: any;
  
  @ApiProperty({
    description: 'Profil de l\'entreprise',
    example: { /* Exemple de profil */ },
    required: true
  })
  businessProfile: any;
}

class InteractionContextDto {
  @ApiProperty({
    description: 'Type d\'interaction',
    enum: InteractionType,
    example: InteractionType.DIRECT_INITIATION,
    required: true
  })
  @IsEnum(InteractionType)
  interactionType: InteractionType;

  @ApiProperty({
    description: 'Identifiant de la source d\'interaction',
    example: 'transaction-123',
    required: false
  })
  @IsString()
  @IsOptional()
  sourceIdentifier?: string;

  // Define structure based on API_DOCUMENTATION.md
  // For now, using any to keep it simple, refine later
  @ApiProperty({
    description: 'Données spécifiques à l\'interaction',
    example: { /* Exemple de données d'interaction */ },
    required: false
  })
  interactionData?: any;
}

class ContextInfoDto {
  @ApiProperty({
    description: 'Contexte de base',
    type: BaseContextDto,
    required: true
  })
  @ValidateNested()
  @Type(() => BaseContextDto)
  baseContext: BaseContextDto;

  @ApiProperty({
    description: 'Contexte d\'interaction',
    type: InteractionContextDto,
    required: true
  })
  @ValidateNested()
  @Type(() => InteractionContextDto)
  interactionContext: InteractionContextDto;
}

export class SendMessageDto {
  @ApiProperty({
    description: 'Texte du message',
    example: 'Je voudrais analyser cette transaction.',
    required: true
  })
  @IsString()
  text: string;

  @ApiProperty({
    description: 'Identifiant de la conversation (optionnel pour une nouvelle conversation)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    format: 'uuid',
    required: false
  })
  @IsUUID()
  @IsOptional()
  conversationId?: string;

  @ApiProperty({
    description: 'Horodatage du message',
    example: '2025-06-04T12:00:00Z',
    format: 'date-time',
    required: true
  })
  @IsDateString()
  timestamp: string;

  @ApiProperty({
    description: 'Informations contextuelles',
    type: ContextInfoDto,
    required: true
  })
  @ValidateNested()
  @Type(() => ContextInfoDto)
  contextInfo: ContextInfoDto;
}
