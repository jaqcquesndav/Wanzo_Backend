import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('transaction_categories')
export class TransactionCategory {
  @ApiProperty({
    description: 'Identifiant unique de la catégorie',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nom de la catégorie',
    example: 'Fournitures de bureau'
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'Description de la catégorie',
    example: 'Dépenses pour les fournitures et matériel de bureau',
    required: false
  })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Code de la catégorie',
    example: 'FOURNITURES',
    required: false
  })
  @Column({ nullable: true })
  code?: string;

  @ApiProperty({
    description: 'ID de la catégorie parente',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false
  })
  @Column({ nullable: true })
  parentId?: string;

  @ApiProperty({
    description: 'Catégorie parente',
    type: () => TransactionCategory,
    required: false
  })
  @ManyToOne(() => TransactionCategory, category => category.subCategories, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: TransactionCategory;

  @ApiProperty({
    description: 'Sous-catégories',
    type: [TransactionCategory]
  })
  @OneToMany(() => TransactionCategory, category => category.parent)
  subCategories: TransactionCategory[];

  @ApiProperty({
    description: 'Type de catégorie (income/expense/both)',
    example: 'expense',
    enum: ['income', 'expense', 'both']
  })
  @Column({ default: 'both' })
  type: string;

  @ApiProperty({
    description: 'Couleur associée à la catégorie (pour l\'UI)',
    example: '#3498db',
    required: false
  })
  @Column({ nullable: true })
  color?: string;

  @ApiProperty({
    description: 'Icône associée à la catégorie (pour l\'UI)',
    example: 'office_supplies',
    required: false
  })
  @Column({ nullable: true })
  icon?: string;

  @ApiProperty({
    description: 'Ordre d\'affichage',
    example: 1,
    required: false
  })
  @Column({ default: 0 })
  displayOrder: number;

  @ApiProperty({
    description: 'ID de l\'entreprise associée',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @Column()
  companyId: string;

  @ApiProperty({
    description: 'Indique si c\'est une catégorie par défaut du système',
    example: false
  })
  @Column({ default: false })
  isSystem: boolean;

  @ApiProperty({
    description: 'Indique si la catégorie est active',
    example: true
  })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Date de création de l\'enregistrement',
    example: '2025-01-15T12:30:00Z'
  })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour de l\'enregistrement',
    example: '2025-01-15T12:30:00Z'
  })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
