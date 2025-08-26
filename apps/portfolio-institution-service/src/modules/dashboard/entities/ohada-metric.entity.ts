import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Portfolio } from '../../portfolios/entities/portfolio.entity';

export enum MetricType {
  NPL_RATIO = 'npl_ratio',
  PROVISION_RATE = 'provision_rate',
  COLLECTION_EFFICIENCY = 'collection_efficiency',
  ROA = 'roa',
  PORTFOLIO_YIELD = 'portfolio_yield',
  BALANCE_AGE = 'balance_age',
  RISK_ASSESSMENT = 'risk_assessment'
}

export enum CalculationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  STALE = 'stale'
}

@Entity('ohada_metrics')
@Index(['portfolio_id', 'metric_type', 'calculation_date'])
@Index(['institution_id', 'calculation_date'])
export class OHADAMetric {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  institution_id!: string;

  @Column({ nullable: true })
  portfolio_id?: string;

  @ManyToOne(() => Portfolio, { nullable: true })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio?: Portfolio;

  @Column({
    type: 'enum',
    enum: MetricType
  })
  metric_type!: MetricType;

  @Column('decimal', { precision: 10, scale: 4 })
  value!: number;

  @Column('jsonb', { nullable: true })
  details?: {
    // Pour NPL_RATIO
    npl_amount?: number;
    total_loans?: number;
    
    // Pour BALANCE_AGE
    current?: number;
    days30?: number;
    days60?: number;
    days90Plus?: number;
    
    // Pour RISK_ASSESSMENT
    risk_score?: number;
    risk_factors?: string[];
    
    // Métadonnées générales
    data_sources?: string[];
    calculation_method?: string;
    assumptions?: Record<string, any>;
  };

  @Column('jsonb', { nullable: true })
  benchmarks?: {
    industry_average?: number;
    regulatory_threshold?: number;
    target_value?: number;
    peer_comparison?: number;
  };

  @Column({
    type: 'enum',
    enum: CalculationStatus,
    default: CalculationStatus.PENDING
  })
  status!: CalculationStatus;

  @Column('date')
  calculation_date!: Date;

  @Column('date')
  period_start!: Date;

  @Column('date')
  period_end!: Date;

  @Column({ nullable: true })
  calculated_by?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('jsonb', { nullable: true })
  validation_rules?: {
    rule_name: string;
    expected_range: { min: number; max: number };
    actual_value: number;
    is_valid: boolean;
    warning_message?: string;
  }[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

// Entité pour stocker les snapshots de métriques agrégées
@Entity('ohada_snapshots')
@Index(['institution_id', 'snapshot_date'])
export class OHADASnapshot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  institution_id!: string;

  @Column({ nullable: true })
  portfolio_id?: string;

  @Column('jsonb')
  metrics_summary!: {
    npl_ratio: number;
    provision_rate: number;
    collection_efficiency: number;
    roa: number;
    portfolio_yield: number;
    risk_level: string;
    compliance_status: string;
  };

  @Column('jsonb')
  balance_age!: {
    current: number;
    days30: number;
    days60: number;
    days90Plus: number;
  };

  @Column('jsonb')
  regulatory_compliance!: {
    bceao_compliant: boolean;
    ohada_provision_compliant: boolean;
    risk_rating: string;
  };

  @Column('jsonb')
  performance_data!: {
    monthly_performance: number[];
    growth_rate: number;
    total_amount: number;
    active_contracts: number;
    avg_loan_size: number;
  };

  @Column('date')
  snapshot_date!: Date;

  @Column('jsonb', { nullable: true })
  metadata?: {
    data_sources_count: number;
    calculation_duration_ms: number;
    quality_score: number;
    last_refresh: string;
  };

  @CreateDateColumn()
  created_at!: Date;
}
