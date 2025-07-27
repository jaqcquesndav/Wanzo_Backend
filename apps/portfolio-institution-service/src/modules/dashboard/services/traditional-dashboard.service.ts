import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TraditionalDashboardMetrics, BasePerformanceMetrics, TraditionalAssetMetrics, TraditionalRiskMetrics, BaseClientMetrics } from '../interfaces/dashboard.interface';
import { Portfolio } from '../../portfolios/entities/portfolio.entity';
import { FinancialProduct } from '../../portfolios/entities/financial-product.entity';
import { FundingRequest } from '../../portfolios/entities/funding-request.entity';
import { Contract } from '../../portfolios/entities/contract.entity';
import { Repayment } from '../../portfolios/entities/repayment.entity';

@Injectable()
export class TraditionalDashboardService {
  constructor(
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

  async getTraditionalDashboardMetrics(
    institutionId: string,
    portfolioId?: string,
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly',
    startDateStr?: string,
    endDateStr?: string,
  ): Promise<TraditionalDashboardMetrics> {
    // Parse dates or use defaults
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    const startDate = startDateStr 
      ? new Date(startDateStr) 
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days

    // Build query conditions
    const where: any = {};
    
    if (portfolioId) {
      where.id = portfolioId;
    }

    // Fetch base data
    const [portfolios, products, contracts, repayments] = await Promise.all([
      this.portfolioRepository.find({ where }),
      this.productRepository.find({
        where: portfolioId ? { portfolio_id: portfolioId } : {},
      }),
      this.contractRepository.find({
        where: portfolioId ? { portfolio_id: portfolioId } : {},
      }),
      this.repaymentRepository.find({
        where: {
          due_date: Between(startDate, endDate),
          ...(portfolioId ? { portfolio_id: portfolioId } : {}),
        },
      }),
    ]);

    // Calculate metrics
    const assetMetrics = this.calculateTraditionalAssetMetrics(portfolios, products);
    const performanceMetrics = this.calculatePerformanceMetrics(period);
    const riskMetrics = this.calculateTraditionalRiskMetrics(portfolios);
    const clientMetrics = this.calculateClientMetrics(contracts);
    const paymentStatus = this.calculatePaymentStatus(repayments);

    return {
      assets: assetMetrics,
      performance: performanceMetrics,
      risk: riskMetrics,
      clients: clientMetrics,
      paymentStatus,
    };
  }

  private calculateTraditionalAssetMetrics(
    portfolios: Portfolio[],
    products: FinancialProduct[],
  ): TraditionalAssetMetrics {
    const totalValue = portfolios.reduce((sum, p) => sum + Number(p.totalAmount), 0);
    const totalCount = portfolios.length;
    
    // Calculate credit distribution - simplified
    const distribution = {
      credit: 0.70,
      microfinance: 0.20,
      treasury: 0.10,
    };
    
    return {
      totalValue,
      totalCount,
      averageSize: totalCount > 0 ? totalValue / totalCount : 0,
      growth: 0.12, // Mock value - 12% growth
      distribution,
      creditUtilization: 0.75, // Mock value - 75% utilization
    };
  }

  private calculatePerformanceMetrics(
    period: string,
  ): BasePerformanceMetrics {
    // Mock data for demonstration
    return {
      global: 0.82, // 82% performance rate
      change: 0.05, // 5% improvement
      monthly: [
        { month: 'Jan', value: 0.75 },
        { month: 'Feb', value: 0.78 },
        { month: 'Mar', value: 0.80 },
        { month: 'Apr', value: 0.82 },
        { month: 'May', value: 0.85 },
        { month: 'Jun', value: 0.82 },
      ],
      annual: [
        { year: '2022', value: 0.70 },
        { year: '2023', value: 0.75 },
        { year: '2024', value: 0.80 },
        { year: '2025', value: 0.82 },
      ],
    };
  }

  private calculateTraditionalRiskMetrics(
    portfolios: Portfolio[],
  ): TraditionalRiskMetrics {
    // Calculate average risk score from portfolios
    const avgRiskScore = portfolios.reduce((sum, p) => {
      return sum + (p.riskScore ? Number(p.riskScore) : 0);
    }, 0) / (portfolios.length || 1);

    return {
      riskScore: avgRiskScore,
      riskDistribution: {
        low: 0.6, // Mock distribution
        medium: 0.3,
        high: 0.1,
      },
      defaultRate: 0.03, // Mock value - 3% default rate
      delinquencyRate: 0.08, // Mock value - 8% delinquency
      provisionRate: 0.05, // Mock value - 5% provision
      concentrationRisk: 0.15, // Mock value - 15% concentration risk
    };
  }

  private calculateClientMetrics(contracts: Contract[]): BaseClientMetrics {
    // Extract unique clients
    const clientIds = contracts.map(c => c.client_id);
    const uniqueClientIds = [...new Set(clientIds)];
    const totalCount = uniqueClientIds.length;
    
    // Mock values for other metrics
    return {
      totalCount,
      newCount: Math.round(totalCount * 0.2), // Assume 20% are new
      activeCount: Math.round(totalCount * 0.85), // Assume 85% are active
      retentionRate: 0.78, // 78% retention rate
    };
  }

  private calculatePaymentStatus(repayments: Repayment[]) {
    // Mock payment status distribution
    return {
      onTime: 0.82, // 82% on time
      late30Days: 0.12, // 12% up to 30 days late
      late60Days: 0.04, // 4% 30-60 days late
      late90Days: 0.02, // 2% more than 60 days late
    };
  }
}
