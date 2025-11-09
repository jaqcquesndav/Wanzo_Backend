import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { BusinessFeature } from '@wanzobe/shared';

/**
 * Entité pour tracker l'usage des fonctionnalités métier par période
 * Remplace l'ancienne approche technique par une approche business
 */
@Entity('business_feature_usage')
@Index(['customerId', 'feature', 'usagePeriod'], { unique: true })
@Index(['customerId', 'feature', 'createdAt'])
@Index(['feature', 'usagePeriod'])
export class BusinessFeatureUsage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_id' })
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({
    type: 'enum',
    enum: BusinessFeature,
    name: 'feature'
  })
  feature!: BusinessFeature;

  @Column({ name: 'usage_count', default: 0 })
  usageCount!: number;

  @Column({ name: 'usage_period' })
  usagePeriod!: string; // Format: YYYY-MM pour mensuel, YYYY-MM-DD pour quotidien

  @Column({ name: 'period_type', default: 'monthly' })
  periodType!: 'daily' | 'monthly' | 'yearly';

  @Column({ name: 'limit_value', nullable: true })
  limitValue?: number; // Limite applicable pour cette période (-1 = illimité)

  @Column({ name: 'limit_exceeded', default: false })
  limitExceeded!: boolean;

  @Column({ name: 'last_used_at', nullable: true })
  lastUsedAt?: Date;

  // Métadonnées spécifiques par fonctionnalité
  @Column('jsonb', { nullable: true })
  metadata?: {
    // Pour ACCOUNTING_ENTRIES: { entryId, amount, automated: boolean, journalType }
    // Pour CREDIT_SCORING: { companyId, scoreValue, computationTime, requestedBy }
    // Pour FINANCING_REQUEST: { requestId, amount, status, productType }
    // Pour PORTFOLIO_USERS: { userId, role, assignedAt }
    // Pour API_CALLS: { endpoint, method, responseTime, statusCode }
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

/**
 * Entité pour les limites actives par fonctionnalité et client
 * Permet de cacher/optimiser les vérifications fréquentes
 */
@Entity('customer_feature_limits')
@Index(['customerId', 'feature'], { unique: true })
@Index(['customerId', 'subscriptionId'])
export class CustomerFeatureLimit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_id' })
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ name: 'subscription_id' })
  subscriptionId!: string;

  @Column({
    type: 'enum',
    enum: BusinessFeature,
    name: 'feature'
  })
  feature!: BusinessFeature;

  @Column({ name: 'limit_value' })
  limitValue!: number; // -1 pour illimité

  @Column({ name: 'current_usage', default: 0 })
  currentUsage!: number;

  @Column({ name: 'usage_period' })
  usagePeriod!: string; // Période actuelle (YYYY-MM ou YYYY-MM-DD)

  @Column({ name: 'period_type', default: 'monthly' })
  periodType!: 'daily' | 'monthly' | 'yearly';

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'reset_at', nullable: true })
  resetAt?: Date; // Prochaine réinitialisation du compteur

  @Column({ name: 'warning_threshold', default: 80 })
  warningThreshold!: number; // % pour déclencher les alertes

  @Column({ name: 'warning_sent', default: false })
  warningSent!: boolean;

  @Column({ name: 'last_used_at', nullable: true })
  lastUsedAt?: Date; // Dernière utilisation de la fonctionnalité

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Méthodes utilitaires
  get remainingUsage(): number {
    if (this.limitValue === -1) return -1; // Illimité
    return Math.max(0, this.limitValue - this.currentUsage);
  }

  get usagePercentage(): number {
    if (this.limitValue === -1) return 0; // Illimité
    return Math.min(100, (this.currentUsage / this.limitValue) * 100);
  }

  get isNearLimit(): boolean {
    return this.usagePercentage >= this.warningThreshold;
  }

  get isOverLimit(): boolean {
    if (this.limitValue === -1) return false; // Illimité
    return this.currentUsage >= this.limitValue;
  }
}

/**
 * Journal des actions de consommation de fonctionnalités
 * Pour audit et analytics détaillées
 */
@Entity('feature_consumption_log')
@Index(['customerId', 'feature', 'consumedAt'])
@Index(['customerId', 'consumedAt'])
@Index(['feature', 'consumedAt'])
export class FeatureConsumptionLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_id' })
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({
    type: 'enum',
    enum: BusinessFeature,
    name: 'feature'
  })
  feature!: BusinessFeature;

  @Column({ name: 'consumption_amount', default: 1 })
  consumptionAmount!: number;

  @Column({ name: 'user_id', nullable: true })
  userId?: string; // Utilisateur qui a déclenché l'action

  @Column({ name: 'service_name' })
  serviceName!: string; // Service qui a consommé la fonctionnalité

  @Column({ name: 'action_type' })
  actionType!: string; // create, update, delete, calculate, etc.

  @Column({ name: 'resource_id', nullable: true })
  resourceId?: string; // ID de la ressource créée/modifiée

  @Column({ name: 'success', default: true })
  success!: boolean;

  @Column({ name: 'error_message', nullable: true })
  errorMessage?: string;

  // Contexte spécifique à l'action
  @Column('jsonb', { nullable: true })
  context?: {
    // Pour ACCOUNTING_ENTRIES: { journalId, amount, accounts: [] }
    // Pour CREDIT_SCORING: { companyId, scoreResult, modelVersion }
    // Pour API_CALLS: { endpoint, method, requestSize, responseSize }
    [key: string]: any;
  };

  @Column({ name: 'consumed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  consumedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

/**
 * Entité pour les alertes et notifications liées aux limites
 */
@Entity('feature_limit_alerts')
@Index(['customerId', 'feature', 'createdAt'])
@Index(['alertType', 'resolved'])
export class FeatureLimitAlert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_id' })
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({
    type: 'enum',
    enum: BusinessFeature,
    name: 'feature'
  })
  feature!: BusinessFeature;

  @Column({ name: 'alert_type' })
  alertType!: 'warning' | 'limit_reached' | 'limit_exceeded' | 'upgrade_suggested';

  @Column({ name: 'current_usage' })
  currentUsage!: number;

  @Column({ name: 'limit_value' })
  limitValue!: number;

  @Column({ name: 'usage_percentage' })
  usagePercentage!: number;

  @Column({ type: 'text' })
  message!: string;

  @Column({ name: 'suggested_plan_id', nullable: true })
  suggestedPlanId?: string;

  @Column({ name: 'notification_sent', default: false })
  notificationSent!: boolean;

  @Column({ name: 'resolved', default: false })
  resolved!: boolean;

  @Column({ name: 'resolved_at', nullable: true })
  resolvedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

/**
 * Cache des plans et leurs restrictions pour optimisation
 */
@Entity('subscription_plan_cache')
@Index(['planId'], { unique: true })
export class SubscriptionPlanCache {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'plan_id', unique: true })
  planId!: string;

  @Column({ name: 'plan_name' })
  planName!: string;

  @Column({ name: 'customer_type' })
  customerType!: 'sme' | 'financial_institution';

  // Configuration des limites par fonctionnalité
  @Column('jsonb')
  featureLimits!: {
    [key in BusinessFeature]?: {
      enabled: boolean;
      limit: number; // -1 pour illimité
      periodType: 'daily' | 'monthly' | 'yearly';
      description?: string;
    };
  };

  @Column({ name: 'monthly_price_usd' })
  monthlyPriceUSD!: number;

  @Column({ name: 'annual_price_usd' })
  annualPriceUSD!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'cache_version', default: 1 })
  cacheVersion!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}