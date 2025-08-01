import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../products/entities/product.entity';

export enum SupplierCategory {
  STRATEGIC = 'strategic',
  REGULAR = 'regular',
  NEW_SUPPLIER = 'newSupplier',
  OCCASIONAL = 'occasional',
  INTERNATIONAL = 'international',
}

@Entity('suppliers')
export class Supplier {
  @ApiProperty({
    description: 'Identifiant unique du fournisseur',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nom du fournisseur',
    example: 'Acme Supplies Corp'
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'Nom de la personne de contact',
    example: 'Jean Dupont',
    required: false
  })
  @Column({ nullable: true })
  contactPerson?: string;

  @ApiProperty({
    description: 'Adresse email du fournisseur',
    example: 'contact@acme-supplies.com',
    required: false
  })
  @Column({ nullable: true })
  email?: string;

  @ApiProperty({
    description: 'Numéro de téléphone du fournisseur',
    example: '+33123456789',
    required: false
  })
  @Column({ nullable: true })
  phoneNumber?: string;

  @ApiProperty({
    description: 'Adresse postale du fournisseur',
    example: '123 Rue de Commerce, 75001 Paris, France',
    required: false
  })
  @Column({ nullable: true })
  address?: string;

  @ApiProperty({
    description: 'Catégorie du fournisseur',
    enum: SupplierCategory,
    example: SupplierCategory.REGULAR,
    default: SupplierCategory.REGULAR
  })
  @Column({
    type: 'enum',
    enum: SupplierCategory,
    default: SupplierCategory.REGULAR,
  })  
  category: SupplierCategory;

  @ApiProperty({
    description: 'Montant total des achats effectués auprès de ce fournisseur',
    example: 5000.50,
    default: 0
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPurchases: number;

  @ApiProperty({
    description: 'Date du dernier achat effectué auprès de ce fournisseur',
    example: '2023-06-15T14:30:00Z',
    required: false,
    format: 'date-time'
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  lastPurchaseDate?: Date;

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

  @ApiProperty({
    description: 'Produits associés à ce fournisseur',
    type: [Product],
    required: false
  })
  // Define the relationship with products
  @OneToMany(() => Product, product => product.supplier)
  products?: Product[];
}