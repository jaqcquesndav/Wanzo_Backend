import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({ description: 'Unique identifier (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID of the user receiving the notification' })
  @Column()
  userId: string;

  @ApiProperty({ description: 'User receiving the notification', type: () => User })
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) // If user is deleted, their notifications are also deleted
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ 
    description: 'Type of notification', 
    enum: NotificationType,
    example: NotificationType.INFO,
    default: NotificationType.INFO
  })
  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.INFO,
  })
  type: NotificationType;

  @ApiProperty({ description: 'Title of the notification', example: 'New Sale Completed' })
  @Column()
  title: string;

  @ApiProperty({ description: 'Body content of the notification', example: 'A new sale has been completed for 2500 FCFA.' })
  @Column('text')
  body: string;

  @ApiProperty({ description: 'When the notification was received', example: '2025-06-01T10:00:00.000Z' })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  receivedAt: Date;

  @ApiProperty({ 
    description: 'When the notification was read by the user. Null if unread.', 
    example: '2025-06-01T12:00:00.000Z',
    required: false,
    nullable: true 
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  readAt: Date | null;

  @ApiProperty({ 
    description: 'Additional data associated with the notification',
    required: false,
    nullable: true,
    example: {
      entityType: 'sale',
      entityId: '123e4567-e89b-12d3-a456-426614174000',
      amount: 2500,
      customerName: 'John Doe'
    }
  })
  @Column({ type: 'jsonb', nullable: true })
  data: NotificationData | null;
}
