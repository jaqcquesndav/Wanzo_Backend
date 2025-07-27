  import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TraditionalDashboardMetrics, BasePerformanceMetrics, TraditionalAssetMetrics, TraditionalRiskMetrics, BaseClientMetrics } from '../interfaces/dashboard.interface';
import { Portfolio } from '../../portfolios/entities/portfolio.entity';
import { FinancialProduct, ProductType } from '../../portfolios/entities/financial-product.entity';
import { FundingRequest } from '../../portfolios/entities/funding-request.entity';
import { Contract } from '../../portfolios/entities/contract.entity';
import { Repayment, RepaymentStatus } from '../../portfolios/entities/repayment.entity';

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
    const conditions: any = { 
      institutionId 
    };
    
    if (portfolioId) {
      conditions.id = portfolioId;
    }

    // Fetch base data
    const [portfolios, products, contracts, repayments] = await Promise.all([
      this.portfolioRepository.find({
        where: conditions,
        relations: ['settings'],
      }),
      this.productRepository.find({
        where: portfolioId ? { portfolio_id: portfolioId } : {},
      }),
      this.contractRepository.find({
        where: portfolioId ? { portfolio_id: portfolioId } : {},
        relations: ['client'],
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
    const performanceMetrics = this.calculatePerformanceMetrics(portfolios, repayments, period, startDate, endDate);
    const riskMetrics = this.calculateTraditionalRiskMetrics(portfolios, repayments);
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
    
    // Calculate credit distribution
    const creditProducts = products.filter(p => p.type === ProductType.CREDIT);
    const savingsProducts = products.filter(p => p.type === ProductType.SAVINGS);
    
    const totalProductValue = products.reduce((sum, p) => sum + Number(p.max_amount), 0);
    
    return {
      totalValue,
      totalCount,
      averageSize: totalCount > 0 ? totalValue / totalCount : 0,
      growth: 0, // Would need historical data to calculate
      distribution: {
        credit: totalProductValue > 0 
          ? creditProducts.reduce((sum, p) => sum + Number(p.max_amount), 0) / totalProductValue 
          : 0,
        savings: totalProductValue > 0 
          ? savingsProducts.reduce((sum, p) => sum + Number(p.max_amount), 0) / totalProductValue 
          : 0,
      },
      creditUtilization: 0.75, // Mock value, would need loan data to calculate actual utilization
    };
  }

  private calculatePerformanceMetrics(
    portfolios: Portfolio[],
    repayments: Repayment[],
    period: string,
    startDate: Date,
    endDate: Date,
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
    repayments: Repayment[],
  ): TraditionalRiskMetrics {
    // Calculate average risk score from portfolios
    const avgRiskScore = portfolios.reduce((sum, p) => {
      return sum + (p.riskScore ? Number(p.riskScore) : 0);
    }, 0) / (portfolios.length || 1);

    // Count late repayments to estimate default rate
    const lateRepayments = repayments.filter(r => 
      r.status === RepaymentStatus.FAILED || r.status === RepaymentStatus.PARTIAL
    );
    const defaultRate = repayments.length > 0 
      ? lateRepayments.length / repayments.length
      : 0;

    return {
      riskScore: avgRiskScore,
      riskDistribution: {
        low: 0.6, // Mock distribution
        medium: 0.3,
        high: 0.1,
      },
      defaultRate,
      delinquencyRate: 0.08, // Mock value
      provisionRate: 0.05, // Mock value
      concentrationRisk: 0.15, // Mock value
    };
  }

  private calculateClientMetrics(contracts: Contract[]): BaseClientMetrics {
    // Extract unique clients
    const uniqueClientIds = new Set(contracts.map(c => c.client_id));
    const totalCount = uniqueClientIds.size;
    
    // Mock values for other metrics
    return {
      totalCount,
      newCount: Math.round(totalCount * 0.2), // Assume 20% are new
      activeCount: Math.round(totalCount * 0.85), // Assume 85% are active
      retentionRate: 0.78, // 78% retention rate
    };
  }

  private calculatePaymentStatus(repayments: Repayment[]) {
    const total = repayments.length;
    if (total === 0) {
      return {
        onTime: 0,
        late30Days: 0,
        late60Days: 0,
        late90Days: 0,
      };
    }

    // Filter repayments by days late
    const onTime = repayments.filter(r => r.status === RepaymentStatus.COMPLETED || r.status === RepaymentStatus.PENDING).length;
    const late30 = repayments.filter(r => r.status === RepaymentStatus.PARTIAL && r.daysLate && r.daysLate <= 30).length;
    const late60 = repayments.filter(r => r.status === RepaymentStatus.PARTIAL && r.daysLate && r.daysLate > 30 && r.daysLate <= 60).length;
    const late90 = repayments.filter(r => r.status === RepaymentStatus.PARTIAL && r.daysLate && r.daysLate > 60).length;

    return {
      onTime: onTime / total,
      late30Days: late30 / total,
      late60Days: late60 / total,
      late90Days: late90 / total,
    };
  }
}
