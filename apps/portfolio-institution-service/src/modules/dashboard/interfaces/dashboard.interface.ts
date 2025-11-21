// ======= TYPES OHADA CONFORMES À LA DOCUMENTATION =======

import { RiskLevel } from '@wanzobe/shared';

// Ré-export RiskLevel pour utilisation locale
export { RiskLevel };

export enum RiskRating {
  AAA = 'AAA',
  AA = 'AA',
  A = 'A',
  BBB = 'BBB',
  BB = 'BB',
  B = 'B',
  CCC = 'CCC'
}

export enum RegulatoryFramework {
  OHADA = 'OHADA',
  BCEAO = 'BCEAO'
}

export enum ComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  WARNING = 'WARNING',
  NON_COMPLIANT = 'NON_COMPLIANT'
}

export interface BalanceAGE {
  current: number; // 0-30 jours (%)
  days30: number; // 31-60 jours (%)
  days60: number; // 61-90 jours (%)
  days90Plus: number; // 90+ jours (%)
}

export interface RegulatoryCompliance {
  bceaoCompliant: boolean; // Conformité BCEAO (NPL < 5%)
  ohadaProvisionCompliant: boolean; // Conformité OHADA provisions
  riskRating: RiskRating;
}

export interface OHADAMetrics {
  id: string;
  name: string;
  sector: string;
  
  // Métriques financières de base
  totalAmount: number;
  activeContracts: number;
  avgLoanSize: number;
  
  // Ratios OHADA critiques
  nplRatio: number; // NPL ratio (%)
  provisionRate: number; // Taux de provisionnement (%)
  collectionEfficiency: number; // Efficacité de recouvrement (%)
  
  // Balance âgée conforme OHADA
  balanceAGE: BalanceAGE;
  
  // Ratios de performance
  roa: number; // Return on Assets (%)
  portfolioYield: number; // Rendement du portefeuille (%)
  riskLevel: RiskLevel;
  growthRate: number; // Taux de croissance (%)
  
  // Données temporelles
  monthlyPerformance: number[];
  lastActivity: string;
  
  // Conformité réglementaire
  regulatoryCompliance?: RegulatoryCompliance;
}

export interface OHADAMetricsResponse {
  success: boolean;
  data: OHADAMetrics[];
  metadata: {
    totalPortfolios: number;
    calculationDate: string;
    regulatoryFramework: RegulatoryFramework;
    complianceStatus: ComplianceStatus;
  };
  benchmarks: {
    avgNplRatio: number; // Seuil BCEAO: 5%
    avgProvisionRate: number; // Norme OHADA: 3-5%
    avgROA: number; // Marché CEMAC: 3.2%
    avgYield: number; // Marché: 14.5%
    collectionEfficiency: number; // Standard: 90%
  };
}

// ======= TYPES CUSTOMISATION DASHBOARD =======

export enum WidgetType {
  // KPI Widgets
  OVERVIEW_METRICS = 'overview_metrics',
  PORTFOLIO_PERFORMANCE = 'portfolio_performance',
  RISK_INDICATORS = 'risk_indicators',
  
  // Analysis Widgets
  BALANCE_AGE_ANALYSIS = 'balance_age_analysis',
  SECTOR_DISTRIBUTION = 'sector_distribution',
  GEOGRAPHIC_DISTRIBUTION = 'geographic_distribution',
  PERFORMANCE_TRENDS = 'performance_trends',
  
  // Compliance Widgets
  REGULATORY_COMPLIANCE = 'regulatory_compliance',
  RISK_ASSESSMENT = 'risk_assessment',
  
  // Activity Widgets
  RECENT_ACTIVITIES = 'recent_activities',
  PORTFOLIO_HEALTH = 'portfolio_health',
  CLIENT_DISTRIBUTION = 'client_distribution'
}

export enum WidgetCategory {
  KPI = 'KPI',
  ANALYSIS = 'ANALYSIS',
  COMPLIANCE = 'COMPLIANCE',
  ACTIVITY = 'ACTIVITY'
}

export interface WidgetConfig {
  id: WidgetType;
  title: string;
  description: string;
  category: WidgetCategory;
  defaultVisible: boolean;
  position: number;
  config?: Record<string, any>;
}

export interface DashboardPreferences {
  userId: string;
  widgets: Record<WidgetType, {
    visible: boolean;
    position: number;
    config?: Record<string, any>;
  }>;
  selectorPosition?: {
    x: number;
    y: number;
    minimized: boolean;
  };
  lastUpdated: string;
}

export interface ComplianceSummary {
  status: ComplianceStatus;
  riskLevel: RiskLevel;
  totalPortfolios: number;
  nonCompliantCount: number;
  complianceRate: string;
  details: {
    bceaoCompliance: {
      threshold: number;
      currentAvg: number;
      compliantCount: number;
      status: ComplianceStatus;
    };
    ohadaProvisionCompliance: {
      minThreshold: number;
      maxThreshold: number;
      currentAvg: number;
      compliantCount: number;
      status: ComplianceStatus;
    };
  };
}

// ======= TYPES LEGACY (Maintenues pour compatibilité) =======

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
