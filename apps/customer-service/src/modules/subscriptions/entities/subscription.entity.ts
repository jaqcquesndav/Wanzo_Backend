import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  TRIAL = 'trial',
  PAST_DUE = 'past_due',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive'
}

export enum SubscriptionPlanType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
  ONE_TIME = 'one_time',
}

export enum PlanTier {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom'
}

/**
 * Entité SubscriptionPlan - Représente un plan d'abonnement disponible
 */
@Entity('subscription_plans')
@Index(['customerType', 'isActive'])
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  configId!: string; // ID depuis la configuration

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column()
  customerType!: string; // 'sme' | 'financial_institution'

  @Column({
    type: 'enum',
    enum: SubscriptionPlanType,
    default: SubscriptionPlanType.MONTHLY,
  })
  type!: SubscriptionPlanType;

  @Column({
    type: 'enum',
    enum: PlanTier,
    default: PlanTier.BASIC
  })
  tier!: PlanTier;

  @Column('decimal', { precision: 10, scale: 2 })
  priceUSD!: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  priceLocal!: number;

  @Column({ nullable: true })
  currency!: string;

  @Column('int')
  durationDays!: number;

  @Column('bigint')
  includedTokens!: number;

  // Configuration moderne des tokens
  @Column('jsonb', { nullable: true })
  tokenConfig!: {
    monthlyTokens: number;
    rolloverAllowed: boolean;
    maxRolloverMonths: number;
    rolloverLimit?: number;
    tokenRates: {
      creditAnalysis: number;
      riskAssessment: number;
      financialReporting: number;
      complianceCheck: number;
      marketAnalysis: number;
      predictiveModeling: number;
      [key: string]: number;
    };
  };

  @Column('jsonb')
  features!: {
    apiAccess: boolean;
    advancedAnalytics: boolean;
    customReporting: boolean;
    prioritySupport: boolean;
    multiUserAccess: boolean;
    dataExport: boolean;
    customIntegrations: boolean;
    whiteLabeling: boolean;
    dedicatedAccountManager: boolean;
    [key: string]: any;
  };

  @Column('jsonb', { nullable: true })
  limits!: {
    maxUsers: number;
    maxAPICallsPerDay: number;
    maxDataStorageGB: number;
    maxReportsPerMonth: number;
    maxCustomFields: number;
    maxIntegrations: number;
    [key: string]: any;
  };

  @Column('jsonb', { nullable: true })
  tokenAllocation!: {
    monthlyTokens: number;
    tokenRollover: boolean;
    maxRolloverMonths: number;
  };

  @Column('boolean', { default: false })
  isPopular!: boolean;

  @Column('boolean', { default: true })
  isActive!: boolean;

  @Column('boolean', { default: true })
  isVisible!: boolean;

  @Column('int', { default: 0 })
  sortOrder!: number;

  @Column('simple-array', { nullable: true })
  tags!: string[];

  @Column('jsonb', { nullable: true })
  discounts!: Array<{
    code: string;
    percentage: number;
    validUntil: Date;
  }>;

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

/**
 * Entité Subscription - Représente un abonnement souscrit par un client
 */
