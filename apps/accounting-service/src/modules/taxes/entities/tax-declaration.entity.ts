import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TaxType {
  TVA = 'TVA',
  IS = 'IS',
  IPR = 'IPR',
  CNSS = 'CNSS',
  INPP = 'INPP',
  ONEM = 'ONEM',
  OTHER = 'OTHER',
}

export enum DeclarationStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  PAID = 'paid',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum DeclarationPeriodicity {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
}

@Entity('tax_declarations')
export class TaxDeclaration {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  kiotaId!: string;

  @Column()
  fiscalYear!: string;

  @Column({
    type: 'enum',
    enum: TaxType,
  })
  type!: TaxType;

  @Column()
  period!: string;

  @Column({
    type: 'enum',
    enum: DeclarationPeriodicity,
  })
  periodicity!: DeclarationPeriodicity;

  @Column()
  documentNumber!: string;

  @Column()
  dueDate!: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  taxableBase!: number;

  @Column('decimal', { precision: 15, scale: 2 })
  taxRate!: number;

  @Column('decimal', { precision: 15, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: DeclarationStatus,
    default: DeclarationStatus.DRAFT
  })
  status!: DeclarationStatus;

  @Column({ nullable: true })
  submittedBy?: string;

  @Column({ nullable: true })
  submittedAt?: Date;

  @Column({ nullable: true })
  paidBy?: string;

  @Column({ nullable: true })
  paidAt?: Date;

  @Column({ nullable: true })
  paymentReference?: string;

  @Column({ nullable: true })
  rejectionReason?: string;

  @Column({ nullable: true })
  journalEntryId?: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  companyId?: string;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}