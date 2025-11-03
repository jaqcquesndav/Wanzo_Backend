import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',                      // Administrateur complet 
  INSTITUTION_ADMIN = 'manager',        // Gestionnaire d'institution
  PORTFOLIO_MANAGER = 'portfolio_manager', // Gestionnaire de portefeuille
  ANALYST = 'analyst',                  // Analyste 
  SALES_REP = 'sales_rep',             // Représentant commercial
  VIEWER = 'viewer'                     // Accès en lecture seule
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

@Entity('auth_users')
export class AuthUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  auth0Id!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ unique: true })
  email!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER
  })
  role!: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE
  })
  status!: UserStatus;

  @Column({ nullable: true })
  profilePicture?: string;

  @Column({ nullable: true })
  institutionId?: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  position?: string;

  @Column({ default: 'fr' })
  language!: string;

  @Column({ default: 'Europe/Paris' })
  timezone!: string;

  @Column('simple-array', { nullable: true })
  permissions?: string[];

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column('jsonb', { nullable: true })
  preferences?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}