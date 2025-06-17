import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Customer } from '@/modules/customers/entities/customer.entity';

export enum FinancialInstitutionType {
  BANK = 'bank',
  MICROFINANCE = 'microfinance',
  INSURANCE = 'insurance',
  INVESTMENT = 'investment',
  OTHER = 'other',
}

@Entity('customer_financial_institution_specific_data')
export class FinancialInstitutionSpecificData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @OneToOne(() => Customer, customer => customer.financialInstitutionData)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({
    type: 'enum',
    enum: FinancialInstitutionType,
  })
  institutionType: FinancialInstitutionType;

  @Column({ nullable: true })
  regulatoryBody: string;

  @Column({ nullable: true })
  regulatoryLicenseNumber: string;

  @Column({ nullable: true })
  branchesCount: number;

  @Column({ nullable: true })
  clientsCount: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  assetsUnderManagement: number;
}
