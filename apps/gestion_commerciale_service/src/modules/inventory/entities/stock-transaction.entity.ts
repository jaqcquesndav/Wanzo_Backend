import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from './product.entity';
import { StockTransactionType } from '../enums/stock-transaction-type.enum';

@Entity('stock_transactions')
export class StockTransaction {
  @ApiProperty({
    description: 'Identifiant unique de la transaction',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    format: 'uuid'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'ID du produit concerné',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    format: 'uuid'
  })
  @Column({ name: 'product_id' })
  productId: string;

  @ApiProperty({
    description: 'Relation avec le produit',
    type: () => Product
  })
  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({
    description: 'Type de transaction',
    example: 'purchase',
    enum: StockTransactionType
  })
  @Column({
    type: 'enum',
    enum: StockTransactionType
  })
  type: StockTransactionType;

  @ApiProperty({
    description: 'Quantité (positive ou négative selon le type)',
    example: 10.0,
    type: 'number',
    format: 'float'
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @ApiProperty({
    description: 'Date de la transaction',
    example: '2023-08-01T12:30:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @Column({ type: 'timestamptz' })
  date: Date;

  @ApiProperty({
    description: 'ID de référence (vente, achat, etc.)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    nullable: true
  })
  @Column({ name: 'reference_id', nullable: true })
  referenceId: string;

  @ApiProperty({
    description: 'Notes additionnelles',
    example: 'Réception de commande fournisseur #123',
    nullable: true
  })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({
    description: 'ID de l\'utilisateur qui a créé la transaction',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    nullable: true
  })
  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @ApiProperty({
    description: 'Date de création de l\'enregistrement',
    example: '2023-08-01T12:30:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({
    description: 'Prix unitaire d\'achat',
    example: 5000.00,
    type: 'number',
    format: 'decimal',
    nullable: true
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_cost_price', nullable: true })
  unitCostPrice: number;

  @ApiProperty({
    description: 'ID de l\'emplacement de stock',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    nullable: true
  })
  @Column({ name: 'location_id', nullable: true })
  locationId: string;
}
