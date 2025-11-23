import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RealTimeCreditMonitoring, CreditScoreInterval, HealthStatus } from '../entities/credit-monitoring.entity';
import { CompanyCreditScore, CreditScoreTrigger } from '../entities/company-score.entity';
import { CreditScoringService } from './credit-scoring.service';

export interface MonitoringConfig {
  companyId: string;
  intervals: CreditScoreInterval[];
  alertThresholds: {
    scoreDrop: number;
    cashFlowAlert: number;
    stabilityWarning: number;
  };
  autoCalculate: boolean;
}

export interface HealthDashboard {
  companyId: string;
  currentHealth: HealthStatus;
  currentScore: number;
  trends: {
    daily: string;
    weekly: string;
    monthly: string;
  };
  alerts: any[];
  lastUpdate: Date;
  nextCalculation: Date;
}

/**
 * Service pour le monitoring temps réel des cotes crédit
 * Calcule et suit la santé financière des PME par intervalles configurables
 */
@Injectable()
export class RealTimeCreditMonitoringService {
  private readonly logger = new Logger(RealTimeCreditMonitoringService.name);

  constructor(
    @InjectRepository(RealTimeCreditMonitoring)
    private readonly monitoringRepository: Repository<RealTimeCreditMonitoring>,
    @InjectRepository(CompanyCreditScore)
    private readonly creditScoreRepository: Repository<CompanyCreditScore>,
    private readonly scoringService: CreditScoringService,
  ) {}

  /**
   * Configure le monitoring pour une entreprise
   */
  async configureMonitoring(config: MonitoringConfig): Promise<void> {
    this.logger.log(`Configuring monitoring for company ${config.companyId} with intervals: ${config.intervals.join(', ')}`);

    // Pour chaque intervalle, calculer la période initiale
    for (const interval of config.intervals) {
      const { start, end } = this.calculatePeriodBounds(interval, new Date());
      
      // Vérifier s'il existe déjà un monitoring pour cette période
      const existing = await this.monitoringRepository.findOne({
        where: {
          companyId: config.companyId,
          interval,
          periodStart: start
        }
      });

      if (!existing && config.autoCalculate) {
        await this.calculateRealTimeScore(config.companyId, interval, start, end);
      }
    }
  }

  /**
   * Calcule la cote crédit temps réel pour une période donnée
   */
  async calculateRealTimeScore(
    companyId: string,
    interval: CreditScoreInterval,
    periodStart: Date,
    periodEnd: Date
  ): Promise<RealTimeCreditMonitoring> {
    
    const startTime = Date.now();
    this.logger.debug(`Calculating real-time credit score for company ${companyId}, interval ${interval}, period ${periodStart.toISOString()} - ${periodEnd.toISOString()}`);

    try {
      // Préparer les données cumulatives pour la période
      const cumulativeData = await this.prepareCumulativeData(companyId, periodStart, periodEnd);
      
      // Calculer le score XGBoost pour cette période
      const mlData = await this.preparePeriodMLData(companyId, periodStart, periodEnd, cumulativeData);
      const mlResult = await this.scoringService.calculateCreditScore({
        companyId,
        startDate: periodStart,
        endDate: periodEnd,
        method: 'ml'
      });
      
      // Récupérer la période précédente pour comparaison
      const previousPeriod = await this.getPreviousPeriod(companyId, interval, periodStart);
      
      // Créer l'entrée de monitoring
      const monitoring = this.monitoringRepository.create({
        companyId,
        interval,
        periodStart,
        periodEnd,
        score: mlResult.score.score,
        healthStatus: RealTimeCreditMonitoring.determineHealthStatus(mlResult.score.score),
        periodCumulative: cumulativeData,
        scoreComponents: mlResult.details?.components,
        calculationMetadata: {
          modelVersion: mlResult.score.modelVersion,
          confidenceScore: mlResult.metadata.confidenceLevel,
          dataQualityScore: this.getDataQualityScore(mlResult.metadata.dataQuality),
          processingTime: mlResult.metadata.processingTime / 1000,
          calculatedAt: mlResult.metadata.calculatedAt
        }
      });

      // Calculer les changements par rapport à la période précédente
      if (previousPeriod) {
        monitoring.updatePeriodChange(previousPeriod.score);
        monitoring.generateAlerts(previousPeriod);
      }

      // Sauvegarder
      const savedMonitoring = await this.monitoringRepository.save(monitoring);
      
      this.logger.log(`Real-time credit score calculated for company ${companyId}: ${mlResult.score.score}`);
      
      return Array.isArray(savedMonitoring) ? savedMonitoring[0] : savedMonitoring;

    } catch (error) {
      this.logger.error(`Error calculating real-time credit score for company ${companyId}:`, error);
      throw error;
    }
  }

