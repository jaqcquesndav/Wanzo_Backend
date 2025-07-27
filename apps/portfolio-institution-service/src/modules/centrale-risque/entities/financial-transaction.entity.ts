import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('financial_transactions')
export class FinancialTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 36 })
  @Index()
  companyId: string;

  @Column({ length: 255 })
  companyName: string;

  @Column({ length: 36, nullable: true })
  loanId: string;

  @Column({ length: 255 })
  transactionType: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  amount: number;

  @Column({ type: 'timestamp' })
  transactionDate: Date;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ length: 50 })
  status: string;

  @Column({ length: 36, nullable: true })
  institutionId: string;

  @Column({ length: 255 })
  institution: string;

  @Column({ length: 255, nullable: true })
  reference: string;

  @Column({ length: 36, nullable: true })
  createdBy: string;

  @Column({ length: 36, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
