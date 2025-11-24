import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CompanyCreditScore, CreditScoreInterval, HealthStatus } from './company-score.entity';

// Re-export les enums pour les autres modules
export { CreditScoreInterval, HealthStatus } from './company-score.entity';

/**
 * Entité pour le suivi temps réel des cotes crédit par intervalles
 * Permet le monitoring continu de la santé financière des PME
 */
@Entity('real_time_credit_monitoring')
@Index(['companyId', 'interval', 'periodStart'])
@Index(['companyId', 'healthStatus'])
@Index(['interval', 'periodStart'])
export class RealTimeCreditMonitoring {
  @ApiProperty({ description: 'Identifiant unique du monitoring' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID de l\'entreprise surveillée' })
  @Column('uuid')
  @Index()
  companyId: string;

  @ApiProperty({ 
    description: 'Intervalle de calcul',
    enum: CreditScoreInterval,
    example: CreditScoreInterval.DAILY
  })
  @Column({
    type: 'enum',
    enum: CreditScoreInterval
  })
  interval: CreditScoreInterval;

  @ApiProperty({ 
    description: 'Début de la période de calcul',
    example: '2023-08-01T00:00:00.000Z'
  })
  @Column()
  @Index()
  periodStart: Date;

  @ApiProperty({ 
    description: 'Fin de la période de calcul',
    example: '2023-08-01T23:59:59.999Z'
  })
  @Column()
  periodEnd: Date;

  @ApiProperty({ 
    description: 'Score crédit XGBoost pour cette période',
    example: 75,
    minimum: 1,
    maximum: 100
  })
  @Column('int')
  score: number;

  @ApiProperty({ 
    description: 'Statut de santé financière',
    enum: HealthStatus,
    example: HealthStatus.GOOD
  })
  @Column({
    type: 'enum',
    enum: HealthStatus
  })
  healthStatus: HealthStatus;

  @ApiProperty({ 
    description: 'Changement par rapport à la période précédente',
    example: {
      previousScore: 70,
      change: 5,
      changePercentage: 7.14,
      trend: 'improving'
    }
  })
  @Column('jsonb', { nullable: true })
  periodChange?: {
    previousScore: number;
    change: number;
    changePercentage: number;
    trend: string;
  };

  @ApiProperty({ 
    description: 'Cumuls des transactions pour cette période',
    example: {
      totalInflows: 150000,
      totalOutflows: 120000,
      netCashFlow: 30000,
      transactionCount: 45,
      averageTransactionSize: 3333
    }
  })
  @Column('jsonb')
  periodCumulative: {
    totalInflows: number;
    totalOutflows: number;
    netCashFlow: number;
    transactionCount: number;
    averageTransactionSize: number;
    dailyAverageBalance: number;
  };

  @ApiProperty({ 
    description: 'Composants du score pour cette période',
    example: {
      cashFlowQuality: 78,
      businessStability: 82,
      financialHealth: 65,
      paymentBehavior: 90,
      growthTrend: 70
    }
  })
  @Column('jsonb')
  scoreComponents: {
    cashFlowQuality: number;
    businessStability: number;
    financialHealth: number;
    paymentBehavior: number;
    growthTrend: number;
  };

  @ApiProperty({ 
    description: 'Métadonnées de calcul',
    example: {
      modelVersion: 'xgboost-v1.0.0',
      confidenceScore: 0.85,
      dataQualityScore: 0.92,
      processingTime: 2.5
    }
  })
  @Column('jsonb')
  calculationMetadata: {
    modelVersion: string;
    confidenceScore: number;
    dataQualityScore: number;
    processingTime: number;
    calculatedAt: Date;
  };

  @ApiProperty({ 
    description: 'Alertes générées pour cette période'
  })
  @Column('jsonb', { nullable: true })
  alerts?: {
    type: string;
    severity: string;
    message: string;
    threshold: number;
    actualValue: number;
  }[];

  @ApiProperty({ 
    description: 'Référence vers le score crédit complet associé',
    required: false
  })
  @Column('uuid', { nullable: true })
  @Index()
  creditScoreId?: string;

  @ManyToOne(() => CompanyCreditScore, { nullable: true })
  @JoinColumn({ name: 'creditScoreId' })
  creditScore?: CompanyCreditScore;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Détermine le statut de santé basé sur le score
   */
  static determineHealthStatus(score: number): HealthStatus {
    if (score >= 91) return HealthStatus.EXCELLENT;
    if (score >= 71) return HealthStatus.GOOD;
    if (score >= 51) return HealthStatus.FAIR;
    if (score >= 31) return HealthStatus.POOR;
    return HealthStatus.CRITICAL;
  }

