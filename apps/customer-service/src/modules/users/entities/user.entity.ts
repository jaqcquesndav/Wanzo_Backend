import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

export enum UserRole {
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant',
  ANALYST = 'analyst',
  CUSTOMER_ADMIN = 'customer_admin',
  CUSTOMER_USER = 'customer_user',
}

export enum UserStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

export enum UserType {
  SYSTEM = 'system',
  CUSTOMER = 'customer',
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

  @Column({ unique: true })
  email!: string;

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
  avatar?: string;

  @Column('simple-json', { nullable: true })
  permissions?: {
    applicationId: string;
    permissions: string[];
  }[];

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true })
  phoneNumber?: string;
  
  @Column({ nullable: true })
  position?: string;
  
  @Column({ nullable: true })
  idAgent?: string;
  
  @Column({ nullable: true })
  validityEnd?: Date;
  
  @Column({ nullable: true })
  language?: string;
  
  @Column({ nullable: true })
  timezone?: string;
  
  @Column('jsonb', { nullable: true })
  kyc?: {
    status: 'pending' | 'verified' | 'rejected';
    verifiedAt?: string;
    documents?: Array<{
      type: string;
      verified: boolean;
      uploadedAt: string;
    }>;
  };

  @Column({ type: 'jsonb', nullable: true })
  preferences?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  devices?: { deviceId: string; lastLogin: Date; deviceInfo: Record<string, any> }[];

  @Column({ nullable: true })
  auth0Id?: string;

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
