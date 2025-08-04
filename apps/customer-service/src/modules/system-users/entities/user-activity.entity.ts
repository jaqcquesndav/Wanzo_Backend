import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_CHANGED = 'password_changed',
  PROFILE_UPDATED = 'profile_updated',
  API_ACCESS = 'api_access',
  TOKEN_USAGE = 'token_usage',
  DOCUMENT_UPLOAD = 'document_upload',
  FAILED_LOGIN = 'failed_login',
  SUBSCRIPTION_CHANGE = 'subscription_change',
}

/**
 * Entité UserActivity - Enregistre les activités des utilisateurs
 */
@Entity('user_activities')
export class UserActivity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({
    type: 'enum',
    enum: ActivityType
  })
  activityType!: ActivityType;

  @Column({ type: 'jsonb', default: {} })
  details!: Record<string, any>;

  @Column({ nullable: true })
  ipAddress!: string;

  @Column({ nullable: true })
  userAgent!: string;

  @CreateDateColumn()
  timestamp!: Date;
}
