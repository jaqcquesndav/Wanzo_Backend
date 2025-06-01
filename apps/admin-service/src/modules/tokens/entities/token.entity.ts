import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

export enum TokenTransactionType {
  PURCHASE = 'purchase',
  CONSUMPTION = 'consumption',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
  BONUS = 'bonus'
}

export enum TokenTransactionStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  PENDING_VERIFICATION = 'pending_verification',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

@Entity('token_packages')
export class TokenPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('int')
  tokens: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column('simple-array')
  features: string[];

  @Column({ default: false })
  isPopular: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  bonusPercentage: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('token_transactions')
export class TokenTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  customerAccountId: string;

  @Column({
    type: 'enum',
    enum: TokenTransactionType
  })
  type: TokenTransactionType;

  @Column('int')
  tokenAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ nullable: true })
  packageId: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({
    type: 'enum',
    enum: TokenTransactionStatus,
    default: TokenTransactionStatus.COMPLETED
  })
  status: TokenTransactionStatus;

  @Column({ nullable: true })
  transactionReference: string;

  @Column({ nullable: true })
  proofDocumentUrl: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('token_balances')
export class TokenBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  customerAccountId: string;

  @Column('int', { default: 0 })
  available: number;

  @Column('int', { default: 0 })
  allocated: number;

  @Column('int', { default: 0 })
  used: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('token_consumption_logs')
export class TokenConsumptionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  customerAccountId: string;

  @Column('int')
  tokensConsumed: number;

  @Column()
  featureUsed: string;

  @Column({ nullable: true })
  resourceId: string;

  @Column({ nullable: true })
  resourceType: string;

  @Column({ nullable: true })
  sessionId: string;

  @CreateDateColumn()
  timestamp: Date;
}
