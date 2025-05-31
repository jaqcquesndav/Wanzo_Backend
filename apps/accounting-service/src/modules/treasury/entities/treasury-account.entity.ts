import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AccountType {
  BANK = 'BANK',
  CASH = 'CASH',
  OTHER = 'OTHER',
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

  @Column()
  accountNumber!: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  balance!: number;

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