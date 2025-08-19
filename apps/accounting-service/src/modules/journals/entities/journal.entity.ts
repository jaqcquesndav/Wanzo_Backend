import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { JournalLine } from './journal-line.entity';
import { JournalAttachment } from './journal-attachment.entity';
import { FiscalYear } from '../../fiscal-years/entities/fiscal-year.entity';

export { JournalLine }; // Re-export JournalLine

// Les énumérations sont alignées exactement avec les types utilisés par le frontend
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
  REJECTED = 'rejected',  // Conservé pour les fonctionnalités backend existantes
  CANCELLED = 'cancelled' // Conservé pour les fonctionnalités backend existantes
}

export enum JournalSource {
  MANUAL = 'manual',
  AGENT = 'agent',
  IMPORT = 'import' // Conservé pour les fonctionnalités backend existantes
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
  journalType!: JournalType; // Utilisation cohérente de journalType comme dans le frontend

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

  @OneToMany(() => JournalAttachment, attachment => attachment.journal, {
    cascade: true
  })
  attachments!: JournalAttachment[];

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
