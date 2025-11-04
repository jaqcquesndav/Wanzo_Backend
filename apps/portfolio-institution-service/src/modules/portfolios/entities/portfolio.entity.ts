import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum RiskToleranceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum PortfolioType {
  TRADITIONAL = 'traditional',
  CREDIT = 'credit',
  SAVINGS = 'savings',
  MICROFINANCE = 'microfinance',
  TREASURY = 'treasury'
}

export enum PortfolioStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive', 
  PENDING = 'pending',
  ARCHIVED = 'archived',
  CLOSED = 'closed',
  SUSPENDED = 'suspended'
}

export enum RiskProfile {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate', 
  AGGRESSIVE = 'aggressive'
}

interface AssetAllocation {
  type: string;
  percentage: number;
}

interface BalanceAGE {
  total: number;
  echeance_0_30: number;
  echeance_31_60: number;
  echeance_61_90: number;
  echeance_91_plus: number;
}

interface BankAccount {
  id: string;
  name: string;
  bank_name: string;
  account_number: string;
  currency: string;
  balance: number;
  is_default: boolean;
  status: 'active' | 'inactive' | 'suspended';
  created_at?: string;
  updated_at?: string;
}

interface FinancialProduct {
  id: string;
  name: string;
  type: 'credit_personnel' | 'credit_immobilier' | 'credit_auto' | 'credit_professionnel' | 'microcredit' | 'credit_consommation';
  description: string;
  minAmount: number;
  maxAmount: number;
  duration: {
    min: number;
    max: number;
  };
  interestRate: {
    type: 'fixed' | 'variable';
    value?: number;
    min?: number;
    max?: number;
  };
  requirements: string[];
  acceptedGuarantees?: string[];
  isPublic: boolean;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface ManagementFees {
  setup_fee?: number;
  annual_fee?: number;
  performance_fee?: number;
}

interface PortfolioMetrics {
  net_value: number;
  average_return: number;
  risk_portfolio: number;
  sharpe_ratio: number;
  volatility: number;
  alpha: number;
  beta: number;
  asset_allocation: AssetAllocation[];
  performance_curve?: number[];
  returns?: number[];
  benchmark?: number[];
  balance_AGE?: BalanceAGE;
  taux_impayes?: number;
  taux_couverture?: number;
  // Métriques métier crédit/traditionnel
  nb_credits?: number;
  total_credits?: number;
  avg_credit?: number;
  nb_clients?: number;
  taux_rotation?: number;
  taux_provision?: number;
  taux_recouvrement?: number;
}

class ManagerInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  department?: string;
}

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  reference!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  manager_id!: string;

  @Column()
  institution_id!: string;

  @Column({
    type: 'enum',
    enum: PortfolioType,
    default: PortfolioType.TRADITIONAL
  })
  type!: PortfolioType;

  @Column({
    type: 'enum',
    enum: PortfolioStatus,
    default: PortfolioStatus.ACTIVE
  })
  status!: PortfolioStatus;

  @Column('decimal', { precision: 15, scale: 2 })
  target_amount!: number;
  
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  total_amount!: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  target_return?: number;

  @Column('simple-array', { nullable: true })
  target_sectors?: string[];

  @Column({
    type: 'enum',
    enum: RiskProfile,
    default: RiskProfile.MODERATE
  })
  risk_profile!: RiskProfile;

  @Column('simple-array', { default: [] })
  products!: string[];

  @Column('jsonb', { nullable: true })
  bank_accounts?: BankAccount[];

  @Column('jsonb', { nullable: true })
  financial_products?: FinancialProduct[];

  @Column('jsonb', { nullable: true })
  management_fees?: ManagementFees;

  @Column('jsonb', { nullable: true })
  metrics?: PortfolioMetrics;

  @Column('jsonb', { nullable: true })
  manager?: ManagerInfo;

  @Column({ default: 'XOF' })
  currency!: string;

  @Column({ nullable: true })
  clientCount?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  riskScore?: number;

  @Column({ nullable: true })
  clientId?: string;

  @Column('jsonb', { nullable: true })
  settings?: {
    maxLoanAmount: number;
    interestRateRange: {
      min: number;
      max: number;
    };
    loanTermRange: {
      min: number;
      max: number;
    };
    riskToleranceLevel: RiskToleranceLevel;
  };

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
