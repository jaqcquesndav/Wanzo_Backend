import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export type PaymentStatus = 'pending' | 'success' | 'failed';

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ nullable: true })
  providerTransactionId?: string;

  @Index()
  @Column({ nullable: true })
  sessionId?: string;

  @Column({ default: 'SerdiPay' })
  provider!: string;

  @Column('decimal', { precision: 18, scale: 2 })
  amount!: string;

  @Column()
  currency!: string;

  @Column()
  clientPhone!: string;

  @Column()
  telecom!: string;

  @Index()
  @Column({ nullable: true })
  clientReference?: string;

  @Column({ type: 'varchar', length: 16 })
  status!: PaymentStatus;

  @Column({ type: 'json', nullable: true })
  meta?: any;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
