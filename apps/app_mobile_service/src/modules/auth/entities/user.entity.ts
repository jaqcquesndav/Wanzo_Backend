import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserSubscription } from '../../subscriptions/entities/user-subscription.entity';
import { Company } from '../../company/entities/company.entity'; // Assuming a Company entity

export enum UserRole {
  OWNER = 'owner', // Super Admin
  ADMIN = 'admin', // Existing admin, might be a general admin below Owner
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant', // Comptable
  CASHIER = 'cashier',     // Caisse
  SALES = 'sales',         // Vente
  INVENTORY_MANAGER = 'inventory_manager', // Stocks
  STAFF = 'staff',
  CUSTOMER_SUPPORT = 'customer_support',
  // Add other roles as needed
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true }) // Password might be null if using OAuth or if user is invited and hasn't set one
  password?: string;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STAFF, // Default role, adjust as needed
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  profilePictureUrl?: string;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column({ nullable: true })
  companyId?: string;

  @ManyToOne(() => Company, company => company.users, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'companyId' })
  company?: Company;

  @OneToMany(() => UserSubscription, userSubscription => userSubscription.user)
  subscriptions: UserSubscription[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({ nullable: true })
  auth0Id?: string; // For Auth0 integration if used

  @Column({ type: 'jsonb', nullable: true })
  settings?: any; // For user-specific settings as described in API doc (Section L)

  // Password hashing (using bcrypt)
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
  }
}
