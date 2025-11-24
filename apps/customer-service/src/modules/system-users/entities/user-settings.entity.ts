import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export interface NotificationSettings {
  email: {
    marketing: boolean;
    security: boolean;
    updates: boolean;
    billing: boolean;
  };
  sms: {
    security: boolean;
    billing: boolean;
    alerts: boolean;
  };
  push: {
    enabled: boolean;
    marketing: boolean;
    updates: boolean;
  };
}

export interface PrivacySettings {
  profileVisibility: string;
  dataSharing: boolean;
  analyticsOptOut: boolean;
}

export interface DisplaySettings {
  theme: string;
  language: string;
  dateFormat: string;
  currency: string;
  timezone: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  sessionTimeout: number;
  allowedIpAddresses?: string[];
}

/**
 * Entité UserSettings - Paramètres et préférences utilisateur
 */
@Entity('user_settings')
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column('jsonb', {
    default: {
      email: {
        marketing: true,
        security: true,
        updates: true,
        billing: true
      },
      sms: {
        security: true,
        billing: true,
        alerts: false
      },
      push: {
        enabled: true,
        marketing: false,
        updates: true
      }
    }
  })
  notifications!: NotificationSettings;

  @Column('jsonb', {
    default: {
      profileVisibility: 'company_only',
      dataSharing: false,
      analyticsOptOut: false
    }
  })
  privacy!: PrivacySettings;

  @Column('jsonb', {
    default: {
      theme: 'light',
      language: 'fr',
      dateFormat: 'dd/mm/yyyy',
      currency: 'USD',
      timezone: 'Africa/Kinshasa'
    }
  })
  display!: DisplaySettings;

  @Column('jsonb', {
    default: {
      twoFactorEnabled: false,
      loginNotifications: true,
      sessionTimeout: 30,
      allowedIpAddresses: []
    }
  })
  security!: SecuritySettings;

  @OneToOne(() => User, user => user.settings)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}