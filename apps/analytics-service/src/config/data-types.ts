// Types pour la configuration des données RDC
export interface Province {
  id: string;
  name: string;
  code: string;
  riskScore: number;
  population: number;
  economicIndicators: {
    gdpContribution: number;
    businessDensity: number;
    financialInclusion: number;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  capital: string;
  surface: number; // km²
  density: number; // hab/km²
}

export interface EconomicSector {
  id: string;
  name: string;
  code: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  defaultRate: number;
  growthRate: number;
  totalSMEs: number;
  avgRevenue: number;
  volatility: number;
  seasonality: boolean;
  regulatoryRisk: number;
}

export interface FinancialInstitution {
  id: string;
  name: string;
  type: 'CENTRAL_BANK' | 'COMMERCIAL_BANK' | 'MICROFINANCE' | 'INSURANCE' | 'INVESTMENT_FUND';
  license: string;
  riskScore: number;
  totalAssets: number;
  capitalRatio: number;
  foundedYear: number;
  headquarters: string;
  employeeCount?: number;
  branchCount?: number;
  isSystemicallyImportant: boolean;
}

export interface RiskThreshold {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  minScore: number;
  maxScore: number;
  description: string;
  actions: string[];
}

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number; // versus USD
  lastUpdate: string;
}

export interface AnalyticsConstants {
  fraudDetectionThresholds: {
    structuringAmount: number;
    layeringLevels: number;
    circularTransactionDays: number;
    shellCompanyRevenue: number;
  };
  systemicRiskLimits: {
    interconnectionThreshold: number;
    concentrationLimit: number;
    capitalAdequacyMinimum: number;
    liquidityRatioMinimum: number;
  };
  reportingFrequency: {
    dailyMetrics: string[];
    weeklyReports: string[];
    monthlyAnalysis: string[];
    quarterlyAssessment: string[];
  };
}
