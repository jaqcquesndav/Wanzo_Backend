import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CustomerDocument } from '@/modules/customers/entities/document.entity';
import { CustomerActivity } from '@/modules/customers/entities/activity.entity';
import { ValidationProcess } from '@/modules/customers/entities/validation.entity';

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

  // Référence au profil complet dans CustomerDetailedProfile
  @Column({ unique: true })
  customerId: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
