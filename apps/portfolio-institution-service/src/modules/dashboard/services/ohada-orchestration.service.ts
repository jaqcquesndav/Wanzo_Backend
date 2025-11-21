import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OHADAMetric, OHADASnapshot, MetricType, CalculationStatus } from '../entities/ohada-metric.entity';
import { OHADACalculatorService } from '../calculators/ohada-calculator.service';
import { Portfolio } from '../../portfolios/entities/portfolio.entity';
import { 
  OHADAMetrics, 
  OHADAMetricsResponse, 
  RiskLevel, 
  RiskRating, 
  RegulatoryCompliance,
  ComplianceStatus,
  RegulatoryFramework 
} from '../interfaces/dashboard.interface';

export interface MetricCalculationJob {
  portfolioId: string;
  institutionId: string;
  metricTypes: MetricType[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  scheduledAt: Date;
}

@Injectable()
export class OHADAOrchestrationService {
  private readonly logger = new Logger(OHADAOrchestrationService.name);
  private calculationQueue: MetricCalculationJob[] = [];
  private isProcessing = false;

  constructor(
    @InjectRepository(OHADAMetric)
    private metricRepository: Repository<OHADAMetric>,
    @InjectRepository(OHADASnapshot)
    private snapshotRepository: Repository<OHADASnapshot>,
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    private ohadaCalculator: OHADACalculatorService,
  ) {}

  /**
   * Service principal pour obtenir les métriques OHADA
   */
  async getOHADAMetricsForInstitution(institutionId: string): Promise<OHADAMetricsResponse> {
    this.logger.log(`Récupération des métriques OHADA pour l'institution ${institutionId}`);

    // 1. Vérifier si nous avons des snapshots récents
    const recentSnapshots = await this.getRecentSnapshots(institutionId);
    
    if (recentSnapshots.length > 0) {
      this.logger.log(`Utilisation des snapshots en cache (${recentSnapshots.length} portfolios)`);
      return this.buildResponseFromSnapshots(recentSnapshots);
    }

    // 2. Si pas de cache, calculer en temps réel
    this.logger.log('Calcul des métriques en temps réel');
    return this.calculateRealTimeMetrics(institutionId);
  }

