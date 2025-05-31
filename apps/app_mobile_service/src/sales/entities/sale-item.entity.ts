import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Sale } from './sale.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sale_id' })
  saleId: string;

  @ManyToOne(() => Sale, sale => sale.items, { onDelete: 'CASCADE' }) // If a sale is deleted, its items are also deleted
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true }) // If product is deleted, set productId to null or handle as needed
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price' }) // Price at the time of sale
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_price' })
  totalPrice: number; // quantity * unitPrice
}
