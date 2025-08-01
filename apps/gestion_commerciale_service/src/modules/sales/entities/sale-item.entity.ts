import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Sale } from './sale.entity';
import { Product } from '../../inventory/entities/product.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('sale_items')
export class SaleItem {
  @ApiProperty({
    description: 'Identifiant unique de l\'article de vente',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    format: 'uuid'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Identifiant de la vente associée',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    format: 'uuid'
  })
  @Column({ name: 'sale_id' })
  saleId: string;

  @ApiProperty({
    description: 'Relation avec la vente',
    type: () => Sale
  })
  @ManyToOne(() => Sale, sale => sale.items, { onDelete: 'CASCADE' }) // If a sale is deleted, its items are also deleted
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @ApiProperty({
    description: 'Identifiant du produit',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    format: 'uuid'
  })
  @Column({ name: 'product_id' })
  productId: string;

  @ApiProperty({
    description: 'Nom du produit',
    example: 'Stylo à bille bleu'
  })
  @Column({ name: 'product_name' })
  productName: string;

  @ApiProperty({
    description: 'Relation avec le produit',
    type: () => Product
  })
  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true }) // If product is deleted, set productId to null or handle as needed
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({
    description: 'Quantité vendue',
    example: 2,
    type: 'integer'
  })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({
    description: 'Prix unitaire au moment de la vente',
    example: 750.00,
    type: 'number',
    format: 'decimal'
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price' }) // Price at the time of sale
  unitPrice: number;

  @ApiProperty({
    description: 'Remise appliquée sur l\'article',
    example: 50.00,
    type: 'number',
    format: 'decimal',
    nullable: true
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'discount', nullable: true, default: 0 })
  discount: number | null;

  @ApiProperty({
    description: 'Code de la devise',
    example: 'USD',
    nullable: true
  })
  @Column({ name: 'currency_code', nullable: true, default: 'CDF' })
  currencyCode: string | null;

  @ApiProperty({
    description: 'Taux de taxe en pourcentage',
    example: 16.00,
    type: 'number',
    format: 'decimal',
    nullable: true
  })
  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'tax_rate', nullable: true })
  taxRate: number | null;

  @ApiProperty({
    description: 'Montant de la taxe',
    example: 120.00,
    type: 'number',
    format: 'decimal',
    nullable: true
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'tax_amount', nullable: true })
  taxAmount: number | null;

  @ApiProperty({
    description: 'Notes sur l\'article',
    example: 'Couleur spéciale commandée',
    nullable: true
  })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ApiProperty({
    description: 'Prix total de l\'article (quantité × prix unitaire - remise)',
    example: 1500.00,
    type: 'number',
    format: 'decimal'
  })
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_price' })
  totalPrice: number; // quantity * unitPrice - discount
}
