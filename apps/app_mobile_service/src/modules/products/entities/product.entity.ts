import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Supplier } from '../../suppliers/entities/supplier.entity'; // Import Supplier

// Assuming a generic Category and Unit entity might exist elsewhere or be simple strings for now.
// If they are separate entities, they would need to be defined and related.

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid') // As per documentation: "string (UUID or ObjectId)"
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ unique: true })
  sku: string;

  @Column({ nullable: true })
  barcode: string;

  @Column({ name: 'category_id', nullable: true }) // Assuming categoryId is a string for now
  categoryId: string; 
  // If Category is an entity: 
  // @ManyToOne(() => Category, category => category.products)
  // @JoinColumn({ name: 'category_id' })
  // category: Category;

  @Column({ name: 'unit_id', nullable: true }) // Assuming unitId is a string for now
  unitId: string;
  // If Unit is an entity:
  // @ManyToOne(() => Unit, unit => unit.products)
  // @JoinColumn({ name: 'unit_id' })
  // unit: Unit;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'purchase_price' })
  purchasePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'selling_price' })
  sellingPrice: number;

  @Column({ type: 'int', name: 'quantity_in_stock' })
  quantityInStock: number;

  @Column({ type: 'int', name: 'reorder_level', nullable: true })
  reorderLevel: number;

  @Column({ name: 'supplier_id', nullable: true })
  supplierId: string | null; // supplierId can be null if product has no supplier

  @ManyToOne(() => Supplier, supplier => supplier.products, { nullable: true, onDelete: 'SET NULL' }) // If supplier is deleted, set supplier_id to null
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier | null;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ type: 'jsonb', nullable: true }) // For attributes: [{"name": "string", "value": "string"}]
  attributes: Array<{ name: string; value: string }>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
