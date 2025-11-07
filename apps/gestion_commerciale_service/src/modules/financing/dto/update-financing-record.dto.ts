import { PartialType } from '@nestjs/swagger'; // Using @nestjs/swagger for PartialType as it works well with ApiProperty
import { CreateFinancingRecordDto } from './create-financing-record.dto';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FinancingRequestStatus } from '../entities/financing-record.entity';

export class UpdateFinancingRecordDto extends PartialType(CreateFinancingRecordDto) {
  @ApiPropertyOptional({
    description: 'Statut de la demande',
    enum: FinancingRequestStatus,
  })
  @IsEnum(FinancingRequestStatus)
  @IsOptional()
  status?: FinancingRequestStatus;

  @ApiPropertyOptional({ 
    description: 'Date de soumission',
    example: '2023-08-01T12:30:00.000Z'
  })
  @IsDateString()
  @IsOptional()
  applicationDate?: Date;

  @ApiPropertyOptional({ 
    description: 'Date de mise à jour de statut',
    example: '2023-08-02T10:15:00.000Z'
  })
  @IsDateString()
  @IsOptional()
  lastStatusUpdateDate?: Date;

  @ApiPropertyOptional({ 
    description: 'Date d\'approbation',
    example: '2023-08-15T14:20:00.000Z'
  })
  @IsDateString()
  @IsOptional()
  approvalDate?: Date;

  @ApiPropertyOptional({ 
    description: 'Date de décaissement',
    example: '2023-08-20T09:45:00.000Z'
  })
  @IsDateString()
  @IsOptional()
  disbursementDate?: Date;

  // ============= CHAMPS SCORE CRÉDIT XGBOOST =============
  
  @ApiPropertyOptional({ 
    description: 'Score crédit calculé par XGBoost (1-100)', 
    example: 75,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  creditScore?: number;

  @ApiPropertyOptional({ 
    description: 'Version du modèle XGBoost utilisé', 
    example: 'v1.2.3'
  })
  @IsOptional()
  creditScoreModelVersion?: string;

  @ApiPropertyOptional({ 
    description: 'Niveau de risque basé sur le score crédit', 
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    example: 'MEDIUM'
  })
  @IsOptional()
  riskLevel?: string;

  @ApiPropertyOptional({ 
    description: 'Score de confiance du modèle (0-1)', 
    example: 0.85,
    minimum: 0,
    maximum: 1
  })
  @IsOptional()
  confidenceScore?: number;

  @ApiPropertyOptional({ 
    description: 'Source des données utilisées pour le calcul', 
    example: 'accounting_transactions_6m'
  })
  @IsOptional()
  creditScoreDataSource?: string;

  // Note: Les champs calculatedAt, validUntil, components, explanation, recommendations
  // ne sont pas inclus dans UpdateDto car ils sont gérés automatiquement par le système
}
