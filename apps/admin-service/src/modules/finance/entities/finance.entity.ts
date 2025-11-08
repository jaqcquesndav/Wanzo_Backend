import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

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
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  currency: string;

  @Column({ type: 'enum', enum: BillingCycle })
  billingCycle: BillingCycle;

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

  // Features du plan (compatible avec Customer Service)
  @Column('jsonb', { nullable: true })
  features: {
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

  // Limites du plan
  @Column('jsonb', { nullable: true })
  limits: {
    maxUsers: number;
    maxAPICallsPerDay: number;
    maxDataStorageGB: number;
    maxReportsPerMonth: number;
    maxCustomFields: number;
    maxIntegrations: number;
    [key: string]: any;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  trialPeriodDays: number;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => Subscription, subscription => subscription.plan)
  subscriptions: Subscription[];
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
