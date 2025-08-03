import { IsString, IsEnum, IsOptional, IsDateString, IsObject, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum FinancialEventType {
  TRANSACTION = 'TRANSACTION',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT', 
  FRAUD_ALERT = 'FRAUD_ALERT',
  PORTFOLIO_UPDATE = 'PORTFOLIO_UPDATE',
  CREDIT_EVENT = 'CREDIT_EVENT'
}

export enum EventSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export class FinancialEventDto {
  @ApiProperty({ description: 'Identifiant unique de l\'événement' })
  @IsUUID()
  id: string;

  @ApiProperty({ enum: FinancialEventType, description: 'Type d\'événement financier' })
  @IsEnum(FinancialEventType)
  type: FinancialEventType;

  @ApiProperty({ description: 'Identifiant de l\'entité concernée (PME, Portfolio, etc.)' })
  @IsString()
  entityId: string;

  @ApiProperty({ description: 'Timestamp de l\'événement' })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ description: 'Données spécifiques à l\'événement', type: 'object' })
  @IsObject()
  data: any;

  @ApiProperty({ description: 'Source de l\'événement' })
  @IsString()
  source: string;

  @ApiProperty({ enum: EventSeverity, description: 'Niveau de sévérité', required: false })
  @IsOptional()
  @IsEnum(EventSeverity)
  severity?: EventSeverity;
}

export class TransactionEventDataDto {
  @ApiProperty({ description: 'ID de la transaction' })
  @IsString()
  transactionId: string;

  @ApiProperty({ description: 'Montant de la transaction' })
  amount: number;

  @ApiProperty({ description: 'Devise' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Type de transaction' })
  @IsString()
  transactionType: string;
}

export class RiskAssessmentEventDataDto {
  @ApiProperty({ description: 'Score de risque calculé' })
  riskScore: number;

  @ApiProperty({ description: 'Niveau de risque' })
  @IsString()
  riskLevel: string;

  @ApiProperty({ description: 'Facteurs de risque identifiés' })
  factors: string[];
}

export class FraudAlertEventDataDto {
  @ApiProperty({ description: 'Type d\'alerte de fraude' })
  @IsString()
  alertType: string;

  @ApiProperty({ description: 'Description de l\'alerte' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Preuves ou indices de fraude' })
  evidence: any[];
}

export class EventProcessingStatsDto {
  @ApiProperty({ description: 'Groupe de consumers Kafka' })
  @IsString()
  groupId: string;

  @ApiProperty({ description: 'Statut de la connexion' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Topics Kafka écoutés' })
  topics: string[];

  @ApiProperty({ description: 'Timestamp de la dernière activité' })
  @IsDateString()
  timestamp: string;
}
