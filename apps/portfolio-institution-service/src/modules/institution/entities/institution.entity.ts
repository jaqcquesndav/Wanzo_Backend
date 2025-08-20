import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { InstitutionDocument } from './institution-document.entity';
import { InstitutionUser } from './institution-user.entity';
import { SubscriptionPlanType, SubscriptionStatusType, InstitutionStatusType } from '@wanzobe/shared';

export enum InstitutionType {
  BANK = 'bank',
  MICROFINANCE = 'microfinance',
  FINTECH = 'fintech',
  // ... other types
}

export enum LicenseType {
  UNIVERSAL_BANKING = 'universal_banking',
  COMMERCIAL_BANKING = 'commercial_banking',
  MICROFINANCE = 'microfinance',
  FINANCIAL_SERVICES = 'financial_services',
  INVESTMENT_BANKING = 'investment_banking',
  PROVISIONAL = 'provisional',
  RESTRICTED = 'restricted',
  NATIONAL = 'national'
}

export enum RegulatoryStatus {
  REGULATED = 'regulated',
  NON_REGULATED = 'non_regulated',
  APPROVED = 'approved',
  PENDING = 'pending',
  REJECTED = 'rejected',
  COMPLIANT = 'compliant'
}

// Export enums for backward compatibility
export { SubscriptionPlanType as SubscriptionPlan };
export { SubscriptionStatusType as SubscriptionStatus };

@Entity('institutions')
export class Institution {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  kiotaId!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: InstitutionType,
  })
  type!: InstitutionType;

  @Column({
    type: 'enum',
    enum: InstitutionStatusType,
    default: InstitutionStatusType.PENDING_VERIFICATION,
  })
  status!: InstitutionStatusType;

  @Column({ nullable: true })
  license_number?: string;

  @Column({
    type: 'enum',
    enum: LicenseType,
    nullable: true
  })
  license_type?: LicenseType;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true })
  legal_representative?: string;

  @Column({ nullable: true })
  tax_id?: string;

  @Column({
    type: 'enum',
    enum: RegulatoryStatus,
    default: RegulatoryStatus.PENDING
  })
  regulatory_status!: RegulatoryStatus;

  @Column('jsonb', { default: {} })
  metadata!: Record<string, any>; // Store additional details

  @Column({ default: true })
  active!: boolean;

  @Column({ nullable: true })
  createdBy?: string; // User ID of the creator

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => InstitutionDocument, document => document.institution)
  documents!: InstitutionDocument[];

  @OneToMany(() => InstitutionUser, user => user.institution)
  users!: InstitutionUser[];

  // Subscription-related fields
  @Column({
    type: 'enum',
    enum: SubscriptionPlanType,
    nullable: true,
  })
  subscriptionPlan?: SubscriptionPlanType;

  @Column({
    type: 'enum',
    enum: SubscriptionStatusType,
    nullable: true,
  })
  subscriptionStatus?: SubscriptionStatusType;

  @Column({ type: 'timestamp with time zone', nullable: true })
  subscriptionEndDate?: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastSubscriptionChangeAt?: Date | null;
  
  // Renamed to match what's used in the code
  @Column({ type: 'timestamp with time zone', nullable: true })
  subscriptionExpiresAt?: Date | null;
  
  // Token-related fields
  @Column({ type: 'integer', default: 0 })
  tokenBalance!: number;
  
  @Column({ type: 'integer', default: 0 })
  tokensUsed!: number;
  
  @Column({ type: 'jsonb', default: [] })
  tokenUsageHistory!: Array<{
    date: Date;
    amount: number;
    operation: string;
    balance: number;
  }>;
}
