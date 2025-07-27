import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

// Forward reference types to avoid circular dependencies
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ANALYST = 'analyst',
  VIEWER = 'viewer'
}

export enum UserStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

@Entity('users')
export class User {
  @PrimaryColumn({ length: 36 })
  id: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 100, nullable: true })
  firstName: string;

  @Column({ length: 100, nullable: true })
  lastName: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING
  })
  status: UserStatus;

  @Column({ length: 255, nullable: true })
  profilePicture: string;

  @Column({ length: 36, nullable: false })
  institutionId: string;

  @Column({ length: 20, unique: true, nullable: true })
  kiotaId: string;

  @Column({ name: 'auth0_id', length: 100, nullable: true })
  auth0Id: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: false })
  isTwoFactorEnabled: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ length: 36, nullable: true })
  createdBy: string;

  @Column({ length: 36, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastLogin: Date;

  @OneToMany('UserActivity', 'user')
  activities: any[];

  @OneToMany('UserPreference', 'user')
  preferences: any[];

  @OneToMany('UserSession', 'user')
  sessions: any[];
}
