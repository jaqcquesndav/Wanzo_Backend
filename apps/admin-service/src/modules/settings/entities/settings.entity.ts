import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';

@Entity('user_settings')
export class UserSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 255 })
  phoneNumber: string;

  @Column({ nullable: true })
  position: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('security_settings')
export class SecuritySetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ default: false })
  twoFactorEnabled: boolean;

  @Column({ nullable: true })
  twoFactorMethod: string; // 'email', 'sms', 'authenticator'

  @Column({ nullable: true })
  twoFactorSecret: string;

  @Column({ default: 30 })
  sessionTimeout: number; // in minutes

  @Column({ type: 'timestamp', nullable: true })
  lastPasswordChange: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('notification_settings')
export class NotificationSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ default: true })
  emailEnabled: boolean;

  @Column({ default: false })
  smsEnabled: boolean;

  @Column({ default: true })
  inAppEnabled: boolean;

  @Column({ default: false })
  pushEnabled: boolean;

  @Column({ type: 'json', default: {} })
  preferences: Record<string, boolean>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('system_settings')
export class SystemSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  section: string; // 'general', 'security', 'notifications', 'billing', 'appearance'

  @Column({ type: 'json' })
  settings: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
