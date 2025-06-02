import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum NotificationType {
  INFO = 'info',
  ALERT = 'alert',
  REMINDER = 'reminder',
  NEW_SALE = 'new_sale',
  STOCK_ALERT = 'stock_alert',
  SUBSCRIPTION_UPDATE = 'subscription_update',
  GENERAL_MESSAGE = 'general_message',
  // Add other specific types as needed
}

export interface NotificationData {
  entityType?: string; // e.g., 'sale', 'product', 'subscription', 'user'
  entityId?: string;   // ID of the related entity
  [key: string]: any;  // For additional custom data
}

@Entity('notifications')
@Index(['userId', 'readAt']) // Index for querying user's notifications, especially unread ones
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' }) // If user is deleted, their notifications are also deleted
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.INFO,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  body: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  receivedAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  readAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  data: NotificationData | null;
}
