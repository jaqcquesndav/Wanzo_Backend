import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  TRIAL = 'trial',
  PAST_DUE = 'past_due',
}

export enum SubscriptionPlanType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
  ONE_TIME = 'one_time',
}

/**
 * Entité SubscriptionPlan - Représente un plan d'abonnement disponible
 */
@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column({
    type: 'enum',
    enum: SubscriptionPlanType,
    default: SubscriptionPlanType.MONTHLY,
  })
  type!: SubscriptionPlanType;

  @Column('decimal', { precision: 10, scale: 2 })
  priceUSD!: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  priceLocal!: number;

  @Column({ nullable: true })
  currency!: string;

  @Column('int')
  durationDays!: number;

  @Column('int')
  includedTokens!: number;

  @Column('jsonb')
  features!: Record<string, any>;

  @Column('boolean', { default: false })
  isPopular!: boolean;

  @Column('jsonb', { nullable: true })
  discounts!: Array<{
    code: string;
    percentage: number;
    validUntil: Date;
  }>;

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

  @Column('boolean', { default: false })
  autoRenew!: boolean;

  @Column({ nullable: true })
  canceledAt!: Date;

  @Column({ nullable: true })
  cancelReason!: string;

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
