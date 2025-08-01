import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum InteractionType {
  GENERIC_CARD_ANALYSIS = 'generic_card_analysis',
  FOLLOW_UP = 'follow_up',
}

export class BusinessProfileDto {
  @ApiProperty({
    description: 'Nom de l\'entreprise',
    example: 'Boulangerie Kinoise',
    required: true
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Secteur d\'activité',
    example: 'Alimentation',
    required: true
  })
  @IsString()
  sector: string;

  @ApiProperty({
    description: 'Adresse de l\'entreprise',
    example: '123 Avenue du Commerce, Kinshasa',
    required: false
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Autres informations sur l\'entreprise',
    example: { employees: 5, foundingYear: 2020 },
    required: false
  })
  @IsObject()
  @IsOptional()
  additionalInfo?: Record<string, any>;
}

export class OperationJournalEntryDto {
  @ApiProperty({
    description: 'Horodatage de l\'entrée',
    example: '2025-06-04T12:00:00Z',
    required: true
  })
  @IsString()
  timestamp: string;

  @ApiProperty({
    description: 'Description de l\'opération',
    example: 'Vente #123 créée',
    required: true
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Type d\'opération',
    example: 'CREATE_SALE',
    required: false
  })
  @IsString()
  @IsOptional()
  operationType?: string;

  @ApiProperty({
    description: 'Détails supplémentaires',
    example: { amount: 2500, customer: 'John Doe' },
    required: false
  })
  @IsObject()
  @IsOptional()
  details?: Record<string, any>;
}

export class OperationJournalSummaryDto {
  @ApiProperty({
    description: 'Entrées récentes du journal',
    type: [OperationJournalEntryDto],
    required: true
  })
  @ValidateNested({ each: true })
  @Type(() => OperationJournalEntryDto)
  recentEntries: OperationJournalEntryDto[];
}

export class BaseContextDto {
  @ApiProperty({
    description: 'Résumé du journal des opérations',
    type: OperationJournalSummaryDto,
    required: true
  })
  @ValidateNested()
  @Type(() => OperationJournalSummaryDto)
  operationJournalSummary: OperationJournalSummaryDto;
  
  @ApiProperty({
    description: 'Profil de l\'entreprise',
    type: BusinessProfileDto,
    required: true
  })
  @ValidateNested()
  @Type(() => BusinessProfileDto)
  businessProfile: BusinessProfileDto;
}

export class InteractionContextDto {
  @ApiProperty({
    description: 'Type d\'interaction',
    enum: InteractionType,
    example: InteractionType.FOLLOW_UP,
    required: true
  })
  @IsEnum(InteractionType)
  interactionType: InteractionType;

  @ApiProperty({
    description: 'Identifiant de la source d\'interaction',
    example: 'sales_analysis_q1_card',
    required: false
  })
  @IsString()
  @IsOptional()
  sourceIdentifier?: string;

  @ApiProperty({
    description: 'Données spécifiques à l\'interaction',
    example: { salesData: { q1Total: 15000, topProducts: ['Pain', 'Croissant'] } },
    required: false
  })
  @IsObject()
  @IsOptional()
  interactionData?: Record<string, any>;
}

export class AdhaContextInfoDto {
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
