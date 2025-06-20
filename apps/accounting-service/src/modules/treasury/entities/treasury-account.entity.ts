import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AccountType {
  BANK = 'bank',
  MICROFINANCE = 'microfinance',
  COOPERATIVE = 'cooperative',
  VSLA = 'vsla',
  CASH = 'cash',
}

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CLOSED = 'closed',
}

@Entity('treasury_accounts')
export class TreasuryAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  kiotaId!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: AccountType,
  })
  type!: AccountType;

  @Column({ nullable: true })
  provider?: string;

  @Column({ nullable: true })
  bankName?: string;

  @Column()
  accountNumber!: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  balance!: number;

  @Column({ nullable: true })
  currency?: string;

  @Column({ 
    type: 'enum', 
    enum: AccountStatus, 
    default: AccountStatus.ACTIVE
  })
  status!: AccountStatus;

  @Column({ type: 'date', nullable: true })
  lastReconciliation?: Date;

  @Column({ default: true })
  active!: boolean;

  @Column('text', { nullable: true })
  description?: string;

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