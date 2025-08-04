import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { User } from '../../system-users/entities/user.entity';

export enum TokenType {
  PURCHASED = 'purchased',
  BONUS = 'bonus',
  REWARD = 'reward',
}

export enum TokenTransactionType {
  PURCHASE = 'purchase',
  USAGE = 'usage',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
  EXPIRY = 'expiry',
  BONUS = 'bonus',
  ALLOCATION = 'allocation',
}

export enum AppType {
  TEXT_GENERATION = 'text-generation',
  IMAGE_GENERATION = 'image-generation',
  CHAT_COMPLETION = 'chat-completion',
  EMBEDDINGS = 'embeddings',
  TEXT_TO_SPEECH = 'text-to-speech',
  WEB_DASHBOARD = 'web-dashboard',
  MOBILE_APP = 'mobile-app',
  API_DIRECT = 'api-direct',
}

/**
 * Entité TokenPackage - Représente un pack de tokens disponible à l'achat
 */
@Entity('token_packages')
export class TokenPackage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  configId!: string; // ID depuis la configuration

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column('bigint')
  tokenAmount!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  priceUSD!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  pricePerMillionTokens!: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  bonusPercentage!: number;

  @Column('simple-array')
  customerTypes!: string[]; // ['sme', 'financial_institution']

  @Column('boolean', { default: true })
  isVisible!: boolean;

  @Column('boolean', { default: true })
  isActive!: boolean;

  @Column('int', { default: 0 })
  sortOrder!: number;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

/**
 * Entité TokenBalance - Représente le solde de tokens d'un client
 */
@Entity('token_balances')
export class TokenBalance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column({ type: 'enum', enum: TokenType })
  tokenType!: TokenType;

  @Column()
  balance!: number;

  @UpdateDateColumn()
  lastUpdatedAt!: Date;
}

/**
 * Entité TokenTransaction - Représente une transaction de tokens (achat, utilisation, etc.)
 */
@Entity('token_transactions')
export class TokenTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column({ nullable: true })
  subscriptionId?: string;

  @Column({ nullable: true })
  packageId?: string;

  @ManyToOne(() => TokenPackage)
  @JoinColumn({ name: 'packageId' })
  package!: TokenPackage;

  @Column({ type: 'enum', enum: TokenTransactionType })
  type!: TokenTransactionType;

  @Column()
  amount!: number;

  @Column()
  balance!: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn()
  timestamp!: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiryDate?: Date;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;
}

/**
 * Entité TokenUsage - Représente une utilisation de tokens par un client
 */
@Entity('token_usages')
export class TokenUsage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  customerId!: string;

  @ManyToOne(() => Customer, customer => customer.tokenUsages)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column()
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'enum', enum: AppType })
  appType!: AppType;

  @Column()
  tokensUsed!: number;

  @Column({ type: 'timestamp' })
  date!: Date;

  @Column()
  feature!: string;

  @Column({ type: 'text', nullable: true })
  prompt?: string;

  @Column()
  responseTokens!: number;

  @Column()
  requestTokens!: number;

  @Column('decimal', { precision: 10, scale: 4 })
  cost!: number;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;
}
