import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  SUPERADMIN = 'super_admin', // Super administrateur Wanzo (accès total à tous les services)
  ADMIN = 'admin',           // Administrateur complet
  ACCOUNTANT = 'accountant', // Comptable avec accès complet
  MANAGER = 'manager',       // Gérant avec accès complet sans suppression
  ANALYST = 'analyst',       // Peut voir toutes les données et générer des rapports
  VIEWER = 'viewer'          // Accès en lecture seule
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  firstName!: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ unique: true })
  email!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER
  })
  role!: UserRole;

  @Column({ nullable: true })
  profilePicture?: string;

  @Column({ nullable: true })
  organizationId?: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  position?: string;

  @Column({ nullable: true })
  language?: string;

  @Column({ nullable: true })
  timezone?: string;

  @Column({ type: 'simple-json', nullable: true })
  permissions?: string[];

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column({ nullable: true })
  auth0Id?: string;

  @Column({ type: 'simple-json', nullable: true })
  preferences?: {
    theme?: string;
    notifications?: boolean;
    dashboardLayout?: string;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
