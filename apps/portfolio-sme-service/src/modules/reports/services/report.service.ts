import { Injectable } from '@nestjs/common';
import { PortfolioService } from '../../portfolios/services/portfolio.service';
import { OperationService } from '../../operations/services/operation.service';
import { AssetService } from '../../assets/services/asset.service';
import { ReportType, ReportFormat, ReportPeriod } from '../dtos/report.dto';

@Injectable()
export class ReportService {
  constructor(
    private portfolioService: PortfolioService,
    private operationService: OperationService,
    private assetService: AssetService,
  ) {}

  async generateReport(
    companyId: string,
    type: ReportType,
    period: ReportPeriod,
    format: ReportFormat = ReportFormat.PDF,
  ): Promise<{
    url: string;
    metadata: Record<string, any>;
  }> {
    const data = await this.collectReportData(companyId, type, period);
    const reportUrl = await this.formatReport(data, format);

    return {
      url: reportUrl,
      metadata: {
        type,
        period,
        format,
        generatedAt: new Date(),
      },
    };
  }

  private async collectReportData(
    companyId: string,
    type: ReportType,
    period: ReportPeriod,
  ): Promise<any> {
    switch (type) {
      case ReportType.PORTFOLIO_SUMMARY:
        return this.generatePortfolioSummary(companyId, period);
      case ReportType.OPERATIONS_ANALYSIS:
        return this.generateOperationsAnalysis(companyId, period);
      case ReportType.ASSET_VALUATION:
        return this.generateAssetValuation(companyId, period);
      case ReportType.RISK_ASSESSMENT:
        return this.generateRiskAssessment(companyId, period);
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }
  }

  private async generatePortfolioSummary(companyId: string, period: ReportPeriod) {
    const portfolios = await this.portfolioService.findAll({ companyId });
    
    return {
      summary: {
        totalPortfolios: portfolios.total,
        totalValue: portfolios.portfolios.reduce((sum, p) => sum + p.metrics.netValue, 0),
        averageReturn: portfolios.portfolios.reduce((sum, p) => sum + p.metrics.averageReturn, 0) / portfolios.total,
      },
      portfolioDetails: portfolios.portfolios.map(p => ({
        name: p.name,
        type: p.type,
        metrics: p.metrics,
        targetSectors: p.targetSectors,
      })),
      period: {
        start: period.startDate,
        end: period.endDate,
      },
    };
  }

  private async generateOperationsAnalysis(companyId: string, period: ReportPeriod) {
    const operations = await this.operationService.findAll({
      companyId,
      startDate: period.startDate,
      endDate: period.endDate,
    });

    return {
      summary: {
        totalOperations: operations.total,
        byType: this.groupOperationsByType(operations.operations),
        byStatus: this.groupOperationsByStatus(operations.operations),
      },
      operationDetails: operations.operations.map(op => ({
        type: op.type,
        status: op.status,
        amount: op.requestedAmount,
        date: op.dateEmission,
        workflow: {
          status: op.workflow.status,
          currentStep: op.workflow.currentStepId,
        },
      })),
      period: {
        start: period.startDate,
        end: period.endDate,
      },
    };
  }

  private async generateAssetValuation(companyId: string, period: ReportPeriod) {
    const assets = await this.assetService.findAll({ companyId });

    return {
      summary: {
        totalAssets: assets.total,
        totalValue: assets.assets.reduce((sum, a) => sum + a.currentValue, 0),
        byType: this.groupAssetsByType(assets.assets),
      },
      assetDetails: await Promise.all(
        assets.assets.map(async asset => ({
          name: asset.name,
          type: asset.type,
          acquisitionValue: asset.acquisitionValue,
          currentValue: asset.currentValue,
          valuationHistory: await this.assetService.getValuationHistory(asset.id),
          depreciation: await this.assetService.getDepreciationSchedule(asset.id),
        }))
      ),
      period: {
        start: period.startDate,
        end: period.endDate,
      },
    };
  }

