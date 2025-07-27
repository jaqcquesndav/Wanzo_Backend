import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PROFILE_UPDATE = 'profile_update',
  PASSWORD_CHANGE = 'password_change',
  SETTINGS_CHANGE = 'settings_change',
  API_ACCESS = 'api_access',
  DATA_EXPORT = 'data_export',
  REPORT_GENERATION = 'report_generation',
  FAILED_LOGIN = 'failed_login',
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
}

@Entity('user_activities')
export class UserActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ActivityType
  })
  type: ActivityType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 45, nullable: true })
  ipAddress: string;

  @Column({ length: 255, nullable: true })
  userAgent: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ length: 36 })
  userId: string;

  @ManyToOne('User', 'activities')
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 36, nullable: true })
  institutionId: string;

  @CreateDateColumn()
  createdAt: Date;
}
