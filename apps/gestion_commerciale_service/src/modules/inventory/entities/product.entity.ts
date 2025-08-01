import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory } from '../enums/product-category.enum';
import { MeasurementUnit } from '../enums/measurement-unit.enum';

@Entity('products')
export class Product {
  @ApiProperty({
    description: 'Identifiant unique du produit',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    format: 'uuid'
  })
  @PrimaryGeneratedColumn('uuid') // As per documentation: "string (UUID or ObjectId)"
  id: string;

  @ApiProperty({
    description: 'Nom du produit',
    example: 'Smartphone XYZ'
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'Description détaillée du produit',
    example: 'Smartphone haut de gamme avec écran OLED 6.5 pouces',
    nullable: true
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Numéro de référence unique du produit (Stock Keeping Unit)',
    example: 'PROD-12345'
  })
  @Column({ unique: true })
  sku: string;

  @ApiProperty({
    description: 'Code-barres du produit',
    example: '5901234123457',
    nullable: true
  })
  @Column({ nullable: true })
  barcode: string;
  @ApiProperty({
    description: 'Catégorie du produit',
    example: 'food',
    enum: ProductCategory,
    nullable: true
  })
  @Column({ 
    type: 'enum', 
    enum: ProductCategory,
    default: ProductCategory.OTHER,
    nullable: true 
  })
  category: ProductCategory;

  @ApiProperty({
    description: 'Unité de mesure du produit',
    example: 'piece',
    enum: MeasurementUnit,
    nullable: true
  })
  @Column({ 
    type: 'enum', 
    enum: MeasurementUnit, 
    default: MeasurementUnit.PIECE,
    nullable: true
  })
  unit: MeasurementUnit;

  @ApiProperty({
    description: 'Prix d\'achat du produit en Francs Congolais',
    example: 500.00,
    type: 'number',
    format: 'decimal'
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'cost_price_in_cdf' })
  costPriceInCdf: number;

  @ApiProperty({
    description: 'Prix de vente du produit en Francs Congolais',
    example: 750.00,
    type: 'number',
    format: 'decimal'
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'selling_price_in_cdf' })
  sellingPriceInCdf: number;

  @ApiProperty({
    description: 'Quantité en stock',
    example: 100,
    type: 'number',
    format: 'float'
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'stock_quantity' })
  stockQuantity: number;

  @ApiProperty({
    description: 'Niveau d\'alerte de stock bas',
    example: 10,
    type: 'number',
    format: 'float',
    nullable: true
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'alert_threshold', nullable: true })
  alertThreshold: number;

  @ApiProperty({
    description: 'Relations avec les fournisseurs',
    type: () => [Supplier],
    nullable: true
  })
  @ManyToMany(() => Supplier, supplier => supplier.products, { nullable: true })
  @JoinTable({
    name: 'product_suppliers',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'supplier_id', referencedColumnName: 'id' }
  })
  suppliers: Supplier[];
  
  @ApiProperty({
    description: 'IDs des fournisseurs',
    example: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'],
    type: [String],
    nullable: true
  })
  @Column('simple-array', { name: 'supplier_ids', nullable: true })
  supplierIds: string[];

  @ApiProperty({
    description: 'URL de l\'image du produit',
    example: 'https://example.com/images/product123.jpg',
    nullable: true
  })
  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @ApiProperty({
    description: 'Liste des attributs spécifiques du produit',
    example: [{ name: 'Couleur', value: 'Rouge' }, { name: 'Taille', value: 'M' }],
    nullable: true,
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        value: { type: 'string' }
      }
    }
  })
  @Column({ type: 'jsonb', name: 'attributes', nullable: true }) // For attributes: [{"name": "string", "value": "string"}]
  attributes: Array<{ name: string; value: string }>;
  
  @ApiProperty({
    description: 'Tags pour le produit',
    example: ['promotion', 'nouveauté'],
    type: [String],
    nullable: true
  })
  @Column('simple-array', { name: 'tags', nullable: true })
  tags: string[];
  
  @ApiProperty({
    description: 'Taux de taxe en pourcentage',
    example: 16.0,
    type: 'number',
    format: 'float',
    nullable: true
  })
  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'tax_rate', nullable: true })
  taxRate: number;

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
    format: 'date-time'
  })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
