export interface BaseAssetMetrics {
  totalValue: number;
  totalCount: number;
  averageSize: number;
  growth: number;
}

export interface BaseClientMetrics {
  totalCount: number;
  newCount: number;
  activeCount: number;
  retentionRate: number;
}

export interface BaseRiskMetrics {
  riskScore: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  defaultRate: number;
}

export interface BasePerformanceMetrics {
  global: number;
  change: number;
  monthly: Array<{
    month: string;
    value: number;
  }>;
  annual: Array<{
    year: string;
    value: number;
  }>;
}

export interface TraditionalAssetMetrics extends BaseAssetMetrics {
  distribution: {
    credit: number;
    savings: number;
  };
  creditUtilization: number;
}

export interface TraditionalRiskMetrics extends BaseRiskMetrics {
  delinquencyRate: number;
  provisionRate: number;
  concentrationRisk: number;
}

export interface TraditionalDashboardMetrics {
  assets: TraditionalAssetMetrics;
  performance: BasePerformanceMetrics;
  risk: TraditionalRiskMetrics;
  clients: BaseClientMetrics;
  paymentStatus?: {
    onTime: number;
    late30Days: number;
    late60Days: number;
    late90Days: number;
  };
}

export interface DashboardData {
  institution: {
    name: string;
    type: string;
    regulatoryStatus: string;
    metrics: {
      totalUsers: number;
      totalPortfolios: number;
      totalProspects: number;
      totalOperations: number;
    };
  };
  portfolioStats: {
    totalPortfolios: number;
    totalValue: number;
    averageReturn: number;
    byType: Record<string, number>;
    topPerforming: any[];
  };
  prospectStats: {
    totalProspects: number;
    byStatus: Record<string, number>;
    byIndustry: Record<string, number>;
    conversionRate: number;
  };
  operationStats: {
    totalOperations: number;
    totalValue: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    approvalRate: number;
  };
  recentActivity: Array<{
    type: string;
    id: string;
    title: string;
    description: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }>;
  traditional: TraditionalDashboardMetrics;
}
