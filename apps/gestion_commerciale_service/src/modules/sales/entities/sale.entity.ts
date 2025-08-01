import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
// import { User } from '../../auth/entities/user.entity'; // Assuming User entity will exist in AuthModule
import { SaleItem } from './sale-item.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  REFUNDED = 'refunded',
}

@Entity('sales')
export class Sale {
  @ApiProperty({
    description: 'Identifiant unique de la vente',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    format: 'uuid'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Identifiant du client',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    format: 'uuid',
    nullable: true
  })
  @Column({ name: 'customer_id', nullable: true }) // A sale might not always have a registered customer
  customerId: string | null;

  @ApiProperty({
    description: 'Relation avec le client',
    type: () => Customer,
    nullable: true
  })
  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' }) // Set customer to null if deleted
  @JoinColumn({ name: 'customer_id' })
  customer: Customer | null;

  @ApiProperty({
    description: 'Date de la vente',
    example: '2025-06-04T12:00:00Z',
    type: 'string',
    format: 'date-time'
  })
  @Column({ name: 'sale_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  saleDate: Date;

  @ApiProperty({
    description: 'Montant total de la vente',
    example: 1500.00,
    type: 'number',
    format: 'decimal'
  })
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @ApiProperty({
    description: 'Montant déjà payé',
    example: 1000.00,
    type: 'number',
    format: 'decimal',
    default: 0
  })
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'amount_paid', default: 0 })
  amountPaid: number;

  @ApiProperty({
    description: 'Statut du paiement',
    enum: PaymentStatus,
    example: PaymentStatus.PARTIALLY_PAID,
    default: PaymentStatus.PENDING
  })
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    name: 'payment_status'
  })
  paymentStatus: PaymentStatus;  @ApiProperty({
    description: 'Identifiant de la méthode de paiement',
    example: 'cash',
    nullable: true
  })
  @Column({ name: 'payment_method_id', nullable: true, type: 'varchar' }) // Assuming this is an ID to a payment method configuration/entity
  paymentMethodId: string | null;

  @ApiProperty({
    description: 'Notes sur la vente',
    example: 'Livraison à domicile prévue le 05/06/2025',
    nullable: true
  })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ApiProperty({
    description: 'Identifiant de l\'utilisateur ayant effectué la vente',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    format: 'uuid'
  })
  @Column({ name: 'user_id' }) // ID of the user (e.g., salesperson) who made the sale
  userId: string;
  // @ManyToOne(() => User) // Relation to User entity
  // @JoinColumn({ name: 'user_id' })
  // user: User;

  @ApiProperty({
    description: 'Articles de la vente',
    type: [SaleItem]
  })
  @OneToMany(() => SaleItem, saleItem => saleItem.sale, { cascade: true, eager: true })
  items: SaleItem[];

  @ApiProperty({
    description: 'Date de création',
    example: '2025-06-04T12:00:00Z',
    type: 'string',
    format: 'date-time'
  })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour',
    example: '2025-06-04T14:30:00Z',
    type: 'string',
    format: 'date-time'
  })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
