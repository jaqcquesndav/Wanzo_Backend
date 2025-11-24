import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { DocumentType } from './document.entity';

// Define locally to avoid circular dependency
export enum ValidationCustomerStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
  NEEDS_VALIDATION = 'needs_validation',
  VALIDATION_IN_PROGRESS = 'validation_in_progress'
}

export enum ValidationStepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

@Entity('customer_validation_processes')
export class ValidationProcess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @ManyToOne(() => Customer, customer => customer.validationProcesses)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;
  @Column({
    type: 'enum',
    enum: ValidationCustomerStatus,
    enumName: 'customer_status_enum'
  })
  status: ValidationCustomerStatus;

  @Column('jsonb')
  steps: ValidationStep[];

  @Column({ default: 0 })
  currentStepIndex: number;

  @CreateDateColumn()
  startedAt: Date;

  @UpdateDateColumn()
  lastUpdatedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  validatedBy: string;

  @Column('jsonb', { nullable: true })
  notes: string[];
}

@Entity('validation_steps')
export class ValidationStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: ValidationStepStatus,
    default: ValidationStepStatus.PENDING
  })
  status: ValidationStepStatus;

  @Column({ nullable: true })
  order: number;

  @Column('jsonb', { nullable: true })
  requiredDocuments: DocumentType[];

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  completedBy: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
