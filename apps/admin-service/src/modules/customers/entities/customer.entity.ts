import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { CustomerDocument } from '@/modules/customers/entities/document.entity';
import { CustomerActivity } from '@/modules/customers/entities/activity.entity';
import { ValidationProcess } from '@/modules/customers/entities/validation.entity';
import { PmeSpecificData } from '@/modules/customers/entities/pme-specific-data.entity';
import { FinancialInstitutionSpecificData } from '@/modules/customers/entities/financial-institution-specific-data.entity';

export enum CustomerType {
  PME = 'pme',
  FINANCIAL = 'financial'
}

export enum CustomerStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
  NEEDS_VALIDATION = 'needs_validation',
  VALIDATION_IN_PROGRESS = 'validation_in_progress'
}

export enum AccountType {
  FREEMIUM = 'freemium',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: CustomerType
  })
  type: CustomerType;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column()
  country: string;

  @Column({
    type: 'enum',
    enum: CustomerStatus,
    default: CustomerStatus.PENDING
  })
  status: CustomerStatus;

  @Column()
  billingContactName: string;

  @Column()
  billingContactEmail: string;

  @Column({ default: 0 })
  tokenAllocation: number;

  @Column({
    type: 'enum',
    enum: AccountType
  })
  accountType: AccountType;

  @Column({ nullable: true })
  ownerId: string;

  @Column({ nullable: true })
  ownerEmail: string;

  @Column({ nullable: true })
  validatedAt: Date;

  @Column({ nullable: true })
  validatedBy: string;

  @Column({ nullable: true })
  suspendedAt: Date | null;

  @Column({ nullable: true })
  suspendedBy: string | null;

  @Column({ nullable: true })
  suspensionReason: string | null;

  @Column({ nullable: true })
  reactivatedAt: Date | null;

  @Column({ nullable: true })
  reactivatedBy: string | null;

  @Column('jsonb', { nullable: true })
  validationHistory: Array<{
    date: Date;
    action: 'validated' | 'revoked' | 'info_requested' | 'info_submitted';
    by: string;
    notes?: string;
  }>;

  @OneToMany(() => CustomerDocument, document => document.customer)
  documents: CustomerDocument[];

  @OneToMany(() => CustomerActivity, activity => activity.customer)
  activities: CustomerActivity[];

  @OneToMany(() => ValidationProcess, process => process.customer)
  validationProcesses: ValidationProcess[];

  @OneToOne(() => PmeSpecificData, pmeData => pmeData.customer, { cascade: true, nullable: true })
  pmeData: PmeSpecificData;

  @OneToOne(() => FinancialInstitutionSpecificData, financialData => financialData.customer, { cascade: true, nullable: true })
  financialInstitutionData: FinancialInstitutionSpecificData;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
