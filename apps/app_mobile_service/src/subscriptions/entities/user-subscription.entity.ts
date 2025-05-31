import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../auth/entities/user.entity'; // Assuming a User entity exists in auth module
import { SubscriptionTier } from './subscription-tier.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  TRIAL = 'trial',
}

@Entity('user_subscriptions')
@Index(['userId', 'tierId'], { unique: true }) // A user can only have one instance of a specific tier, or one active subscription
@Index(['userId', 'status']) // To quickly find active subscriptions for a user
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string; // Foreign key to User entity

  @ManyToOne(() => User, user => user.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  tierId: string; // Foreign key to SubscriptionTier entity

  @ManyToOne(() => SubscriptionTier, tier => tier.userSubscriptions, { eager: true, onDelete: 'RESTRICT' }) // Eager load tier details
  @JoinColumn({ name: 'tierId' })
  tier: SubscriptionTier;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  endDate: Date; // For fixed-term subscriptions or next renewal date

  @Column({ type: 'timestamp with time zone', nullable: true })
  trialEndsAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  paymentDetails?: any; // Store relevant payment info, e.g., last payment date, method type

  @Column({ default: 0 })
  remainingAdhaTokens: number;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
