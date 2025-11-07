import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRole, UserType } from '../dto/user-profile.dto';

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
    default: UserRole.COMPANY_USER
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.EXTERNAL
  })
  userType: UserType;

  @Column({ nullable: true })
  picture: string;

  @Column({ nullable: true })
  organizationId: string;

  @Column({ nullable: true, name: 'customer_account_id' })
  customerAccountId: string;

  @Column({ nullable: true, name: 'phone_number' })
  phoneNumber: string;

  @Column({ nullable: true, name: 'id_agent' })
  idAgent: string;

  @Column({ nullable: true, name: 'validity_end' })
  validityEnd: Date;

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ type: 'simple-json', nullable: true })
  permissions: string[];

  @Column({ type: 'simple-json', nullable: true })
  kyc: {
    status: 'pending' | 'verified' | 'rejected';
    verifiedAt?: string;
    documents?: Array<{
      type: string;
      verified: boolean;
      uploadedAt: string;
    }>;
  };

  @Column({ nullable: true, name: 'last_login' })
  lastLogin: Date;

  @Column({ nullable: true, name: 'auth0_id' })
  auth0Id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
