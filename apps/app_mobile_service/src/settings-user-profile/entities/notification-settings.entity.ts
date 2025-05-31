import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity'; // Adjust path as needed

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

@Entity('notification_settings')
export class NotificationSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' }) // Settings are user-specific
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string; // Foreign key for User

  // General notification preferences
  @Column({ type: 'boolean', default: true })
  enableAllNotifications: boolean;

  // Granular settings for different notification types or events
  @Column({ type: 'boolean', default: true })
  newSaleNotifications: boolean;

  @Column({ type: 'boolean', default: true })
  stockAlertNotifications: boolean;

  @Column({ type: 'boolean', default: false })
  promotionalUpdates: boolean;

  @Column({ type: 'boolean', default: true })
  accountActivityAlerts: boolean;

  // Preferred channels for certain types of notifications
  @Column({
    type: 'simple-array',
    nullable: true,
    comment: 'Preferred channels for critical alerts, e.g., [\'email\', \'sms\']'
  })
  criticalAlertChannels?: NotificationType[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
