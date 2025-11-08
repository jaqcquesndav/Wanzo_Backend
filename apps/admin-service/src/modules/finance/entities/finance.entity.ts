import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';

// 8. Data Models from finance.md

// Enums from documentation
export enum SubscriptionStatus {
  ACTIVE = 'active',
  PENDING_ACTIVATION = 'pending_activation',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  PAUSED = 'paused',
  TRIAL = 'trial',
  PAYMENT_FAILED = 'payment_failed',
}

// Nouveaux enums pour la gestion des plans
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

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELED = 'cancelled',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  ANNUALLY = 'annually',
  QUARTERLY = 'quarterly',
  BIENNIALLY = 'biennially',
  ONE_TIME = 'one_time',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
  MOBILE_MONEY = 'mobile_money',
  CRYPTO = 'crypto',
  CASH = 'cash',
  CHECK = 'check',
  OTHER = 'other',
}

export enum PaymentStatus {
  VERIFIED = 'verified',
  PENDING = 'pending',
  REJECTED = 'rejected',
}

export enum TransactionType {
  PAYMENT = 'payment',
  INVOICE = 'invoice',
  REFUND = 'refund',
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum TransactionStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  FAILED = 'failed',
  CANCELED = 'canceled',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

// Entities based on documentation

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

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  currency: string;

  @Column({ type: 'enum', enum: BillingCycle })
  billingCycle: BillingCycle;

  // Nouveau champ pour le type de customer
  @Column({ type: 'enum', enum: CustomerType, default: CustomerType.SME })
  customerType: CustomerType;

  // Prix annuel et réduction
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  annualPrice: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  annualDiscount: number; // Pourcentage de réduction annuelle

  // ===== TOKENS INCLUS DANS LE PLAN =====
  @Column('bigint', { default: 0 })
  includedTokens: number;

  // Configuration moderne des tokens (compatible avec Customer Service)
  @Column('jsonb', { nullable: true })
  tokenConfig: {
    monthlyTokens: number;
    rolloverAllowed: boolean;
    maxRolloverMonths: number;
    rolloverLimit?: number;
    tokenRates: Record<FeatureCode, number>;
    discountTiers: Array<{
      minTokens: number;
      discountPercentage: number;
    }>;
  };

  // Features du plan avec système granulaire (compatible avec Customer Service)
  @Column('jsonb', { nullable: true })
  features: Record<FeatureCode, {
    enabled: boolean;
    limit?: number;
    description?: string;
    customConfig?: Record<string, any>;
  }>;

  // Limites du plan étendues
  @Column('jsonb', { nullable: true })
  limits: {
    maxUsers: number;
    maxAPICallsPerDay: number;
    maxDataStorageGB: number;
    maxReportsPerMonth: number;
    maxCustomFields: number;
    maxIntegrations: number;
    maxConcurrentSessions: number;
    maxDashboards: number;
    [key: string]: any;
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

  // Métadonnées étendues
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
    [key: string]: any;
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

  // Audit fields étendus
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

  @OneToMany(() => Subscription, subscription => subscription.plan)
  subscriptions: Subscription[];

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
    const baseAnnual = this.annualPrice || (this.price * 12);
    return baseAnnual * (1 - this.annualDiscount / 100);
  }

  getFeatureList(): FeatureCode[] {
    return Object.keys(this.features || {})
      .filter(feature => this.features[feature as FeatureCode]?.enabled)
      .map(feature => feature as FeatureCode);
  }

  hasFeature(feature: FeatureCode): boolean {
    return this.features?.[feature]?.enabled === true;
  }

  getFeatureLimit(feature: FeatureCode): number | undefined {
    return this.features?.[feature]?.limit;
  }
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  customerName: string;

  @Column()
  planId: string;

  @ManyToOne(() => SubscriptionPlan, plan => plan.subscriptions)
  @JoinColumn({ name: 'planId' })
  plan: SubscriptionPlan;

  @Column({ type: 'enum', enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ type: 'timestamp' })
  currentPeriodStart: Date;

  @Column({ type: 'timestamp' })
  currentPeriodEnd: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextBillingDate: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column({ type: 'enum', enum: BillingCycle })
  billingCycle: BillingCycle;

  @Column({ default: true })
  autoRenew: boolean;

  @Column({ nullable: true })
  paymentMethodId: string;

  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  canceledAt: Date;

  @Column('text', { nullable: true })
  cancellationReason: string;

  // ===== GESTION DES TOKENS (compatible avec Customer Service) =====
  @Column({ name: 'tokens_included', type: 'bigint', default: 0 })
  tokensIncluded: number;

  @Column({ name: 'tokens_used', type: 'bigint', default: 0 })
  tokensUsed: number;

  @Column({ name: 'tokens_remaining', type: 'bigint', default: 0 })
  tokensRemaining: number;

  @Column({ name: 'tokens_rolled_over', type: 'bigint', default: 0, nullable: true })
  tokensRolledOver: number;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Invoice, invoice => invoice.subscription)
  invoices: Invoice[];
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  invoiceNumber: string;

  @Column()
  customerId: string;

  @Column()
  customerName: string;
  
  @Column({ nullable: true })
  subscriptionId: string;

  @ManyToOne(() => Subscription, subscription => subscription.invoices)
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column({ type: 'enum', enum: InvoiceStatus })
  status: InvoiceStatus;

  @Column({ type: 'timestamp' })
  issueDate: Date;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidDate: Date;

  @OneToMany(() => InvoiceItem, item => item.invoice, { cascade: true })
  items: InvoiceItem[];

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2 })
  taxAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  discountAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column('text', { nullable: true })
  notes: string;
}

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Invoice, invoice => invoice.items)
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column()
  invoiceId: string;

  @Column('text')
  description: string;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  taxRate: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  taxAmount: number;
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  invoiceId: string;

  @Column()
  customerId: string;

  @Column()
  customerName: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ nullable: true })
  proofType: string;

  @Column({ nullable: true })
  proofUrl: string;

  @Column({ type: 'enum', enum: PaymentStatus })
  status: PaymentStatus;

  @Column({ nullable: true })
  transactionReference: string;

  @Column({ type: 'timestamp' })
  paidAt: Date;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  verifiedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  // === NOUVEAUX CHAMPS POUR SUBSCRIPTION PAYMENTS ===
  
  @Column({ nullable: true })
  planId?: string;
  
  @Column({ nullable: true })
  subscriptionId?: string;
  
  @Column({ nullable: true })
  providerTransactionId?: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reference: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'enum', enum: TransactionStatus })
  status: TransactionStatus;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  customerId: string;

  @Column({ nullable: true })
  customerName: string;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
