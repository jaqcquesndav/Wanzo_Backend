import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString, IsOptional, IsUUID, IsArray, IsDate, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionStatus, TransactionType, PaymentMethod } from '../entities/financial-transaction.entity';

export class CreateFinancialTransactionDto {
  @ApiProperty({
    description: 'Type de transaction',
    enum: TransactionType,
    example: TransactionType.SALE
  })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  transactionType: TransactionType;

  @ApiProperty({
    description: 'Montant de la transaction',
    example: 1500.75
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({
    description: 'Description de la transaction',
    example: 'Paiement de la facture FACT-2025-0124'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Date de la transaction',
    example: '2025-01-15T12:30:00Z'
  })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  transactionDate: Date;

  @ApiPropertyOptional({
    description: 'Méthode de paiement',
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Référence du paiement (numéro de chèque, référence de virement, etc.)',
    example: 'CH-123456'
  })
  @IsString()
  @IsOptional()
  paymentReference?: string;

  @ApiPropertyOptional({
    description: 'Statut de la transaction',
    enum: TransactionStatus,
    example: TransactionStatus.COMPLETED,
    default: TransactionStatus.PENDING
  })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus = TransactionStatus.PENDING;

  @ApiPropertyOptional({
    description: 'ID du client associé à la transaction',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'ID du fournisseur associé à la transaction',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional({
    description: 'ID de la facture ou du document associé',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsString()
  @IsOptional()
  relatedDocumentId?: string;

  @ApiPropertyOptional({
    description: 'Type de document associé (facture, devis, etc.)',
    example: 'invoice'
  })
  @IsString()
  @IsOptional()
  relatedDocumentType?: string;

  @ApiPropertyOptional({
    description: 'Numéro du document associé',
    example: 'FACT-2025-0124'
  })
  @IsString()
  @IsOptional()
  relatedDocumentNumber?: string;

  @ApiPropertyOptional({
    description: 'Compte bancaire source',
    example: 'Compte principal'
  })
  @IsString()
  @IsOptional()
  sourceAccount?: string;

  @ApiPropertyOptional({
    description: 'Compte bancaire destination',
    example: 'Compte fournisseur'
  })
  @IsString()
  @IsOptional()
  destinationAccount?: string;

  @ApiPropertyOptional({
    description: 'Devise de la transaction',
    example: 'XOF',
    default: 'XOF'
  })
  @IsString()
  @IsOptional()
  currency?: string = 'XOF';

  @ApiPropertyOptional({
    description: 'Taux de change (si applicable)',
    example: 655.957
  })
  @IsNumber()
  @IsOptional()
  exchangeRate?: number;

  @ApiPropertyOptional({
    description: 'Notes ou commentaires additionnels',
    example: 'Paiement partiel de la facture'
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Pièces jointes (URLs ou références)',
    example: ['https://example.com/receipt.pdf'],
    type: [String]
  })
  @IsArray()
  @IsOptional()
  attachments?: string[];

  @ApiPropertyOptional({
    description: 'Catégories associées à la transaction',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    type: [String]
  })
  @IsArray()
  @IsOptional()
  categoryIds?: string[];

  @ApiPropertyOptional({
    description: 'Métadonnées additionnelles',
    example: { taxDetails: { taxRate: 18, taxAmount: 270.13 } }
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateFinancialTransactionDto {
  @ApiPropertyOptional({
    description: 'Montant de la transaction',
    example: 1500.75
  })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Description de la transaction',
    example: 'Paiement de la facture FACT-2025-0124'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Date de la transaction',
    example: '2025-01-15T12:30:00Z'
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  transactionDate?: Date;

  @ApiPropertyOptional({
    description: 'Méthode de paiement',
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Référence du paiement (numéro de chèque, référence de virement, etc.)',
    example: 'CH-123456'
  })
  @IsString()
  @IsOptional()
  paymentReference?: string;

  @ApiPropertyOptional({
    description: 'Statut de la transaction',
    enum: TransactionStatus,
    example: TransactionStatus.COMPLETED
  })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: 'Notes ou commentaires additionnels',
    example: 'Paiement partiel de la facture'
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Pièces jointes (URLs ou références)',
    example: ['https://example.com/receipt.pdf'],
    type: [String]
  })
  @IsArray()
  @IsOptional()
  attachments?: string[];

  @ApiPropertyOptional({
    description: 'Catégories associées à la transaction',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    type: [String]
  })
  @IsArray()
  @IsOptional()
  categoryIds?: string[];

  @ApiPropertyOptional({
    description: 'Métadonnées additionnelles',
    example: { taxDetails: { taxRate: 18, taxAmount: 270.13 } }
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
