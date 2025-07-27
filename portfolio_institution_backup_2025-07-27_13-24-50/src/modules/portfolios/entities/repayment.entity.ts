import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { Contract } from './contract.entity';

export enum RepaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL = 'partial'
}

@Entity('repayments')
export class Repayment {
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

  @Column({ nullable: true })
  schedule_id?: string;

  @Column('decimal', { precision: 15, scale: 2 })
  amount!: number;

  @Column({ default: 'XOF' })
  currency!: string;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  principal_amount?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  interest_amount?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  penalty_amount?: number;

  @Column({
    type: 'enum',
    enum: RepaymentStatus,
    default: RepaymentStatus.PENDING
  })
  status!: RepaymentStatus;

  @Column({ nullable: true })
  payment_method?: string;

  @Column({ nullable: true })
  transaction_id?: string;

  @Column({ type: 'timestamp', nullable: true })
  transaction_date?: Date;

  @Column({ nullable: true })
  receipt_number?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  processed_by?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
