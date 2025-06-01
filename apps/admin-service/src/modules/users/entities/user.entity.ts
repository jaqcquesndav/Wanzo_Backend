import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRole, UserStatus, UserType } from './enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.COMPANY_USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserType,
  })
  userType: UserType;

  @Column({ nullable: true })
  customerAccountId?: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Column({ nullable: true })
  avatar?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin?: Date;

  @Column('simple-array', { nullable: true })
  permissions?: string[];

  @Column({ nullable: true })
  departement?: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  // Relation to Company (if a user can belong to one company)
  // @ManyToOne(() => Company, company => company.users, { nullable: true })
  // company?: Company;

  // Relation to Auth (if you store auth specific details separately)
  // @OneToOne(() => Auth, auth => auth.user)
  // auth: Auth;

  // Relation to UserSettings
  // @OneToOne(() => UserSetting, userSetting => userSetting.user)
  // settings: UserSetting;

  // Relation to UserActivity
  // @OneToMany(() => UserActivity, activity => activity.user)
  // activities: UserActivity[];

  // Relation to UserSessions
  // @OneToMany(() => UserSession, session => session.user)
  // sessions: UserSession[];

  // Password field - typically not directly exposed, handled by auth service/logic
  @Column({ select: false, nullable: true }) // select: false ensures it's not returned by default
  password?: string;

  // Fields for 2FA
  @Column({ nullable: true, select: false })
  twoFactorSecret?: string;

  @Column({ default: false })
  isTwoFactorEnabled: boolean;

  // Fields for password reset
  @Column({ nullable: true, select: false })
  resetPasswordToken?: string;

  @Column({ type: 'timestamp', nullable: true, select: false })
  resetPasswordExpires?: Date;
}
