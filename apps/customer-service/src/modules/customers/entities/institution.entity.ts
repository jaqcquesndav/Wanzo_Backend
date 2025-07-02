import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Customer } from './customer.entity';

export enum InstitutionType {
  BANK = 'bank',
  INSURANCE = 'insurance',
  INVESTMENT_FUND = 'investment_fund',
  ASSET_MANAGER = 'asset_manager',
  MICROFINANCE = 'microfinance',
  OTHER = 'other',
}

/**
 * Entité Institution - Données spécifiques pour les institutions financières
 */
@Entity('institutions')
export class Institution {
  @PrimaryColumn()
  customerId!: string;

  @OneToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column({
    type: 'enum',
    enum: InstitutionType,
    default: InstitutionType.OTHER
  })
  institutionType!: InstitutionType;

  @Column()
  licenseNumber!: string;

  @Column({ nullable: true })
  regulatoryAuthority!: string;

  @Column({ nullable: true })
  foundingDate!: Date;

  @Column({ default: 0 })
  numberOfBranches!: number;

  @Column({ nullable: true })
  assetUnderManagement!: number;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ nullable: true })
  website!: string;

  @Column({ type: 'jsonb', default: {} })
  additionalDetails!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
