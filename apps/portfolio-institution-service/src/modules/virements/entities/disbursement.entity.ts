import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum DisbursementStatus {
  PENDING = 'en attente',
  COMPLETED = 'effectué',
}

export enum PaymentMethod {
  TRANSFER = 'virement',
  ELECTRONIC_TRANSFER = 'transfert',
  CHECK = 'chèque',
  CASH = 'espèces',
}

@Entity('disbursements')
export class Disbursement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  company!: string;

  @Column()
  product!: string;

  @Column('decimal', { precision: 15, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: DisbursementStatus,
    default: DisbursementStatus.PENDING
  })
  status!: DisbursementStatus;

  @Column({ type: 'timestamp' })
  date!: Date;

  @Column({ nullable: true })
  requestId?: string;

  @Column()
  portfolioId!: string;

  @Column()
  contractReference!: string;

  @Column({ nullable: true })
  transactionReference?: string;

  @Column({ type: 'timestamp', nullable: true })
  valueDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  executionDate?: Date;

  @Column('jsonb')
  debitAccount!: {
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankCode: string;
    branchCode?: string;
  };

  @Column('jsonb')
  beneficiary!: {
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankCode?: string;
    branchCode?: string;
    swiftCode?: string;
    companyName: string;
    address?: string;
  };

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true
  })
  paymentMethod?: PaymentMethod;

  @Column({ nullable: true })
  paymentReference?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  supportingDocumentUrl?: string;

  @Column('jsonb', { nullable: true })
  reconciliationData?: {
    reconciledBy?: string;
    reconciledAt?: Date;
    bankReference?: string;
    matchStatus?: string;
    notes?: string;
  };

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
