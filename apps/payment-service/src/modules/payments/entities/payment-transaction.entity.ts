import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

// ISO 4217 Currency Codes
export const SUPPORTED_CURRENCIES = ['CDF', 'USD', 'XOF', 'EUR', 'XAF'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

export interface PaymentMetadata {
  portfolioId?: string;
  clientId?: string;
  contractId?: string;
  scheduleId?: string;
  paymentType?: 'disbursement' | 'repayment' | 'subscription' | 'token';
  isFinancingPayment?: boolean;
  timestamp?: string;
  description?: string;
  [key: string]: any;
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed'
}

export enum PaymentType {
  SUBSCRIPTION = 'subscription',
  TOKEN = 'token',
  LEGACY = 'legacy'
}

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ nullable: true })
  providerTransactionId?: string;

  @Index()
  @Column({ nullable: true })
  sessionId?: string;

  @Column({ default: 'SerdiPay' })
  provider!: string;

  @Column('decimal', { precision: 18, scale: 2 })
  amount!: string;

  @Column()
  currency!: string;

  @Column()
  clientPhone!: string;

  @Column()
  telecom!: string;

  @Index()
  @Column({ nullable: true })
  clientReference?: string;

  @Column({ type: 'varchar', length: 16 })
  status!: PaymentStatus;

  // === NOUVELLES COLONNES POUR SUPPORT DES SUBSCRIPTIONS ===
  // Ajoutées de manière nullable pour la rétrocompatibilité
  
  @Column({ nullable: true })
  paymentType?: string; // 'subscription' | 'token' | null (null = legacy)

  @Index()
  @Column({ nullable: true })
  customerId?: string; // Customer qui effectue le paiement

  @Index()
  @Column({ nullable: true })
  planId?: string; // Plan acheté (si subscription)

  @Column({ nullable: true })
  subscriptionId?: string; // Référence vers customer-service subscription

  @Column({ type: 'json', nullable: true })
  meta?: any;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  // Alias pour compatibilité avec les nouveaux services
  get metadata(): any {
    return this.meta;
  }

  set metadata(value: any) {
    this.meta = value;
  }

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
