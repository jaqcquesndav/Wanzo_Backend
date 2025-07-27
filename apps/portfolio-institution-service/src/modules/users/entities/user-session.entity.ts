import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  token: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ length: 45, nullable: true })
  ipAddress: string;

  @Column({ length: 255, nullable: true })
  userAgent: string;

  @Column({ length: 100, nullable: true })
  deviceType: string;

  @Column({ length: 36 })
  userId: string;

  @ManyToOne('User', 'sessions')
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 36, nullable: true })
  institutionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  lastActivity: Date;
}
