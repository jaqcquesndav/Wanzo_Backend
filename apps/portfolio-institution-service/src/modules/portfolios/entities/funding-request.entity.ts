import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Portfolio } from './portfolio.entity';

export enum FundingRequestStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELED = 'canceled',
  DISBURSED = 'disbursed'
}

export enum DurationUnit {
  DAYS = 'days',
  WEEKS = 'weeks',
  MONTHS = 'months',
  YEARS = 'years'
}

@Entity('funding_requests')
export class FundingRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  request_number!: string;

  @Column()
  portfolio_id!: string;
  
  @ManyToOne(() => Portfolio)
  @JoinColumn({ name: 'portfolio_id' })
  portfolio!: Portfolio;

  @Column()
  client_id!: string;

  @Column()
  company_name!: string;

  @Column()
  product_type!: string;

  @Column('decimal', { precision: 15, scale: 2 })
  amount!: number;

  @Column({ default: 'CDF' })
  currency!: string;

  @Column({ nullable: true })
  purpose?: string;

  @Column()
  duration!: number;

  @Column({
    type: 'enum',
    enum: DurationUnit,
    default: DurationUnit.MONTHS
  })
  duration_unit!: DurationUnit;

  @Column({ nullable: true, type: 'timestamp' })
  proposed_start_date?: Date;

  @Column({
    type: 'enum',
    enum: FundingRequestStatus,
    default: FundingRequestStatus.PENDING
  })
  status!: FundingRequestStatus;

  @Column({ nullable: true, type: 'timestamp' })
  status_date?: Date;

  @Column({ nullable: true })
  assigned_to?: string;

  @Column({ nullable: true })
  contract_id?: string;

  @Column({ name: 'source_request_id', nullable: true })
  source_request_id?: string;

  @Column({ name: 'source_system', nullable: true, default: 'direct' })
  source_system?: string;

  @Column('jsonb', { nullable: true })
  payment_info?: {
    bankAccounts: Array<{
      id: string;
      accountNumber: string;
      accountName: string;
      bankName: string;
      bankCode?: string;
      branchCode?: string;
      swiftCode?: string;
      rib?: string;
      isDefault: boolean;
      status: string;
    }>;
    mobileMoneyAccounts: Array<{
      id: string;
      phoneNumber: string;
      accountName: string;
      operator: string;
      operatorName: string;
      isDefault: boolean;
      status: string;
      verificationStatus: string;
    }>;
    preferredMethod: string;
    defaultBankAccountId?: string;
    defaultMobileMoneyAccountId?: string;
  };

  @Column('jsonb', { nullable: true })
  financial_data?: {
    annual_revenue: number;
    net_profit: number;
    existing_debts: number;
    cash_flow: number;
    assets: number;
    liabilities: number;
  };

  @Column('jsonb', { nullable: true })
  proposed_guarantees?: {
    type: string;
    description: string;
    value: number;
    currency: string;
  }[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
