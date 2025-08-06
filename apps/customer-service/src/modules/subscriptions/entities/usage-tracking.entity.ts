import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { FeatureCode } from '../../../config/subscription-pricing.config';

@Entity()
export class FeatureUsageTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  customerId: string;

  @Column()
  featureCode: string;

  @Column()
  usageCount: number;

  @Column({ type: 'timestamp' })
  lastUsed: Date;

  @Column({ nullable: true })
  usageDate: Date;
  
  @Column({ nullable: true })
  usagePeriod: string;
  
  @Column({ nullable: true, type: 'jsonb' })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;
}

@Entity()
export class CustomerFeatureLimit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  customerId: string;
  
  @Column({ nullable: true })
  planId: string;

  @Column({
    type: 'enum',
    enum: FeatureCode
  })
  featureCode: FeatureCode;

  @Column()
  monthlyLimit: number;

  @Column()
  currentPeriod: string; // Format: YYYY-MM
  
  @Column({ nullable: true })
  period: string; // Alias pour currentPeriod
  
  @Column({ nullable: true })
  limitValue: number;

  @Column()
  currentUsage: number;
  
  @Column({ nullable: true, type: 'timestamp' })
  lastUsedAt: Date;
  
  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;
}

@Entity()
export class CustomerTokenBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  customerId: string;

  @Column()
  currentPeriod: string; // Format: YYYY-MM

  @Column({ default: 0 })
  monthlyAllocation: number;

  @Column({ default: 0 })
  purchasedTokens: number;

  @Column({ default: 0 })
  bonusTokens: number;

  @Column({ default: 0 })
  rolledOverTokens: number;

  @Column({ default: 0 })
  totalTokens: number;

  @Column({ default: 0 })
  usedTokens: number;

  @Column({ default: 0 })
  remainingTokens: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;
}

@Entity()
export class TokenTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  customerId: string;

  @Column()
  transactionType: string; // 'USAGE', 'PURCHASE', 'ALLOCATION', 'BONUS'

  @Column()
  tokenAmount: number;

  @Column()
  featureCode: string;
  
  @Column({ nullable: true })
  period: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  balanceBefore: number;

  @Column()
  balanceAfter: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;
}
