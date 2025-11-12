import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';
import { Customer } from './customer.entity';

export enum CustomerUserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  VIEWER = 'viewer',
}

export enum CustomerUserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

/**
 * Entity pour gérer les relations entre clients et utilisateurs
 * Remplace les relations directes complexes dans User entity
 */
@Entity('customer_users')
@Index(['customerId', 'userId'], { unique: true })
export class CustomerUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  customerId!: string;

  @Column('uuid')
  @Index()
  userId!: string;

  @Column({
    type: 'enum',
    enum: CustomerUserRole,
    default: CustomerUserRole.USER,
  })
  role!: CustomerUserRole;

  @Column({
    type: 'enum',
    enum: CustomerUserStatus,
    default: CustomerUserStatus.ACTIVE,
  })
  status!: CustomerUserStatus;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  invitedBy?: string;

  @Column({ nullable: true })
  invitedAt?: Date;

  @Column({ nullable: true })
  joinedAt?: Date;

  @Column({ nullable: true })
  lastActiveAt?: Date;

  @Column('jsonb', { nullable: true })
  permissions?: string[];

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  customer!: Customer;
}