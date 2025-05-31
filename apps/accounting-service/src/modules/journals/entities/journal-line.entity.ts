import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Journal } from './journal.entity';

@Entity('journal_lines')
export class JournalLine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  journalId!: string;

  @ManyToOne(() => Journal, journal => journal.lines)
  @JoinColumn({ name: 'journalId' })
  journal!: Journal;

  @Column()
  accountId!: string;

  @Column('decimal', { precision: 20, scale: 2 })
  debit!: number;

  @Column('decimal', { precision: 20, scale: 2 })
  credit!: number;

  @Column('decimal', { precision: 20, scale: 2, default: 0 })
  originalDebit!: number;

  @Column('decimal', { precision: 20, scale: 2, default: 0 })
  originalCredit!: number;

  @Column({ default: 'CDF' })
  currency!: string;

  @Column('decimal', { precision: 20, scale: 6, default: 1 })
  exchangeRate!: number;

  @Column('text')
  description!: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;
}