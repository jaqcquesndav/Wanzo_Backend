import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';

export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PROFILE_UPDATE = 'profile_update',
  DOCUMENT_UPLOAD = 'document_upload',
  PAYMENT = 'payment',
  SUBSCRIPTION_CHANGE = 'subscription_change',
  TOKEN_PURCHASE = 'token_purchase',
  TOKEN_USAGE = 'token_usage',
  API_ACCESS = 'api_access',
  PASSWORD_CHANGE = 'password_change',
  ADMIN_ACTION = 'admin_action',
  OTHER = 'other'
}

/**
 * Entité CustomerActivity - Activité des clients
 */
@Entity('customer_activities')
export class CustomerActivity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column({
    type: 'enum',
    enum: ActivityType
  })
  activityType!: ActivityType;

  @Column({ nullable: true })
  userId!: string;

  @Column({ nullable: true })
  ipAddress!: string;

  @Column({ nullable: true })
  userAgent!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any>;

  @CreateDateColumn()
  timestamp!: Date;
}
