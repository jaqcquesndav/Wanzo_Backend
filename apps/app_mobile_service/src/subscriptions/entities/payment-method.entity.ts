import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../auth/entities/user.entity'; // Assuming User entity

export enum PaymentMethodType {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_MONEY = 'mobile_money',
  // Add other relevant types
}

@Entity('payment_methods')
@Index(['userId', 'isDefault'])
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: PaymentMethodType,
  })
  type: PaymentMethodType;

  @Column({ type: 'jsonb' }) // Store details like card last4, expiry, bank name, account number (encrypted or tokenized)
  details: any; // e.g., { cardBrand: 'Visa', last4: '1234', expiryMonth: '12', expiryYear: '2025' } or { bankName: 'ABC Bank', accountNumberMasked: '******5678' }

  @Column({ default: false })
  isDefault: boolean;

  @Column({ nullable: true })
  providerToken?: string; // If using a payment provider like Stripe, this could be their token for the payment method

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
