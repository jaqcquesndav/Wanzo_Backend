import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Portfolio } from './portfolio.entity';

export enum DisbursementStatus {
  PENDING = 'en attente',
  COMPLETED = 'effectué',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

export enum PaymentMethod {
  VIREMENT = 'virement',
  TRANSFERT = 'transfert',
  CHEQUE = 'chèque',
  ESPECES = 'espèces'
}

interface DebitAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  branchCode?: string;
}

interface Beneficiary {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode?: string;
  branchCode?: string;
  swiftCode?: string;
  companyName: string;
  address?: string;
}

@Entity('traditional_disbursements')
export class TraditionalDisbursement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  company!: string;

  @Column()
  product!: string;

  @Column('decimal', { precision: 15, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: DisbursementStatus,
    default: DisbursementStatus.PENDING
  })
  status!: DisbursementStatus;

  @Column({ type: 'timestamp' })
  date!: Date;

  @Column({ nullable: true })
  requestId?: string;

  @Column()
  portfolioId!: string;

  @ManyToOne(() => Portfolio)
  @JoinColumn({ name: 'portfolioId' })
  portfolio!: Portfolio;

  @Column()
  contractReference!: string;

  @Column({ nullable: true })
  transactionReference?: string;

  @Column({ type: 'timestamp', nullable: true })
  valueDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  executionDate?: Date;

  @Column('jsonb')
  debitAccount!: DebitAccount;

  @Column('jsonb')
  beneficiary!: Beneficiary;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true
  })
  paymentMethod?: PaymentMethod;

  @Column({ nullable: true })
  paymentReference?: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ default: 'XOF' })
  currency!: string;

  @Column({ nullable: true })
  approved_by?: string;

  @Column({ nullable: true })
  approval_date?: Date;

  @Column({ nullable: true })
  processed_by?: string;

  @Column('jsonb', { nullable: true })
  fees?: {
    transfer_fee: number;
    commission: number;
    total_fees: number;
  };

  @Column('text', { nullable: true })
  failure_reason?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
