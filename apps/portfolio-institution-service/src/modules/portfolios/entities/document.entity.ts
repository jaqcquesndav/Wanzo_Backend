import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { FundingRequest } from './funding-request.entity';
import { Contract } from './contract.entity';
import { Disbursement } from './disbursement.entity';
import { Repayment } from './repayment.entity';

export enum DocumentType {
  CONTRACT = 'contract',
  AMENDMENT = 'amendment',
  GUARANTEE = 'guarantee',
  TRANSFER_ORDER = 'transfer_order',
  PAYMENT_PROOF = 'payment_proof',
  OFFICIAL_NOTIFICATION = 'official_notification',
  IDENTIFICATION = 'identification',
  OTHER = 'other'
}

export enum DocumentStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.OTHER
  })
  type!: DocumentType;

  @Column()
  file_path!: string;

  @Column({ nullable: true })
  file_size?: number;

  @Column({ nullable: true })
  mime_type?: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.ACTIVE
  })
  status!: DocumentStatus;

  @Column({ nullable: true })
  version?: number;

  @Column({ nullable: true })
  funding_request_id?: string;

  @ManyToOne(() => FundingRequest)
  @JoinColumn({ name: 'funding_request_id' })
  funding_request?: FundingRequest;

  @Column({ nullable: true })
  credit_request_id?: string;

  @Column({ nullable: true })
  contract_id?: string;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'contract_id' })
  contract?: Contract;

  @Column({ nullable: true })
  disbursement_id?: string;

  @ManyToOne(() => Disbursement)
  @JoinColumn({ name: 'disbursement_id' })
  disbursement?: Disbursement;

  @Column({ nullable: true })
  repayment_id?: string;

  @ManyToOne(() => Repayment)
  @JoinColumn({ name: 'repayment_id' })
  repayment?: Repayment;

  @Column('jsonb', { nullable: true })
  metadata?: {
    uploaded_by?: string;
    upload_date?: Date;
    tags?: string[];
    expiry_date?: Date;
    custom_fields?: Record<string, any>;
  };

  @Column({ nullable: true })
  uploaded_by?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
