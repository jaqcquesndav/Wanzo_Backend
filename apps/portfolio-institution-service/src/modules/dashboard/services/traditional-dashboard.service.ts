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
    period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" = "monthly",
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
    const totalValue = portfolios.reduce((sum, p) => sum + Number(p.total_amount), 0);
    const totalCount = portfolios.length;
    
    // Calculate credit distribution - simplified with savings property to match interface
    const distribution = {
      credit: 0.50,
      savings: 0.50,
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
    // Mock implementation with correct interface properties
    return {
      global: 0.15, // 15% overall performance
      change: 0.03, // 3% change
      monthly: [
        { month: 'Jan', value: 0.12 },
        { month: 'Feb', value: 0.13 },
        { month: 'Mar', value: 0.14 },
        { month: 'Apr', value: 0.15 },
        { month: 'May', value: 0.16 },
        { month: 'Jun', value: 0.15 }
      ],
      annual: [
        { year: '2023', value: 0.13 },
        { year: '2024', value: 0.14 },
        { year: '2025', value: 0.15 }
      ]
    };
  }

  private calculateTraditionalRiskMetrics(
    portfolios: Portfolio[],
  ): TraditionalRiskMetrics {
    // Mock implementation with correct interface properties
    return {
      riskScore: 0.35, // 35% risk score
      riskDistribution: {
        low: 35,
        medium: 45,
        high: 20,
      },
      defaultRate: 0.03, // 3% default rate
      delinquencyRate: 0.03, // 3% delinquency rate
      provisionRate: 0.04, // 4% provision rate
      concentrationRisk: 0.25, // 25% concentration risk
    };
  }

  private calculateClientMetrics(
    contracts: Contract[],
  ): BaseClientMetrics {
    const totalClientCount = new Set(contracts.map(c => c.client_id)).size;
    
    // Mock implementation with correct interface properties
    return {
      totalCount: totalClientCount,
      newCount: Math.round(totalClientCount * 0.12), // 12% new clients
      activeCount: Math.round(totalClientCount * 0.85), // 85% active clients
      retentionRate: 0.92, // 92% retention rate
    };
  }

  private calculatePaymentStatus(
    repayments: Repayment[],
  ): { onTime: number; late30Days: number; late60Days: number; late90Days: number } {
    const total = repayments.length;
    
    if (total === 0) {
      return { onTime: 0, late30Days: 0, late60Days: 0, late90Days: 0 };
    }
    
    // Mock implementation
    return {
      onTime: Math.round(total * 0.85), // 85% on time
      late30Days: Math.round(total * 0.08), // 8% late 30 days
      late60Days: Math.round(total * 0.04), // 4% late 60 days
      late90Days: Math.round(total * 0.03), // 3% late 90 days
    };
  }
}