  /**
   * Calculer les métriques pour un portefeuille spécifique
   */
  async calculatePortfolioMetrics(portfolioId: string): Promise<OHADAMetrics> {
    this.logger.log(`Calcul des métriques pour le portefeuille ${portfolioId}`);

    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId }
    });

    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} not found`);
    }

    const calculationDate = new Date();
    const periodStart = new Date(calculationDate.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 an

    // Calculer toutes les métriques en parallèle
    const [
      nplResult,
      provisionResult,
      collectionResult,
      balanceAge,
      roa
    ] = await Promise.all([
      this.ohadaCalculator.calculateNPLRatio(portfolioId, calculationDate),
      this.ohadaCalculator.calculateProvisionRate(portfolioId, calculationDate),
      this.ohadaCalculator.calculateCollectionEfficiency(portfolioId, periodStart, calculationDate),
      this.ohadaCalculator.calculateBalanceAge(portfolioId, calculationDate),
      this.ohadaCalculator.calculateROA(portfolioId, periodStart, calculationDate)
    ]);

    // Sauvegarder les métriques calculées
    await this.saveCalculatedMetrics(portfolio.institution_id, portfolioId, {
      nplResult,
      provisionResult,
      collectionResult,
      balanceAge,
      roa
    }, calculationDate);

    // Construire la réponse OHADA
    const ohadaMetrics: OHADAMetrics = {
      id: portfolioId,
      name: portfolio.name,
      sector: portfolio.target_sectors?.[0] || 'PME',
      totalAmount: Number(portfolio.total_amount),
      activeContracts: await this.getActiveContractsCount(portfolioId),
      avgLoanSize: await this.calculateAverageLoanSize(portfolioId),
      nplRatio: nplResult.nplRatio,
      provisionRate: provisionResult.provisionRate,
      collectionEfficiency: collectionResult.efficiency,
      balanceAGE: balanceAge,
      roa,
      portfolioYield: await this.calculatePortfolioYield(portfolioId, periodStart, calculationDate),
      riskLevel: this.determineRiskLevel(nplResult.nplRatio, provisionResult.provisionRate),
      growthRate: await this.calculateGrowthRate(portfolioId, calculationDate),
      monthlyPerformance: await this.getMonthlyPerformance(portfolioId, calculationDate),
      lastActivity: calculationDate.toISOString(),
      regulatoryCompliance: this.assessRegulatoryCompliance(nplResult.nplRatio, provisionResult.provisionRate)
    };

    // Créer un snapshot pour le cache
    await this.createSnapshot(portfolio.institution_id, portfolioId, ohadaMetrics, calculationDate);

    return ohadaMetrics;
  }

  /**
   * Programmer un recalcul des métriques
   */
  async scheduleMetricCalculation(
    portfolioId: string, 
    institutionId: string, 
    priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'
  ): Promise<void> {
    const job: MetricCalculationJob = {
      portfolioId,
      institutionId,
      metricTypes: Object.values(MetricType),
      priority,
      scheduledAt: new Date()
    };

    this.calculationQueue.push(job);
    this.logger.log(`Job de calcul programmé pour le portefeuille ${portfolioId}`);

    // Traiter immédiatement si haute priorité
    if (priority === 'HIGH' && !this.isProcessing) {
      await this.processCalculationQueue();
    }
  }

  /**
   * Tâche cron pour recalculer les métriques quotidiennement
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyMetricsCalculation() {
    this.logger.log('Début du recalcul quotidien des métriques OHADA');

    try {
      // Récupérer tous les portfolios actifs
      const activePortfolios = await this.portfolioRepository.find({
        where: { status: 'active' as any }
      });

      // Programmer le calcul pour chaque portfolio
      for (const portfolio of activePortfolios) {
        await this.scheduleMetricCalculation(
          portfolio.id, 
          portfolio.institution_id, 
          'LOW'
        );
      }

      // Traiter la queue
      await this.processCalculationQueue();

      this.logger.log(`Recalcul terminé pour ${activePortfolios.length} portfolios`);
    } catch (error) {
      this.logger.error('Erreur lors du recalcul quotidien', error);
    }
  }

  /**
   * Nettoyer les anciennes métriques
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOldMetrics() {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 3); // Garder 3 mois

    const deletedMetrics = await this.metricRepository.delete({
      calculation_date: cutoffDate as any
    });

    const deletedSnapshots = await this.snapshotRepository.delete({
      snapshot_date: cutoffDate as any
    });

    this.logger.log(`Nettoyage: ${deletedMetrics.affected} métriques et ${deletedSnapshots.affected} snapshots supprimés`);
  }

  // ============ MÉTHODES PRIVÉES ============

  private async getRecentSnapshots(institutionId: string): Promise<OHADASnapshot[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return await this.snapshotRepository.find({
      where: {
        institution_id: institutionId,
        snapshot_date: yesterday as any
      }
    });
  }

  private async buildResponseFromSnapshots(snapshots: OHADASnapshot[]): Promise<OHADAMetricsResponse> {
    const metrics: OHADAMetrics[] = snapshots.map(snapshot => ({
      id: snapshot.portfolio_id || 'global',
      name: `Portfolio ${snapshot.portfolio_id}`,
      sector: 'PME',
      totalAmount: snapshot.performance_data.total_amount,
      activeContracts: snapshot.performance_data.active_contracts,
      avgLoanSize: snapshot.performance_data.avg_loan_size,
      nplRatio: snapshot.metrics_summary.npl_ratio,
      provisionRate: snapshot.metrics_summary.provision_rate,
      collectionEfficiency: snapshot.metrics_summary.collection_efficiency,
      balanceAGE: snapshot.balance_age,
      roa: snapshot.metrics_summary.roa,
      portfolioYield: snapshot.metrics_summary.portfolio_yield,
      riskLevel: snapshot.metrics_summary.risk_level as RiskLevel,
      growthRate: snapshot.performance_data.growth_rate,
      monthlyPerformance: snapshot.performance_data.monthly_performance,
      lastActivity: snapshot.created_at.toISOString(),
      regulatoryCompliance: {
        bceaoCompliant: snapshot.regulatory_compliance.bceao_compliant,
        ohadaProvisionCompliant: snapshot.regulatory_compliance.ohada_provision_compliant,
        riskRating: snapshot.regulatory_compliance.risk_rating as RiskRating
      }
    }));

    // Calculer les benchmarks
    const benchmarks = this.calculateBenchmarks(metrics);
    const complianceStatus = this.determineOverallCompliance(metrics);

    return {
      success: true,
      data: metrics,
      metadata: {
        totalPortfolios: metrics.length,
        calculationDate: new Date().toISOString(),
        regulatoryFramework: RegulatoryFramework.OHADA,
        complianceStatus
      },
      benchmarks
    };
  }

  private async calculateRealTimeMetrics(institutionId: string): Promise<OHADAMetricsResponse> {
    const portfolios = await this.portfolioRepository.find({
      where: { institution_id: institutionId }
    });

    const metricsPromises = portfolios.map(portfolio => 
      this.calculatePortfolioMetrics(portfolio.id)
    );
    
    const metrics = await Promise.all(metricsPromises);
    const benchmarks = this.calculateBenchmarks(metrics);
    const complianceStatus = this.determineOverallCompliance(metrics);

    return {
      success: true,
      data: metrics,
      metadata: {
        totalPortfolios: portfolios.length,
        calculationDate: new Date().toISOString(),
        regulatoryFramework: RegulatoryFramework.OHADA,
        complianceStatus
      },
      benchmarks
    };
  }

  private async saveCalculatedMetrics(
    institutionId: string,
    portfolioId: string,
    metrics: any,
    calculationDate: Date
  ): Promise<void> {
    const periodStart = new Date(calculationDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const metricEntries: Partial<OHADAMetric>[] = [
      {
        institution_id: institutionId,
        portfolio_id: portfolioId,
        metric_type: MetricType.NPL_RATIO,
        value: metrics.nplResult.nplRatio,
        details: metrics.nplResult.details,
        status: CalculationStatus.COMPLETED,
        calculation_date: calculationDate,
        period_start: periodStart,
        period_end: calculationDate
      },
      {
        institution_id: institutionId,
        portfolio_id: portfolioId,
        metric_type: MetricType.PROVISION_RATE,
        value: metrics.provisionResult.provisionRate,
        details: metrics.provisionResult.details,
        status: CalculationStatus.COMPLETED,
        calculation_date: calculationDate,
        period_start: periodStart,
        period_end: calculationDate
      },
      {
        institution_id: institutionId,
        portfolio_id: portfolioId,
        metric_type: MetricType.COLLECTION_EFFICIENCY,
        value: metrics.collectionResult.efficiency,
        details: metrics.collectionResult.details,
        status: CalculationStatus.COMPLETED,
        calculation_date: calculationDate,
        period_start: periodStart,
        period_end: calculationDate
      }
    ];

    await this.metricRepository.save(metricEntries);
  }

  private async createSnapshot(
    institutionId: string,
    portfolioId: string,
    metrics: OHADAMetrics,
    snapshotDate: Date
  ): Promise<void> {
    const snapshot = this.snapshotRepository.create({
      institution_id: institutionId,
      portfolio_id: portfolioId,
      metrics_summary: {
        npl_ratio: metrics.nplRatio,
        provision_rate: metrics.provisionRate,
        collection_efficiency: metrics.collectionEfficiency,
        roa: metrics.roa,
        portfolio_yield: metrics.portfolioYield,
        risk_level: metrics.riskLevel,
        compliance_status: metrics.regulatoryCompliance?.bceaoCompliant ? 'COMPLIANT' : 'NON_COMPLIANT'
      },
      balance_age: metrics.balanceAGE,
      regulatory_compliance: {
        bceao_compliant: metrics.regulatoryCompliance?.bceaoCompliant || false,
        ohada_provision_compliant: metrics.regulatoryCompliance?.ohadaProvisionCompliant || false,
        risk_rating: metrics.regulatoryCompliance?.riskRating || 'B'
      },
      performance_data: {
        monthly_performance: metrics.monthlyPerformance,
        growth_rate: metrics.growthRate,
        total_amount: metrics.totalAmount,
        active_contracts: metrics.activeContracts,
        avg_loan_size: metrics.avgLoanSize
      },
      snapshot_date: snapshotDate
    });

    await this.snapshotRepository.save(snapshot);
  }

  private async processCalculationQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.logger.log(`Traitement de ${this.calculationQueue.length} jobs en attente`);

    // Trier par priorité
    this.calculationQueue.sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    while (this.calculationQueue.length > 0) {
      const job = this.calculationQueue.shift()!;
      
      try {
        await this.calculatePortfolioMetrics(job.portfolioId);
        this.logger.log(`Job terminé pour le portefeuille ${job.portfolioId}`);
      } catch (error) {
        this.logger.error(`Erreur lors du calcul pour ${job.portfolioId}`, error);
      }
    }

    this.isProcessing = false;
  }

  // Méthodes utilitaires pour les calculs business...
  private determineRiskLevel(nplRatio: number, provisionRate: number): RiskLevel {
    if (nplRatio < 2 && provisionRate < 3) return RiskLevel.LOW;
    if (nplRatio < 5 && provisionRate < 5) return RiskLevel.MEDIUM;
    return RiskLevel.HIGH;
  }

  private assessRegulatoryCompliance(nplRatio: number, provisionRate: number): RegulatoryCompliance {
    return {
      bceaoCompliant: nplRatio < 5.0,
      ohadaProvisionCompliant: provisionRate >= 3.0 && provisionRate <= 5.0,
      riskRating: nplRatio < 2 ? RiskRating.A : nplRatio < 4 ? RiskRating.BBB : RiskRating.BB
    };
  }

  private calculateBenchmarks(metrics: OHADAMetrics[]) {
    const count = metrics.length;
    if (count === 0) {
      return {
        avgNplRatio: 0,
        avgProvisionRate: 0,
        avgROA: 0,
        avgYield: 0,
        collectionEfficiency: 0
      };
    }

    return {
      avgNplRatio: Number((metrics.reduce((sum, m) => sum + m.nplRatio, 0) / count).toFixed(1)),
      avgProvisionRate: Number((metrics.reduce((sum, m) => sum + m.provisionRate, 0) / count).toFixed(1)),
      avgROA: Number((metrics.reduce((sum, m) => sum + m.roa, 0) / count).toFixed(1)),
      avgYield: Number((metrics.reduce((sum, m) => sum + m.portfolioYield, 0) / count).toFixed(1)),
      collectionEfficiency: Number((metrics.reduce((sum, m) => sum + m.collectionEfficiency, 0) / count).toFixed(1))
    };
  }

  private determineOverallCompliance(metrics: OHADAMetrics[]): ComplianceStatus {
    const nonCompliantCount = metrics.filter(m => 
      !m.regulatoryCompliance?.bceaoCompliant || 
      !m.regulatoryCompliance?.ohadaProvisionCompliant
    ).length;

    if (nonCompliantCount === 0) return ComplianceStatus.COMPLIANT;
    if (nonCompliantCount <= metrics.length * 0.1) return ComplianceStatus.WARNING;
    return ComplianceStatus.NON_COMPLIANT;
  }

  // Méthodes de calcul supplémentaires (simplifiées pour l'exemple)
  private async getActiveContractsCount(portfolioId: string): Promise<number> {
    // Implémentation réelle requise
    return 50;
  }

  private async calculateAverageLoanSize(portfolioId: string): Promise<number> {
    // Implémentation réelle requise
    return 15000000;
  }

  private async calculatePortfolioYield(portfolioId: string, periodStart: Date, periodEnd: Date): Promise<number> {
    // Implémentation réelle requise
    return 14.5;
  }

  private async calculateGrowthRate(portfolioId: string, calculationDate: Date): Promise<number> {
    // Implémentation réelle requise
    return 8.2;
  }

  private async getMonthlyPerformance(portfolioId: string, calculationDate: Date): Promise<number[]> {
    // Implémentation réelle requise
    return [12.1, 13.2, 14.5, 15.1, 15.8, 16.2, 15.9, 16.1, 15.7, 16.3, 16.8, 17.2];
  }
}
