import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { JournalLine } from './journal-line.entity';

export enum JournalType {
  GENERAL = 'GENERAL',
  SALES = 'SALES',
  PURCHASES = 'PURCHASES',
  BANK = 'BANK',
  CASH = 'CASH'
}

export enum JournalStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  POSTED = 'posted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

@Entity('journals')
export class Journal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  kiotaId!: string;

  @Column()
  fiscalYear!: string;

  @Column({
    type: 'enum',
    enum: JournalType,
  })
  type!: JournalType;

  @Column()
  reference!: string;

  @Column()
  date!: Date;

  @Column('text')
  description!: string;

  @Column({
    type: 'enum',
    enum: JournalStatus,
    default: JournalStatus.DRAFT
  })
  status!: JournalStatus;

  @Column('decimal', { precision: 20, scale: 2 })
  totalDebit!: number;

  @Column('decimal', { precision: 20, scale: 2 })
  totalCredit!: number;

  @Column({ default: 'CDF' })
  currency!: string;

  @Column('decimal', { precision: 20, scale: 6, default: 1 })
  exchangeRate!: number;

  @OneToMany(() => JournalLine, line => line.journal, {
    cascade: true,
    eager: true
  })
  lines!: JournalLine[];

  @Column({ nullable: true })
  postedBy?: string;

  @Column({ nullable: true })
  postedAt?: Date;

  @Column({ nullable: true })
  rejectionReason?: string;

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