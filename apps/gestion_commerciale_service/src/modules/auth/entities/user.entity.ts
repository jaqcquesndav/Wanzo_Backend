import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ApiProperty } from '@nestjs/swagger';
// Relations supprimées pour adapter à la nouvelle architecture
// L'intégration avec la plateforme remplacera ces relations

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
  @ApiProperty({
    description: 'Identifiant unique de l\'utilisateur',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Adresse email de l\'utilisateur (unique)',
    example: 'user@example.com'
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    description: 'Mot de passe hashé (non retourné dans les réponses API)',
    example: 'hashed_password',
    required: false,
    writeOnly: true
  })
  @Column({ nullable: true }) // Password might be null if using OAuth or if user is invited and hasn't set one
  password?: string;

  @ApiProperty({
    description: 'Prénom de l\'utilisateur',
    example: 'John'
  })
  @Column()
  firstName: string;

  @ApiProperty({
    description: 'Nom de famille de l\'utilisateur',
    example: 'Doe',
    required: false
  })
  @Column({ nullable: true })
  lastName?: string;

  @ApiProperty({
    description: 'Numéro de téléphone de l\'utilisateur',
    example: '+33612345678',
    required: false
  })
  @Column({ nullable: true })
  phoneNumber?: string;

  @ApiProperty({
    description: 'Rôle de l\'utilisateur dans le système',
    enum: UserRole,
    example: UserRole.STAFF,
    default: UserRole.STAFF
  })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STAFF, // Default role, adjust as needed
  })
  role: UserRole;

  @ApiProperty({
    description: 'Indique si le compte utilisateur est actif',
    example: true,
    default: true
  })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'URL de la photo de profil de l\'utilisateur',
    example: 'https://example.com/profile-pictures/user123.jpg',
    required: false
  })
  @Column({ nullable: true })
  profilePictureUrl?: string;

  @ApiProperty({
    description: 'Date et heure de la dernière connexion',
    example: '2023-01-01T12:00:00Z',
    required: false,
    format: 'date-time'
  })
  @Column({ nullable: true })
  lastLoginAt?: Date;

  @ApiProperty({
    description: 'Identifiant de l\'entreprise associée à l\'utilisateur',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
    format: 'uuid'
  })
  @Column({ nullable: true })
  companyId?: string;

  @ApiProperty({
    description: 'Entreprise associée à l\'utilisateur',
    example: { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Entreprise A' },
    required: false
  })
  // Relation supprimée et remplacée par une référence simple
  company?: any; // Type simplifié pour l'intégration

  @ApiProperty({
    description: 'Abonnements associés à l\'utilisateur',
    example: [{ id: '123', plan: 'premium' }]
  })
  // Relation supprimée et remplacée par une référence simple
  subscriptions?: any[]; // Type simplifié pour l'intégration

  @ApiProperty({
    description: 'Date et heure de création du compte',
    example: '2023-01-01T10:00:00Z',
    format: 'date-time'
  })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ApiProperty({
    description: 'Date et heure de la dernière mise à jour du compte',
    example: '2023-01-01T11:00:00Z',
    format: 'date-time'
  })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Identifiant Auth0 de l\'utilisateur (si authentification Auth0 utilisée)',
    example: 'auth0|123456789',
    required: false
  })
  @Column({ nullable: true })
  auth0Id?: string; // For Auth0 integration if used

  @ApiProperty({
    description: 'Paramètres spécifiques à l\'utilisateur',
    required: false,
    example: {
      theme: 'dark',
      notifications: { email: true, push: false },
      language: 'fr'
    }
  })
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
