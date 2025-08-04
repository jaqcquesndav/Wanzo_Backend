import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Extension des types de nœuds pour supporter les micro-relations
export enum ExtendedNodeType {
  // Types existants
  ENTERPRISE = 'enterprise',
  INSTITUTION = 'institution',
  PORTFOLIO = 'portfolio',
  OPERATION = 'operation',
  TRANSACTION = 'transaction',
  WORKFLOW = 'workflow',
  WORKFLOW_STEP = 'workflow_step',
  ALERT_RISK = 'alert_risk',
  SCORE_AML = 'score_aml',
  MARKET_INDEX = 'market_index',
  MACRO_TREND = 'macro_trend',
  
  // Nouveaux types pour micro-relations
  FINANCIAL_PRODUCT = 'financial_product',
  ECONOMIC_GROUP = 'economic_group',
  MARKET_SEGMENT = 'market_segment',
  PRODUCT_CATEGORY = 'product_category',
  RISK_CLUSTER = 'risk_cluster',
  CONCENTRATION_POINT = 'concentration_point',
  REGULATORY_FRAMEWORK = 'regulatory_framework',
  BUSINESS_RELATIONSHIP = 'business_relationship'
}

// Interface pour les produits financiers granulaires
export interface FinancialProductProperties {
  id: string;
  name: string;
  type: 'CREDIT' | 'DEPOSIT' | 'INVESTMENT' | 'INSURANCE' | 'GUARANTEE' | 'SERVICE';
  subType: string; // Ex: 'MICROCREDIT', 'SME_LOAN', 'WORKING_CAPITAL', 'TERM_DEPOSIT'
  category: 'INDIVIDUAL' | 'SME' | 'CORPORATE' | 'INTERBANK' | 'GOVERNMENT';
  riskCategory: 'RETAIL' | 'WHOLESALE' | 'TREASURY' | 'INVESTMENT';
  maturityBucket: 'DEMAND' | 'SHORT' | 'MEDIUM' | 'LONG'; // < 1 an, 1-5 ans, > 5 ans
  currencyCode: 'CDF' | 'USD' | 'EUR';
  amount: number;
  interestRate?: number;
  commission?: number;
  fees?: number;
  guaranteeType?: 'COLLATERAL' | 'PERSONAL' | 'INSTITUTIONAL' | 'NONE';
  riskWeight?: number; // Pondération réglementaire
  performanceStatus: 'PERFORMING' | 'WATCH' | 'SUBSTANDARD' | 'DOUBTFUL' | 'LOSS';
  creationDate: string;
  maturityDate?: string;
  lastReviewDate?: string;
  renewalCount?: number;
  originChannel: 'BRANCH' | 'DIGITAL' | 'AGENT' | 'PARTNER';
}

// Interface pour les groupes économiques
export interface EconomicGroupProperties {
  id: string;
  name: string;
  registrationNumber?: string;
  type: 'HOLDING' | 'COOPERATIVE' | 'FRANCHISE' | 'SUPPLY_CHAIN' | 'JOINT_VENTURE';
  legalStructure: 'SA' | 'SARL' | 'COOPERATIVE' | 'ASSOCIATION' | 'INFORMAL';
  controlStructure: 'CENTRALIZED' | 'FEDERATED' | 'NETWORK' | 'HYBRID';
  totalAssets?: number;
  totalRevenue?: number;
  memberCount: number;
  foundedYear?: number;
  mainSector: string;
  secondarySectors?: string[];
  geographicScope: 'LOCAL' | 'PROVINCIAL' | 'NATIONAL' | 'REGIONAL' | 'INTERNATIONAL';
  riskProfile: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  consolidatedRiskScore?: number;
  lastAuditDate?: string;
}

// Interface pour les segments de marché
export interface MarketSegmentProperties {
  id: string;
  name: string;
  description?: string;
  size: 'LARGE' | 'MEDIUM' | 'SMALL' | 'MICRO';
  maturity: 'EMERGING' | 'GROWING' | 'MATURE' | 'DECLINING';
  competitiveness: number; // 1-10 scale
  marketShare?: number; // Pourcentage du marché total
  growthRate?: number;
  profitability: 'HIGH' | 'MEDIUM' | 'LOW';
  barriers: 'HIGH' | 'MEDIUM' | 'LOW';
  regulation: 'STRICT' | 'MODERATE' | 'FLEXIBLE';
  seasonality?: boolean;
  volatility: number; // 1-10 scale
  targetCustomers: string[];
  keySuccessFactors: string[];
}

// Interface pour les catégories de produits
export interface ProductCategoryProperties {
  id: string;
  name: string;
  parentCategoryId?: string;
  level: number; // Niveau dans la hiérarchie
  riskProfile: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' | 'SPECULATIVE';
  regulatoryCategory: string;
  minimumAmount?: number;
  maximumAmount?: number;
  typicalMaturity?: number; // en mois
  targetMargin?: number;
  provisioning: {
    stage1: number;
    stage2: number;
    stage3: number;
  };
  complianceRequirements: string[];
}

