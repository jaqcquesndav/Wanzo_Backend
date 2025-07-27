import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Portfolio } from './portfolio.entity';

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

@Entity('financial_products')
export class FinancialProduct {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  code!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  portfolio_id!: string;
  
  @ManyToOne(() => Portfolio)
  @JoinColumn({ name: 'portfolio_id' })
  portfolio!: Portfolio;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE
  })
  status!: ProductStatus;

  @Column('decimal', { precision: 5, scale: 2 })
  base_interest_rate!: number;

  @Column({ nullable: true })
  interest_type?: string;

  @Column({ nullable: true })
  interest_calculation_method?: string;

  @Column('decimal', { precision: 15, scale: 2 })
  min_amount!: number;

  @Column('decimal', { precision: 15, scale: 2 })
  max_amount!: number;

  @Column()
  min_term!: number;

  @Column()
  max_term!: number;

  @Column({ default: 'months' })
  term_unit!: string;

  @Column('jsonb', { nullable: true })
  required_documents?: string[];

  @Column('jsonb', { nullable: true })
  fees?: {
    type: string;
    amount: number;
    is_percentage: boolean;
  }[];

  @Column('jsonb', { nullable: true })
  eligibility_criteria?: {
    criterion: string;
    description: string;
  }[];

  @Column({ nullable: true })
  created_by?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}