import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../auth/entities/user.entity';

@Entity('companies')
export class Company {
  @ApiProperty({
    description: 'Identifiant unique de l\'entreprise',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nom de l\'entreprise',
    example: 'Wanzo Solutions'
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'Adresse de l\'entreprise',
    example: '123 Avenue des Champs-Élysées, 75008 Paris, France',
    required: false
  })
  @Column({ nullable: true })
  address?: string;

  @ApiProperty({
    description: 'Numéro de téléphone de l\'entreprise',
    example: '+33123456789',
    required: false
  })
  @Column({ nullable: true })
  phoneNumber?: string;

  @ApiProperty({
    description: 'Adresse email de contact de l\'entreprise',
    example: 'contact@wanzo-solutions.com',
    required: false
  })
  @Column({ nullable: true })
  email?: string;

  @ApiProperty({
    description: 'Site web de l\'entreprise',
    example: 'https://www.wanzo-solutions.com',
    required: false
  })
  @Column({ nullable: true })
  website?: string;

  @ApiProperty({
    description: 'URL du logo de l\'entreprise',
    example: 'https://storage.wanzo.com/logos/wanzo-solutions.png',
    required: false
  })
  @Column({ nullable: true })
  logoUrl?: string;

  @ApiProperty({
    description: 'Industrie de l\'entreprise',
    example: 'Retail',
    required: false
  })
  @Column({ nullable: true })  
  industry?: string; // e.g., Retail, Services, Manufacturing

  @ApiProperty({
    description: 'Secteur d\'activité spécifique de l\'entreprise',
    example: 'E-commerce',
    required: false
  })
  @Column({ nullable: true })
  businessSector?: string; // More specific sector from a predefined list if available
  
  @ApiProperty({
    description: 'Utilisateurs associés à cette entreprise',
    type: [User]
  })
  @OneToMany(() => User, user => user.company)
  users: User[];
  
  @ApiProperty({
    description: 'Date de création de l\'enregistrement',
    example: '2023-05-01T10:00:00Z',
    format: 'date-time'
  })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour de l\'enregistrement',
    example: '2023-06-15T10:00:00Z',
    format: 'date-time'
  })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Add other company-specific fields as needed
  // For example, tax ID, registration number, etc.
}