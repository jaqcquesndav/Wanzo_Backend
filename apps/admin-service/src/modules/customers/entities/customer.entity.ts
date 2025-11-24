import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import type { CustomerDocument } from '@/modules/customers/entities/document.entity';
import type { CustomerActivity } from '@/modules/customers/entities/activity.entity';
import type { ValidationProcess } from '@/modules/customers/entities/validation.entity';

export enum CustomerType {
  SME = 'sme',
  FINANCIAL = 'financial'
}

console.log('CustomerType:', CustomerType);

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

  // Référence au profil complet dans CustomerDetailedProfile
  @Column({ unique: true })
  customerId: string;

  @Column({ type: 'timestamp', nullable: true })
  validatedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  validatedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  suspendedAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  suspendedBy: string | null;

  @Column({ type: 'text', nullable: true })
  suspensionReason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reactivatedAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  reactivatedBy: string | null;

  @Column('jsonb', { nullable: true })
  validationHistory: any[];

  @OneToMany('CustomerDocument', 'customer')
  documents: CustomerDocument[];

  @OneToMany('CustomerActivity', 'customer')
  activities: CustomerActivity[];

  @OneToMany('ValidationProcess', 'customer')
  validationProcesses: ValidationProcess[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
