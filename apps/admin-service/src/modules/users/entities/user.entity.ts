import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from './enums/user-role.enum';
import { UserStatus } from './enums/user-status.enum';
import { UserType } from './enums/user-type.enum';

console.log('UserRole:', UserRole);
console.log('UserStatus:', UserStatus);
console.log('UserType:', UserType);

export { UserRole, UserStatus, UserType };

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
  @Column({ nullable: true, name: 'customer_account_id' })
  customerAccountId?: string;
  
  @Column({ nullable: true, name: 'customer_name' })
  customerName?: string;
  
  @Column({ nullable: true, name: 'customer_type' })
  customerType?: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Column({ nullable: true })
  avatar?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ nullable: true, name: 'updated_at' })
  updatedAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login' })
  lastLogin?: Date;
  @Column('simple-json', { nullable: true })
  permissions?: {
    applicationId: string;
    permissions: string[];
  }[];

  @Column({ nullable: true })
  departement?: string;

  @Column({ nullable: true, name: 'phone_number' })
  phoneNumber?: string;
  
  @Column({ nullable: true })
  position?: string;
  
  @Column({ nullable: true, name: 'id_agent' })
  idAgent?: string;
  
  @Column({ nullable: true, name: 'validity_end' })
  validityEnd?: Date;
  
  @Column({ nullable: true })
  language?: string;
  
  @Column({ nullable: true })
  timezone?: string;
  
  @Column({ type: 'simple-json', nullable: true })
  kyc?: {
    status: string;
    verifiedAt?: string;
    documents?: Array<{
      type: string;
      verified: boolean;
      uploadedAt: string;
    }>;
  };
  // Relation to Company (if a user can belong to one company)
  // @ManyToOne(() => Company, company => company.users, { nullable: true })
  // company?: Company;

  @Column({ nullable: true, name: 'auth0_id' })
  auth0Id?: string;

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

  // Fields for password reset
  @Column({ nullable: true, select: false })
  resetPasswordToken?: string;

  @Column({ type: 'timestamp', nullable: true, select: false })
  resetPasswordExpires?: Date;
}
