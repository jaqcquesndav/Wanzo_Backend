import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum PreferenceCategory {
  NOTIFICATION = 'notification',
  DISPLAY = 'display',
  LANGUAGE = 'language',
  DASHBOARD = 'dashboard',
  REPORTING = 'reporting',
}

@Entity('user_preferences')
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PreferenceCategory,
    default: PreferenceCategory.NOTIFICATION
  })
  category: PreferenceCategory;

  @Column({ length: 100 })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ length: 36 })
  userId: string;

  @ManyToOne('User', 'preferences')
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 36, nullable: true })
  institutionId: string;

  @Column({ length: 36, nullable: true })
  createdBy: string;

  @Column({ length: 36, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