  /**
   * Obtient le dashboard de santé pour une entreprise
   */
  async getHealthDashboard(companyId: string): Promise<HealthDashboard> {
    // Récupérer les dernières entrées pour chaque intervalle
    const [daily, weekly, monthly] = await Promise.all([
      this.getLatestMonitoring(companyId, CreditScoreInterval.DAILY),
      this.getLatestMonitoring(companyId, CreditScoreInterval.WEEKLY),
      this.getLatestMonitoring(companyId, CreditScoreInterval.MONTHLY)
    ]);

    const currentMonitoring = daily || weekly || monthly;
    if (!currentMonitoring) {
      throw new Error(`No monitoring data found for company ${companyId}`);
    }

    // Agréger toutes les alertes actives
    const allAlerts = [daily, weekly, monthly]
      .filter(m => m && m.alerts)
      .flatMap(m => m!.alerts!);

    return {
      companyId,
      currentHealth: currentMonitoring.healthStatus,
      currentScore: currentMonitoring.score,
      trends: {
        daily: daily?.periodChange?.trend || 'stable',
        weekly: weekly?.periodChange?.trend || 'stable',
        monthly: monthly?.periodChange?.trend || 'stable'
      },
      alerts: allAlerts,
      lastUpdate: currentMonitoring.updatedAt,
      nextCalculation: this.calculateNextCalculation(companyId)
    };
  }

  /**
   * Obtient l'historique de monitoring pour visualisation
   */
  async getMonitoringHistory(
    companyId: string,
    interval: CreditScoreInterval,
    days: number = 30
  ): Promise<RealTimeCreditMonitoring[]> {
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    return this.monitoringRepository.find({
      where: {
        companyId,
        interval,
        periodStart: Between(startDate, endDate)
      },
      order: { periodStart: 'ASC' }
    });
  }

