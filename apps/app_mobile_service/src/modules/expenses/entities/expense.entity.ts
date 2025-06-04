import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { ExpenseCategory } from './expense-category.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { Company } from '../../company/entities/company.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('expenses')
export class Expense {
  @ApiProperty({
    description: 'Identifiant unique de la dépense',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    format: 'uuid'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Identifiant de l\'utilisateur ayant créé la dépense',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    format: 'uuid'
  })
  @Column()
  userId: string;

  @ApiProperty({
    description: 'Relation avec l\'utilisateur',
    type: () => User
  })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true }) // User who created the expense
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ApiProperty({
    description: 'Identifiant de l\'entreprise',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    format: 'uuid'
  })
  @Column()
  companyId: string;

  @ApiProperty({
    description: 'Relation avec l\'entreprise',
    type: () => Company
  })
  @ManyToOne(() => Company, { onDelete: 'CASCADE' }) // Expense belongs to a company
  @JoinColumn({ name: 'companyId' })
  company: Company;
  @ApiProperty({
    description: 'Date de la dépense',
    example: '2025-06-04T12:00:00Z',
    type: 'string',
    format: 'date-time'
  })
  @Column({ type: 'timestamp with time zone' })
  date: Date;

  @ApiProperty({
    description: 'Montant de la dépense',
    example: 250.50,
    type: 'number',
    format: 'decimal'
  })
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({
    description: 'Motif de la dépense',
    example: 'Achat de fournitures de bureau'
  })
  @Column()
  motif: string; // Renamed from description as per API doc

  @ApiProperty({
    description: 'Identifiant de la catégorie de dépense',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    format: 'uuid'
  })
  @Column()
  categoryId: string;

  @ApiProperty({
    description: 'Relation avec la catégorie de dépense',
    type: () => ExpenseCategory
  })
  @ManyToOne(() => ExpenseCategory, category => category.expenses, { onDelete: 'RESTRICT' }) // Prevent deleting category if expenses exist
  @JoinColumn({ name: 'categoryId' })
  category: ExpenseCategory;

  @ApiProperty({
    description: 'Méthode de paiement utilisée',
    example: 'carte'
  })
  @Column()
  paymentMethod: string; // e.g., "cash", "card", "bank_transfer"

  @ApiProperty({
    description: 'URLs des pièces jointes',
    example: ['https://example.com/attachments/receipt1.jpg', 'https://example.com/attachments/receipt2.jpg'],
    nullable: true,
    type: [String]
  })
  @Column('simple-array', { nullable: true })
  attachmentUrls?: string[]; // Array of Cloudinary URLs

  @ApiProperty({
    description: 'Identifiant du fournisseur (optionnel)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    format: 'uuid',
    nullable: true
  })
  @Column({ nullable: true })
  supplierId?: string;
  @ApiProperty({
    description: 'Relation avec le fournisseur',
    type: () => Supplier,
    nullable: true
  })
  @ManyToOne(() => Supplier, { nullable: true, onDelete: 'SET NULL' }) // Optional link to a supplier
  @JoinColumn({ name: 'supplierId' })
  supplier?: Supplier;

  @ApiProperty({
    description: 'Date de création',
    example: '2025-06-04T12:00:00Z',
    type: 'string',
    format: 'date-time'
  })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour',
    example: '2025-06-04T14:30:00Z',
    type: 'string',
    format: 'date-time'
  })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
