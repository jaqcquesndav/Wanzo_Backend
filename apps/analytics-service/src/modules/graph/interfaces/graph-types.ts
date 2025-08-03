// Interfaces pour les nœuds Neo4j du système financier Wanzo

export interface GeographicNode {
  id: string;
  name: string;
  code?: string;
  type: 'COUNTRY' | 'PROVINCE' | 'CITY' | 'COMMUNE';
  riskScore?: number;
  population?: number;
  economicIndicators?: {
    gdpContribution: number;
    businessDensity: number;
    financialInclusion: number;
  };
}

export interface SectorNode {
  id: string;
  name: string;
  code: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  defaultRate: number;
  growthRate?: number;
  totalSMEs?: number;
  avgRevenue?: number;
}

export interface SMENode {
  id: string;
  name: string;
  registrationNumber?: string;
  foundedYear?: number;
  employees?: number;
  revenue?: number;
  riskScore?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  legalForm?: string;
  taxId?: string;
}

export interface InstitutionNode {
  id: string;
  name: string;
  type: 'CENTRAL_BANK' | 'COMMERCIAL_BANK' | 'MICROFINANCE' | 'INSURANCE' | 'INVESTMENT_FUND';
  license?: string;
  riskScore?: number;
  totalAssets?: number;
  capitalRatio?: number;
  foundedYear?: number;
}

export interface PortfolioNode {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount?: number;
  riskProfile: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  expectedReturn?: number;
  maxLoss?: number;
  diversificationIndex?: number;
}

export interface CreditNode {
  id: string;
  amount: number;
  interestRate: number;
  term: number; // en mois
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'DEFAULT';
  disbursementDate?: string;
  maturityDate?: string;
  collateralValue?: number;
  riskGrade?: string;
}

export interface RiskEventNode {
  id: string;
  type: 'DEFAULT' | 'FRAUD' | 'SYSTEMIC' | 'MARKET' | 'OPERATIONAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  amount?: number;
  description?: string;
  resolved: boolean;
  impact?: number;
}

export interface GuaranteeNode {
  id: string;
  type: 'REAL_ESTATE' | 'VEHICLE' | 'EQUIPMENT' | 'CASH' | 'BANK_GUARANTEE' | 'PERSONAL';
  value: number;
  assessmentDate: string;
  condition?: string;
  liquidityRate?: number;
}

// Relations entre les nœuds
export interface GraphRelationship {
  type: RelationshipType;
  properties?: Record<string, any>;
}

export type RelationshipType = 
  // Relations géographiques
  | 'PART_OF'
  | 'LOCATED_IN'
  | 'SERVES_REGION'
  
  // Relations business
  | 'OPERATES_IN'
  | 'OWNS'
  | 'MANAGES'
  | 'PARTNERS_WITH'
  | 'COMPETES_WITH'
  
  // Relations financières
  | 'HAS_CREDIT'
  | 'PROVIDES_CREDIT'
  | 'GUARANTEES'
  | 'INVESTS_IN'
  | 'BORROWS_FROM'
  
  // Relations de risque
  | 'HAS_RISK_PROFILE'
  | 'AFFECTED_BY'
  | 'CORRELATED_WITH'
  | 'EXPOSED_TO'
  
  // Relations de surveillance
  | 'MONITORS'
  | 'REPORTS_TO'
  | 'REGULATES'
  | 'SUPERVISES'
  
  // Relations temporelles
  | 'SUCCEEDED_BY'
  | 'PRECEDED_BY'
  | 'CONCURRENT_WITH';

// Types pour les requêtes Cypher
export interface CypherQuery {
  query: string;
  parameters?: Record<string, any>;
}

export interface GraphQueryOptions {
  limit?: number;
  skip?: number;
  orderBy?: string;
  direction?: 'ASC' | 'DESC';
}

// Types pour les résultats de requêtes
export interface NodeResult {
  identity: number;
  labels: string[];
  properties: Record<string, any>;
}

export interface RelationshipResult {
  identity: number;
  type: string;
  start: number;
  end: number;
  properties: Record<string, any>;
}

export interface PathResult {
  start: NodeResult;
  end: NodeResult;
  segments: Array<{
    start: NodeResult;
    relationship: RelationshipResult;
    end: NodeResult;
  }>;
  length: number;
}

// Types pour l'analyse de réseau
export interface NetworkAnalysis {
  centrality: {
    node: string;
    betweenness: number;
    closeness: number;
    degree: number;
    pagerank: number;
  }[];
  communities: {
    communityId: number;
    nodes: string[];
    modularity: number;
  }[];
  riskClusters: {
    clusterId: string;
    nodes: string[];
    avgRiskScore: number;
    interconnectedness: number;
  }[];
}

// Types pour la détection d'anomalies
export interface RiskPattern {
  patternId: string;
  type: 'CIRCULAR_LENDING' | 'EXCESSIVE_CONCENTRATION' | 'UNUSUAL_FLOW' | 'ISOLATED_ENTITY';
  entities: string[];
  riskScore: number;
  description: string;
  recommendations: string[];
}
