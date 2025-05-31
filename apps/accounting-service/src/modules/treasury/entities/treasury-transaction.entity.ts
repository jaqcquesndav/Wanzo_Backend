import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TreasuryAccount } from './treasury-account.entity';

export enum TransactionType {
  RECEIPT = 'RECEIPT',
  PAYMENT = 'PAYMENT',
  TRANSFER = 'TRANSFER',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

@Entity('treasury_transactions')
export class TreasuryTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  kiotaId!: string;

  @Column()
  fiscalYear!: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type!: TransactionType;

  @Column()
  reference!: string;

  @Column()
  date!: Date;

  @Column('text')
  description!: string;

  @Column('decimal', { precision: 15, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING
  })
  status!: TransactionStatus;

  @Column()
  accountId!: string;

  @ManyToOne(() => TreasuryAccount)
  @JoinColumn({ name: 'accountId' })
  account!: TreasuryAccount;

  @Column({ nullable: true })
  counterpartyAccountId?: string;

  @Column({ nullable: true })
  journalEntryId?: string;

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