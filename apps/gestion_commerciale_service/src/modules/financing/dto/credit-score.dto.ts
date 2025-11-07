import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, IsEnum, IsDateString, IsNumber, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO pour calculer le score crédit d'une entreprise
 */
export class CalculateCreditScoreDto {
  @ApiProperty({ 
    description: 'ID de l\'entreprise pour calculer le score crédit',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsString()
  companyId: string;

  @ApiPropertyOptional({ 
    description: 'Période d\'analyse - date de début',
    example: '2023-02-01T00:00:00.000Z'
  })
  @IsDateString()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ 
    description: 'Période d\'analyse - date de fin',
    example: '2023-08-01T00:00:00.000Z'
  })
  @IsDateString()
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({ 
    description: 'Forcer le recalcul même si un score récent existe',
    example: false,
    default: false
  })
  @IsOptional()
  forceRecalculation?: boolean;

  @ApiPropertyOptional({ 
    description: 'Type d\'analyse demandée',
    enum: ['full', 'quick', 'minimal'],
    example: 'full',
    default: 'full'
  })
  @IsEnum(['full', 'quick', 'minimal'])
  @IsOptional()
  analysisType?: 'full' | 'quick' | 'minimal';

  @ApiPropertyOptional({ 
    description: 'Inclure les détails des composants dans la réponse',
    example: true,
    default: true
  })
  @IsOptional()
  includeComponents?: boolean;

  @ApiPropertyOptional({ 
    description: 'Inclure les explications et recommandations',
    example: true,
    default: true
  })
  @IsOptional()
  includeExplanations?: boolean;

  @ApiPropertyOptional({ 
    description: 'Utilisateur qui a demandé le calcul',
    example: 'user@example.com'
  })
  @IsString()
  @IsOptional()
  calculatedBy?: string;
}

/**
 * DTO pour les composants détaillés du score crédit
 */
export class CreditScoreComponentsDto {
  @ApiProperty({ 
    description: 'Qualité des flux de trésorerie (0-100)',
    example: 78,
    minimum: 0,
    maximum: 100
  })
  @IsInt()
  @Min(0)
  @Max(100)
  cashFlowQuality: number;

  @ApiProperty({ 
    description: 'Stabilité de l\'activité commerciale (0-100)',
    example: 82,
    minimum: 0,
    maximum: 100
  })
  @IsInt()
  @Min(0)
  @Max(100)
  businessStability: number;

  @ApiProperty({ 
    description: 'Santé financière globale (0-100)',
    example: 65,
    minimum: 0,
    maximum: 100
  })
  @IsInt()
  @Min(0)
  @Max(100)
  financialHealth: number;

  @ApiProperty({ 
    description: 'Comportement de paiement (0-100)',
    example: 90,
    minimum: 0,
    maximum: 100
  })
  @IsInt()
  @Min(0)
  @Max(100)
  paymentBehavior: number;

  @ApiProperty({ 
    description: 'Tendance de croissance (0-100)',
    example: 70,
    minimum: 0,
    maximum: 100
  })
  @IsInt()
  @Min(0)
  @Max(100)
  growthTrend: number;
}

/**
 * DTO pour le score crédit calculé (réponse simple)
 */
export class CreditScoreResponseDto {
  @ApiProperty({ 
    description: 'Score crédit principal (1-100)',
    example: 75,
    minimum: 1,
    maximum: 100
  })
  @IsInt()
  @Min(1)
  @Max(100)
  score: number;

  @ApiProperty({ 
    description: 'Niveau de risque déterminé par le score',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    example: 'MEDIUM'
  })
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  riskLevel: string;

  @ApiProperty({ 
    description: 'Classification détaillée du score',
    enum: ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR', 'VERY_POOR'],
    example: 'GOOD'
  })
  @IsEnum(['EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR', 'VERY_POOR'])
  scoreClass: string;

  @ApiProperty({ 
    description: 'Date de calcul du score',
    example: '2023-08-01T12:30:00.000Z'
  })
  @IsDateString()
  calculatedAt: Date;

  @ApiProperty({ 
    description: 'Date d\'expiration du score (30 jours par défaut)',
    example: '2023-08-31T12:30:00.000Z'
  })
  @IsDateString()
  validUntil: Date;

  @ApiProperty({ 
    description: 'Version du modèle utilisé pour le calcul',
    example: 'v1.2.3'
  })
  @IsString()
  modelVersion: string;

  @ApiProperty({ 
    description: 'Source des données utilisées pour le calcul',
    example: 'accounting_transactions_6m'
  })
  @IsString()
  dataSource: string;

