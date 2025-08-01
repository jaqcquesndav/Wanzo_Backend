import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum OperationStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum OperationType {
  SALE = 'sale',
  EXPENSE = 'expense',
  FINANCING = 'financing',
  INVENTORY = 'inventory',
  TRANSACTION = 'transaction',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_MONEY = 'mobile_money',
  CREDIT = 'credit',
  CHECK = 'check',
  OTHER = 'other',
}

@Entity('business_operations')
@Index(['type', 'date'])
@Index(['relatedPartyId'])
@Index(['status'])
export class BusinessOperation {
  @ApiProperty({ description: 'Identifiant unique de l\'opération', example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Type d\'opération', enum: OperationType, example: OperationType.SALE })
  @Column({
    type: 'enum',
    enum: OperationType,
  })
  type: OperationType;

  @ApiProperty({ description: 'Date de l\'opération', example: '2023-08-01T12:30:00.000Z' })
  @Column({ type: 'timestamp with time zone' })
  date: Date;

  @ApiProperty({ description: 'Description de l\'opération', example: 'Vente de produits informatiques' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ description: 'ID de l\'entité associée (vente, dépense, etc.)', example: 'sale-123456' })
  @Column({ nullable: true })
  entityId: string;

  @ApiProperty({ description: 'Montant en francs congolais (CDF)', example: 150000.00 })
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  amountCdf: number;

  @ApiProperty({ description: 'Montant en dollars américains (USD)', example: 75.00 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  amountUsd: number;

  @ApiProperty({ description: 'ID de la partie liée (client, fournisseur)', example: 'customer-456789' })
  @Column({ nullable: true })
  relatedPartyId: string;

  @ApiProperty({ description: 'Nom de la partie liée', example: 'Entreprise ABC' })
  @Column({ nullable: true })
  relatedPartyName: string;

  @ApiProperty({ description: 'Statut de l\'opération', enum: OperationStatus, example: OperationStatus.COMPLETED })
  @Column({
    type: 'enum',
    enum: OperationStatus,
    default: OperationStatus.PENDING,
  })
  status: OperationStatus;

  @ApiProperty({ description: 'Méthode de paiement (pour les ventes/dépenses)', enum: PaymentMethod, example: PaymentMethod.CASH })
  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'ID de la catégorie (pour les dépenses)', example: 'category-123' })
  @Column({ nullable: true })
  categoryId: string;

  @ApiProperty({ description: 'Nombre de produits (pour les ventes)', example: 5 })
  @Column({ nullable: true })
  productCount: number;

  @ApiProperty({ description: 'Notes supplémentaires', example: 'Paiement en plusieurs tranches' })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ description: 'ID de l\'utilisateur qui a créé l\'opération' })
  @Column()
  createdBy: string;

  @ApiProperty({ description: 'Date de création' })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @ApiProperty({ description: 'Données supplémentaires spécifiques au type d\'opération' })
  @Column({ type: 'jsonb', nullable: true })
  additionalData: any;

  // La relation avec l'entité User est commentée car cela dépendra de votre structure
  // @ManyToOne(() => User)
  // @JoinColumn({ name: 'createdBy' })
  // creator: User;
}
