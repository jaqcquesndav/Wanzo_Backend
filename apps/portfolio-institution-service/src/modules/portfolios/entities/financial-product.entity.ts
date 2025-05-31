import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Portfolio } from './portfolio.entity';

export enum ProductType {
  CREDIT = 'credit',
  BOND = 'bond',
  EQUITY = 'equity'
}

@Entity('financial_products')
export class FinancialProduct {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  kiotaId!: string;

  @Column('uuid')
  portfolioId!: string;

  @ManyToOne(() => Portfolio)
  @JoinColumn({ name: 'portfolioId' })
  portfolio!: Portfolio;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: ProductType,
  })
  type!: ProductType;

  @Column('jsonb')
  characteristics!: {
    minAmount: number;
    maxAmount: number;
    minDuration: number;
    maxDuration: number;
    interestRateType: string;
    minInterestRate: number;
    maxInterestRate: number;
    requiredGuarantees: string[];
    eligibilityCriteria: string[];
  };

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}