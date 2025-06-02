import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

// Placeholder for Company entity - this should be defined elsewhere properly
// For example, in src/company/entities/company.entity.ts
class Company { id: string; suppliers: Supplier[]; name: string; /* other properties */ }

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

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  address?: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Example Relation: A supplier can supply multiple products
  @OneToMany(() => Product, product => product.supplier, { nullable: true })
  products?: Product[];

  @ManyToOne(() => Company, company => company.suppliers, {nullable: false}) // Assuming a supplier must belong to a company
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({name: 'company_id'})
  companyId: string;
}
