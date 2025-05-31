import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from '../dtos/user.dto';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  kiotaId!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role!: UserRole;

  @Column('jsonb')
  permissions!: {
    application: string;
    access: string;
  }[];

  @Column({ nullable: true })
  companyId?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  profilePicture?: string;

  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ nullable: true })
  emailVerificationToken!: string;

  @Column({ nullable: true })
  emailVerificationTokenExpires!: Date;

  @Column({ nullable: true })
  passwordResetToken!: string;

  @Column({ nullable: true })
  passwordResetTokenExpires!: Date;

  @Column({ default: false })
  twoFactorEnabled!: boolean;

  @Column({ nullable: true })
  twoFactorSecret!: string;

  @Column({ default: 0 })
  failedLoginAttempts!: number;

  @Column({ nullable: true })
  lastLoginAttempt!: Date;

  @Column({ default: false })
  locked!: boolean;

  @Column({ default: true })
  active!: boolean;

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}