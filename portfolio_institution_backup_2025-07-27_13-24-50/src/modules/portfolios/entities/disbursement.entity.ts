import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { Contract } from './contract.entity';

export enum DisbursementStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled'
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
    default: DisbursementStatus.PENDING
  })
  status!: DisbursementStatus;

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
  transaction_date?: Date;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  approved_by?: string;

  @Column({ nullable: true })
  approval_date?: Date;

  @Column({ nullable: true })
  executed_by?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
