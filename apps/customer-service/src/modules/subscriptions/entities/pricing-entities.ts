import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('feature_usage_tracking')
@Index(['customerId', 'featureCode', 'usageDate'])
@Index(['customerId', 'featureCode', 'usagePeriod'])
export class FeatureUsageTracking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_id' })
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ name: 'feature_code' })
  featureCode!: string;

  @Column({ name: 'usage_count', default: 1 })
  usageCount!: number;

  @Column({ name: 'tokens_cost', type: 'bigint', nullable: true })
  tokensCost?: number;

  @Column({ name: 'usage_date', type: 'date' })
  usageDate!: Date;

  @Column({ name: 'usage_period' })
  usagePeriod!: string; // Format: YYYY-MM pour mensuel

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity('customer_feature_limits')
export class CustomerFeatureLimit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_id' })
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ name: 'plan_id' })
  planId!: string;

  @Column({ name: 'feature_code' })
  featureCode!: string;

  @Column()
  period!: string; // Format: YYYY-MM pour mensuel

  @Column({ name: 'limit_value', nullable: true })
  limitValue?: number;

  @Column({ name: 'current_usage', default: 0 })
  currentUsage!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'last_used_at', nullable: true })
  lastUsedAt?: Date;
}

@Entity('customer_token_balances')
@Index(['customerId'])
export class CustomerTokenBalance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_id' })
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ name: 'total_tokens', type: 'bigint', default: 0 })
  totalTokens!: number;

  @Column({ name: 'used_tokens', type: 'bigint', default: 0 })
  usedTokens!: number;

  @Column({ name: 'remaining_tokens', type: 'bigint', default: 0 })
  remainingTokens!: number;

  @Column({ name: 'monthly_allocation', type: 'bigint', default: 0 })
  monthlyAllocation!: number;

  @Column({ name: 'rolled_over_tokens', type: 'bigint', default: 0 })
  rolledOverTokens!: number;

  @Column({ name: 'purchased_tokens', type: 'bigint', default: 0 })
  purchasedTokens!: number;

  @Column({ name: 'bonus_tokens', type: 'bigint', default: 0 })
  bonusTokens!: number;

  @Column({ name: 'current_period' })
  currentPeriod!: string; // Format: YYYY-MM

  @Column({ name: 'period_start_date', type: 'timestamp' })
  periodStartDate!: Date;

  @Column({ name: 'period_end_date', type: 'timestamp' })
  periodEndDate!: Date;

  @Column({ name: 'rollover_history', type: 'jsonb', nullable: true })
  rolloverHistory?: Array<{
    period: string;
    tokens: number;
    date: Date;
  }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('token_transactions')
@Index(['customerId', 'transactionDate'])
@Index(['customerId', 'transactionType'])
export class TokenTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_id' })
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ name: 'transaction_type' })
  transactionType!: string; // 'usage', 'purchase', 'allocation', 'rollover', 'bonus'

  @Column({ name: 'token_amount', type: 'bigint' })
  tokenAmount!: number;

  @Column({ name: 'balance_before', type: 'bigint' })
  balanceBefore!: number;

  @Column({ name: 'balance_after', type: 'bigint' })
  balanceAfter!: number;

  @Column({ name: 'feature_code', nullable: true })
  featureCode?: string;

  @Column({ name: 'related_entity_id', nullable: true })
  relatedEntityId?: string;

  @Column({ name: 'related_entity_type', nullable: true })
  relatedEntityType?: string;

  @Column({ name: 'cost_usd', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costUSD?: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'transaction_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  transactionDate!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
