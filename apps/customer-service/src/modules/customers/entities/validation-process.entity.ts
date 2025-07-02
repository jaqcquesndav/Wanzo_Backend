import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';

export enum ValidationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ADDITIONAL_INFO_REQUESTED = 'additional_info_requested'
}

/**
 * Entité ValidationProcess - Processus de validation des clients
 */
@Entity('validation_processes')
export class ValidationProcess {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column({ type: 'enum', enum: ValidationStatus, default: ValidationStatus.PENDING })
  status!: ValidationStatus;

  @Column({ nullable: true })
  initiatedBy!: string;

  @Column({ nullable: true })
  assignedTo!: string;

  @Column({ nullable: true })
  completedBy!: string;

  @Column({ nullable: true })
  completedAt!: Date;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason!: string;

  @Column({ type: 'jsonb', nullable: true })
  requiredDocuments!: string[];

  @Column({ type: 'jsonb', nullable: true })
  submittedDocuments!: Array<{
    documentId: string;
    documentType: string;
    submittedAt: Date;
    status: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  validationSteps!: Array<{
    step: string;
    status: string;
    completedAt?: Date;
    completedBy?: string;
    notes?: string;
  }>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
