import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense'
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  kiotaId!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: AccountType,
  })
  type!: AccountType;

  @Column({ nullable: true })
  parentId?: string;

  @ManyToOne(() => Account, account => account.children)
  @JoinColumn({ name: 'parentId' })
  parent?: Account;

  @OneToMany(() => Account, account => account.parent)
  children?: Account[];

  @Column({ default: false })
  isAnalytic!: boolean;

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