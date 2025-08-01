import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../auth/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';

export enum TransactionType {
  SALE = 'sale',               // Vente
  PURCHASE = 'purchase',       // Achat auprès d'un fournisseur
  CUSTOMER_PAYMENT = 'customer_payment', // Paiement reçu d'un client
  SUPPLIER_PAYMENT = 'supplier_payment', // Paiement effectué à un fournisseur
  REFUND = 'refund',           // Remboursement à un client
  EXPENSE = 'expense',         // Dépense générale
  PAYROLL = 'payroll',         // Paie des employés
  TAX_PAYMENT = 'tax_payment', // Paiement des taxes
  TRANSFER = 'transfer',       // Transfert entre comptes
  OTHER = 'other'              // Autre transaction
}

export enum PaymentMethod {
  CASH = 'cash',               // Espèces
  BANK_TRANSFER = 'bank_transfer', // Virement bancaire
  CHECK = 'check',             // Chèque
  CREDIT_CARD = 'credit_card', // Carte de crédit
  DEBIT_CARD = 'debit_card',   // Carte de débit
  MOBILE_MONEY = 'mobile_money', // Mobile money (Orange Money, Wave, etc.)
  PAYPAL = 'paypal',           // PayPal
  OTHER = 'other'              // Autre méthode
}

export enum TransactionStatus {
  PENDING = 'pending',         // En attente
  COMPLETED = 'completed',     // Terminée
  FAILED = 'failed',           // Échouée
  VOIDED = 'voided',           // Annulée
  REFUNDED = 'refunded',       // Remboursée
  PARTIALLY_REFUNDED = 'partially_refunded', // Partiellement remboursée
  PENDING_APPROVAL = 'pending_approval' // En attente d'approbation
}

@Entity('financial_transactions')
@Index(['companyId'])
@Index(['transactionDate'])
@Index(['transactionType'])
@Index(['status'])
export class FinancialTransaction {
  @ApiProperty({
    description: 'Identifiant unique de la transaction',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Numéro de référence de la transaction',
    example: 'TRX-2025-0001'
  })
  @Column({ unique: true })
  referenceNumber: string;

  @ApiProperty({
    description: 'Type de transaction',
    enum: TransactionType,
    example: TransactionType.SALE
  })
  @Column({
    type: 'enum',
    enum: TransactionType
  })
  transactionType: TransactionType;

  @ApiProperty({
    description: 'Montant de la transaction',
    example: 1500.75
  })
  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @ApiProperty({
    description: 'Description de la transaction',
    example: 'Paiement de la facture FACT-2025-0124',
    required: false
  })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Date de la transaction',
    example: '2025-01-15T12:30:00Z'
  })
  @Column('timestamp with time zone')
  transactionDate: Date;

  @ApiProperty({
    description: 'Méthode de paiement',
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER,
    required: false
  })
  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true
  })
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    description: 'Référence du paiement (numéro de chèque, référence de virement, etc.)',
    example: 'CH-123456',
    required: false
  })
  @Column({ nullable: true })
  paymentReference?: string;

  @ApiProperty({
    description: 'Statut de la transaction',
    enum: TransactionStatus,
    example: TransactionStatus.COMPLETED
  })
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING
  })
  status: TransactionStatus;

  @ApiProperty({
    description: 'ID du client associé à la transaction',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false
  })
  @Column({ nullable: true })
  customerId?: string;

  @ApiProperty({
    description: 'Client associé à la transaction',
    type: () => Customer,
    required: false
  })
  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer?: Customer;

  @ApiProperty({
    description: 'ID du fournisseur associé à la transaction',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false
  })
  @Column({ nullable: true })
  supplierId?: string;

  @ApiProperty({
    description: 'Fournisseur associé à la transaction',
    type: () => Supplier,
    required: false
  })
  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'supplierId' })
  supplier?: Supplier;

  @ApiProperty({
    description: 'ID de la facture ou du document associé',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false
  })
  @Column({ nullable: true })
  relatedDocumentId?: string;

  @ApiProperty({
    description: 'Type de document associé (facture, devis, etc.)',
    example: 'invoice',
    required: false
  })
  @Column({ nullable: true })
  relatedDocumentType?: string;

  @ApiProperty({
    description: 'Numéro du document associé',
    example: 'FACT-2025-0124',
    required: false
  })
  @Column({ nullable: true })
  relatedDocumentNumber?: string;

  @ApiProperty({
    description: 'Compte bancaire source',
    example: 'Compte principal',
    required: false
  })
  @Column({ nullable: true })
  sourceAccount?: string;

  @ApiProperty({
    description: 'Compte bancaire destination',
    example: 'Compte fournisseur',
    required: false
  })
  @Column({ nullable: true })
  destinationAccount?: string;

  @ApiProperty({
    description: 'Devise de la transaction',
    example: 'XOF',
    default: 'XOF'
  })
  @Column({ default: 'XOF' })
  currency: string;

  @ApiProperty({
    description: 'Taux de change (si applicable)',
    example: 655.957,
    required: false
  })
  @Column('decimal', { precision: 15, scale: 6, nullable: true })
  exchangeRate?: number;

  @ApiProperty({
    description: 'Montant dans la devise de base',
    example: 1500.75,
    required: false
  })
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  baseCurrencyAmount?: number;

  @ApiProperty({
    description: 'Notes ou commentaires additionnels',
    example: 'Paiement partiel de la facture',
    required: false
  })
  @Column({ nullable: true })
  notes?: string;

  @ApiProperty({
    description: 'Pièces jointes (URLs ou références)',
    example: ['https://example.com/receipt.pdf'],
    required: false
  })
  @Column('jsonb', { nullable: true })
  attachments?: string[];

  @ApiProperty({
    description: 'ID de l\'entreprise associée',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @Column()
  companyId: string;

  @ApiProperty({
    description: 'ID de l\'utilisateur qui a créé la transaction',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @Column()
  createdById: string;

  @ApiProperty({
    description: 'Utilisateur qui a créé la transaction',
    type: () => User
  })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @ApiProperty({
    description: 'ID de l\'utilisateur qui a approuvé la transaction',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false
  })
  @Column({ nullable: true })
  approvedById?: string;

  @ApiProperty({
    description: 'Utilisateur qui a approuvé la transaction',
    type: () => User,
    required: false
  })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy?: User;

  @ApiProperty({
    description: 'Date d\'approbation de la transaction',
    example: '2025-01-16T09:45:00Z',
    required: false
  })
  @Column({ nullable: true })
  approvalDate?: Date;

  @ApiProperty({
    description: 'Métadonnées additionnelles',
    example: { taxDetails: { taxRate: 18, taxAmount: 270.13 } },
    required: false
  })
  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

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
