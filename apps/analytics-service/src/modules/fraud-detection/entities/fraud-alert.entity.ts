import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum FraudType {
  UNUSUAL_TRANSACTION = 'unusual_transaction',
  IDENTITY_FRAUD = 'identity_fraud',
  MONEY_LAUNDERING = 'money_laundering',
  COLLUSION = 'collusion',
  DOCUMENT_FRAUD = 'document_fraud',
  PAYMENT_FRAUD = 'payment_fraud',
  ACCOUNT_TAKEOVER = 'account_takeover',
  FAKE_BUSINESS = 'fake_business'
}

export enum AlertStatus {
  ACTIVE = 'active',
  INVESTIGATING = 'investigating',
  CONFIRMED = 'confirmed',
  FALSE_POSITIVE = 'false_positive',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface FraudEvidence {
  indicators: string[];
  suspiciousPatterns: any[];
  relatedEntities: string[];
  confidence: number;
  detectionMethod: string;
  ruleTriggered?: string;
  anomalyScore?: number;
}

export interface FraudInvestigation {
  assignedTo: string;
  startDate: Date;
  expectedResolution?: Date;
  findings: string[];
  actions: string[];
  notes?: string;
  priority: number;
}

@Entity('fraud_alerts')
@Index(['fraudType', 'status'])
@Index(['entityId', 'createdAt'])
@Index(['severity', 'status'])
@Index(['province', 'createdAt'])
export class FraudAlert {
  @ApiProperty({ description: 'Identifiant unique de l\'alerte' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ description: 'Identifiant de l\'entité concernée' })
  @Column('uuid')
  entityId!: string;

  @ApiProperty({ description: 'Type d\'entité (SME, TRANSACTION, etc.)' })
  @Column()
  entityType!: string;

  @ApiProperty({ description: 'Nom de l\'entité (pour affichage)' })
  @Column({ nullable: true })
  entityName?: string;

  @ApiProperty({ 
    description: 'Type de fraude détectée',
    enum: FraudType,
    example: FraudType.UNUSUAL_TRANSACTION
  })
  @Column({
    type: 'enum',
    enum: FraudType
  })
  fraudType!: FraudType;

  @ApiProperty({ 
    description: 'Sévérité de l\'alerte',
    enum: AlertSeverity,
    example: AlertSeverity.HIGH
  })
  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.MEDIUM
  })
  severity!: AlertSeverity;

  @ApiProperty({ 
    description: 'Score de risque de fraude (0-1)',
    example: 0.856,
    minimum: 0,
    maximum: 1
  })
  @Column('decimal', { precision: 4, scale: 3 })
  riskScore!: number;

  @ApiProperty({ 
    description: 'Seuil de déclenchement qui a été dépassé',
    example: 0.75
  })
  @Column('decimal', { precision: 4, scale: 3 })
  threshold!: number;

  @ApiProperty({ 
    description: 'Statut actuel de l\'alerte',
    enum: AlertStatus,
    example: AlertStatus.ACTIVE
  })
  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE
  })
  status!: AlertStatus;

  @ApiProperty({ description: 'Description détaillée de l\'alerte' })
  @Column('text')
  description!: string;

  @ApiProperty({ 
    description: 'Preuves et indicateurs de fraude',
    example: {
      indicators: ['montant_inhabituel', 'heure_suspecte'],
      confidence: 0.85,
      detectionMethod: 'ml_model_v2'
    }
  })
  @Column('jsonb')
  evidence!: FraudEvidence;

  @ApiProperty({ 
    description: 'Informations d\'enquête (si applicable)',
    required: false
  })
  @Column('jsonb', { nullable: true })
  investigation?: FraudInvestigation;

  @ApiProperty({ description: 'Actions recommandées' })
  @Column('jsonb', { nullable: true })
  recommendedActions?: string[];

  @ApiProperty({ description: 'Province (pour agrégation géographique)', required: false })
  @Column({ nullable: true })
  province?: string;

  @ApiProperty({ description: 'Secteur d\'activité', required: false })
  @Column({ nullable: true })
  sector?: string;

  @ApiProperty({ description: 'Institution financière concernée', required: false })
  @Column('uuid', { nullable: true })
  institutionId?: string;

  @ApiProperty({ description: 'Utilisateur qui a accusé réception', required: false })
  @Column('uuid', { nullable: true })
  acknowledgedBy?: string;

  @ApiProperty({ description: 'Date d\'accusé de réception', required: false })
  @Column('timestamp', { nullable: true })
  acknowledgedAt?: Date;

  @ApiProperty({ description: 'Date de résolution', required: false })
  @Column('timestamp', { nullable: true })
  resolvedAt?: Date;

  @ApiProperty({ description: 'Alertes liées', required: false })
  @Column('simple-array', { nullable: true })
  relatedAlerts?: string[];

  @ApiProperty({ description: 'Métadonnées additionnelles' })
  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Détermine la sévérité basée sur le score de risque
   */
  static determineSeverity(riskScore: number): AlertSeverity {
    if (riskScore >= 0.9) return AlertSeverity.CRITICAL;
    if (riskScore >= 0.7) return AlertSeverity.HIGH;
    if (riskScore >= 0.5) return AlertSeverity.MEDIUM;
    return AlertSeverity.LOW;
  }

  /**
   * Vérifie si l'alerte nécessite une attention immédiate
   */
  requiresImmediateAttention(): boolean {
    return this.severity === AlertSeverity.CRITICAL || 
           (this.severity === AlertSeverity.HIGH && this.status === AlertStatus.ACTIVE);
  }

  /**
   * Calcule l'âge de l'alerte en heures
   */
  getAgeInHours(): number {
    return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60));
  }

  /**
   * Vérifie si l'alerte est expirée (non traitée depuis plus de 24h pour les critiques)
   */
  isExpired(): boolean {
    const hoursThreshold = this.severity === AlertSeverity.CRITICAL ? 24 : 72;
    return this.status === AlertStatus.ACTIVE && this.getAgeInHours() > hoursThreshold;
  }
}
