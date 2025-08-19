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

  @Column({ nullable: true })
  accountCode?: string;

  @Column({ nullable: true })
  accountName?: string;

  @Column('decimal', { precision: 20, scale: 2 })
  debit!: number;

  @Column('decimal', { precision: 20, scale: 2 })
  credit!: number;

  @Column('text')
  description!: string;

  @Column({ nullable: true })
  vatCode?: string;

  @Column('decimal', { precision: 20, scale: 2, nullable: true })
  vatAmount?: number;

  @Column({ nullable: true })
  analyticCode?: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;
}
