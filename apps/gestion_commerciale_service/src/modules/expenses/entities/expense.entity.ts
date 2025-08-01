import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum ExpenseCategoryType {
  RENT = 'rent',
  UTILITIES = 'utilities',
  SUPPLIES = 'supplies',
  SALARIES = 'salaries',
  MARKETING = 'marketing',
  TRANSPORT = 'transport',
  MAINTENANCE = 'maintenance',
  OTHER = 'other',
  INVENTORY = 'inventory',
  EQUIPMENT = 'equipment',
  TAXES = 'taxes',
  INSURANCE = 'insurance',
  LOAN = 'loan',
  OFFICE = 'office',
  TRAINING = 'training',
  TRAVEL = 'travel',
  SOFTWARE = 'software',
  ADVERTISING = 'advertising',
  LEGAL = 'legal',
  MANUFACTURING = 'manufacturing',
  CONSULTING = 'consulting',
  RESEARCH = 'research',
  FUEL = 'fuel',
  ENTERTAINMENT = 'entertainment',
  COMMUNICATION = 'communication'
}

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
    description: 'Date de la dépense',
    example: '2023-08-01T12:30:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @Column({ type: 'timestamp with time zone' })
  date: Date;

  @ApiProperty({
    description: 'Motif de la dépense',
    example: 'Achat de fournitures de bureau'
  })
  @Column()
  motif: string;

  @ApiProperty({
    description: 'Montant de la dépense',
    example: 150.00,
    type: 'number',
    format: 'decimal'
  })
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({
    description: 'Catégorie de la dépense',
    enum: ExpenseCategoryType,
    example: ExpenseCategoryType.SUPPLIES
  })
  @Column({
    type: 'enum',
    enum: ExpenseCategoryType
  })
  category: ExpenseCategoryType;

  @ApiProperty({
    description: 'Méthode de paiement utilisée',
    example: 'cash',
    nullable: true
  })
  @Column({ nullable: true })
  paymentMethod: string;

  @ApiProperty({
    description: 'URLs des pièces jointes',
    example: ['https://example.com/attachments/receipt1.jpg', 'https://example.com/attachments/receipt2.jpg'],
    nullable: true,
    type: [String]
  })
  @Column('simple-array', { nullable: true })
  attachmentUrls?: string[];

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
  @ManyToOne(() => Supplier, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supplierId' })
  supplier?: Supplier;

  @ApiProperty({
    description: 'Bénéficiaire de la dépense',
    example: 'Fournisseur ABC',
    nullable: true
  })
  @Column({ nullable: true })
  beneficiary?: string;

  @ApiProperty({
    description: 'Notes additionnelles',
    example: 'Achat urgent pour projet client',
    nullable: true
  })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ApiProperty({
    description: 'Code de la devise',
    example: 'USD',
    nullable: true
  })
  @Column({ nullable: true, default: 'USD' })
  currencyCode?: string;

  @ApiProperty({
    description: 'Identifiant de l\'utilisateur',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    format: 'uuid',
    nullable: true
  })
  @Column({ nullable: true })
  userId?: string;

  @ApiProperty({
    description: 'Relation avec l\'utilisateur',
    type: () => User,
    nullable: true
  })
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ApiProperty({
    description: 'Date de création',
    example: '2023-08-01T12:30:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour',
    example: '2023-08-01T12:30:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
