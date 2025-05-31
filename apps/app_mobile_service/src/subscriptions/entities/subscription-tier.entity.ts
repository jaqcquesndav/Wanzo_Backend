import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserSubscription } from './user-subscription.entity'; // Assuming a UserSubscription entity links users to tiers

export enum SubscriptionTierType {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

@Entity('subscription_tiers')
export class SubscriptionTier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SubscriptionTierType,
    unique: true,
  })
  type: SubscriptionTierType;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('int')
  users: number; // Max users allowed

  @Column('int')
  adhaTokens: number; // Adha AI tokens included

  @Column('simple-array') // Stores array of strings
  features: string[];

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => UserSubscription, userSubscription => userSubscription.tier)
  userSubscriptions: UserSubscription[];

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
