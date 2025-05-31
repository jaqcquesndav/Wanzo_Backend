import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

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

  @Column('text')
  password!: string;

  @Column()
  role!: string;

  @Column('jsonb')
  permissions!: {
    application: string;
    access: string;
  }[];

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

  @Column('uuid', { nullable: true })
  companyId?: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company?: Company;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}