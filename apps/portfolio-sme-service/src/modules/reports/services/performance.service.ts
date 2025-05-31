import { Injectable } from '@nestjs/common';
import { PortfolioService } from '../../portfolios/services/portfolio.service';
import { OperationService } from '../../operations/services/operation.service';
import { PerformanceMetric, PerformancePeriod } from '../dtos/performance.dto';

@Injectable()
export class PerformanceService {
  constructor(
    private portfolioService: PortfolioService,
    private operationService: OperationService,
  ) {}

  async calculatePortfolioPerformance(
    portfolioId: string,
    period: PerformancePeriod,
  ): Promise<{
    metrics: Record<PerformanceMetric, number>;
    trends: Record<string, any>;
    analysis: Record<string, any>;
  }> {
    const portfolio = await this.portfolioService.findById(portfolioId);
    const operations = await this.operationService.findAll({
      portfolioId,
      startDate: period.startDate,
      endDate: period.endDate,
    });

    const metrics = {
      [PerformanceMetric.RETURN]: this.calculateReturn(portfolio),
      [PerformanceMetric.VOLATILITY]: this.calculateVolatility(portfolio),
      [PerformanceMetric.SHARPE_RATIO]: this.calculateSharpeRatio(portfolio),
      [PerformanceMetric.ALPHA]: this.calculateAlpha(portfolio),
      [PerformanceMetric.BETA]: this.calculateBeta(portfolio),
      [PerformanceMetric.TRACKING_ERROR]: this.calculateTrackingError(portfolio),
      [PerformanceMetric.INFORMATION_RATIO]: this.calculateInformationRatio(portfolio),
      [PerformanceMetric.MAX_DRAWDOWN]: this.calculateMaxDrawdown(portfolio),
    };

    const trends = {
      historical: this.calculateHistoricalTrends(portfolio, period),
      seasonal: this.calculateSeasonalPatterns(portfolio, period),
      comparative: this.compareToTargets(portfolio),
    };

    const analysis = {
      strengths: this.identifyStrengths(metrics, portfolio),
      weaknesses: this.identifyWeaknesses(metrics, portfolio),
      opportunities: this.identifyOpportunities(metrics, portfolio, operations.operations),
      risks: this.identifyRisks(metrics, portfolio, operations.operations),
    };

    return {
      metrics,
      trends,
      analysis,
    };
  }

  private calculateReturn(portfolio: any): number {
    return portfolio.metrics.averageReturn;
  }

  private calculateVolatility(portfolio: any): number {
    return portfolio.metrics.volatility;
  }

  private calculateSharpeRatio(portfolio: any): number {
    return portfolio.metrics.sharpeRatio;
  }

  private calculateAlpha(portfolio: any): number {
    return portfolio.metrics.alpha;
  }

  private calculateBeta(portfolio: any): number {
    return portfolio.metrics.beta;
  }

  private calculateTrackingError(portfolio: any): number {
    // Simulé pour l'exemple
    return Math.abs(portfolio.metrics.averageReturn - portfolio.targetReturn);
  }

  private calculateInformationRatio(portfolio: any): number {
    const trackingError = this.calculateTrackingError(portfolio);
    return trackingError === 0 ? 0 : (portfolio.metrics.averageReturn - portfolio.targetReturn) / trackingError;
  }

  private calculateMaxDrawdown(portfolio: any): number {
    // Simulé pour l'exemple
    return portfolio.metrics.volatility * 2;
  }

  private calculateHistoricalTrends(portfolio: any, period: PerformancePeriod) {
    return {
      returns: this.generateTimeSeries(period, portfolio.metrics.averageReturn),
      volatility: this.generateTimeSeries(period, portfolio.metrics.volatility),
      value: this.generateTimeSeries(period, portfolio.metrics.netValue),
    };
  }

  private calculateSeasonalPatterns(portfolio: any, period: PerformancePeriod) {
    return {
      monthly: this.generateMonthlyPatterns(portfolio),
      quarterly: this.generateQuarterlyPatterns(portfolio),
      yearly: this.generateYearlyPatterns(portfolio),
    };
  }

  private compareToTargets(portfolio: any) {
    return {
      return: {
        actual: portfolio.metrics.averageReturn,
        target: portfolio.targetReturn,
        variance: portfolio.metrics.averageReturn - portfolio.targetReturn,
      },
      risk: {
        actual: portfolio.metrics.riskPortfolio,
        target: this.getRiskTarget(portfolio.riskProfile),
        variance: portfolio.metrics.riskPortfolio - this.getRiskTarget(portfolio.riskProfile),
      },
    };
  }

  private generateTimeSeries(period: PerformancePeriod, baseValue: number) {
    const points = [];
    let currentDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);
    
