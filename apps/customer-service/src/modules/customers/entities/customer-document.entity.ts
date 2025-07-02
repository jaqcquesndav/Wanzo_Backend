import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';

export enum DocumentType {
  REGISTRATION = 'registration',
  TAX = 'tax',
  IDENTITY = 'identity',
  LICENSE = 'license',
  BANK_STATEMENT = 'bank_statement',
  FINANCIAL_STATEMENT = 'financial_statement',
  CONTRACT = 'contract',
  OTHER = 'other'
}

export enum DocumentStatus {
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

/**
 * Entité CustomerDocument - Documents associés à un client
 */
@Entity('customer_documents')
export class CustomerDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column({
    type: 'enum',
    enum: DocumentType
  })
  documentType!: DocumentType;

  @Column()
  name!: string;

  @Column()
  path!: string;

  @Column({ nullable: true })
  mimeType!: string;

  @Column({ nullable: true })
  size!: number;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING_REVIEW
  })
  status!: DocumentStatus;

  @Column({ nullable: true })
  validUntil!: Date;

  @Column({ nullable: true })
  rejectionReason!: string;

  @Column({ nullable: true })
  reviewedBy!: string;

  @Column({ nullable: true })
  reviewedAt!: Date;

  @Column({ nullable: true })
  uploadedBy!: string;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @CreateDateColumn()
  uploadedAt!: Date;
}
