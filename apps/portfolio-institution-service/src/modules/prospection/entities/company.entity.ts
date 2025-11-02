import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CompanySize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export enum CompanyStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  REJECTED = 'rejected',
  FUNDED = 'funded',
  CONTACTED = 'contacted'
}

export interface FinancialMetrics {
  revenue_growth: number;
  profit_margin: number;
  cash_flow: number;
  debt_ratio: number;
  working_capital: number;
  credit_score: number;
  financial_rating: string;
  ebitda?: number;
}

export interface ESGMetrics {
  carbon_footprint: number;
  environmental_rating: string;
  social_rating: string;
  governance_rating: string;
  gender_ratio?: {
    male: number;
    female: number;
  };
}

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  sector!: string;

  @Column({
    type: 'enum',
    enum: CompanySize
  })
  size!: CompanySize;

  @Column('decimal', { precision: 15, scale: 2 })
  annual_revenue!: number;

  @Column('int')
  employee_count!: number;

  @Column({ nullable: true })
  website_url?: string;

  @Column({ nullable: true })
  pitch_deck_url?: string;

  @Column({
    type: 'enum',
    enum: CompanyStatus,
    default: CompanyStatus.ACTIVE
  })
  status!: CompanyStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastContact?: Date;

  @Column('jsonb')
  financial_metrics!: FinancialMetrics;

  @Column('jsonb')
  esg_metrics!: ESGMetrics;

  @Column()
  institution_id!: string;

  @Column({ nullable: true })
  created_by?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}