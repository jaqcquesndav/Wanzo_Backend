import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PortfolioType {
  TRADITIONAL = 'traditional_finance',
  LEASING = 'leasing',
  INVESTMENT = 'investment'
}

export enum RiskProfile {
  LOW = 'low',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive'
}

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  kiotaId!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: PortfolioType,
  })
  type!: PortfolioType;

  @Column({ default: true })
  active!: boolean;

  @Column('decimal', { precision: 15, scale: 2 })
  targetAmount!: number;

  @Column('decimal', { precision: 5, scale: 2 })
  targetReturn!: number;

  @Column('simple-array')
  targetSectors!: string[];

  @Column({
    type: 'enum',
    enum: RiskProfile,
  })
  riskProfile!: RiskProfile;

  @Column('jsonb')
  metrics!: {
    netValue: number;
    averageReturn: number;
    riskPortfolio: number;
    sharpeRatio: number;
    volatility: number;
    alpha: number;
    beta: number;
    assetAllocation?: {
      type: string;
      percentage: number;
    }[];
  };

  @Column({ nullable: true })
  companyId?: string;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}