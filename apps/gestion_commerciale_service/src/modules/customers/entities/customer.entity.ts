import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

// Enum pour la catégorie client, aligné avec le frontend
export enum CustomerCategory {
  VIP = 'vip',
  REGULAR = 'regular',
  NEW_CUSTOMER = 'new_customer',
  OCCASIONAL = 'occasional',
  BUSINESS = 'business'
}

@Entity('customers')
export class Customer {
  @ApiProperty({
    description: 'Identifiant unique du client',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    format: 'uuid'
  })
  @PrimaryGeneratedColumn('uuid') // Documentation says "id": "string", UUID is a good choice
  id: string;

  @ApiProperty({
    description: 'Nom complet du client',
    example: 'John Doe'
  })
  @Column({ name: 'full_name' })
  fullName: string;

  @ApiProperty({
    description: 'Numéro de téléphone du client',
    example: '+243999123456'
  })
  @Column({ name: 'phone_number', unique: true })
  phoneNumber: string;

  @ApiProperty({
    description: 'Adresse email du client',
    example: 'john.doe@example.com',
    nullable: true
  })
  @Column({ unique: true, nullable: true })
  email: string;

  @ApiProperty({
    description: 'Adresse postale du client',
    example: '123 rue de Paris, 75001 Paris, France',
    nullable: true
  })
  @Column({ nullable: true })
  address: string;
  
  @ApiProperty({
    description: 'Date de création',
    example: '2025-06-04T12:00:00Z',
    type: 'string',
    format: 'date-time'
  })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour',
    example: '2025-06-04T14:30:00Z',
    type: 'string',
    format: 'date-time',
    nullable: true
  })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date;

  @ApiProperty({
    description: 'Notes concernant le client',
    example: 'Client fidèle depuis 2023',
    nullable: true
  })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({
    description: 'Montant total des achats effectués par le client',
    example: 1500.00,
    type: 'number',
    format: 'decimal',
    default: 0
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_purchases', default: 0 })
  totalPurchases: number;

  @ApiProperty({
    description: 'URL de la photo de profil du client',
    example: 'https://example.com/profiles/johndoe.jpg',
    nullable: true
  })
  @Column({ name: 'profile_picture_url', nullable: true })
  profilePicture: string;
  
  @ApiProperty({
    description: 'Date du dernier achat du client',
    example: '2025-07-10T14:30:00Z',
    type: 'string',
    format: 'date-time',
    nullable: true
  })
  @Column({ name: 'last_purchase_date', type: 'timestamptz', nullable: true })
  lastPurchaseDate: Date;
  
  @ApiProperty({
    description: 'Catégorie du client',
    enum: CustomerCategory,
    example: CustomerCategory.REGULAR,
    default: CustomerCategory.REGULAR
  })
  @Column({ 
    type: 'enum', 
    enum: CustomerCategory, 
    default: CustomerCategory.REGULAR,
    name: 'category'
  })
  category: CustomerCategory;
}
