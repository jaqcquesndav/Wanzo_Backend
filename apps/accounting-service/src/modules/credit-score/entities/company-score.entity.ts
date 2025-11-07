import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum CreditScoreTrigger {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic', 
  TRANSACTION_UPDATE = 'transaction_update',
  PERIODIC = 'periodic',
  API_REQUEST = 'api_request',
  REAL_TIME_DAILY = 'real_time_daily',
  REAL_TIME_WEEKLY = 'real_time_weekly',
  REAL_TIME_MONTHLY = 'real_time_monthly',
  REAL_TIME_YEARLY = 'real_time_yearly'
}

export enum CreditScoreInterval {
  DAILY = 'daily',
  WEEKLY = 'weekly', 
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export enum HealthStatus {
  EXCELLENT = 'excellent',    // Score 91-100
  GOOD = 'good',             // Score 71-90
  FAIR = 'fair',             // Score 51-70
  POOR = 'poor',             // Score 31-50
  CRITICAL = 'critical'      // Score 1-30
}

export enum CreditScoreStatus {
  CALCULATING = 'calculating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

/**
 * Entité pour stocker l'historique des cotes crédit XGBoost
 * Source unique de vérité pour toutes les cotes crédit de la plateforme
 */
@Entity('company_credit_scores')
@Index(['companyId', 'createdAt'])
@Index(['companyId', 'status'])
@Index(['validUntil'])
export class CompanyCreditScore {
  @ApiProperty({ description: 'Identifiant unique du score crédit' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID de l\'entreprise évaluée' })
  @Column('uuid')
  @Index()
  companyId: string;

  @ApiProperty({ 
    description: 'Score crédit XGBoost (1-100)', 
    example: 75,
    minimum: 1,
    maximum: 100
  })
  @Column('int')
  score: number;

  @ApiProperty({ 
    description: 'Niveau de risque basé sur le score',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    example: 'MEDIUM'
  })
  @Column()
  riskLevel: string;

  @ApiProperty({ 
    description: 'Classification détaillée du score',
    enum: ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR', 'VERY_POOR'],
    example: 'GOOD'
  })
  @Column()
  scoreClass: string;

  @ApiProperty({ 
    description: 'Date de calcul du score',
    example: '2023-08-01T12:30:00.000Z'
  })
  @Column()
  calculatedAt: Date;

  @ApiProperty({ 
    description: 'Date d\'expiration du score (30 jours)',
    example: '2023-08-31T12:30:00.000Z'
  })
  @Column()
  validUntil: Date;

  @ApiProperty({ 
    description: 'Version du modèle XGBoost utilisé',
    example: 'v1.2.3'
  })
  @Column()
  modelVersion: string;

  @ApiProperty({ 
    description: 'Source des données utilisées',
    example: 'accounting_transactions_xgboost'
  })
  @Column()
  dataSource: string;

  @ApiProperty({ 
    description: 'Score de confiance du modèle (0-1)',
    example: 0.85,
    minimum: 0,
    maximum: 1
  })
  @Column('decimal', { precision: 3, scale: 2 })
  confidenceScore: number;

  @ApiProperty({ 
    description: 'Statut du calcul',
    enum: CreditScoreStatus,
    example: CreditScoreStatus.COMPLETED
  })
  @Column({
    type: 'enum',
    enum: CreditScoreStatus,
    default: CreditScoreStatus.CALCULATING
  })
  status: CreditScoreStatus;

  @ApiProperty({ 
    description: 'Type d\'événement qui a déclenché le calcul',
    enum: CreditScoreTrigger,
    example: CreditScoreTrigger.API_REQUEST
  })
  @Column({
    type: 'enum',
    enum: CreditScoreTrigger
  })
  trigger: CreditScoreTrigger;

  @ApiProperty({ 
    description: 'Utilisateur qui a initié le calcul (si manuel)',
    required: false
  })
  @Column({ nullable: true })
  calculatedBy?: string;

  @ApiProperty({ 
    description: 'Composants détaillés du score XGBoost',
    example: {
      cashFlowQuality: 78,
      businessStability: 82,
      financialHealth: 65,
      paymentBehavior: 90,
      growthTrend: 70
    }
  })
  @Column('jsonb')
  components: {
    cashFlowQuality: number;
    businessStability: number;
    financialHealth: number;
    paymentBehavior: number;
    growthTrend: number;
  };

  @ApiProperty({ 
    description: 'Facteurs explicatifs du score',
    example: [
      'Flux de trésorerie réguliers détectés',
      'Croissance constante du chiffre d\'affaires'
    ]
  })
  @Column('jsonb')
  explanation: string[];

  @ApiProperty({ 
    description: 'Recommandations basées sur l\'analyse',
    example: [
      'Maintenir la régularité des flux',
      'Diversifier les sources de revenus'
    ]
  })
  @Column('jsonb')
  recommendations: string[];

  @ApiProperty({ 
    description: 'Changement par rapport au score précédent',
    required: false
  })
  @Column('jsonb', { nullable: true })
  scoreChange?: {
    previousScore: number;
    change: number;
    changePercentage: number;
  };

  @ApiProperty({ 
    description: 'Paramètres utilisés pour le calcul',
    example: {
      startDate: '2023-02-01',
      endDate: '2023-08-01',
      analysisType: 'full'
    }
  })
  @Column('jsonb')
  calculationParams: {
    startDate: Date;
    endDate: Date;
    analysisType: string;
  };

  @ApiProperty({ 
    description: 'Temps de traitement en secondes',
    example: 2.5
  })
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  processingTime?: number;

  @ApiProperty({ 
    description: 'Messages d\'erreur (si échec)',
    required: false
  })
  @Column('text', { nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Vérifie si le score est encore valide
   */
  isValid(): boolean {
    return new Date() < this.validUntil && this.status === CreditScoreStatus.COMPLETED;
  }

  /**
   * Vérifie si le score est expiré
   */
  isExpired(): boolean {
    return new Date() >= this.validUntil;
  }

  /**
   * Retourne la recommandation textuelle basée sur le score
   */
  getRecommendation(): string {
    if (this.score >= 91) return 'Crédit excellent - Conditions préférentielles applicables';
    if (this.score >= 81) return 'Très bon crédit - Taux avantageux recommandés';
    if (this.score >= 71) return 'Bon crédit - Conditions standard applicables';
    if (this.score >= 51) return 'Crédit acceptable - Surveillance recommandée';
    if (this.score >= 31) return 'Crédit faible - Garanties supplémentaires requises';
    return 'Crédit très faible - Approbation spéciale requise';
  }

  /**
   * Marque le score comme expiré
   */
  markAsExpired(): void {
    this.status = CreditScoreStatus.EXPIRED;
  }

  /**
   * Met à jour le changement par rapport au score précédent
   */
  updateScoreChange(previousScore: number): void {
    const change = this.score - previousScore;
    const changePercentage = previousScore > 0 ? (change / previousScore) * 100 : 0;

    this.scoreChange = {
      previousScore,
      change: Math.round(change),
      changePercentage: Math.round(changePercentage * 100) / 100
    };
  }
}