  private async generateRiskAssessment(companyId: string, period: ReportPeriod) {
    const portfolios = await this.portfolioService.findAll({ companyId });
    const operations = await this.operationService.findAll({ companyId });

    return {
      portfolioRisks: portfolios.portfolios.map(p => ({
        name: p.name,
        type: p.type,
        riskProfile: p.riskProfile,
        metrics: {
          riskScore: p.metrics.riskPortfolio,
          volatility: p.metrics.volatility,
          sharpeRatio: p.metrics.sharpeRatio,
        },
      })),
      operationalRisks: this.assessOperationalRisks(operations.operations),
      recommendations: this.generateRiskRecommendations(portfolios.portfolios),
      period: {
        start: period.startDate,
        end: period.endDate,
      },
    };
  }

  private groupOperationsByType(operations: any[]) {
    return operations.reduce((acc, op) => {
      acc[op.type] = (acc[op.type] || 0) + 1;
      return acc;
    }, {});
  }

  private groupOperationsByStatus(operations: any[]) {
    return operations.reduce((acc, op) => {
      acc[op.status] = (acc[op.status] || 0) + 1;
      return acc;
    }, {});
  }

  private groupAssetsByType(assets: any[]) {
    return assets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + asset.currentValue;
      return acc;
    }, {});
  }

  private assessOperationalRisks(operations: any[]) {
    return {
      pendingOperations: operations.filter(op => op.status === 'pending').length,
      failedWorkflows: operations.filter(op => op.workflow.status === 'rejected').length,
      averageCompletionTime: this.calculateAverageCompletionTime(operations),
      riskFactors: this.identifyRiskFactors(operations),
    };
  }

  private calculateAverageCompletionTime(operations: any[]) {
    const completedOps = operations.filter(op => op.status === 'completed');
    if (completedOps.length === 0) return 0;

    const totalTime = completedOps.reduce((sum, op) => {
      const start = new Date(op.createdAt).getTime();
      const end = new Date(op.updatedAt).getTime();
      return sum + (end - start);
    }, 0);

    return totalTime / completedOps.length / (1000 * 60 * 60 * 24); // Convert to days
  }

  private identifyRiskFactors(operations: any[]) {
    return {
      highRiskOperations: operations.filter(op => op.requestedAmount > 1000000).length,
      delayedOperations: operations.filter(op => {
        const age = Date.now() - new Date(op.createdAt).getTime();
        return age > (30 * 24 * 60 * 60 * 1000); // 30 days
      }).length,
      incompleteDocumentation: operations.filter(op => 
        op.workflow.steps.some((step: any) => 
          step.stepType === 'document_upload' && step.status === 'pending'
        )
      ).length,
    };
  }

  private generateRiskRecommendations(portfolios: any[]) {
    const recommendations = [];

    // Diversification check
    const sectorConcentration = this.calculateSectorConcentration(portfolios);
    if (Object.values(sectorConcentration).some(v => v > 0.3)) {
      recommendations.push({
        type: 'diversification',
        priority: 'high',
        message: 'High sector concentration detected. Consider diversifying investments.',
      });
    }

    // Risk profile check
    const highRiskPortfolios = portfolios.filter(p => p.riskProfile === 'aggressive');
    if (highRiskPortfolios.length > portfolios.length * 0.4) {
      recommendations.push({
        type: 'risk_profile',
        priority: 'medium',
        message: 'High proportion of aggressive portfolios. Consider rebalancing risk profiles.',
      });
    }

    // Performance check
    const underperforming = portfolios.filter(p => p.metrics.averageReturn < p.targetReturn);
    if (underperforming.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: `${underperforming.length} portfolios are underperforming their targets.`,
      });
    }

    return recommendations;
  }

  private calculateSectorConcentration(portfolios: any[]) {
    const sectorTotals: Record<string, number> = {};
    let totalValue = 0;

    portfolios.forEach(p => {
      const value = p.metrics.netValue;
      totalValue += value;
      p.targetSectors.forEach((sector: string) => {
        sectorTotals[sector] = (sectorTotals[sector] || 0) + (value / p.targetSectors.length);
      });
    });

    return Object.entries(sectorTotals).reduce((acc, [sector, value]) => {
      acc[sector] = value / totalValue;
      return acc;
    }, {} as Record<string, number>);
  }

  private async formatReport(data: any, format: ReportFormat): Promise<string> {
    // Ici, on utiliserait un service de génération de rapports
    // Pour l'instant, on simule juste une URL
    const timestamp = Date.now();
    return `https://reports.kiota.com/generated/${timestamp}.${format.toLowerCase()}`;
  }
}