import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { InstitutionService } from '../../institution/services/institution.service';
import { ProspectService } from '../../prospection/services/prospect.service';
import { PortfolioService } from '../../portfolios/services/portfolio.service';
import { DashboardData, TraditionalDashboardMetrics, BasePerformanceMetrics, TraditionalAssetMetrics, TraditionalRiskMetrics, BaseClientMetrics } from '../interfaces/dashboard.interface';
import { Portfolio } from '../../portfolios/entities/portfolio.entity';
import { FinancialProduct, ProductStatus, ProductType } from '../../portfolios/entities/financial-product.entity';
import { FundingRequest } from '../../portfolios/entities/funding-request.entity';
import { Contract } from '../../portfolios/entities/contract.entity';
import { Repayment, RepaymentStatus } from '../../portfolios/entities/repayment.entity';

@Injectable()
export class DashboardService {
  constructor(
    private institutionService: InstitutionService,
    private prospectService: ProspectService,
    private portfolioService: PortfolioService,
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(FinancialProduct)
    private productRepository: Repository<FinancialProduct>,
    @InjectRepository(FundingRequest)
    private fundingRequestRepository: Repository<FundingRequest>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Repayment)
    private repaymentRepository: Repository<Repayment>,
  ) {}

  async getDashboardData(institutionId: string): Promise<DashboardData> {
    const [
      institution,
      portfolioStats,
      prospectStats,
      recentActivity,
      traditional,
    ] = await Promise.all([
      this.getInstitutionOverview(institutionId),
      this.getPortfolioStatistics(institutionId),
      this.getProspectStatistics(institutionId),
      this.getRecentActivity(institutionId),
      this.getTraditionalDashboardMetrics(institutionId),
    ]);

    return {
      institution,
      portfolioStats,
      prospectStats,
      operationStats: {
        totalOperations: 0,
        totalValue: 0,
        byType: {},
        byStatus: {},
        approvalRate: 0,
      },
      recentActivity,
      traditional,
    };
  }

  private async getInstitutionOverview(institutionId: string) {
    const institution = await this.institutionService.findById(institutionId);
    return {
      name: institution.name,
      type: institution.type.toString(),
      regulatoryStatus: institution.regulatory_status ? institution.regulatory_status.toString() : 'unknown',
      metrics: {
        totalUsers: institution.users.length,
        totalPortfolios: 0, // Will be updated
        totalProspects: 0, // Will be updated
        totalOperations: 0, // Will be updated
      },
    };
  }

  private async getPortfolioStatistics(institutionId: string) {
    const portfoliosResult = await this.portfolioRepository.find({
      where: { clientId: institutionId },
    });
    
    return {
      totalPortfolios: portfoliosResult.length,
      totalValue: portfoliosResult.reduce((sum, p) => sum + Number(p.total_amount), 0),
      averageReturn: 0.08, // Mock value - 8% average return
      byType: portfoliosResult.reduce((acc: Record<string, number>, portfolio) => {
        const type = portfolio.status;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      topPerforming: portfoliosResult
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          name: p.name,
          totalAmount: p.total_amount,
          performance: Math.random() * 0.15 // Mock performance between 0-15%
        })),
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
  
  private async getRecentActivity(institutionId: string) {
    // Only get prospect activities
    const recentProspects = await this.prospectService.findAll({ institutionId }, 1, 10);

    return this.formatProspectActivities(recentProspects.prospects);
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

  // Traditional Dashboard metrics implementation
  private async getTraditionalDashboardMetrics(institutionId: string): Promise<TraditionalDashboardMetrics> {
    // Get portfolios for the institution
    const portfolios = await this.portfolioRepository.find({
      where: { clientId: institutionId },
    });
    
    const portfolioIds = portfolios.map(p => p.id);
    
    // Get products for these portfolios
    const products = await this.productRepository.find({
      where: { portfolio_id: In(portfolioIds) },
    });
    
    // Get contracts for these portfolios
    const contracts = await this.contractRepository.find({
      where: { portfolio_id: In(portfolioIds) },
    });
    
    // Get repayments for these contracts
    const repayments = await this.repaymentRepository.find({
      where: { contract_id: In(contracts.map(c => c.id)) },
    });

    // Calculate metrics
    const performance = this.calculateTraditionalPerformance(products, contracts);
    const assets = this.calculateTraditionalAssetDistribution(products);
    const risk = this.calculateTraditionalRiskMetrics(repayments);
    const clients = this.calculateTraditionalClientMetrics(contracts);

    return {
      performance,
      assets,
      risk,
      clients
    };
  }

  private calculateTraditionalPerformance(products: FinancialProduct[], contracts: Contract[]): BasePerformanceMetrics {
    // Mock data for now
    return {
      global: 0.08,
      change: 0.02,
      monthly: [
        { month: 'Jan', value: 0.07 },
        { month: 'Feb', value: 0.075 },
        { month: 'Mar', value: 0.08 }
      ],
      annual: [
        { year: '2023', value: 0.06 },
        { year: '2024', value: 0.07 },
        { year: '2025', value: 0.08 }
      ]
    };
  }

  private calculateTraditionalAssetDistribution(products: FinancialProduct[]): TraditionalAssetMetrics {
    const totalValue = products.reduce((sum, p) => sum + Number(p.max_amount), 0);
    const totalCount = products.length;
    
    // Calculate distribution
    const creditProducts = products.filter(p => p.type === ProductType.CREDIT);
    const savingsProducts = products.filter(p => p.type === ProductType.SAVINGS);
    
    const creditValue = creditProducts.reduce((sum, p) => sum + Number(p.max_amount), 0);
    const savingsValue = savingsProducts.reduce((sum, p) => sum + Number(p.max_amount), 0);
    
    return {
      totalValue,
      totalCount,
      averageSize: totalCount > 0 ? totalValue / totalCount : 0,
      growth: 0.05, // Mock 5% growth
      distribution: {
        credit: totalValue > 0 ? creditValue / totalValue : 0,
        savings: totalValue > 0 ? savingsValue / totalValue : 0
      },
      creditUtilization: 0.7 // Mock 70% utilization
    };
  }

  private calculateTraditionalRiskMetrics(repayments: Repayment[]): TraditionalRiskMetrics {
    const total = repayments.length;
    
    // Calculate delinquency rates
    const onTimeCount = repayments.filter(r => 
      r.status === RepaymentStatus.COMPLETED || r.status === RepaymentStatus.PENDING
    ).length;
    
    const late30Count = repayments.filter(r => 
      r.status === RepaymentStatus.PARTIAL && r.daysLate && r.daysLate <= 30
    ).length;
    
    const late60Count = repayments.filter(r => 
      r.status === RepaymentStatus.PARTIAL && r.daysLate && r.daysLate > 30 && r.daysLate <= 60
    ).length;
    
    const late90Count = repayments.filter(r => 
      r.status === RepaymentStatus.PARTIAL && r.daysLate && r.daysLate > 60
    ).length;

    const onTimeRate = total > 0 ? onTimeCount / total : 0;
    const delinquencyRate = total > 0 ? (late30Count + late60Count + late90Count) / total : 0;
    
    return {
      riskScore: 65, // Mock risk score
      riskDistribution: {
        low: 0.6,
        medium: 0.3,
        high: 0.1
      },
      defaultRate: 0.03, // Mock 3% default rate
      delinquencyRate,
      provisionRate: 0.05, // Mock 5% provision rate
      concentrationRisk: 0.25 // Mock 25% concentration risk
    };
  }

  private calculateTraditionalClientMetrics(contracts: Contract[]): BaseClientMetrics {
    // Get unique clients
    const uniqueClients = [...new Set(contracts.map(c => c.client_id))];
    const totalClients = uniqueClients.length;
    const activeClients = Math.floor(totalClients * 0.8); // Mock 80% active
    const newClients = Math.floor(totalClients * 0.15); // Mock 15% new
    
    return {
      totalCount: totalClients,
      activeCount: activeClients,
      newCount: newClients,
      retentionRate: 0.85 // Mock 85% retention
    };
  }
}