import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { Contract } from './contract.entity';

export enum DisbursementStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

export enum DisbursementType {
  FULL = 'full',
  PARTIAL = 'partial',
  INSTALLMENT = 'installment'
}

@Entity('disbursements')
export class Disbursement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  reference!: string;

  @Column()
  portfolio_id!: string;
  
  @ManyToOne(() => Portfolio)
  @JoinColumn({ name: 'portfolio_id' })
  portfolio!: Portfolio;

  @Column()
  contract_id!: string;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;

  @Column()
  client_id!: string;

  @Column('decimal', { precision: 15, scale: 2 })
  amount!: number;

  @Column({ default: 'XOF' })
  currency!: string;

  @Column({
    type: 'enum',
    enum: DisbursementStatus,
    default: DisbursementStatus.DRAFT
  })
  status!: DisbursementStatus;

  @Column({
    type: 'enum',
    enum: DisbursementType,
    default: DisbursementType.FULL
  })
  disbursement_type!: DisbursementType;

  @Column({ nullable: true })
  installment_number?: number;

  @Column({ nullable: true })
  payment_method?: string;

  @Column('jsonb', { nullable: true })
  recipient_info?: {
    account_number?: string;
    bank_name?: string;
    bank_code?: string;
    mobile_wallet?: string;
    name?: string;
  };

  @Column({ nullable: true })
  transaction_id?: string;

  @Column({ nullable: true })
  payment_transaction_id?: string;

  @Column({ nullable: true })
  transaction_date?: Date;

  @Column({ nullable: true })
  requested_date?: Date;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  approved_by?: string;

  @Column({ nullable: true })
  approval_date?: Date;

  @Column({ nullable: true })
  rejection_reason?: string;

  @Column({ nullable: true })
  rejected_by?: string;

  @Column({ nullable: true })
  rejection_date?: Date;

  @Column({ nullable: true })
  executed_by?: string;

  @Column({ nullable: true })
  execution_date?: Date;

  @Column({ nullable: true })
  prerequisites_verified?: boolean;

  @Column('jsonb', { nullable: true })
  documents?: {
    id: string;
    name: string;
    type: string;
    url: string;
    upload_date: Date;
  }[];

  @Column('jsonb', { nullable: true })
  callback_data?: {
    provider: string;
    response_code: string;
    response_message: string;
    timestamp: Date;
    additional_info?: any;
  };

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
