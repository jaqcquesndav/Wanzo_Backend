import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum InstitutionType {
  BANK = 'bank',
  INSURANCE = 'insurance',
  INVESTMENT_FUND = 'investment_fund',
  MICROFINANCE = 'microfinance',
  PENSION_FUND = 'pension_fund',
  CREDIT_UNION = 'credit_union',
  OTHER = 'other'
}

/**
 * Entité FinancialInstitutionSpecificData - Données spécifiques aux institutions financières
 */
@Entity('financial_institution_specific_data')
export class FinancialInstitutionSpecificData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: InstitutionType
  })
  institutionType!: InstitutionType;

  @Column()
  licenseNumber!: string;

  @Column()
  regulatoryAuthority!: string;

  @Column({ nullable: true })
  yearEstablished!: number;

  @Column({ nullable: true })
  branchCount!: number;

  @Column({ nullable: true })
  clientCount!: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  assetUnderManagement!: number;

  @Column({ nullable: true })
  primaryRegulator!: string;

  @Column({ nullable: true })
  ceoName!: string;

  @Column({ nullable: true })
  cfoName!: string;

  @Column({ type: 'jsonb', nullable: true })
  keyExecutives!: Array<{
    name: string;
    position: string;
    email: string;
    phone: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  reportingRequirements!: Array<{
    type: string;
    frequency: string;
    lastSubmitted: Date;
    nextDue: Date;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  complianceInfo!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
