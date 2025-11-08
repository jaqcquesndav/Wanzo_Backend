import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';

export enum PlanStatus {
  DRAFT = 'DRAFT',
  DEPLOYED = 'DEPLOYED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

export enum CustomerType {
  SME = 'SME',
  FINANCIAL_INSTITUTION = 'FINANCIAL_INSTITUTION',
}

export enum FeatureCode {
  // Features de base
  BASIC_REPORTS = 'BASIC_REPORTS',
  CUSTOMER_MANAGEMENT = 'CUSTOMER_MANAGEMENT',
  TRANSACTION_HISTORY = 'TRANSACTION_HISTORY',
  
  // Features avancées
  FINANCIAL_REPORTS = 'FINANCIAL_REPORTS',
  CREDIT_ANALYSIS = 'CREDIT_ANALYSIS',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  PORTFOLIO_ANALYSIS = 'PORTFOLIO_ANALYSIS',
  
  // Features premium
  AI_INSIGHTS = 'AI_INSIGHTS',
  PREDICTIVE_ANALYTICS = 'PREDICTIVE_ANALYTICS',
  CUSTOM_DASHBOARDS = 'CUSTOM_DASHBOARDS',
  WHITE_LABEL = 'WHITE_LABEL',
  
  // API et intégrations
  API_ACCESS = 'API_ACCESS',
  WEBHOOK_SUPPORT = 'WEBHOOK_SUPPORT',
  THIRD_PARTY_INTEGRATIONS = 'THIRD_PARTY_INTEGRATIONS',
  
  // Support et formation
  PRIORITY_SUPPORT = 'PRIORITY_SUPPORT',
  DEDICATED_ACCOUNT_MANAGER = 'DEDICATED_ACCOUNT_MANAGER',
  TRAINING_SESSIONS = 'TRAINING_SESSIONS',
  
  // Features techniques
  DATA_EXPORT = 'DATA_EXPORT',
  BULK_OPERATIONS = 'BULK_OPERATIONS',
  ADVANCED_FILTERS = 'ADVANCED_FILTERS',
  MULTI_CURRENCY = 'MULTI_CURRENCY',
  AUDIT_LOGS = 'AUDIT_LOGS',
  
  // Fonctionnalités mobiles
  MOBILE_APP_ACCESS = 'MOBILE_APP_ACCESS',
  OFFLINE_MODE = 'OFFLINE_MODE',
}

@Entity('subscription_plans')
@Index(['customerType', 'status'])
@Index(['status', 'isActive'])
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: CustomerType })
  customerType: CustomerType;

  @Column('decimal', { precision: 10, scale: 2 })
  monthlyPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  annualPrice: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  annualDiscount: number; // Pourcentage de réduction annuelle

  // Configuration des tokens
  @Column('jsonb')
  tokenConfig: {
    monthlyTokens: number;
    rolloverAllowed: boolean;
    maxRolloverMonths: number;
    tokenRates: Record<FeatureCode, number>;
    discountTiers: Array<{
      minTokens: number;
      discountPercentage: number;
    }>;
  };

  // Features avec limites
  @Column('jsonb')
  features: Record<FeatureCode, {
    enabled: boolean;
    limit?: number;
    description?: string;
    customConfig?: Record<string, any>;
  }>;

  // Limites générales du plan
  @Column('jsonb')
  limits: {
    maxUsers: number;
    maxAPICallsPerDay: number;
    maxDataStorageGB: number;
    maxReportsPerMonth: number;
    maxConcurrentSessions: number;
    maxDashboards: number;
    maxCustomFields: number;
  };

  // Statut et visibilité
  @Column({ type: 'enum', enum: PlanStatus, default: PlanStatus.DRAFT })
  status: PlanStatus;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isVisible: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  // Métadonnées et configuration
  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ nullable: true })
  trialPeriodDays: number;

  @Column('jsonb', { nullable: true })
  metadata: {
    targetMarket?: string;
    salesNotes?: string;
    migrationInstructions?: string;
    featureHighlights?: string[];
    comparisonNotes?: string;
  };

  // Versioning et audit
  @Column({ default: 1 })
  version: number;

  @Column({ nullable: true })
  previousVersionId: string;

  @Column({ type: 'timestamp', nullable: true })
  deployedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt: Date;

  // Analytics et performance
  @Column('jsonb', { nullable: true })
  analytics: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    churnRate: number;
    averageLifetimeValue: number;
    monthlyRecurringRevenue: number;
    conversionRate: number;
    popularFeatures: Array<{
      feature: FeatureCode;
      usagePercentage: number;
    }>;
    customerSatisfactionScore: number;
    supportTicketsPerMonth: number;
  };

  // Audit fields
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @Column({ nullable: true })
  deployedBy: string;

  @Column({ nullable: true })
  archivedBy: string;

  // Relations
  @ManyToOne(() => SubscriptionPlan, { nullable: true })
  @JoinColumn({ name: 'previousVersionId' })
  previousVersion: SubscriptionPlan;

  @OneToMany(() => SubscriptionPlan, plan => plan.previousVersion)
  nextVersions: SubscriptionPlan[];

  // Méthodes utilitaires
  canBeDeployed(): boolean {
    return this.status === PlanStatus.DRAFT && this.isActive;
  }

  canBeArchived(): boolean {
    return this.status === PlanStatus.DEPLOYED;
  }

  canBeDeleted(): boolean {
    return this.status === PlanStatus.DRAFT || this.status === PlanStatus.ARCHIVED;
  }

  isDeployed(): boolean {
    return this.status === PlanStatus.DEPLOYED;
  }

  getEffectiveAnnualPrice(): number {
    const monthlyTotal = this.monthlyPrice * 12;
    return monthlyTotal * (1 - this.annualDiscount / 100);
  }

  getFeatureList(): FeatureCode[] {
    return Object.keys(this.features)
      .filter(feature => this.features[feature as FeatureCode].enabled)
      .map(feature => feature as FeatureCode);
  }

  hasFeature(feature: FeatureCode): boolean {
    return this.features[feature]?.enabled === true;
  }

  getFeatureLimit(feature: FeatureCode): number | undefined {
    return this.features[feature]?.limit;
  }
}