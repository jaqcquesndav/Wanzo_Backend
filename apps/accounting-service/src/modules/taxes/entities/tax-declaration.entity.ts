import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { FiscalYear } from '../../fiscal-years/entities/fiscal-year.entity';

export enum DeclarationType {
  TVA = 'TVA',
  IPR = 'IPR',
  IB = 'IB',
  CNSS = 'CNSS',
  TPI = 'TPI',
  TE = 'TE',
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

  @Column({
    type: 'enum',
    enum: DeclarationType,
  })
  type!: DeclarationType;

  @Column()
  period!: string;

  @Column({
    type: 'enum',
    enum: DeclarationPeriodicity,
  })
  periodicity!: DeclarationPeriodicity;

  @Column()
  dueDate!: Date;

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
  reference?: string;

  @Column('simple-array', { nullable: true })
  attachments?: string[];

  @Column()
  fiscalYearId!: string;

  @ManyToOne(() => FiscalYear)
  @JoinColumn({ name: 'fiscalYearId' })
  fiscalYear!: FiscalYear;

  @Column({ nullable: true })
  companyId?: string;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Added fields based on previous errors and DTOs
  @Column({ nullable: true })
  kiotaId?: string;

  @Column({ nullable: true })
  documentNumber?: string;

  @Column({ nullable: true })
  journalEntryId?: string;

  @Column({ nullable: true })
  paidBy?: string;

  @Column({ nullable: true })
  paidAt?: Date;

  @Column({ nullable: true })
  paymentReference?: string;

  @Column({ nullable: true })
  rejectionReason?: string;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  taxRate?: number;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  taxableBase?: number;
}