    while (currentDate <= endDate) {
      points.push({
        date: new Date(currentDate),
        value: baseValue * (1 + (Math.random() - 0.5) * 0.1),
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return points;
  }

  private generateMonthlyPatterns(portfolio: any) {
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      averageReturn: portfolio.metrics.averageReturn * (1 + (Math.random() - 0.5) * 0.2),
    }));
  }

  private generateQuarterlyPatterns(portfolio: any) {
    return Array.from({ length: 4 }, (_, i) => ({
      quarter: i + 1,
      averageReturn: portfolio.metrics.averageReturn * (1 + (Math.random() - 0.5) * 0.15),
    }));
  }

  private generateYearlyPatterns(portfolio: any) {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 3 }, (_, i) => ({
      year: currentYear - 2 + i,
      averageReturn: portfolio.metrics.averageReturn * (1 + (Math.random() - 0.5) * 0.1),
    }));
  }

  private getRiskTarget(riskProfile: string): number {
    const riskTargets: Record<string, number> = {
      low: 0.05,
      moderate: 0.1,
      aggressive: 0.2,
    };
    return riskTargets[riskProfile] || 0.1;
  }

  private identifyStrengths(metrics: Record<PerformanceMetric, number>, portfolio: any) {
    const strengths = [];

    if (metrics[PerformanceMetric.RETURN] > portfolio.targetReturn) {
      strengths.push({
        type: 'return',
        description: 'Above target return',
        value: metrics[PerformanceMetric.RETURN],
      });
    }

    if (metrics[PerformanceMetric.SHARPE_RATIO] > 1) {
      strengths.push({
        type: 'risk_adjusted_return',
        description: 'Strong risk-adjusted performance',
        value: metrics[PerformanceMetric.SHARPE_RATIO],
      });
    }

    if (metrics[PerformanceMetric.ALPHA] > 0) {
      strengths.push({
        type: 'alpha',
        description: 'Positive alpha generation',
        value: metrics[PerformanceMetric.ALPHA],
      });
    }

    return strengths;
  }

  private identifyWeaknesses(metrics: Record<PerformanceMetric, number>, portfolio: any) {
    const weaknesses = [];

    if (metrics[PerformanceMetric.RETURN] < portfolio.targetReturn) {
      weaknesses.push({
        type: 'return',
        description: 'Below target return',
        value: metrics[PerformanceMetric.RETURN],
      });
    }

    if (metrics[PerformanceMetric.VOLATILITY] > this.getRiskTarget(portfolio.riskProfile)) {
      weaknesses.push({
        type: 'volatility',
        description: 'Higher than target volatility',
        value: metrics[PerformanceMetric.VOLATILITY],
      });
    }

    if (metrics[PerformanceMetric.MAX_DRAWDOWN] > 0.2) {
      weaknesses.push({
        type: 'drawdown',
        description: 'Significant maximum drawdown',
        value: metrics[PerformanceMetric.MAX_DRAWDOWN],
      });
    }

    return weaknesses;
  }

  private identifyOpportunities(
    metrics: Record<PerformanceMetric, number>,
    portfolio: any,
    operations: any[],
  ) {
    const opportunities = [];

    // Identifier les secteurs sous-représentés
    const sectorAllocation = this.calculateSectorAllocation(portfolio);
    const underweightSectors = Object.entries(sectorAllocation)
      .filter(([_, weight]) => weight < 0.1)
      .map(([sector]) => sector);

    if (underweightSectors.length > 0) {
      opportunities.push({
        type: 'diversification',
        description: 'Potential for sector diversification',
        sectors: underweightSectors,
      });
    }

    // Identifier les opportunités basées sur les opérations réussies
    const successfulOperations = operations.filter(op => op.status === 'completed');
    const successfulTypes = this.groupOperationsBySuccess(successfulOperations);

    Object.entries(successfulTypes).forEach(([type, count]) => {
      if (count > 5) {
        opportunities.push({
          type: 'operation_type',
          description: `High success rate in ${type} operations`,
          count,
        });
      }
    });

    return opportunities;
  }

  private identifyRisks(
    metrics: Record<PerformanceMetric, number>,
    portfolio: any,
    operations: any[],
  ) {
    const risks = [];

    // Risques de concentration
    const sectorAllocation = this.calculateSectorAllocation(portfolio);
    const concentratedSectors = Object.entries(sectorAllocation)
      .filter(([_, weight]) => weight > 0.3)
      .map(([sector]) => sector);

    if (concentratedSectors.length > 0) {
      risks.push({
        type: 'concentration',
        description: 'High sector concentration',
        sectors: concentratedSectors,
      });
    }

    // Risques opérationnels
    const failedOperations = operations.filter(op => op.status === 'rejected');
    if (failedOperations.length > 0) {
      risks.push({
        type: 'operational',
        description: 'High operation failure rate',
        count: failedOperations.length,
      });
    }

    // Risques de marché
    if (metrics[PerformanceMetric.BETA] > 1.5) {
      risks.push({
        type: 'market',
        description: 'High market sensitivity',
        beta: metrics[PerformanceMetric.BETA],
      });
    }

    return risks;
  }

  private calculateSectorAllocation(portfolio: any): Record<string, number> {
    const allocation: Record<string, number> = {};
    const totalValue = portfolio.metrics.netValue;

    portfolio.targetSectors.forEach((sector: string) => {
      allocation[sector] = Math.random(); // Simulé pour l'exemple
    });

    // Normaliser les allocations
    const total = Object.values(allocation).reduce((sum, value) => sum + value, 0);
    Object.keys(allocation).forEach(sector => {
      allocation[sector] = allocation[sector] / total;
    });

    return allocation;
  }

  private groupOperationsBySuccess(operations: any[]): Record<string, number> {
    return operations.reduce((acc, op) => {
      acc[op.type] = (acc[op.type] || 0) + 1;
      return acc;
    }, {});
  }
}