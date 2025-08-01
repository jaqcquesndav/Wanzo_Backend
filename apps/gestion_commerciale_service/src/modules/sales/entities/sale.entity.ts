import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
// import { User } from '../../auth/entities/user.entity'; // Assuming User entity will exist in AuthModule
import { SaleItem } from './sale-item.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum SaleStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PARTIALLY_PAID = 'partiallyPaid'
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
    description: 'Identifiant local de la vente',
    example: 'SALE-2025-0001',
    nullable: true
  })
  @Column({ nullable: true })
  localId: string | null;

  @ApiProperty({
    description: 'Identifiant du client',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    format: 'uuid',
    nullable: true
  })
  @Column({ name: 'customer_id', nullable: true }) // A sale might not always have a registered customer
  customerId: string | null;

  @ApiProperty({
    description: 'Nom du client',
    example: 'Jean Dupont',
    nullable: false
  })
  @Column()
  customerName: string;

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
  date: Date;

  @ApiProperty({
    description: 'Date d\'échéance',
    example: '2025-06-18T12:00:00Z',
    type: 'string',
    format: 'date-time',
    nullable: true
  })
  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate: Date | null;

  @ApiProperty({
    description: 'Montant total de la vente en Francs Congolais',
    example: 1500000.00,
    type: 'number',
    format: 'decimal'
  })
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_amount_in_cdf' })
  totalAmountInCdf: number;

  @ApiProperty({
    description: 'Montant déjà payé en Francs Congolais',
    example: 1000000.00,
    type: 'number',
    format: 'decimal',
    default: 0
  })
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'amount_paid_in_cdf', default: 0 })
  amountPaidInCdf: number;

  @ApiProperty({
    description: 'Statut de la vente',
    enum: SaleStatus,
    example: SaleStatus.PARTIALLY_PAID,
    default: SaleStatus.PENDING
  })
  @Column({
    type: 'enum',
    enum: SaleStatus,
    default: SaleStatus.PENDING,
    name: 'status'
  })
  status: SaleStatus;

  @ApiProperty({
    description: 'Taux de change utilisé pour la vente',
    example: 2000.00,
    type: 'number',
    format: 'decimal'
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'exchange_rate' })
  exchangeRate: number;
  
  @ApiProperty({
    description: 'Méthode de paiement',
    example: 'cash',
    nullable: false
  })
  @Column({ name: 'payment_method', type: 'varchar' })
  paymentMethod: string;

  @ApiProperty({
    description: 'Référence de paiement',
    example: 'TRANS-123456',
    nullable: true
  })
  @Column({ name: 'payment_reference', nullable: true, type: 'varchar' })
  paymentReference: string | null;

  @ApiProperty({
    description: 'Notes sur la vente',
    example: 'Livraison à domicile prévue le 05/06/2025',
    nullable: true
  })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ApiProperty({
    description: 'Statut de synchronisation',
    example: 'synced',
    nullable: true
  })
  @Column({ name: 'sync_status', nullable: true, type: 'varchar' })
  syncStatus: string | null;

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
