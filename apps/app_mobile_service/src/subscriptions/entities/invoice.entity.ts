import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../auth/entities/user.entity'; // Assuming User entity
import { UserSubscription } from './user-subscription.entity'; // For linking to a specific subscription period if needed

export enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible',
}

@Entity('invoices')
@Index(['userId', 'status'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userSubscriptionId?: string; // Optional: Link to the specific subscription period this invoice is for

  @ManyToOne(() => UserSubscription, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userSubscriptionId' })
  userSubscription?: UserSubscription;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.OPEN,
  })
  status: InvoiceStatus;

  @Column({ type: 'timestamp with time zone' })
  dueDate: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  paidAt?: Date;

  @Column({ nullable: true })
  description?: string; // e.g., "Monthly Subscription - Premium Tier"

  @Column({ type: 'jsonb', nullable: true })
  paymentMethodDetails?: any; // e.g., { type: 'card', last4: '1234' }

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
