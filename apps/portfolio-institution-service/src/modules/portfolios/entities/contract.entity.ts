import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { FundingRequest } from './funding-request.entity';
import { PaymentSchedule } from './payment-schedule.entity';

export enum ContractStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  RESTRUCTURED = 'restructured',
  LITIGATION = 'litigation',
  DEFAULTED = 'defaulted',
  COMPLETED = 'completed',
  CANCELED = 'canceled'
}

export enum AmortizationType {
  CONSTANT = 'constant',
  DEGRESSIVE = 'degressive',
  BALLOON = 'balloon',
  BULLET = 'bullet',
  CUSTOM = 'custom'
}

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  contract_number!: string;

  @Column()
  portfolio_id!: string;
  
  @ManyToOne(() => Portfolio)
  @JoinColumn({ name: 'portfolio_id' })
  portfolio!: Portfolio;

  @Column()
  funding_request_id!: string;

  @OneToOne(() => FundingRequest)
  @JoinColumn({ name: 'funding_request_id' })
  funding_request!: FundingRequest;

  @Column()
  client_id!: string;

  @Column('decimal', { precision: 15, scale: 2 })
  principal_amount!: number;

  @Column('decimal', { precision: 5, scale: 2 })
  interest_rate!: number;

  @Column({ nullable: true })
  interest_type?: string;

  @Column()
  term!: number;

  @Column()
  term_unit!: string;

  @Column({ type: 'timestamp' })
  start_date!: Date;

  @Column({ type: 'timestamp' })
  end_date!: Date;

  @Column({
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.DRAFT
  })
  status!: ContractStatus;

  @Column({ nullable: true })
  payment_frequency?: string;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  disbursed_amount?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  outstanding_balance?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  total_interest_due?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  total_paid_to_date?: number;

  @Column('jsonb', { nullable: true })
  payment_schedule?: {
    due_date: Date;
    principal_amount: number;
    interest_amount: number;
    total_amount: number;
    status: string;
  }[];

  @Column('jsonb', { nullable: true })
  guarantees?: {
    id: string;
    type: string;
    description: string;
    value: number;
    currency: string;
    status: string;
  }[];

  @Column({ nullable: true })
  amortization_type?: string;

  @Column({ nullable: true })
  last_payment_date?: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  total_paid_amount?: number;

  @Column({ nullable: true })
  suspension_reason?: string;

  @Column({ nullable: true })
  suspension_date?: Date;

  @Column({ nullable: true })
  restructured_date?: Date;

  @Column({ nullable: true })
  litigation_date?: Date;

  @Column({ nullable: true })
  litigation_reason?: string;

  @Column({ nullable: true })
  created_by?: string;

  @OneToMany(() => PaymentSchedule, paymentSchedule => paymentSchedule.contract)
  payment_schedules!: PaymentSchedule[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
