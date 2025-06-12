import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { JournalLine } from './journal-line.entity';
import { FiscalYear } from '../../fiscal-years/entities/fiscal-year.entity';

export { JournalLine }; // Re-export JournalLine

export enum JournalType {
  GENERAL = 'general',
  SALES = 'sales',
  PURCHASES = 'purchases',
  BANK = 'bank',
  CASH = 'cash'
}

export enum JournalStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  POSTED = 'posted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export enum JournalSource {
  MANUAL = 'manual',
  AGENT = 'agent',
  IMPORT = 'import'
}

export enum ValidationStatus {
  PENDING = 'pending',
  VALIDATED = 'validated',
  REJECTED = 'rejected'
}

@Entity('journals')
export class Journal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true }) // kiotaId can be optional
  kiotaId?: string;

  @Column()
  date!: Date;

  @Column({
    type: 'enum',
    enum: JournalType,
  })
  journalType!: JournalType;

  @Column('text')
  description!: string;

  @Column({ nullable: true })
  reference?: string;

  @Column('decimal', { precision: 20, scale: 2 })
  totalDebit!: number;

  @Column('decimal', { precision: 20, scale: 2 })
  totalCredit!: number;

  @Column('decimal', { precision: 20, scale: 2, default: 0 })
  totalVat!: number;

  @Column({
    type: 'enum',
    enum: JournalStatus,
    default: JournalStatus.DRAFT
  })
  status!: JournalStatus;

  @Column({
    type: 'enum',
    enum: JournalSource,
    default: JournalSource.MANUAL
  })
  source!: JournalSource;

  @Column({ nullable: true })
  agentId?: string;

  @Column({
    type: 'enum',
    enum: ValidationStatus,
    nullable: true
  })
  validationStatus?: ValidationStatus;

  @Column({ nullable: true })
  validatedBy?: string;

  @Column({ nullable: true })
  validatedAt?: Date;

  @Column({ nullable: true })
  postedBy?: string; // Added

  @Column({ nullable: true })
  postedAt?: Date; // Added

  @Column('text', { nullable: true })
  rejectionReason?: string; // Added

  @OneToMany(() => JournalLine, line => line.journal, {
    cascade: true,
    eager: true
  })
  lines!: JournalLine[];

  @Column('jsonb', { nullable: true })
  attachments?: Array<{
    id: string;
    name: string;
    url?: string;
    localUrl?: string;
    status: 'pending' | 'uploading' | 'uploaded' | 'error';
  }>;

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
}