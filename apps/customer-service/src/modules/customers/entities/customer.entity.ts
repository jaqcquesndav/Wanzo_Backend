import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { CustomerDocument } from './customer-document.entity';
import { CustomerActivity } from './customer-activity.entity';
import { ValidationProcess } from './validation-process.entity';
import { SmeSpecificData } from './sme-specific-data.entity';
import { FinancialInstitutionSpecificData } from './financial-institution-specific-data.entity';
import { User } from '../../users/entities/user.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { TokenUsage } from '../../tokens/entities/token-usage.entity';

export enum CustomerType {
  SME = 'sme',
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

/**
 * Entité Customer - Représente un client (PME ou Institution financière)
 */
@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: CustomerType
  })
  type!: CustomerType;

  @Column({ unique: true })
  email!: string;

  @Column()
  phone!: string;

  @Column()
  address!: string;

  @Column()
  city!: string;

  @Column()
  country!: string;

  @Column({
    type: 'enum',
    enum: CustomerStatus,
    default: CustomerStatus.PENDING
  })
  status!: CustomerStatus;

  @Column()
  billingContactName!: string;

  @Column()
  billingContactEmail!: string;

  @Column({ default: 0 })
  tokenAllocation!: number;

  @Column({
    type: 'enum',
    enum: AccountType
  })
  accountType!: AccountType;

  @Column({ nullable: true })
  ownerId!: string;

  @Column({ nullable: true })
  ownerEmail!: string;

  @Column({ nullable: true })
  validatedAt!: Date;

  @Column({ nullable: true })
  validatedBy!: string;

  @Column({ nullable: true })
  suspendedAt!: Date;

  @Column({ nullable: true })
  suspendedBy!: string;

  @Column({ nullable: true })
  suspensionReason!: string;

  @Column({ nullable: true })
  reactivatedAt!: Date;

  @Column({ nullable: true })
  reactivatedBy!: string;

  @Column('jsonb', { nullable: true })
  validationHistory!: Array<{
    date: Date;
    action: 'validated' | 'revoked' | 'info_requested' | 'info_submitted';
    by: string;
    notes?: string;
  }>;

  @Column('jsonb', { nullable: true })
  preferences!: Record<string, any>;

  @OneToMany(() => CustomerDocument, document => document.customer)
  documents!: CustomerDocument[];

  @OneToMany(() => CustomerActivity, activity => activity.customer)
  activities!: CustomerActivity[];

  @OneToMany(() => ValidationProcess, process => process.customer)
  validationProcesses!: ValidationProcess[];

  @OneToOne(() => SmeSpecificData, { cascade: true, nullable: true })
  @JoinColumn()
  smeData!: SmeSpecificData;

  @OneToOne(() => FinancialInstitutionSpecificData, { cascade: true, nullable: true })
  @JoinColumn()
  financialData!: FinancialInstitutionSpecificData;

  @OneToMany(() => User, user => user.customer)
  users!: User[];

  @OneToMany(() => Subscription, subscription => subscription.customer)
  subscriptions!: Subscription[];

  @OneToMany(() => TokenUsage, tokenUsage => tokenUsage.customer)
  tokenUsages!: TokenUsage[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