  /**
   * Calcule le changement par rapport à la période précédente
   */
  updatePeriodChange(previousScore: number): void {
    const change = this.score - previousScore;
    const changePercentage = previousScore > 0 ? (change / previousScore) * 100 : 0;
    
    let trend: string= 'stable';
    if (Math.abs(change) >= 3) {
      trend = change > 0 ? 'improving' : 'declining';
    }

    this.periodChange = {
      previousScore,
      change: Math.round(change),
      changePercentage: Math.round(changePercentage * 100) / 100,
      trend
    };
  }

  /**
   * Génère des alertes basées sur les seuils
   */
  generateAlerts(previousPeriod?: RealTimeCreditMonitoring): void {
    const alerts: any[] = [];

    // Alerte de chute de score
    if (previousPeriod && this.score < previousPeriod.score - 10) {
      alerts.push({
        type: 'score_drop',
        severity: this.score < previousPeriod.score - 20 ? 'critical' : 'high',
        message: `Chute significative du score crédit: ${previousPeriod.score} → ${this.score}`,
        threshold: previousPeriod.score - 10,
        actualValue: this.score
      });
    }

    // Alerte d'amélioration
    if (previousPeriod && this.score > previousPeriod.score + 15) {
      alerts.push({
        type: 'score_improvement',
        severity: 'low',
        message: `Amélioration notable du score crédit: ${previousPeriod.score} → ${this.score}`,
        threshold: previousPeriod.score + 15,
        actualValue: this.score
      });
    }

    // Alerte de flux de trésorerie
    if (this.periodCumulative.netCashFlow < 0) {
      alerts.push({
        type: 'cash_flow_alert',
        severity: Math.abs(this.periodCumulative.netCashFlow) > this.periodCumulative.totalInflows * 0.5 ? 'critical' : 'medium',
        message: `Flux de trésorerie négatif: ${this.periodCumulative.netCashFlow}`,
        threshold: 0,
        actualValue: this.periodCumulative.netCashFlow
      });
    }

    // Alerte de stabilité
    if (this.scoreComponents.businessStability < 40) {
      alerts.push({
        type: 'stability_warning',
        severity: this.scoreComponents.businessStability < 25 ? 'critical' : 'medium',
        message: `Stabilité commerciale faible: ${this.scoreComponents.businessStability}/100`,
        threshold: 40,
        actualValue: this.scoreComponents.businessStability
      });
    }

    this.alerts = alerts.length > 0 ? alerts : undefined;
  }

  /**
   * Retourne la période suivante basée sur l'intervalle
   */
  getNextPeriod(): { start: Date; end: Date } {
    const start = new Date(this.periodEnd.getTime() + 1);
    let end: Date;

    switch (this.interval) {
      case CreditScoreInterval.DAILY:
        end = new Date(start);
        end.setDate(end.getDate() + 1);
        end.setMilliseconds(end.getMilliseconds() - 1);
        break;
      
      case CreditScoreInterval.WEEKLY:
        end = new Date(start);
        end.setDate(end.getDate() + 7);
        end.setMilliseconds(end.getMilliseconds() - 1);
        break;
      
      case CreditScoreInterval.MONTHLY:
        end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        end.setMilliseconds(end.getMilliseconds() - 1);
        break;
      
      case CreditScoreInterval.QUARTERLY:
        end = new Date(start);
        end.setMonth(end.getMonth() + 3);
        end.setMilliseconds(end.getMilliseconds() - 1);
        break;
      
      case CreditScoreInterval.YEARLY:
        end = new Date(start);
        end.setFullYear(end.getFullYear() + 1);
        end.setMilliseconds(end.getMilliseconds() - 1);
        break;
      
      default:
        end = new Date(start);
        end.setDate(end.getDate() + 1);
        end.setMilliseconds(end.getMilliseconds() - 1);
    }

    return { start, end };
  }

  /**
   * Vérifie si la période est critique et nécessite une intervention
   */
  isCriticalPeriod(): boolean {
    return this.healthStatus === HealthStatus.CRITICAL || 
           (this.alerts && this.alerts.some(alert => alert.severity === 'critical')) || false;
  }

  /**
   * Retourne un résumé de la santé pour cette période
   */
  getHealthSummary(): string {
    const trend = this.periodChange?.trend || 'stable';
    const trendText = trend === 'improving' ? '📈 En amélioration' : 
                     trend === 'declining' ? '📉 En déclin' : '➡️ Stable';
    
    return `Score: ${this.score}/100 | Santé: ${this.healthStatus} | ${trendText}`;
  }
}