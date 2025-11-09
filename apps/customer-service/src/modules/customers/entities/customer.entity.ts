import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { CustomerDocument } from './customer-document.entity';
import { CustomerActivity } from './customer-activity.entity';
import { ValidationProcess } from './validation-process.entity';
import { SmeSpecificData } from './sme-specific-data.entity';
import { FinancialInstitutionSpecificData } from './financial-institution-specific-data.entity';
import { EnterpriseIdentificationForm } from './enterprise-identification-form.entity';
import { User } from '../../system-users/entities/user.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { TokenUsage } from '../../tokens/entities/token-usage.entity';
import { AssetData } from './asset-data.entity';
import { StockData } from './stock-data.entity';
import { EncryptedColumnTransformer, EncryptedJsonTransformer } from '../../../security/encrypted-transformers';

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
  ENTERPRISE = 'enterprise',
  BUSINESS = 'business'
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

  @Column({ nullable: true })
  logo?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: CustomerType
  })
  type!: CustomerType;

  @Column({ unique: true })
  email!: string;

  @Column({ 
    transformer: new EncryptedColumnTransformer()
  })
  phone!: string;

  @Column('jsonb', { nullable: true })
  address!: {
    street?: string;
    commune?: string;
    city?: string;
    province?: string;
    country?: string;
  };

  @Column('jsonb', { nullable: true })
  locations?: Array<{
    id: string;
    name: string;
    type: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;

  @Column('jsonb', { 
    nullable: true,
    transformer: new EncryptedJsonTransformer()
  })
  contacts?: {
    email?: string;
    phone?: string;
    altPhone?: string;
  };

  @Column({
    type: 'enum',
    enum: CustomerStatus,
    default: CustomerStatus.PENDING
  })
  status!: CustomerStatus;

  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true })
  facebookPage?: string;

  @Column({ nullable: true })
  linkedinPage?: string;

  // Nouveaux champs selon documentation v2.1
  @Column({ nullable: true })
  legalForm?: string;

  @Column({ nullable: true })
  industry?: string;

  @Column({ nullable: true })
  size?: string;

  @Column({ nullable: true })
  rccm?: string;

  @Column({ nullable: true })
  taxId?: string;

  @Column({ nullable: true })
  natId?: string;

  // Activités étendues v2.1
  @Column('jsonb', { nullable: true })
  activities?: {
    primary?: string;
    secondary?: string[];
  };

  // Secteurs personnalisés v2.1
  @Column('simple-array', { nullable: true })
  secteursPersnnalises?: string[];

  // Capital social
  @Column('jsonb', { nullable: true })
  capital?: {
    isApplicable?: boolean;
    amount?: number;
    currency?: 'USD' | 'CDF' | 'EUR';
  };

  // Données financières
  @Column('jsonb', { nullable: true })
  financials?: {
    revenue?: number;
    netIncome?: number;
    totalAssets?: number;
    equity?: number;
  };

  // Affiliations institutionnelles
  @Column('jsonb', { nullable: true })
  affiliations?: {
    cnss?: string;
    inpp?: string;
    onem?: string;
    intraCoop?: string;
    interCoop?: string;
    partners?: string[];
  };

  @Column({ nullable: true })
  billingContactName?: string;

  @Column({ nullable: true })
  billingContactEmail?: string;

  @Column({ default: 0 })
  tokenAllocation!: number;

  @Column({
    type: 'enum',
    enum: AccountType,
    nullable: true
  })
  accountType?: AccountType;

  @Column({ nullable: true })
  ownerId!: string;

  @Column({ nullable: true })
  ownerEmail!: string;

  @Column('jsonb', { nullable: true })
  owner?: {
    id?: string;
    name?: string;
    gender?: string;
    email?: string;
    phone?: string;
    hasOtherJob?: boolean;
    cv?: string;
    linkedin?: string;
    facebook?: string;
  };

  @Column('jsonb', { nullable: true })
  associates?: Array<{
    id?: string;
    name?: string;
    gender?: string;
    role?: string;
    shares?: number;
    email?: string;
    phone?: string;
  }>;

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
  rejectedAt!: Date;

  @Column({ nullable: true })
  rejectedBy!: string;

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
  subscription?: {
    plan?: {
      name?: string;
    };
    status?: string;
    currentPeriodEnd?: Date;
  };

  @Column('jsonb', { nullable: true })
  preferences!: Record<string, any>;

  @OneToMany(() => CustomerDocument, document => document.customer)
  documents!: CustomerDocument[];

  @OneToMany(() => CustomerActivity, activity => activity.customer)
  customerActivities!: CustomerActivity[];

  @OneToMany(() => ValidationProcess, process => process.customer)
  validationProcesses!: ValidationProcess[];

  @OneToOne(() => SmeSpecificData, { cascade: true, nullable: true })
  @JoinColumn()
  smeData!: SmeSpecificData;

  @OneToOne(() => FinancialInstitutionSpecificData, { cascade: true, nullable: true })
  @JoinColumn()
  financialData!: FinancialInstitutionSpecificData;

  @OneToOne(() => EnterpriseIdentificationForm, { cascade: true, nullable: true })
  @JoinColumn()
  extendedIdentification?: EnterpriseIdentificationForm;

  @OneToMany(() => User, user => user.customer)
  users!: User[];

  @OneToMany(() => Subscription, subscription => subscription.customer)
  subscriptions!: Subscription[];

  @OneToMany(() => TokenUsage, tokenUsage => tokenUsage.customer)
  tokenUsages!: TokenUsage[];

  // Relations patrimoine v2.1
  @OneToMany(() => AssetData, asset => asset.customer)
  assets!: AssetData[];

  @OneToMany(() => StockData, stock => stock.customer)
  stocks!: StockData[];

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