@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  customerId!: string;

  @ManyToOne(() => Customer, customer => customer.subscriptions)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column()
  planId!: string;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'planId' })
  plan!: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status!: SubscriptionStatus;

  @Column({ type: 'timestamp' })
  startDate!: Date;

  @Column({ type: 'timestamp' })
  endDate!: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column({ nullable: true })
  currency!: string;

  @Column({ nullable: true })
  paymentMethod!: string;

  @Column({ nullable: true })
  paymentReference!: string;

  // === STRIPE INTEGRATION ===
  @Column({ nullable: true })
  stripeSubscriptionId?: string;

  @Column('boolean', { default: false })
  autoRenew!: boolean;

  @Column({ nullable: true })
  canceledAt!: Date;

  @Column({ nullable: true })
  cancelReason!: string;

  // ===== NOUVELLES COLONNES POUR GESTION MODERNE DES TOKENS =====

  // Gestion des tokens
  @Column({ name: 'tokens_included', type: 'int', default: 0 })
  tokensIncluded!: number;

  @Column({ name: 'tokens_used', type: 'int', default: 0 })
  tokensUsed!: number;

  @Column({ name: 'tokens_remaining', type: 'int', default: 0 })
  tokensRemaining!: number;

  @Column({ name: 'tokens_rollover_allowed', type: 'boolean', default: false })
  tokensRolloverAllowed!: boolean;

  @Column({ name: 'tokens_rollover_limit', type: 'int', nullable: true })
  tokensRolloverLimit?: number;

  @Column({ name: 'tokens_rollover_from_previous', type: 'int', default: 0 })
  tokensRolloverFromPrevious!: number;

  // Configuration des tokens par feature
  @Column({ name: 'token_rates', type: 'jsonb', nullable: true })
  tokenRates?: {
    creditAnalysis: number;
    riskAssessment: number;
    financialReporting: number;
    complianceCheck: number;
    marketAnalysis: number;
    predictiveModeling: number;
    [key: string]: number;
  };

  // Features et limites spécifiques à cette souscription
  @Column({ name: 'subscription_features', type: 'jsonb', nullable: true })
  subscriptionFeatures?: {
    apiAccess: boolean;
    advancedAnalytics: boolean;
    customReporting: boolean;
    prioritySupport: boolean;
    multiUserAccess: boolean;
    dataExport: boolean;
    customIntegrations: boolean;
    whiteLabeling: boolean;
    dedicatedAccountManager: boolean;
    [key: string]: any;
  };

  @Column({ name: 'subscription_limits', type: 'jsonb', nullable: true })
  subscriptionLimits?: {
    maxUsers: number;
    maxAPICallsPerDay: number;
    maxDataStorageGB: number;
    maxReportsPerMonth: number;
    maxCustomFields: number;
    maxIntegrations: number;
    [key: string]: any;
  };

  // Informations de facturation étendues
  @Column({ name: 'next_billing_date', type: 'timestamptz', nullable: true })
  nextBillingDate?: Date;

  @Column({ name: 'last_payment_date', type: 'timestamptz', nullable: true })
  lastPaymentDate?: Date;

  @Column({ name: 'last_payment_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  lastPaymentAmount?: number;

  @Column({ name: 'next_payment_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  nextPaymentAmount?: number;

  @Column({ name: 'billing_contact_email' })
  billingContactEmail!: string;

  @Column({ name: 'payment_method_id', nullable: true })
  paymentMethodId?: string;

  // Gestion des changements de plan
  @Column({ name: 'upgrade_available', type: 'boolean', default: false })
  upgradeAvailable!: boolean;

  @Column({ name: 'downgrade_scheduled', type: 'boolean', default: false })
  downgradeScheduled!: boolean;

  @Column({ name: 'downgrade_to_plan_id', nullable: true })
  downgradeToPlanId?: string;

  @Column({ name: 'downgrade_effective_date', type: 'timestamptz', nullable: true })
  downgradeEffectiveDate?: Date;

  // Gestion des suspensions
  @Column({ name: 'suspended_at', type: 'timestamptz', nullable: true })
  suspendedAt?: Date;

  @Column({ name: 'suspension_reason', nullable: true })
  suspensionReason?: string;

  // Métadonnées étendues
  @Column({ name: 'created_by' })
  createdBy!: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;

  @Column('jsonb', { nullable: true })
  metadata!: {
    source?: string;
    salesAgent?: string;
    promotionalCode?: string;
    referralSource?: string;
    customFields?: Record<string, any>;
    migrationData?: Record<string, any>;
    [key: string]: any;
  };

  // Relations avec l'historique des tokens
  @OneToMany(() => SubscriptionTokenUsage, usage => usage.subscription)
  tokenUsageHistory!: SubscriptionTokenUsage[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // ===== MÉTHODES UTILITAIRES =====

  getTokensRemainingPercentage(): number {
    if (this.tokensIncluded === 0) return 0;
    return (this.tokensRemaining / this.tokensIncluded) * 100;
  }

  isExpired(): boolean {
    return this.endDate ? new Date() > this.endDate : false;
  }

  isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE && !this.isExpired();
  }

  canUseTokens(amount: number = 1): boolean {
    return this.isActive() && this.tokensRemaining >= amount;
  }

  getDaysUntilExpiry(): number | null {
    if (!this.endDate) return null;
    const now = new Date();
    const expiry = new Date(this.endDate);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysUntilNextBilling(): number | null {
    if (!this.nextBillingDate) return null;
    const now = new Date();
    const nextBilling = new Date(this.nextBillingDate);
    const diffTime = nextBilling.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  calculateProrationAmount(newPrice: number): number {
    const daysRemaining = this.getDaysUntilExpiry();
    if (!daysRemaining) return newPrice;
    
    const daysInBillingCycle = this.getBillingCycleDays();
    const proratedAmount = (newPrice / daysInBillingCycle) * daysRemaining;
    return Math.round(proratedAmount * 100) / 100;
  }

  private getBillingCycleDays(): number {
    if (!this.plan) return 30; // Default to monthly
    switch (this.plan.type) {
      case SubscriptionPlanType.MONTHLY:
        return 30;
      case SubscriptionPlanType.QUARTERLY:
        return 90;
      case SubscriptionPlanType.ANNUAL:
        return 365;
      default:
        return 30;
    }
  }
}

// ===== NOUVELLE ENTITÉ POUR L'HISTORIQUE DES TOKENS =====

export enum TokenUsageType {
  CREDIT_ANALYSIS = 'credit_analysis',
  RISK_ASSESSMENT = 'risk_assessment',
  FINANCIAL_REPORTING = 'financial_reporting',
  COMPLIANCE_CHECK = 'compliance_check',
  MARKET_ANALYSIS = 'market_analysis',
  PREDICTIVE_MODELING = 'predictive_modeling',
  CUSTOM_ANALYSIS = 'custom_analysis'
}

@Entity('subscription_token_usage')
export class SubscriptionTokenUsage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  subscriptionId!: string;

  @ManyToOne(() => Subscription, subscription => subscription.tokenUsageHistory)
  @JoinColumn({ name: 'subscriptionId' })
  subscription!: Subscription;

  @Column()
  userId!: string; // ID de l'utilisateur qui a consommé les tokens

  @Column({
    type: 'enum',
    enum: TokenUsageType
  })
  usageType!: TokenUsageType;

  @Column('int')
  tokensUsed!: number;

  @Column('int')
  tokensRemaining!: number; // État des tokens après cette utilisation

  @Column({ nullable: true })
  description?: string;

  @Column('jsonb', { nullable: true })
  context?: {
    feature: string;
    endpoint?: string;
    parameters?: Record<string, any>;
    result?: Record<string, any>;
    duration?: number;
    [key: string]: any;
  };

  @CreateDateColumn()
  createdAt!: Date;
}
