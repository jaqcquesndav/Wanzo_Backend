import { Injectable } from '@nestjs/common';
import { OHADAOrchestrationService } from './ohada-orchestration.service';
import { 
  OHADAMetrics, 
  OHADAMetricsResponse, 
  ComplianceSummary,
  ComplianceStatus,
  RiskLevel
} from '../interfaces/dashboard.interface';

@Injectable()
export class OHADAMetricsService {
  constructor(
    private orchestrationService: OHADAOrchestrationService
  ) {}

  async getOHADAMetrics(institutionId: string): Promise<OHADAMetricsResponse> {
    return await this.orchestrationService.getOHADAMetricsForInstitution(institutionId);
  }

  async getPortfolioOHADAMetrics(portfolioId: string): Promise<OHADAMetrics> {
    return await this.orchestrationService.calculatePortfolioMetrics(portfolioId);
  }

  async getGlobalOHADAMetrics(institutionId: string): Promise<OHADAMetrics> {
    const response = await this.orchestrationService.getOHADAMetricsForInstitution(institutionId);
    
    // Agréger toutes les métriques pour créer une vue globale
    const allMetrics = response.data;
    const totalAmount = allMetrics.reduce((sum, m) => sum + m.totalAmount, 0);
    const totalContracts = allMetrics.reduce((sum, m) => sum + m.activeContracts, 0);
    
    return {
      id: 'global',
      name: 'Vue Globale',
      sector: 'Tous Secteurs',
      totalAmount,
      activeContracts: totalContracts,
      avgLoanSize: totalContracts > 0 ? totalAmount / totalContracts : 0,
      nplRatio: response.benchmarks.avgNplRatio,
      provisionRate: response.benchmarks.avgProvisionRate,
      collectionEfficiency: response.benchmarks.collectionEfficiency,
      balanceAGE: this.calculateAggregatedBalanceAge(allMetrics),
      roa: response.benchmarks.avgROA,
      portfolioYield: response.benchmarks.avgYield,
      riskLevel: this.determineGlobalRiskLevel(response.benchmarks.avgNplRatio),
      growthRate: this.calculateAverageGrowthRate(allMetrics),
      monthlyPerformance: this.calculateAggregatedPerformance(allMetrics),
      lastActivity: new Date().toISOString(),
      regulatoryCompliance: {
        bceaoCompliant: response.metadata.complianceStatus === ComplianceStatus.COMPLIANT,
        ohadaProvisionCompliant: response.benchmarks.avgProvisionRate >= 3.0 && response.benchmarks.avgProvisionRate <= 5.0,
        riskRating: 'A' as any
      }
    };
  }

  async getComplianceSummary(institutionId: string): Promise<ComplianceSummary> {
    const response = await this.orchestrationService.getOHADAMetricsForInstitution(institutionId);
    const portfolios = response.data;

    const nonCompliantCount = portfolios.filter(p => 
      !p.regulatoryCompliance?.bceaoCompliant || 
      !p.regulatoryCompliance?.ohadaProvisionCompliant
    ).length;

    const complianceRate = ((portfolios.length - nonCompliantCount) / portfolios.length * 100).toFixed(1);

    return {
      status: response.metadata.complianceStatus,
      riskLevel: this.determineGlobalRiskLevel(response.benchmarks.avgNplRatio),
      totalPortfolios: portfolios.length,
      nonCompliantCount,
      complianceRate,
      details: {
        bceaoCompliance: {
          threshold: 5.0,
          currentAvg: response.benchmarks.avgNplRatio,
          compliantCount: portfolios.filter(p => p.nplRatio < 5.0).length,
          status: response.benchmarks.avgNplRatio < 5.0 ? ComplianceStatus.COMPLIANT : ComplianceStatus.NON_COMPLIANT
        },
        ohadaProvisionCompliance: {
          minThreshold: 3.0,
          maxThreshold: 5.0,
          currentAvg: response.benchmarks.avgProvisionRate,
          compliantCount: portfolios.filter(p => p.provisionRate >= 3.0 && p.provisionRate <= 5.0).length,
          status: response.benchmarks.avgProvisionRate >= 3.0 && response.benchmarks.avgProvisionRate <= 5.0 ? 
                  ComplianceStatus.COMPLIANT : ComplianceStatus.NON_COMPLIANT
        }
      }
    };
  }

  async scheduleRecalculation(portfolioId: string, institutionId: string): Promise<void> {
    await this.orchestrationService.scheduleMetricCalculation(portfolioId, institutionId, 'HIGH');
  }

  // Méthodes utilitaires privées
  private calculateAggregatedBalanceAge(metrics: OHADAMetrics[]) {
    if (metrics.length === 0) {
      return { current: 0, days30: 0, days60: 0, days90Plus: 0 };
    }

    const totalWeight = metrics.reduce((sum, m) => sum + m.totalAmount, 0);
    
    return {
      current: Number((metrics.reduce((sum, m) => sum + (m.balanceAGE.current * m.totalAmount), 0) / totalWeight).toFixed(1)),
      days30: Number((metrics.reduce((sum, m) => sum + (m.balanceAGE.days30 * m.totalAmount), 0) / totalWeight).toFixed(1)),
      days60: Number((metrics.reduce((sum, m) => sum + (m.balanceAGE.days60 * m.totalAmount), 0) / totalWeight).toFixed(1)),
      days90Plus: Number((metrics.reduce((sum, m) => sum + (m.balanceAGE.days90Plus * m.totalAmount), 0) / totalWeight).toFixed(1))
    };
  }

  private determineGlobalRiskLevel(avgNplRatio: number): RiskLevel {
    if (avgNplRatio < 2) return RiskLevel.FAIBLE;
    if (avgNplRatio < 5) return RiskLevel.MOYEN;
    return RiskLevel.ELEVE;
  }

  private calculateAverageGrowthRate(metrics: OHADAMetrics[]): number {
    if (metrics.length === 0) return 0;
    return Number((metrics.reduce((sum, m) => sum + m.growthRate, 0) / metrics.length).toFixed(1));
  }

  private calculateAggregatedPerformance(metrics: OHADAMetrics[]): number[] {
    if (metrics.length === 0) return Array(12).fill(0);
    
    const monthlyTotals = Array(12).fill(0);
    
    metrics.forEach(metric => {
      metric.monthlyPerformance.forEach((value, index) => {
        monthlyTotals[index] += value * metric.totalAmount;
      });
    });

    const totalWeight = metrics.reduce((sum, m) => sum + m.totalAmount, 0);
    
    return monthlyTotals.map(total => 
      totalWeight > 0 ? Number((total / totalWeight).toFixed(1)) : 0
    );
  }
}
