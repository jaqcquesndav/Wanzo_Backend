import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn
} from 'typeorm';

export enum PlanStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived'
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export enum CustomerType {
  PME = 'pme',
  FINANCIAL = 'financial',
  INDIVIDUAL = 'individual'
}

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  basePriceUSD: number;

  @Column('simple-array')
  billingCycles: BillingCycle[];

  @Column('simple-array')
  features: string[];

  @Column({ default: 0 })
  tokenAllocation: number;

  @Column({ nullable: true })
  maxUsers: number;

  @Column('simple-array')
  targetCustomerTypes: CustomerType[];

  @Column({
    type: 'enum',
    enum: PlanStatus,
    default: PlanStatus.ACTIVE
  })
  status: PlanStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CustomerSubscription, subscription => subscription.plan)
  subscriptions: CustomerSubscription[];
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  EXPIRED = 'expired'
}

@Entity('customer_subscriptions')
export class CustomerSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  planId: string;

  @ManyToOne(() => SubscriptionPlan, plan => plan.subscriptions)
  @JoinColumn({ name: 'planId' })
  plan: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE
  })
  status: SubscriptionStatus;

  @Column({
    type: 'enum',
    enum: BillingCycle
  })
  billingCycle: BillingCycle;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceUSD: number;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  trialEndDate: Date;

  @Column({ default: true })
  autoRenew: boolean;

  @Column({ nullable: true })
  canceledAt: Date;

  @Column({ nullable: true })
  cancellationReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Invoice, invoice => invoice.subscription)
  invoices: Invoice[];
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  UNCOLLECTIBLE = 'uncollectible',
  VOID = 'void'
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subscriptionId: string;

  @ManyToOne(() => CustomerSubscription, subscription => subscription.invoices)
  @JoinColumn({ name: 'subscriptionId' })
  subscription: CustomerSubscription;

  @Column()
  customerId: string;

  @Column()
  invoiceNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amountDue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT
  })
  status: InvoiceStatus;

  @Column({ nullable: true })
  pdfUrl: string;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  paymentDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => InvoiceItem, item => item.invoice)
  items: InvoiceItem[];
}

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  invoiceId: string;

  @ManyToOne(() => Invoice, invoice => invoice.items)
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 1 })
  quantity: number;

  @Column({ nullable: true })
  periodStart: Date;

  @Column({ nullable: true })
  periodEnd: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  CREDIT = 'credit',
  ADJUSTMENT = 'adjustment'
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed'
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column({ nullable: true })
  invoiceId: string;

  @Column({
    type: 'enum',
    enum: TransactionType
  })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  currency: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus
  })
  status: TransactionStatus;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  paymentIntentId: string;

  @Column({ nullable: true })
  paymentMethodDetails: string;

  @Column({ nullable: true })
  failureCode: string;

  @Column({ nullable: true })
  failureMessage: string;

  @Column({ nullable: true })
  refundReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
