import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { Contract } from './contract.entity';
import { PaymentSchedule } from './payment-schedule.entity';

export enum RepaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL = 'partial'
}

export enum RepaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CHECK = 'check',
  MOBILE_MONEY = 'mobile_money',
  OTHER = 'other'
}

export enum RepaymentType {
  STANDARD = 'standard',
  PARTIAL = 'partial',
  ADVANCE = 'advance',
  EARLY_PAYOFF = 'early_payoff'
}

@Entity('repayments')
export class Repayment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
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

  @Column({
    type: 'enum',
    enum: RepaymentMethod,
    nullable: true
  })
  payment_method_type?: RepaymentMethod;

  @Column({
    type: 'enum',
    enum: RepaymentType,
    default: RepaymentType.STANDARD
  })
  payment_type!: RepaymentType;

  @Column({ nullable: true, unique: true })
  transaction_id?: string;

  @Column({ type: 'timestamp', nullable: true })
  transaction_date?: Date;

  @Column({ type: 'timestamp', nullable: true })
  due_date?: Date;

  @Column({ nullable: true })
  receipt_number?: string;
  
  @Column({ type: 'integer', nullable: true })
  daysLate?: number;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  processed_by?: string;

  @Column({ nullable: true, default: false })
  is_external!: boolean;

  @ManyToMany(() => PaymentSchedule)
  @JoinTable({
    name: 'repayment_schedule_items',
    joinColumn: { name: 'repayment_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'schedule_id', referencedColumnName: 'id' }
  })
  payment_schedules!: PaymentSchedule[];

  @Column('jsonb', { nullable: true })
  allocation?: {
    schedule_id: string;
    principal_amount: number;
    interest_amount: number;
    penalties_amount: number;
    fees_amount: number;
  }[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
