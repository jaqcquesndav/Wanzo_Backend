import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

export enum TokenServiceType {
  ACCOUNTING_AI = 'accounting_ai',
  ANALYTICS = 'analytics',
  DOCUMENT_PROCESSING = 'document_processing',
  CHATBOT = 'chatbot',
  OTHER = 'other'
}

/**
 * Entité TokenUsage - Enregistre l'utilisation des tokens par les clients
 */
@Entity('token_usages')
export class TokenUsage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column({ nullable: true })
  userId!: string;

  @Column()
  amount!: number;

  @Column({
    type: 'enum',
    enum: TokenServiceType
  })
  serviceType!: TokenServiceType;

  @Column({ nullable: true })
  requestId!: string;

  @Column({ type: 'jsonb', nullable: true })
  context!: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any>;

  @CreateDateColumn()
  timestamp!: Date;
}
