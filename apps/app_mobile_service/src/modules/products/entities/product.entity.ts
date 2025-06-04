import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Supplier } from '../../suppliers/entities/supplier.entity'; // Import Supplier
import { ApiProperty } from '@nestjs/swagger';

// Assuming a generic Category and Unit entity might exist elsewhere or be simple strings for now.
// If they are separate entities, they would need to be defined and related.

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
    description: 'Identifiant de la catégorie du produit',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    nullable: true
  })
  @Column({ name: 'category_id', nullable: true }) // Assuming categoryId is a string for now
  categoryId: string; 
  // If Category is an entity: 
  // @ManyToOne(() => Category, category => category.products)
  // @JoinColumn({ name: 'category_id' })
  // category: Category;

  @ApiProperty({
    description: 'Identifiant de l\'unité de mesure du produit',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    nullable: true
  })
  @Column({ name: 'unit_id', nullable: true }) // Assuming unitId is a string for now
  unitId: string;
  // If Unit is an entity:
  // @ManyToOne(() => Unit, unit => unit.products)
  // @JoinColumn({ name: 'unit_id' })
  // unit: Unit;

  @ApiProperty({
    description: 'Prix d\'achat du produit',
    example: 500.00,
    type: 'number',
    format: 'decimal'
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'purchase_price' })
  purchasePrice: number;

  @ApiProperty({
    description: 'Prix de vente du produit',
    example: 750.00,
    type: 'number',
    format: 'decimal'
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'selling_price' })
  sellingPrice: number;

  @ApiProperty({
    description: 'Quantité en stock',
    example: 100,
    type: 'integer'
  })
  @Column({ type: 'int', name: 'quantity_in_stock' })
  quantityInStock: number;

  @ApiProperty({
    description: 'Niveau de réapprovisionnement',
    example: 10,
    type: 'integer',
    nullable: true
  })
  @Column({ type: 'int', name: 'reorder_level', nullable: true })
  reorderLevel: number;

  @ApiProperty({
    description: 'Identifiant du fournisseur',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    nullable: true,
    format: 'uuid'
  })
  @Column({ name: 'supplier_id', nullable: true })
  supplierId: string | null; // supplierId can be null if product has no supplier
  @ApiProperty({
    description: 'Relation avec le fournisseur',
    type: () => Supplier,
    nullable: true
  })
  @ManyToOne(() => Supplier, supplier => supplier.products, { nullable: true, onDelete: 'SET NULL' }) // If supplier is deleted, set supplier_id to null
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier | null;

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
  @Column({ type: 'jsonb', nullable: true }) // For attributes: [{"name": "string", "value": "string"}]
  attributes: Array<{ name: string; value: string }>;

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
