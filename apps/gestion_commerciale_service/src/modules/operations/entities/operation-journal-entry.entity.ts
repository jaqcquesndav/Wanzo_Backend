import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum OperationType {
  SALE = 'sale',
  PURCHASE = 'purchase',
  EXPENSE = 'expense',
  INCOME = 'income',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment'
  // ALL ne devrait pas être ici car il s'agit d'une valeur uniquement pour le filtrage
}

@Entity('operation_journal_entries')
export class OperationJournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  businessId: string;

  @Column({
    type: 'enum',
    enum: OperationType
  })
  type: OperationType;

  @Column()
  amount: number;

  @Column({ default: 'XOF' })
  currency: string;

  @Column({ nullable: true })
  reference: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  entityId: string;

  @Column({ nullable: true })
  entityType: string;

  @Column({ nullable: true })
  performedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
