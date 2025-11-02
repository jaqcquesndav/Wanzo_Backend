import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from './company.entity';

export enum OpportunityType {
  BOND = 'bond',
  SHARE = 'share'
}

export enum OpportunityStatus {
  LEAD = 'lead',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed-won',
  CLOSED_LOST = 'closed-lost'
}

export enum SecurityStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  CLOSED = 'closed'
}

export interface SecurityDetails {
  totalAmount: number;
  unitPrice: number;
  quantity: number;
  maturityDate?: string;
  interestRate?: number;
  dividendYield?: number;
  minimumInvestment: number;
  status: SecurityStatus;
}

@Entity('security_opportunities')
export class SecurityOpportunity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  company_id!: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Column({
    type: 'enum',
    enum: OpportunityType
  })
  type!: OpportunityType;

  @Column({
    type: 'enum',
    enum: OpportunityStatus,
    default: OpportunityStatus.LEAD
  })
  status!: OpportunityStatus;

  @Column()
  sector!: string;

  @Column({ nullable: true })
  region?: string;

  @Column('jsonb')
  details!: SecurityDetails;

  @Column('text', { nullable: true })
  description?: string;

  @Column()
  institution_id!: string;

  @Column({ nullable: true })
  created_by?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}