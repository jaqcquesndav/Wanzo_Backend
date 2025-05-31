import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { InstitutionUser } from './institution-user.entity';
import { InstitutionDocument } from './institution-document.entity';

export enum InstitutionType {
  BANK = 'bank',
  INSURANCE = 'insurance',
  INVESTMENT_FUND = 'investment_fund',
  MICROFINANCE = 'microfinance',
  OTHER = 'other'
}

export enum LicenseType {
  NATIONAL = 'national',
  REGIONAL = 'regional',
  INTERNATIONAL = 'international'
}

export enum RegulatoryStatus {
  COMPLIANT = 'compliant',
  PENDING = 'pending',
  NON_COMPLIANT = 'non_compliant'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled'
}

export enum SubscriptionPlan {
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise'
}

@Entity('institutions')
export class Institution {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  kiotaId!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: InstitutionType,
  })
  type!: InstitutionType;

  @Column({ default: true })
  active!: boolean;

  @Column()
  licenseNumber!: string;

  @Column({
    type: 'enum',
    enum: LicenseType,
  })
  licenseType!: LicenseType;

  @Column()
  address!: string;

  @Column()
  phone!: string;

  @Column()
  email!: string;

  @Column()
  website!: string;

  @Column()
  legalRepresentative!: string;

  @Column()
  taxId!: string;

  @Column({
    type: 'enum',
    enum: RegulatoryStatus,
    default: RegulatoryStatus.PENDING
  })
  regulatoryStatus!: RegulatoryStatus;

  @OneToMany(() => InstitutionUser, user => user.institution)
  users!: InstitutionUser[];

  @OneToMany(() => InstitutionDocument, document => document.institution)
  documents!: InstitutionDocument[];

  // Subscription fields
  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.BASIC
  })
  subscriptionPlan!: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE
  })
  subscriptionStatus!: SubscriptionStatus;

  @Column({ nullable: true })
  subscriptionExpiresAt?: Date;

  // Token management
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  tokenBalance!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  tokensUsed!: number;

  @Column('jsonb')
  tokenUsageHistory!: {
    date: Date;
    amount: number;
    operation: string;
    balance: number;
  }[];

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, any>;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}