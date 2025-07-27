import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum RiskToleranceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum PortfolioType {
  CREDIT = 'credit',
  SAVINGS = 'savings',
  MICROFINANCE = 'microfinance',
  TREASURY = 'treasury'
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

  @Column({
    default: 'active',
    enum: ['active', 'closed', 'suspended'],
    type: 'enum'
  })
  status!: string;
  
  @Column({
    type: 'enum',
    enum: PortfolioType,
    default: PortfolioType.CREDIT
  })
  type!: PortfolioType;
  
  @Column({
    nullable: true,
    default: RiskToleranceLevel.MEDIUM
  })
  riskProfile?: string;

  @Column('decimal', { precision: 15, scale: 2 })
  totalAmount!: number;

  @Column({ default: 'XOF' })
  currency!: string;

  @Column({ nullable: true })
  clientCount?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  riskScore?: number;

  @Column({ nullable: true })
  managerId?: string;

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
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}