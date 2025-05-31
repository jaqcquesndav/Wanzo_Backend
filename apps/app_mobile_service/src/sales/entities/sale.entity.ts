import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
// import { User } from '../../auth/entities/user.entity'; // Assuming User entity will exist in AuthModule
import { SaleItem } from './sale-item.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  REFUNDED = 'refunded',
}

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id', nullable: true }) // A sale might not always have a registered customer
  customerId: string | null;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' }) // Set customer to null if deleted
  @JoinColumn({ name: 'customer_id' })
  customer: Customer | null;

  @Column({ name: 'sale_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  saleDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'amount_paid', default: 0 })
  amountPaid: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    name: 'payment_status'
  })
  paymentStatus: PaymentStatus;

  @Column({ name: 'payment_method_id', nullable: true }) // Assuming this is an ID to a payment method configuration/entity
  paymentMethodId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'user_id' }) // ID of the user (e.g., salesperson) who made the sale
  userId: string;
  // @ManyToOne(() => User) // Relation to User entity
  // @JoinColumn({ name: 'user_id' })
  // user: User;

  @OneToMany(() => SaleItem, saleItem => saleItem.sale, { cascade: true, eager: true })
  items: SaleItem[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
