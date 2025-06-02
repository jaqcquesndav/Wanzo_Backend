import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { ExpenseCategory } from './expense-category.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { Company } from '../../company/entities/company.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true }) // User who created the expense
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column()
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' }) // Expense belongs to a company
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ type: 'timestamp with time zone' })
  date: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  motif: string; // Renamed from description as per API doc

  @Column()
  categoryId: string;

  @ManyToOne(() => ExpenseCategory, category => category.expenses, { onDelete: 'RESTRICT' }) // Prevent deleting category if expenses exist
  @JoinColumn({ name: 'categoryId' })
  category: ExpenseCategory;

  @Column()
  paymentMethod: string; // e.g., "cash", "card", "bank_transfer"

  @Column('simple-array', { nullable: true })
  attachmentUrls?: string[]; // Array of Cloudinary URLs

  @Column({ nullable: true })
  supplierId?: string;

  @ManyToOne(() => Supplier, { nullable: true, onDelete: 'SET NULL' }) // Optional link to a supplier
  @JoinColumn({ name: 'supplierId' })
  supplier?: Supplier;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