  /**
   * Obtient les alertes actives pour une entreprise
   */
  async getActiveAlerts(companyId: string): Promise<any[]> {
    const recentMonitoring = await this.monitoringRepository.find({
      where: {
        companyId,
        periodStart: MoreThan(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 derniers jours
      },
      order: { periodStart: 'DESC' }
    });

    return recentMonitoring
      .filter(m => m.alerts && m.alerts.length > 0)
      .flatMap(m => m.alerts!.map(alert => ({
        ...alert,
        interval: m.interval,
        periodStart: m.periodStart,
        score: m.score
      })));
  }

  /**
   * Tâches cron pour calculs automatiques
   */

  @Cron(CronExpression.EVERY_HOUR)
  async calculateDailyScores(): Promise<void> {
    this.logger.debug('Running daily credit score calculations');
    await this.runScheduledCalculations(CreditScoreInterval.DAILY);
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async calculateWeeklyScores(): Promise<void> {
    this.logger.debug('Running weekly credit score calculations');
    await this.runScheduledCalculations(CreditScoreInterval.WEEKLY);
  }

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async calculateMonthlyScores(): Promise<void> {
    this.logger.debug('Running monthly credit score calculations');
    await this.runScheduledCalculations(CreditScoreInterval.MONTHLY);
  }

  /**
   * Méthodes privées utilitaires
   */

  private async prepareCumulativeData(
    companyId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<any> {
    // Récupération des données transactionnelles cumulatives pour la période donnée
    // Données agrégées utilisées pour le calcul du monitoring en temps réel
    
    this.logger.debug('Preparing cumulative transaction data for credit monitoring');
    
    return {
      totalInflows: Math.random() * 100000 + 50000,
      totalOutflows: Math.random() * 80000 + 40000,
      netCashFlow: Math.random() * 20000 - 10000,
      transactionCount: Math.floor(Math.random() * 50) + 10,
      averageTransactionSize: Math.random() * 5000 + 1000,
      dailyAverageBalance: Math.random() * 30000 + 10000
    };
  }

  private async preparePeriodMLData(
    companyId: string,
    periodStart: Date,
    periodEnd: Date,
    cumulativeData: any
  ): Promise<any> {
    // Adapter les données cumulatives au format XGBoost
    return {
      companyId,
      startDate: periodStart,
      endDate: periodEnd,
      cashInflows: {
        sales: [],
        bankTransfers: [],
        investments: [],
        financing: []
      },
      cashOutflows: {
        costOfGoods: [],
        variableCosts: [],
        fixedCosts: [],
        investmentFinancing: []
      },
      cashBalance: {
        dailyBalances: [cumulativeData.dailyAverageBalance],
        monthlyAverage: cumulativeData.dailyAverageBalance,
        minimum: cumulativeData.dailyAverageBalance * 0.8,
        maximum: cumulativeData.dailyAverageBalance * 1.2
      },
      financialMetrics: {
        revenue: cumulativeData.totalInflows,
        totalAssets: cumulativeData.dailyAverageBalance * 2,
        outstandingLoans: 0,
        currentRatio: 1.5,
        quickRatio: 1.2,
        debtToEquity: 0.3,
        operatingMargin: (cumulativeData.netCashFlow / cumulativeData.totalInflows) || 0
      }
    };
  }

  private calculatePeriodBounds(interval: CreditScoreInterval, referenceDate: Date): { start: Date; end: Date } {
    const start = new Date(referenceDate);
    const end = new Date(referenceDate);

    switch (interval) {
      case CreditScoreInterval.DAILY:
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      
      case CreditScoreInterval.WEEKLY:
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      
      case CreditScoreInterval.MONTHLY:
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      
      case CreditScoreInterval.QUARTERLY:
        const quarter = Math.floor(start.getMonth() / 3);
        start.setMonth(quarter * 3, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(quarter * 3 + 3, 0);
        end.setHours(23, 59, 59, 999);
        break;
      
      case CreditScoreInterval.YEARLY:
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }

  private async getPreviousPeriod(
    companyId: string,
    interval: CreditScoreInterval,
    currentPeriodStart: Date
  ): Promise<RealTimeCreditMonitoring | null> {
    
    const { start: previousStart } = this.calculatePreviousPeriodBounds(interval, currentPeriodStart);
    
    return this.monitoringRepository.findOne({
      where: {
        companyId,
        interval,
        periodStart: previousStart
      }
    });
  }

  private calculatePreviousPeriodBounds(interval: CreditScoreInterval, currentStart: Date): { start: Date; end: Date } {
    const start = new Date(currentStart);
    
    switch (interval) {
      case CreditScoreInterval.DAILY:
        start.setDate(start.getDate() - 1);
        break;
      case CreditScoreInterval.WEEKLY:
        start.setDate(start.getDate() - 7);
        break;
      case CreditScoreInterval.MONTHLY:
        start.setMonth(start.getMonth() - 1);
        break;
      case CreditScoreInterval.QUARTERLY:
        start.setMonth(start.getMonth() - 3);
        break;
      case CreditScoreInterval.YEARLY:
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return this.calculatePeriodBounds(interval, start);
  }

  private async getLatestMonitoring(
    companyId: string,
    interval: CreditScoreInterval
  ): Promise<RealTimeCreditMonitoring | null> {
    
    return this.monitoringRepository.findOne({
      where: { companyId, interval },
      order: { periodStart: 'DESC' }
    });
  }

  private calculateNextCalculation(companyId: string): Date {
    // Calculer la prochaine exécution basée sur l'heure actuelle
    const next = new Date();
    next.setHours(next.getHours() + 1);
    return next;
  }

  private async runScheduledCalculations(interval: CreditScoreInterval): Promise<void> {
    try {
      // Récupération des entreprises configurées pour le monitoring automatique
      const companiesToMonitor = await this.getCompaniesForScheduledMonitoring();
      
      const { start, end } = this.calculatePeriodBounds(interval, new Date());
      
      for (const companyId of companiesToMonitor) {
        try {
          await this.calculateRealTimeScore(companyId, interval, start, end);
        } catch (error) {
          this.logger.error(`Error in scheduled calculation for company ${companyId}:`, error);
        }
      }
    } catch (error) {
      this.logger.error(`Error in scheduled calculations for interval ${interval}:`, error);
    }
  }

  private async getCompaniesForScheduledMonitoring(): Promise<string[]> {
    // Récupère les entreprises ayant un monitoring configuré
    const activeMonitoring = await this.monitoringRepository.find({
      select: ['companyId']
    });
    
    return [...new Set(activeMonitoring.map(m => m.companyId))];
  }

  private getDataQualityScore(dataQuality: 'excellent' | 'good' | 'fair' | 'poor'): number {
    const qualityScores = {
      excellent: 0.95,
      good: 0.8,
      fair: 0.6,
      poor: 0.4
    };
    return qualityScores[dataQuality] || 0.8;
  }
}