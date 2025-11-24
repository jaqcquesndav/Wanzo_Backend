import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import type { Customer } from '@/modules/customers/entities/customer.entity';

export enum DocumentType {
  RCCM = 'rccm',
  ID_NAT = 'id_nat',
  NIF = 'nif',
  CNSS = 'cnss',
  INPP = 'inpp',
  PATENTE = 'patente',
  AGREMENT = 'agrement',
  CONTRACT = 'contract'
}

export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

@Entity('customer_documents')
export class CustomerDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @ManyToOne('Customer', 'documents')
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({
    type: 'enum',
    enum: DocumentType
  })
  type: DocumentType;

  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING
  })
  status: DocumentStatus;

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ nullable: true })
  reviewComments: string;

  @Column({ nullable: true })
  uploadedBy: string;

  @CreateDateColumn()
  uploadedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
