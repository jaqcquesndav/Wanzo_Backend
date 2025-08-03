import { IsString, IsEnum, IsNumber, IsOptional, IsArray, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FraudType, AlertSeverity, AlertStatus } from '../entities/fraud-alert.entity';

export class AnalyzeTransactionDto {
  @ApiProperty({ description: 'Identifiant unique de la transaction' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Montant de la transaction' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Devise de la transaction' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'ID de l\'entité (PME, client)' })
  @IsString()
  entityId: string;

  @ApiProperty({ description: 'Timestamp de la transaction' })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ description: 'Méthode de paiement' })
  @IsString()
  paymentMethod: string;

  @ApiProperty({ description: 'Localisation de la transaction', required: false })
  @IsOptional()
  location?: {
    province: string;
    city?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  @ApiProperty({ description: 'Informations sur la contrepartie', required: false })
  @IsOptional()
  counterpart?: {
    id: string;
    name: string;
    type: string;
  };
}

export class CreateFraudAlertDto {
  @ApiProperty({ description: 'ID de l\'entité concernée' })
  @IsString()
  entityId: string;

  @ApiProperty({ enum: FraudType, description: 'Type de fraude détectée' })
  @IsEnum(FraudType)
  fraudType: FraudType;

  @ApiProperty({ enum: AlertSeverity, description: 'Sévérité de l\'alerte' })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiProperty({ description: 'Score de risque (0-1)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  riskScore: number;

  @ApiProperty({ description: 'Description de l\'alerte' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Province où l\'alerte a été détectée', required: false })
  @IsOptional()
  @IsString()
  province?: string;
}

export class UpdateFraudAlertDto {
  @ApiProperty({ enum: AlertStatus, description: 'Nouveau statut de l\'alerte', required: false })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @ApiProperty({ description: 'Notes d\'investigation', required: false })
  @IsOptional()
  @IsString()
  investigationNotes?: string;

  @ApiProperty({ description: 'Actions prises', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  actionsTaken?: string[];

  @ApiProperty({ description: 'Assigné à (investigateur)', required: false })
  @IsOptional()
  @IsString()
  assignedTo?: string;
}

export class FraudStatsQueryDto {
  @ApiProperty({ description: 'Date de début (ISO string)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Date de fin (ISO string)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Province à filtrer', required: false })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ enum: FraudType, description: 'Type de fraude à filtrer', required: false })
  @IsOptional()
  @IsEnum(FraudType)
  fraudType?: FraudType;

  @ApiProperty({ enum: AlertSeverity, description: 'Sévérité minimum', required: false })
  @IsOptional()
  @IsEnum(AlertSeverity)
  minSeverity?: AlertSeverity;
}

export class FraudAnalysisResultDto {
  @ApiProperty({ description: 'Nombre d\'alertes générées' })
  alertsGenerated: number;

  @ApiProperty({ description: 'Score de risque maximum détecté' })
  maxRiskScore: number;

  @ApiProperty({ description: 'Types de fraude détectés' })
  detectedFraudTypes: FraudType[];

  @ApiProperty({ description: 'Indicateurs de risque identifiés' })
  riskIndicators: string[];

  @ApiProperty({ description: 'Recommandations d\'action' })
  recommendations: string[];

  @ApiProperty({ description: 'Statut de l\'analyse' })
  analysisStatus: 'completed' | 'partial' | 'failed';
}

export class RiskThresholdDto {
  @ApiProperty({ enum: FraudType, description: 'Type de fraude' })
  @IsEnum(FraudType)
  fraudType: FraudType;

  @ApiProperty({ description: 'Seuil de risque (0-1)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  threshold: number;

  @ApiProperty({ description: 'Description du seuil' })
  @IsString()
  description: string;
}

export class BulkAnalysisDto {
  @ApiProperty({ description: 'Liste des transactions à analyser', type: [AnalyzeTransactionDto] })
  @IsArray()
  transactions: AnalyzeTransactionDto[];

  @ApiProperty({ description: 'Options d\'analyse', required: false })
  @IsOptional()
  options?: {
    includeHistorical?: boolean;
    severityThreshold?: AlertSeverity;
    skipDuplicates?: boolean;
  };
}
