import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum DocumentType {
  RCCM = 'rccm',
  IDNAT = 'idnat',
  NIF = 'nif',
  CNSS = 'cnss',
  OTHER = 'other',
}

export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  companyId!: string;

  @Column()
  type!: DocumentType;

  @Column()
  name!: string;

  @Column()
  cloudinaryId!: string;

  @Column()
  url!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.PENDING })
  status!: DocumentStatus;

  @Column({ nullable: true })
  expiryDate!: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any>;

  @Column()
  uploadedBy!: string;

  @Column({ nullable: true })
  reviewedBy!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}