import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  contactPerson?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({
    type: 'enum',
    enum: SupplierCategory,
    default: SupplierCategory.REGULAR,
  })  category: SupplierCategory;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPurchases: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastPurchaseDate?: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Define the relationship with products
  @OneToMany(() => Product, product => product.supplier)
  products?: Product[];
}