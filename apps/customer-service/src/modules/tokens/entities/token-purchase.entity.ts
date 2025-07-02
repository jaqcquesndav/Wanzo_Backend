import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

/**
 * Entité TokenPurchase - Enregistre les achats de tokens par les clients
 */
@Entity('token_purchases')
export class TokenPurchase {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column()
  amount!: number;

  @CreateDateColumn()
  purchaseDate!: Date;

  @Column({ nullable: true })
  transactionId?: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price?: number;

  @Column({ nullable: true })
  currency?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