// Interface pour les clusters de risque
export interface RiskClusterProperties {
  id: string;
  name: string;
  type: 'SECTOR' | 'GEOGRAPHIC' | 'PRODUCT' | 'CLIENT' | 'COUNTERPARTY';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  concentrationThreshold: number;
  currentConcentration: number;
  memberCount: number;
  totalExposure: number;
  averageRiskScore: number;
  correlationCoefficient?: number;
  lastAnalysisDate: string;
  monitoringFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  actionTriggers: {
    yellow: number;
    orange: number;
    red: number;
  };
  mitigationStrategies: string[];
}

// Interface pour les points de concentration
export interface ConcentrationPointProperties {
  id: string;
  type: 'SINGLE_BORROWER' | 'SECTOR' | 'GEOGRAPHIC' | 'PRODUCT' | 'MATURITY' | 'CURRENCY';
  entity: string; // ID de l'entité concernée
  threshold: number; // Seuil réglementaire ou interne
  currentLevel: number;
  maxHistorical: number;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  riskRating: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  lastBreachDate?: string;
  mitigationPlan?: string;
  reviewFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  responsibleTeam: string;
}

// Relations étendues pour les micro-analyses
export enum ExtendedEdgeType {
  // Relations existantes
  BELONGS_TO = 'belongs_to',
  OWNS = 'owns',
  INVESTS_IN = 'invests_in',
  APPROVES = 'approves',
  GENERATES = 'generates',
  CONCERNS = 'concerns',
  SIGNALS = 'signals',
  IMPACTS = 'impacts',
  EVOLVES_WITH = 'evolves_with',
  SUCCEEDS = 'succeeds',
  
  // Nouvelles relations micro-granulaires
  CONCENTRATES_IN = 'concentrates_in',
  DIVERSIFIES_ACROSS = 'diversifies_across',
  SPECIALIZES_IN = 'specializes_in',
  DOMINATES_MARKET = 'dominates_market',
  CORRELATES_WITH = 'correlates_with',
  SUBSTITUTES_FOR = 'substitutes_for',
  COMPLEMENTS = 'complements',
  COMPETES_WITH = 'competes_with',
  SUPPLIES_TO = 'supplies_to',
  SOURCES_FROM = 'sources_from',
  CONTROLS = 'controls',
  INFLUENCES = 'influences',
  DEPENDS_ON = 'depends_on',
  MITIGATES = 'mitigates',
  AMPLIFIES = 'amplifies',
  TRANSFERS_RISK = 'transfers_risk',
  SHARES_RISK = 'shares_risk',
  HEDGES_AGAINST = 'hedges_against',
  EXPOSES_TO = 'exposes_to',
  LIMITS_EXPOSURE = 'limits_exposure'
}

// Propriétés spécifiques pour les relations de concentration
export interface ConcentrationRelationshipProperties {
  concentrationRatio: number; // Pourcentage de concentration
  riskWeight: number;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  duration: number; // Durée en mois
  volatility?: number;
  seasonalPattern?: boolean;
  correlationStrength?: number; // -1 à 1
  lastMeasurement: string;
  thresholdStatus: 'WITHIN' | 'APPROACHING' | 'EXCEEDING';
}

// Propriétés pour les relations de risque
export interface RiskRelationshipProperties {
  riskTransferCoefficient: number; // 0 à 1
  propagationSpeed: 'IMMEDIATE' | 'FAST' | 'MODERATE' | 'SLOW';
  impactSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mitigationEffectiveness?: number; // 0 à 1
  historicalCorrelation?: number;
  stressTestSensitivity?: number;
  recoveryTime?: number; // en jours
  contagionProbability?: number; // 0 à 1
}

@Entity('extended_graph_nodes')
export class ExtendedNode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  kiotaId!: string;

  @Column({
    type: 'enum',
    enum: ExtendedNodeType
  })
  type!: ExtendedNodeType;

  @Column()
  label!: string;

  @Column('jsonb')
  properties!: 
    | FinancialProductProperties 
    | EconomicGroupProperties 
    | MarketSegmentProperties 
    | ProductCategoryProperties
    | RiskClusterProperties
    | ConcentrationPointProperties
    | Record<string, any>;

  @Column('jsonb', { nullable: true })
  microRelationMetrics?: {
    centralityScore?: number;
    clusteringCoefficient?: number;
    betweennessCentrality?: number;
    pageRankScore?: number;
    communityId?: string;
    riskContribution?: number;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('extended_graph_edges')
export class ExtendedEdge {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: ExtendedEdgeType
  })
  type!: ExtendedEdgeType;

  @Column('uuid')
  sourceId!: string;

  @Column('uuid')
  targetId!: string;

  @Column('jsonb')
  properties!: 
    | ConcentrationRelationshipProperties 
    | RiskRelationshipProperties 
    | Record<string, any>;

  @Column('jsonb', { nullable: true })
  analytics?: {
    strength?: number; // Force de la relation
    frequency?: number; // Fréquence d'interaction
    direction?: 'BIDIRECTIONAL' | 'UNIDIRECTIONAL';
    stability?: number; // Stabilité dans le temps
    seasonality?: boolean;
    criticalityScore?: number; // Importance systémique
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
