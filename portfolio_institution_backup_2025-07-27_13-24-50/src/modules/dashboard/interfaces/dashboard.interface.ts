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
}