  @ApiProperty({ 
    description: 'Score de confiance du modèle (0-1)',
    example: 0.85,
    minimum: 0,
    maximum: 1
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceScore: number;
}

/**
 * DTO pour le score crédit détaillé avec composants et explications
 */
export class DetailedCreditScoreResponseDto extends CreditScoreResponseDto {
  @ApiProperty({ 
    description: 'Composants détaillés du score',
    type: CreditScoreComponentsDto
  })
  @ValidateNested()
  @Type(() => CreditScoreComponentsDto)
  components: CreditScoreComponentsDto;

  @ApiProperty({ 
    description: 'Facteurs explicatifs du score',
    example: [
      'Flux de trésorerie réguliers détectés',
      'Croissance constante du chiffre d\'affaires',
      'Ratio d\'endettement acceptable'
    ]
  })
  @IsArray()
  @IsString({ each: true })
  explanation: string[];

  @ApiProperty({ 
    description: 'Recommandations basées sur l\'analyse',
    example: [
      'Maintenir la régularité des flux',
      'Diversifier les sources de revenus',
      'Optimiser la gestion de trésorerie'
    ]
  })
  @IsArray()
  @IsString({ each: true })
  recommendations: string[];

  @ApiPropertyOptional({ 
    description: 'Données contextuelles additionnelles',
    example: {
      companyId: '123e4567-e89b-12d3-a456-426614174001',
      companyName: 'ABC Company SARL',
      sector: 'Commerce',
      analysisType: 'full'
    }
  })
  @IsOptional()
  context?: {
    companyId: string;
    companyName?: string;
    sector?: string;
    analysisType: string;
  };
}

/**
 * DTO pour l'historique des scores crédit
 */
export class CreditScoreHistoryDto {
  @ApiProperty({ 
    description: 'Identifiant unique de l\'entrée historique',
    example: '123e4567-e89b-12d3-a456-426614174004'
  })
  @IsString()
  id: string;

  @ApiProperty({ 
    description: 'Score crédit à cette date',
    type: CreditScoreResponseDto
  })
  @ValidateNested()
  @Type(() => CreditScoreResponseDto)
  score: CreditScoreResponseDto;

  @ApiProperty({ 
    description: 'Type d\'événement qui a déclenché le recalcul',
    enum: ['manual', 'automatic', 'transaction_update', 'periodic'],
    example: 'automatic'
  })
  @IsEnum(['manual', 'automatic', 'transaction_update', 'periodic'])
  trigger: 'manual' | 'automatic' | 'transaction_update' | 'periodic';

  @ApiPropertyOptional({ 
    description: 'Utilisateur qui a initié le calcul (si manuel)',
    example: 'user@example.com'
  })
  @IsString()
  @IsOptional()
  calculatedBy?: string;

  @ApiPropertyOptional({ 
    description: 'Changement par rapport au score précédent',
    example: {
      previousScore: 70,
      change: 5,
      changePercentage: 7.14
    }
  })
  @IsOptional()
  scoreChange?: {
    previousScore: number;
    change: number;
    changePercentage: number;
  };
}

/**
 * DTO pour la réponse de l'API de calcul de score
 */
export class CreditScoreApiResponseDto {
  @ApiProperty({ 
    description: 'Succès de l\'opération',
    example: true
  })
  success: boolean;

  @ApiProperty({ 
    description: 'Score calculé (simple ou détaillé)',
    oneOf: [
      { $ref: '#/components/schemas/CreditScoreResponseDto' },
      { $ref: '#/components/schemas/DetailedCreditScoreResponseDto' }
    ]
  })
  score: CreditScoreResponseDto | DetailedCreditScoreResponseDto;

  @ApiPropertyOptional({ 
    description: 'Message informatif',
    example: 'Score crédit calculé avec succès'
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({ 
    description: 'Erreurs éventuelles',
    example: []
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  errors?: string[];

  @ApiProperty({ 
    description: 'Métadonnées de l\'API',
    example: {
      processingTime: 2.5,
      apiVersion: 'v1.0.0',
      requestId: 'req_123456789'
    }
  })
  metadata: {
    processingTime: number;
    apiVersion: string;
    requestId: string;
  };
}

/**
 * DTO pour récupérer l'historique des scores
 */
export class GetCreditScoreHistoryDto {
  @ApiProperty({ 
    description: 'ID de l\'entreprise',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsString()
  companyId: string;

  @ApiPropertyOptional({ 
    description: 'Limite du nombre d\'entrées à retourner',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ 
    description: 'Décalage pour la pagination',
    example: 0,
    default: 0,
    minimum: 0
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number;

  @ApiPropertyOptional({ 
    description: 'Filtrer par type de déclenchement',
    enum: ['manual', 'automatic', 'transaction_update', 'periodic']
  })
  @IsEnum(['manual', 'automatic', 'transaction_update', 'periodic'])
  @IsOptional()
  triggerType?: 'manual' | 'automatic' | 'transaction_update' | 'periodic';
}

/**
 * DTO pour mettre à jour manuellement un score crédit
 */
export class UpdateCreditScoreDto {
  @ApiProperty({ 
    description: 'Nouveau score crédit (1-100)',
    example: 80,
    minimum: 1,
    maximum: 100
  })
  @IsInt()
  @Min(1)
  @Max(100)
  score: number;

  @ApiPropertyOptional({ 
    description: 'Raison de la mise à jour manuelle',
    example: 'Correction suite à analyse manuelle'
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ 
    description: 'Utilisateur effectuant la mise à jour',
    example: 'analyst@company.com'
  })
  @IsString()
  @IsOptional()
  updatedBy?: string;
}