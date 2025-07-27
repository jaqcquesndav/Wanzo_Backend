import { Injectable } from '@nestjs/common';
import { InstitutionService } from '../../institution/services/institution.service';
import { ProspectService } from '../../prospection/services/prospect.service';
import { PortfolioService } from '../../portfolios/services/portfolio.service';
import { OperationService } from '../../operations/services/operation.service';
import { DashboardData } from '../interfaces/dashboard.interface';

@Injectable()
export class DashboardService {
  constructor(
    private institutionService: InstitutionService,
    private prospectService: ProspectService,
    private portfolioService: PortfolioService,
    private operationService: OperationService,
  ) {}

  async getDashboardData(institutionId: string): Promise<DashboardData> {
    const [
      institution,
      portfolioStats,
      prospectStats,
      operationStats,
      recentActivity,
    ] = await Promise.all([
      this.getInstitutionOverview(institutionId),
      this.getPortfolioStatistics(institutionId),
      this.getProspectStatistics(institutionId),
      this.getOperationStatistics(institutionId),
      this.getRecentActivity(institutionId),
    ]);

    return {
      institution,
      portfolioStats,
      prospectStats,
      operationStats,
      recentActivity,
    };
  }

  private async getInstitutionOverview(institutionId: string) {
    const institution = await this.institutionService.findById(institutionId);
    return {
      name: institution.name,
      type: institution.type.toString(),
      regulatoryStatus: institution.regulatoryStatus ? institution.regulatoryStatus.toString() : 'unknown',
      metrics: {
        totalUsers: institution.users.length,
        totalPortfolios: 0, // Will be updated
        totalProspects: 0, // Will be updated
        totalOperations: 0, // Will be updated
      },
    };
  }

  private async getPortfolioStatistics(institutionId: string) {
    const portfolios = await this.portfolioService.findAll({ institutionId });
    
    return {
      totalPortfolios: portfolios.total,
      totalValue: portfolios.portfolios.reduce((sum, p) => sum + p.metrics.netValue, 0),
      averageReturn: portfolios.portfolios.reduce((sum, p) => sum + p.metrics.averageReturn, 0) / portfolios.total,
      byType: this.groupPortfoliosByType(portfolios.portfolios),
      topPerforming: this.getTopPerformingPortfolios(portfolios.portfolios),
    };
  }

  private async getProspectStatistics(institutionId: string) {
    const prospects = await this.prospectService.findAll({ institutionId });
    
    return {
      totalProspects: prospects.total,
      byStatus: this.groupProspectsByStatus(prospects.prospects),
      byIndustry: this.groupProspectsByIndustry(prospects.prospects),
      conversionRate: this.calculateConversionRate(prospects.prospects),
    };
  }

  private async getOperationStatistics(institutionId: string) {
    const operations = await this.operationService.findAll({ institutionId });
    
    return {
      totalOperations: operations.total,
      totalValue: this.calculateTotalOperationValue(operations.operations),
      byType: this.groupOperationsByType(operations.operations),
      byStatus: this.groupOperationsByStatus(operations.operations),
      approvalRate: this.calculateApprovalRate(operations.operations),
    };
  }

  private async getRecentActivity(institutionId: string) {
    // Combine recent activities from different sources
    const [recentProspects, recentOperations] = await Promise.all([
      this.prospectService.findAll({ institutionId }, 1, 5),
      this.operationService.findAll({ institutionId }, 1, 5),
    ]);

    return this.mergeAndSortActivities([
      ...this.formatProspectActivities(recentProspects.prospects),
      ...this.formatOperationActivities(recentOperations.operations),
    ]);
  }

  private groupPortfoliosByType(portfolios: any[]): Record<string, number> {
    return portfolios.reduce((acc: Record<string, number>, portfolio) => {
      acc[portfolio.type] = (acc[portfolio.type] || 0) + 1;
      return acc;
    }, {});
  }

  private getTopPerformingPortfolios(portfolios: any[]): any[] {
    return [...portfolios]
      .sort((a, b) => b.metrics.averageReturn - a.metrics.averageReturn)
      .slice(0, 5);
  }

  private groupProspectsByStatus(prospects: any[]): Record<string, number> {
    return prospects.reduce((acc: Record<string, number>, prospect) => {
      acc[prospect.status] = (acc[prospect.status] || 0) + 1;
      return acc;
    }, {});
  }

  private groupProspectsByIndustry(prospects: any[]): Record<string, number> {
    return prospects.reduce((acc: Record<string, number>, prospect) => {
      acc[prospect.sector] = (acc[prospect.sector] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateConversionRate(prospects: any[]): number {
    const converted = prospects.filter(p => p.status === 'converted').length;
    return prospects.length > 0 ? (converted / prospects.length) * 100 : 0;
  }

  private calculateTotalOperationValue(operations: any[]): number {
    return operations.reduce((sum, op) => sum + (op.requestedAmount || 0), 0);
  }

  private groupOperationsByType(operations: any[]): Record<string, number> {
    return operations.reduce((acc: Record<string, number>, operation) => {
      acc[operation.type] = (acc[operation.type] || 0) + 1;
      return acc;
    }, {});
  }

  private groupOperationsByStatus(operations: any[]): Record<string, number> {
    return operations.reduce((acc: Record<string, number>, operation) => {
      acc[operation.status] = (acc[operation.status] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateApprovalRate(operations: any[]): number {
    const completed = operations.filter(op => op.status === 'completed').length;
    return operations.length > 0 ? (completed / operations.length) * 100 : 0;
  }

  private formatProspectActivities(prospects: any[]) {
    return prospects.map(prospect => ({
      type: 'prospect',
      id: prospect.id,
      title: prospect.name,
      description: `Prospect ${prospect.status}`,
      timestamp: prospect.updatedAt,
      metadata: {
        status: prospect.status,
        sector: prospect.sector,
      },
    }));
  }

  private formatOperationActivities(operations: any[]) {
    return operations.map(operation => ({
      type: 'operation',
      id: operation.id,
      title: operation.description,
      description: `Operation ${operation.status}`,
      timestamp: operation.updatedAt,
      metadata: {
        type: operation.type,
        status: operation.status,
        amount: operation.requestedAmount,
      },
    }));
  }

  private mergeAndSortActivities(activities: Array<{
    type: string;
    id: string;
    title: string;
    description: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }>) {
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}