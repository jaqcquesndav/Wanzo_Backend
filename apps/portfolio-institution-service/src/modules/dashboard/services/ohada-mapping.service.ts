import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiskLevel, CreditScoreUtils } from '@wanzobe/shared';
import { OHADAMetric, OHADASnapshot, MetricType } from '../entities/ohada-metric.entity';
import { Portfolio } from '../../portfolios/entities/portfolio.entity';
import { 
  OHADAMetrics, 
  BalanceAGE, 
  RegulatoryCompliance,
  RegulatoryFramework,
  ComplianceStatus,
  RiskRating
} from '../interfaces/dashboard.interface';

@Injectable()
export class OHADAMappingService {
  private readonly logger = new Logger(OHADAMappingService.name);

  constructor(
    @InjectRepository(OHADAMetric)
    private readonly ohadaMetricRepository: Repository<OHADAMetric>,
    @InjectRepository(OHADASnapshot)
    private readonly ohadaSnapshotRepository: Repository<OHADASnapshot>,
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
  ) {}

  /**
   * Mappe les données de l'entité vers l'interface attendue par le dashboard
   */
  async mapToOHADAMetrics(portfolioId: string, institutionId: string): Promise<OHADAMetrics> {
    this.logger.log(`Mapping OHADA metrics for portfolio ${portfolioId}`);

    // 1. Récupérer le portfolio pour les données de base
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId }
    });

    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} not found`);
    }

    // 2. Récupérer le snapshot le plus récent
    const snapshot = await this.ohadaSnapshotRepository.findOne({
      where: { 
        portfolio_id: portfolioId,
        institution_id: institutionId 
      },
      order: { snapshot_date: 'DESC' }
    });

    // 3. Récupérer les métriques individuelles récentes
    const metrics = await this.ohadaMetricRepository.find({
      where: { 
        portfolio_id: portfolioId,
        institution_id: institutionId 
      },
      order: { calculation_date: 'DESC' },
      take: 20 // Dernières métriques
    });

    // 4. Construire l'objet OHADAMetrics
    return this.buildOHADAMetrics(portfolio, snapshot, metrics);
  }

  /**
   * Construit l'objet OHADAMetrics à partir des données récupérées
   */
  private buildOHADAMetrics(
    portfolio: Portfolio,
    snapshot: OHADASnapshot | null,
    metrics: OHADAMetric[]
  ): OHADAMetrics {
    // Extraire les métriques par type
    const nplMetric = metrics.find(m => m.metric_type === MetricType.NPL_RATIO);
    const provisionMetric = metrics.find(m => m.metric_type === MetricType.PROVISION_RATE);
    const collectionMetric = metrics.find(m => m.metric_type === MetricType.COLLECTION_EFFICIENCY);
    const roaMetric = metrics.find(m => m.metric_type === MetricType.ROA);
    const yieldMetric = metrics.find(m => m.metric_type === MetricType.PORTFOLIO_YIELD);
    const balanceAgeMetric = metrics.find(m => m.metric_type === MetricType.BALANCE_AGE);
    const riskMetric = metrics.find(m => m.metric_type === MetricType.RISK_ASSESSMENT);

    // Construire les ratios depuis les métriques ou snapshot
    const nplRatio = nplMetric?.value || snapshot?.metrics_summary?.npl_ratio || 0;
    const provisionRate = provisionMetric?.value || snapshot?.metrics_summary?.provision_rate || 0;
    const collectionEfficiency = collectionMetric?.value || snapshot?.metrics_summary?.collection_efficiency || 0;
    const roa = roaMetric?.value || snapshot?.metrics_summary?.roa || 0;
    const portfolioYield = yieldMetric?.value || snapshot?.metrics_summary?.portfolio_yield || 0;

    // Balance âgée depuis les métriques ou snapshot
    const balanceAGE: BalanceAGE = {
      current: (balanceAgeMetric?.details?.current ?? snapshot?.balance_age?.current) ?? 0,
      days30: (balanceAgeMetric?.details?.days30 ?? snapshot?.balance_age?.days30) ?? 0,
      days60: (balanceAgeMetric?.details?.days60 ?? snapshot?.balance_age?.days60) ?? 0,
      days90Plus: (balanceAgeMetric?.details?.days90Plus ?? snapshot?.balance_age?.days90Plus) ?? 0
    };

    // Déterminer le niveau de risque
    const riskLevel = this.determineRiskLevel(nplRatio, provisionRate);

    // Données de performance depuis snapshot
    const performanceData = snapshot?.performance_data || {
      monthly_performance: Array(12).fill(0),
      growth_rate: 0,
      total_amount: portfolio.total_amount || 0,
      active_contracts: 0,
      avg_loan_size: 0
    };

    // Conformité réglementaire
    const regulatoryCompliance: RegulatoryCompliance = {
      bceaoCompliant: nplRatio < 5.0, // Seuil BCEAO
      ohadaProvisionCompliant: provisionRate >= 3.0 && provisionRate <= 5.0,
      riskRating: this.determineRiskRating(nplRatio, roa)
    };

    return {
      id: portfolio.id,
      name: portfolio.name,
      sector: portfolio.target_sectors?.[0] || 'Non spécifié',
      
      // Métriques financières de base
      totalAmount: performanceData.total_amount,
      activeContracts: performanceData.active_contracts,
      avgLoanSize: performanceData.avg_loan_size,
      
      // Ratios OHADA critiques
      nplRatio,
      provisionRate,
      collectionEfficiency,
      
      // Balance âgée conforme OHADA
      balanceAGE,
      
      // Ratios de performance
      roa,
      portfolioYield,
      riskLevel,
      growthRate: performanceData.growth_rate,
      
      // Données temporelles
      monthlyPerformance: performanceData.monthly_performance,
      lastActivity: snapshot?.created_at?.toISOString() || new Date().toISOString(),
      
      // Conformité réglementaire
      regulatoryCompliance
    };
  }

  /**
   * Détermine le niveau de risque basé sur NPL et provision
   */
  private determineRiskLevel(nplRatio: number, provisionRate: number): RiskLevel {
    // Logique basée sur standards BCEAO/OHADA
    if (nplRatio >= 10 || provisionRate >= 8) {
      return RiskLevel.HIGH;
    } else if (nplRatio >= 5 || provisionRate >= 5) {
      return RiskLevel.MEDIUM;
    } else {
      return RiskLevel.LOW;
    }
  }

  /**
   * Détermine le rating de risque
   */
  private determineRiskRating(nplRatio: number, roa: number): RiskRating {
    // Rating basé sur performance combinée
    if (nplRatio < 2 && roa > 3) {
      return RiskRating.AAA;
    } else if (nplRatio < 3 && roa > 2) {
      return RiskRating.AA;
    } else if (nplRatio < 5 && roa > 1) {
      return RiskRating.A;
    } else if (nplRatio < 7 && roa > 0) {
      return RiskRating.BBB;
    } else if (nplRatio < 10) {
      return RiskRating.BB;
    } else if (nplRatio < 15) {
      return RiskRating.B;
    } else {
      return RiskRating.CCC;
    }
  }

  /**
   * Mappe plusieurs portfolios vers OHADAMetrics[]
   */
  async mapMultiplePortfolios(institutionId: string): Promise<OHADAMetrics[]> {
    const portfolios = await this.portfolioRepository.find({
      where: { institution_id: institutionId }
    });

    const mappedMetrics: OHADAMetrics[] = [];

    for (const portfolio of portfolios) {
      try {
        const metrics = await this.mapToOHADAMetrics(portfolio.id, institutionId);
        mappedMetrics.push(metrics);
      } catch (error: any) {
        this.logger.error(`Failed to map portfolio ${portfolio.id}: ${error.message}`);
        // Continuer avec les autres portfolios
      }
    }

    return mappedMetrics;
  }

  /**
   * Crée ou met à jour un snapshot OHADA
   */
  async createSnapshot(portfolioId: string, institutionId: string): Promise<OHADASnapshot> {
    const metrics = await this.ohadaMetricRepository.find({
      where: { 
        portfolio_id: portfolioId,
        institution_id: institutionId 
      },
      order: { calculation_date: 'DESC' },
      take: 10
    });

    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId }
    });

    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} not found`);
    }

    // Agréger les métriques
    const summary = this.aggregateMetrics(metrics);
    
    const snapshot = this.ohadaSnapshotRepository.create({
      institution_id: institutionId,
      portfolio_id: portfolioId,
      metrics_summary: summary.metrics_summary,
      balance_age: summary.balance_age,
      regulatory_compliance: summary.regulatory_compliance,
      performance_data: summary.performance_data,
      snapshot_date: new Date(),
      metadata: {
        data_sources_count: metrics.length,
        calculation_duration_ms: Date.now(),
        quality_score: this.calculateQualityScore(metrics),
        last_refresh: new Date().toISOString()
      }
    });

    return await this.ohadaSnapshotRepository.save(snapshot);
  }

  /**
   * Agrège les métriques individuelles
   */
  private aggregateMetrics(metrics: OHADAMetric[]) {
    const nplMetric = metrics.find(m => m.metric_type === MetricType.NPL_RATIO);
    const provisionMetric = metrics.find(m => m.metric_type === MetricType.PROVISION_RATE);
    const collectionMetric = metrics.find(m => m.metric_type === MetricType.COLLECTION_EFFICIENCY);
    const roaMetric = metrics.find(m => m.metric_type === MetricType.ROA);
    const yieldMetric = metrics.find(m => m.metric_type === MetricType.PORTFOLIO_YIELD);
    const balanceAgeMetric = metrics.find(m => m.metric_type === MetricType.BALANCE_AGE);
    const riskMetric = metrics.find(m => m.metric_type === MetricType.RISK_ASSESSMENT);

    const nplRatio = nplMetric?.value || 0;
    const provisionRate = provisionMetric?.value || 0;

    return {
      metrics_summary: {
        npl_ratio: nplRatio,
        provision_rate: provisionRate,
        collection_efficiency: collectionMetric?.value || 0,
        roa: roaMetric?.value || 0,
        portfolio_yield: yieldMetric?.value || 0,
        risk_level: this.determineRiskLevel(nplRatio, provisionRate),
        compliance_status: this.determineComplianceStatus(nplRatio, provisionRate)
      },
      balance_age: balanceAgeMetric?.details || {
        current: 0,
        days30: 0,
        days60: 0,
        days90Plus: 0
      },
      regulatory_compliance: {
        bceao_compliant: nplRatio < 5.0,
        ohada_provision_compliant: provisionRate >= 3.0 && provisionRate <= 5.0,
        risk_rating: this.determineRiskRating(nplRatio, roaMetric?.value || 0)
      },
      performance_data: {
        monthly_performance: Array(12).fill(0), // À calculer depuis données réelles
        growth_rate: 0, // À calculer
        total_amount: 0, // À calculer
        active_contracts: 0, // À calculer
        avg_loan_size: 0 // À calculer
      }
    };
  }

  /**
   * Détermine le statut de conformité
   */
  private determineComplianceStatus(nplRatio: number, provisionRate: number): ComplianceStatus {
    if (nplRatio < 5.0 && provisionRate >= 3.0 && provisionRate <= 5.0) {
      return ComplianceStatus.COMPLIANT;
    } else if (nplRatio < 7.0 || (provisionRate >= 2.0 && provisionRate <= 6.0)) {
      return ComplianceStatus.WARNING;
    } else {
      return ComplianceStatus.NON_COMPLIANT;
    }
  }

  /**
   * Calcule un score de qualité des données
   */
  private calculateQualityScore(metrics: OHADAMetric[]): number {
    if (metrics.length === 0) return 0;
    
    const completedMetrics = metrics.filter(m => m.status === 'completed');
    return Math.round((completedMetrics.length / metrics.length) * 100);
  }
}