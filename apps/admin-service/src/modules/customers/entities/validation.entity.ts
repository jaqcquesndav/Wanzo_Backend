import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer, CustomerStatus } from '@/modules/customers/entities/customer.entity';
import { DocumentType } from '@/modules/customers/entities/document.entity';

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
    enum: CustomerStatus,
    enumName: 'customer_status_enum'
  })
  status: CustomerStatus;

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

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  completedBy: string;

  @Column({ nullable: true })
  notes: string;
}
