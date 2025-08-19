import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, ManyToMany } from 'typeorm';
import { FiscalYear } from '../../fiscal-years/entities/fiscal-year.entity';

// Ces énumérations sont alignées exactement avec les types du frontend
export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense'
}

export enum AccountingStandard {
  SYSCOHADA = 'SYSCOHADA',
  IFRS = 'IFRS'
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: AccountType,
  })
  type!: AccountType;

  @Column({
    type: 'enum',
    enum: AccountingStandard,
    default: AccountingStandard.SYSCOHADA
  })
  standard!: AccountingStandard;

  @Column({ length: 1 })
  class!: string;

  @Column({ default: false })
  isAnalytic!: boolean;

  @Column({ nullable: true })
  parentId?: string;

  @ManyToOne(() => Account, account => account.children)
  @JoinColumn({ name: 'parentId' })
  parent?: Account;

  @OneToMany(() => Account, account => account.parent)
  children?: Account[];

  @Column()
  fiscalYearId!: string;

  @ManyToOne(() => FiscalYear)
  @JoinColumn({ name: 'fiscalYearId' })
  fiscalYear!: FiscalYear;

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
