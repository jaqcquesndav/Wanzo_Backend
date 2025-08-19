import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum MetricType {
  TRANSACTION_VOLUME = 'transaction_volume',
  CREDIT_SCORE = 'credit_score',
  AML_SCORE = 'aml_score',
  MARKET_INDEX = 'market_index',
  RISK_SCORE = 'risk_score',
  FINANCIAL_RATIO = 'financial_ratio',
  HISTORICAL_PATTERN = 'historical_pattern',
  MARKET = 'market'
}

@Entity('timeseries_metrics')
export class Metric {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  entityId!: string;

  @Column()
  entityType!: string;

  @Column({
    type: 'enum',
    enum: MetricType
  })
  type!: MetricType;

  @Column('decimal', { precision: 20, scale: 4 })
  value!: number;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  timestamp!: Date;
}
