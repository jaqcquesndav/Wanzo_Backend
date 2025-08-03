import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { FraudAlert, FraudType, AlertStatus, AlertSeverity } from '../entities/fraud-alert.entity';
import * as _ from 'lodash';

export interface TransactionData {
  id: string;
  entityId: string;
  entityType: string;
  entityName?: string;
  amount: number;
  timestamp: Date;
  paymentMethod: string;
  location?: {
    province?: string;
    city?: string;
  };
  counterpart?: {
    id: string;
    name: string;
    type: string;
  };
  metadata?: Record<string, any>;
}

export interface AnomalyDetectionResult {
  isAnomalous: boolean;
  score: number;
  indicators: string[];
  evidence: Record<string, any>;
  confidence: number;
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  constructor(
    @InjectRepository(FraudAlert)
    private fraudAlertRepository: Repository<FraudAlert>
  ) {}

  /**
   * Analyse une transaction pour détecter des patterns de fraude
   */
  async analyzeTransaction(transaction: TransactionData): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = [];

    try {
      this.logger.log(`Analyzing transaction ${transaction.id} for fraud patterns`);

      // 1. Détection de montants anormaux
      const amountAnomaly = await this.detectAmountAnomaly(transaction);
      if (amountAnomaly.isAnomalous) {
        alerts.push(await this.createAlert(
          transaction,
          FraudType.UNUSUAL_TRANSACTION,
          amountAnomaly.score,
          'Montant de transaction significativement anormal par rapport à l\'historique',
          amountAnomaly.evidence,
          amountAnomaly.indicators
        ));
      }

      // 2. Détection de patterns temporels suspects
      const timePatternAnomaly = await this.detectTimePatternAnomaly(transaction);
      if (timePatternAnomaly.isAnomalous) {
        alerts.push(await this.createAlert(
          transaction,
          FraudType.UNUSUAL_TRANSACTION,
          timePatternAnomaly.score,
          'Pattern temporel inhabituel détecté',
          timePatternAnomaly.evidence,
          timePatternAnomaly.indicators
        ));
      }

      // 3. Détection de transactions en rafale
      const velocityAnomaly = await this.detectVelocityAnomaly(transaction);
      if (velocityAnomaly.isAnomalous) {
        alerts.push(await this.createAlert(
          transaction,
          FraudType.PAYMENT_FRAUD,
          velocityAnomaly.score,
          'Volume de transactions anormalement élevé',
          velocityAnomaly.evidence,
          velocityAnomaly.indicators
        ));
      }

      // 4. Détection de patterns géographiques suspects
      const locationAnomaly = await this.detectLocationAnomaly(transaction);
      if (locationAnomaly.isAnomalous) {
        alerts.push(await this.createAlert(
          transaction,
          FraudType.IDENTITY_FRAUD,
          locationAnomaly.score,
          'Localisation géographique suspecte',
          locationAnomaly.evidence,
          locationAnomaly.indicators
        ));
      }

      // 5. Détection de blanchiment potentiel
      const launderingAnomaly = await this.detectMoneyLaunderingPattern(transaction);
      if (launderingAnomaly.isAnomalous) {
        alerts.push(await this.createAlert(
          transaction,
          FraudType.MONEY_LAUNDERING,
          launderingAnomaly.score,
          'Pattern potentiel de blanchiment d\'argent',
          launderingAnomaly.evidence,
          launderingAnomaly.indicators
        ));
      }

      this.logger.log(`Fraud analysis completed for transaction ${transaction.id}. ${alerts.length} alerts generated.`);
      return alerts;

    } catch (error) {
      this.logger.error(`Error analyzing transaction ${transaction.id}:`, error);
      return [];
    }
  }

  /**
   * Détecte les anomalies de montant basées sur l'historique
   */
  private async detectAmountAnomaly(transaction: TransactionData): Promise<AnomalyDetectionResult> {
    try {
      // Récupération de l'historique des transactions (simulation)
      const historicalAmounts = await this.getHistoricalAmounts(transaction.entityId);
      
      if (historicalAmounts.length < 5) {
        return {
          isAnomalous: false,
          score: 0,
          indicators: [],
          evidence: { reason: 'Historique insuffisant' },
          confidence: 0.1
        };
      }

      // Calcul des statistiques
      const mean = _.mean(historicalAmounts);
      const stdDev = this.calculateStandardDeviation(historicalAmounts);
      const median = this.calculateMedian(historicalAmounts);
      const q75 = this.calculatePercentile(historicalAmounts, 0.75);
      const q95 = this.calculatePercentile(historicalAmounts, 0.95);

      // Z-score pour détecter les outliers
      const zScore = Math.abs((transaction.amount - mean) / stdDev);
      
      // Score d'anomalie (0-1)
      let anomalyScore = 0;
      const indicators: string[] = [];

      // Critères multiples de détection
      if (zScore > 3) {
        anomalyScore += 0.4;
        indicators.push('z_score_extreme');
      } else if (zScore > 2.5) {
        anomalyScore += 0.3;
        indicators.push('z_score_high');
      }

      // Montant très supérieur au 95e percentile
      if (transaction.amount > q95 * 2) {
        anomalyScore += 0.3;
        indicators.push('amount_far_above_p95');
      } else if (transaction.amount > q95) {
        anomalyScore += 0.2;
        indicators.push('amount_above_p95');
      }

      // Montant anormalement rond (peut indiquer une fraude)
      if (this.isRoundNumber(transaction.amount) && transaction.amount > mean * 3) {
        anomalyScore += 0.2;
        indicators.push('suspicious_round_amount');
      }

      const isAnomalous = anomalyScore >= 0.6;

      return {
        isAnomalous,
        score: Math.min(anomalyScore, 1),
        indicators,
        evidence: {
          currentAmount: transaction.amount,
          historicalMean: Math.round(mean),
          historicalMedian: Math.round(median),
          standardDeviation: Math.round(stdDev),
          zScore: Math.round(zScore * 100) / 100,
          percentile95: Math.round(q95),
          historicalDataPoints: historicalAmounts.length
        },
        confidence: Math.min(historicalAmounts.length / 30, 1) // Plus d'historique = plus de confiance
      };

    } catch (error) {
      this.logger.error('Error in amount anomaly detection:', error);
      return {
        isAnomalous: false,
        score: 0,
        indicators: ['detection_error'],
        evidence: { error: error instanceof Error ? error.message : 'Unknown error' },
        confidence: 0
      };
    }
  }

  /**
   * Détecte les patterns temporels suspects
   */
  private async detectTimePatternAnomaly(transaction: TransactionData): Promise<AnomalyDetectionResult> {
    const indicators: string[] = [];
    let anomalyScore = 0;

    // Heure de la transaction
    const hour = transaction.timestamp.getHours();
    const dayOfWeek = transaction.timestamp.getDay(); // 0 = Dimanche

    // Transactions en dehors des heures normales
    if (hour < 6 || hour > 22) {
      anomalyScore += 0.3;
      indicators.push('unusual_hour');
    }

    // Transactions le dimanche ou jours fériés
    if (dayOfWeek === 0) {
      anomalyScore += 0.2;
      indicators.push('sunday_transaction');
    }

    // Weekend pour transactions business importantes
    if ((dayOfWeek === 0 || dayOfWeek === 6) && transaction.amount > 1000000) {
      anomalyScore += 0.3;
      indicators.push('large_weekend_transaction');
    }

    // Patterns de timing suspects (à améliorer avec ML)
    const recentTransactions = await this.getRecentTransactions(transaction.entityId, 24); // 24h
    if (recentTransactions.length > 10) {
      anomalyScore += 0.4;
      indicators.push('high_frequency');
    }

    const isAnomalous = anomalyScore >= 0.5;

    return {
      isAnomalous,
      score: anomalyScore,
      indicators,
      evidence: {
        transactionHour: hour,
        dayOfWeek: dayOfWeek,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        recentTransactionCount: recentTransactions.length
      },
      confidence: 0.7
    };
  }

  /**
   * Détecte les anomalies de vélocité (trop de transactions)
   */
  private async detectVelocityAnomaly(transaction: TransactionData): Promise<AnomalyDetectionResult> {
    const indicators: string[] = [];
    let anomalyScore = 0;

    // Transactions dans différentes fenêtres temporelles
    const transactionsLast1h = await this.getRecentTransactions(transaction.entityId, 1);
    const transactionsLast24h = await this.getRecentTransactions(transaction.entityId, 24);
    const transactionsLast7d = await this.getRecentTransactions(transaction.entityId, 24 * 7);

    // Seuils basés sur des patterns typiques
    if (transactionsLast1h.length > 5) {
      anomalyScore += 0.5;
      indicators.push('high_velocity_1h');
    }

    if (transactionsLast24h.length > 20) {
      anomalyScore += 0.4;
      indicators.push('high_velocity_24h');
    }

    // Volume total anormal
    const totalAmountLast24h = transactionsLast24h.reduce((sum, t) => sum + t.amount, 0);
    const avgDailyAmount = transactionsLast7d.length > 0 
      ? transactionsLast7d.reduce((sum, t) => sum + t.amount, 0) / 7 
      : 0;

    if (avgDailyAmount > 0 && totalAmountLast24h > avgDailyAmount * 5) {
      anomalyScore += 0.4;
      indicators.push('volume_spike');
    }

    const isAnomalous = anomalyScore >= 0.6;

    return {
      isAnomalous,
      score: Math.min(anomalyScore, 1),
      indicators,
      evidence: {
        transactionsLast1h: transactionsLast1h.length,
        transactionsLast24h: transactionsLast24h.length,
        totalAmountLast24h,
        avgDailyAmount: Math.round(avgDailyAmount)
      },
      confidence: 0.8
    };
  }

  /**
   * Détecte les anomalies géographiques
   */
  private async detectLocationAnomaly(transaction: TransactionData): Promise<AnomalyDetectionResult> {
    if (!transaction.location?.province) {
      return {
        isAnomalous: false,
        score: 0,
        indicators: [],
        evidence: { reason: 'Pas de données de localisation' },
        confidence: 0
      };
    }

    const indicators: string[] = [];
    let anomalyScore = 0;

    // Provinces à haut risque
    const highRiskProvinces = ['Nord-Kivu', 'Sud-Kivu', 'Ituri'];
    if (highRiskProvinces.includes(transaction.location.province)) {
      anomalyScore += 0.3;
      indicators.push('high_risk_province');
    }

    // Changement soudain de localisation (à implémenter avec l'historique)
    const recentLocations = await this.getRecentTransactionLocations(transaction.entityId);
    if (recentLocations.length > 0 && !recentLocations.includes(transaction.location.province)) {
      anomalyScore += 0.4;
      indicators.push('location_change');
    }

    const isAnomalous = anomalyScore >= 0.5;

    return {
      isAnomalous,
      score: anomalyScore,
      indicators,
      evidence: {
        currentProvince: transaction.location.province,
        recentLocations,
        isHighRiskArea: highRiskProvinces.includes(transaction.location.province)
      },
      confidence: 0.6
    };
  }

  /**
   * Détecte les patterns de blanchiment d'argent
   */
  private async detectMoneyLaunderingPattern(transaction: TransactionData): Promise<AnomalyDetectionResult> {
    const indicators: string[] = [];
    let anomalyScore = 0;

    // Montants juste en dessous des seuils de déclaration
    const declarationThreshold = 10000000; // 10M CDF exemple
    if (transaction.amount > declarationThreshold * 0.9 && 
        transaction.amount < declarationThreshold) {
      anomalyScore += 0.4;
      indicators.push('structuring_threshold');
    }

    // Transactions rondes répétitives
    let recentRoundTransactions: any[] = [];
    if (this.isRoundNumber(transaction.amount)) {
      recentRoundTransactions = await this.getRecentRoundTransactions(transaction.entityId);
      if (recentRoundTransactions.length > 3) {
        anomalyScore += 0.3;
        indicators.push('repetitive_round_amounts');
      }
    }

    // Pattern de smurfing (nombreuses petites transactions)
    const recentSmallTransactions = await this.getRecentSmallTransactions(
      transaction.entityId, 
      declarationThreshold * 0.1
    );
    if (recentSmallTransactions.length > 10) {
      anomalyScore += 0.5;
      indicators.push('smurfing_pattern');
    }

    const isAnomalous = anomalyScore >= 0.6;

    return {
      isAnomalous,
      score: Math.min(anomalyScore, 1),
      indicators,
      evidence: {
        amount: transaction.amount,
        declarationThreshold,
        isNearThreshold: Math.abs(transaction.amount - declarationThreshold) / declarationThreshold < 0.1,
        recentRoundTransactions: recentRoundTransactions.length,
        recentSmallTransactions: recentSmallTransactions.length
      },
      confidence: 0.7
    };
  }

  /**
   * Crée une alerte de fraude
   */
  private async createAlert(
    transaction: TransactionData,
    fraudType: FraudType,
    riskScore: number,
    description: string,
    evidence: Record<string, any>,
    indicators: string[]
  ): Promise<FraudAlert> {
    const severity = FraudAlert.determineSeverity(riskScore);
    
    const alert = new FraudAlert();
    alert.entityId = transaction.entityId;
    alert.entityType = transaction.entityType;
    alert.entityName = transaction.entityName;
    alert.fraudType = fraudType;
    alert.severity = severity;
    alert.riskScore = Math.round(riskScore * 1000) / 1000; // 3 décimales
    alert.threshold = this.getThresholdForFraudType(fraudType);
    alert.description = description;
    alert.evidence = {
      indicators,
      suspiciousPatterns: [evidence],
      relatedEntities: transaction.counterpart ? [transaction.counterpart.id] : [],
      confidence: evidence.confidence || 0.7,
      detectionMethod: 'ml_statistical_analysis',
      anomalyScore: riskScore
    };
    alert.recommendedActions = this.generateRecommendedActions(fraudType, severity);
    alert.province = transaction.location?.province;
    alert.metadata = {
      transactionAmount: transaction.amount,
      transactionTime: transaction.timestamp,
      paymentMethod: transaction.paymentMethod,
      detectionTime: new Date()
    };

    return this.fraudAlertRepository.save(alert);
  }

  /**
   * Obtient le seuil de déclenchement pour un type de fraude
   */
  private getThresholdForFraudType(fraudType: FraudType): number {
    const thresholds = {
      [FraudType.UNUSUAL_TRANSACTION]: 0.6,
      [FraudType.MONEY_LAUNDERING]: 0.7,
      [FraudType.PAYMENT_FRAUD]: 0.6,
      [FraudType.IDENTITY_FRAUD]: 0.5,
      [FraudType.COLLUSION]: 0.8,
      [FraudType.DOCUMENT_FRAUD]: 0.7,
      [FraudType.ACCOUNT_TAKEOVER]: 0.8,
      [FraudType.FAKE_BUSINESS]: 0.9
    };

    return thresholds[fraudType] || 0.6;
  }

  /**
   * Génère des actions recommandées basées sur le type et la sévérité
   */
  private generateRecommendedActions(fraudType: FraudType, severity: AlertSeverity): string[] {
    const baseActions = [
      'Examiner la transaction en détail',
      'Vérifier l\'identité du client',
      'Consulter l\'historique des transactions'
    ];

    const typeSpecificActions = {
      [FraudType.UNUSUAL_TRANSACTION]: [
        'Contacter le client pour confirmation',
        'Vérifier la source des fonds'
      ],
      [FraudType.MONEY_LAUNDERING]: [
        'Signaler aux autorités compétentes',
        'Geler temporairement les comptes',
        'Analyser le réseau de transactions'
      ],
      [FraudType.PAYMENT_FRAUD]: [
        'Bloquer la transaction',
        'Vérifier les méthodes de paiement'
      ]
    };

    const severityActions = {
      [AlertSeverity.CRITICAL]: [
        'Escalader immédiatement',
        'Notifier la direction',
        'Activation du protocole d\'urgence'
      ],
      [AlertSeverity.HIGH]: [
        'Traitement prioritaire',
        'Notification dans l\'heure'
      ]
    };

    return [
      ...baseActions,
      ...(typeSpecificActions[fraudType] || []),
      ...(severityActions[severity] || [])
    ];
  }

  // Méthodes utilitaires (à implémenter avec les vraies données)
  
  private async getHistoricalAmounts(entityId: string): Promise<number[]> {
    // Simulation - à remplacer par une vraie requête
    return [100000, 150000, 120000, 200000, 180000, 90000, 300000];
  }

  private async getRecentTransactions(entityId: string, hoursBack: number): Promise<any[]> {
    // Simulation - à remplacer par une vraie requête
    return [];
  }

  private async getRecentTransactionLocations(entityId: string): Promise<string[]> {
    // Simulation
    return ['Kinshasa', 'Bas-Congo'];
  }

  private async getRecentRoundTransactions(entityId: string): Promise<any[]> {
    // Simulation
    return [];
  }

  private async getRecentSmallTransactions(entityId: string, threshold: number): Promise<any[]> {
    // Simulation
    return [];
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = _.mean(values);
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return Math.sqrt(_.mean(squaredDiffs));
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = percentile * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sorted[lower];
    }
    
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  private isRoundNumber(amount: number): boolean {
    // Considère comme "rond" les multiples de 100000 (100K XOF)
    return amount % 100000 === 0 && amount > 0;
  }

  /**
   * Récupère les alertes actives
   */
  async getActiveAlerts(limit: number = 50): Promise<FraudAlert[]> {
    return this.fraudAlertRepository.find({
      where: { status: AlertStatus.ACTIVE },
      order: { createdAt: 'DESC', severity: 'DESC' },
      take: limit
    });
  }

  /**
   * Met à jour le statut d'une alerte
   */
  async updateAlertStatus(alertId: string, status: AlertStatus, userId?: string): Promise<FraudAlert> {
    const alert = await this.fraudAlertRepository.findOne({ where: { id: alertId } });
    
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.status = status;
    
    if (status === AlertStatus.INVESTIGATING && userId) {
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date();
    }
    
    if (status === AlertStatus.RESOLVED || status === AlertStatus.FALSE_POSITIVE) {
      alert.resolvedAt = new Date();
    }

    return this.fraudAlertRepository.save(alert);
  }
}
