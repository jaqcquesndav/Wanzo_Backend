import { ChildEntity, Column, OneToMany } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Company } from '../../company/entities/company.entity';

export enum SupplierCategory {
  STRATEGIC = 'strategic',
  REGULAR = 'regular',
  NEW_SUPPLIER = 'newSupplier',
  OCCASIONAL = 'occasional',
  INTERNATIONAL = 'international',
}

@ChildEntity('supplier')
export class Supplier extends Company {
  @Column({ nullable: true })
  contactPerson?: string;

  @Column({
    type: 'enum',
    enum: SupplierCategory,
    default: SupplierCategory.REGULAR,
  })
  category: SupplierCategory;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPurchases: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastPurchaseDate?: Date;

  // Example Relation: A supplier can supply multiple products
  @OneToMany(() => Product, product => product.supplier, { nullable: true })
  products?: Product[];
}