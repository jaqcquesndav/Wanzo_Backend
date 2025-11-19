import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { UserSettings } from './user-settings.entity';
import { IdentityDocument } from './identity-document.entity';

export enum UserRole {
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant',
  ANALYST = 'analyst',
  CUSTOMER_ADMIN = 'customer_admin',
  CUSTOMER_USER = 'customer_user',
  VIEWER = 'viewer',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  PENDING_PROFILE = 'pending_profile',  // User créé mais sans organisation associée
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

export enum ProfileCompletionStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export enum SyncStatus {
  PENDING = 'pending',        // En attente de synchronisation
  IN_PROGRESS = 'in_progress', // Synchronisation en cours
  SYNCED = 'synced',          // Synchronisé avec succès
  FAILED = 'failed',          // Échec de synchronisation
  RETRY = 'retry',            // En attente de retry
}

export enum UserType {
  SYSTEM = 'system',
  CUSTOMER = 'customer',
  SME = 'sme',
  FINANCIAL_INSTITUTION = 'financial_institution',
}

export enum AccountType {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  CONSULTANT = 'CONSULTANT',
  OTHER = 'OTHER',
}

export enum IdType {
  NATIONAL_ID = 'national_id',
  PASSPORT = 'passport',
  DRIVING_LICENSE = 'driver_license',
  OTHER = 'other'
}

export enum IdStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

/**
 * Entité User - Représente un utilisateur du système
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  givenName?: string;

  @Column({ nullable: true })
  familyName?: string;

  @Column({ unique: true })
  email!: string;

  @Column({ default: false })
  emailVerified!: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER_USER,
  })
  role!: UserRole;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.CUSTOMER,
  })
  userType!: UserType;

  @Column({ nullable: true })
  customerId!: string;

  @Column({ nullable: true })
  companyId!: string;

  @Column({ nullable: true })
  financialInstitutionId!: string;

  @Column({ default: false })
  isCompanyOwner!: boolean;

  @Column({
    type: 'enum',
    enum: AccountType,
    nullable: true
  })
  accountType?: AccountType;

  @ManyToOne(() => Customer, customer => customer.users, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status!: UserStatus;

  @Column({ nullable: true })
  picture?: string;

  @Column('simple-json', { nullable: true })
  permissions?: string[] | {
    applicationId: string;
    permissions: string[];
  }[];

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true })
  phone?: string;
  
  @Column({ default: false })
  phoneVerified!: boolean;
  
  @Column({ nullable: true })
  position?: string;
  
  @Column({ nullable: true })
  address?: string;
  
  @Column({
    type: 'enum',
    enum: IdType,
    nullable: true
  })
  idType?: IdType;
  
  @Column({ nullable: true })
  idNumber?: string;

  @Column({
    type: 'enum',
    enum: IdStatus,
    nullable: true
  })
  idStatus?: IdStatus;
  
  @Column({ nullable: true })
  identityDocumentType?: string;
  
  @Column({ nullable: true })
  identityDocumentUrl?: string;
  
  @Column({
    type: 'enum',
    enum: IdStatus,
    nullable: true,
    default: IdStatus.PENDING
  })
  identityDocumentStatus?: IdStatus;
  
  @Column({ type: 'timestamp', nullable: true })
  identityDocumentUpdatedAt?: Date;
  
  @Column({ nullable: true })
  birthdate?: Date;
  
  @Column({ nullable: true })
  bio?: string;
  
  @Column({ nullable: true })
  language?: string;

  @Column({ nullable: true })
  timezone?: string;

  @Column({ nullable: true })
  plan?: string;
  
  @Column({ default: 0 })
  tokenBalance!: number;
  
  @Column({ default: 0 })
  tokenTotal!: number;
  
  @Column({ type: 'jsonb', nullable: true })
  settings?: {
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
    security?: {
      twoFactorEnabled?: boolean;
      twoFactorMethod?: string;
      lastPasswordChange?: Date;
    };
    preferences?: {
      theme?: string;
      language?: string;
      currency?: string;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  devices?: { deviceId: string; lastLogin: Date; deviceInfo: Record<string, any> }[];

  @Column({ nullable: true })
  auth0Id?: string;

  // === GESTION DES ÉTATS INTERMÉDIAIRES ===
  @Column({
    type: 'enum',
    enum: ProfileCompletionStatus,
    default: ProfileCompletionStatus.NOT_STARTED,
  })
  profileCompletionStatus!: ProfileCompletionStatus;

  @Column({ type: 'timestamp', nullable: true })
  profileCompletionDeadline?: Date;  // 7 jours après création

  @Column({ type: 'timestamp', nullable: true })
  profileCompletedAt?: Date;

  @Column({ default: 0 })
  profileCompletionReminders!: number;  // Nombre de rappels envoyés

  // === GESTION DE LA SYNCHRONISATION KAFKA ===
  @Column({
    type: 'enum',
    enum: SyncStatus,
    default: SyncStatus.PENDING,
  })
  syncStatus!: SyncStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAttempt?: Date;

  @Column({ default: 0 })
  syncRetryCount!: number;

  @Column({ type: 'text', nullable: true })
  lastSyncError?: string;

  @Column({ type: 'jsonb', nullable: true })
  syncMetadata?: {
    servicesToSync?: string[];  // Services qui doivent recevoir les données
    syncedServices?: string[];   // Services qui ont confirmé la réception
    failedServices?: string[];   // Services qui ont échoué
    lastSuccessfulSync?: Record<string, string>;  // Timestamp par service
  };

  // Relations avec les nouvelles entités
  @OneToOne(() => UserSettings, settings => settings.user, { cascade: true, nullable: true })
  userSettings?: UserSettings;

  @OneToMany(() => IdentityDocument, document => document.user, { cascade: true })
  identityDocuments?: IdentityDocument[];

  @Column({ select: false, nullable: true })
  password?: string;

  @Column({ nullable: true, select: false })
  twoFactorSecret?: string;

  @Column({ nullable: true, select: false })
  resetPasswordToken?: string;

  @Column({ type: 'timestamp', nullable: true, select: false })
  resetPasswordExpires?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin?: Date;
}
