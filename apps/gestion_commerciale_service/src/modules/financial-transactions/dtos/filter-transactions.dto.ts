import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, IsString, IsUUID, IsDate, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionStatus, TransactionType, PaymentMethod } from '../entities/financial-transaction.entity';

export class FilterTransactionsDto {
  @ApiPropertyOptional({
    description: 'Page actuelle (pour la pagination)',
    example: 1,
    default: 1
  })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page',
    example: 10,
    default: 10
  })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Champ à utiliser pour le tri',
    example: 'transactionDate',
    default: 'transactionDate'
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'transactionDate';

  @ApiPropertyOptional({
    description: 'Ordre de tri',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC'
  })
  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({
    description: 'Types de transactions à inclure',
    example: [TransactionType.SALE, TransactionType.CUSTOMER_PAYMENT],
    type: [String]
  })
  @IsArray()
  @IsEnum(TransactionType, { each: true })
  @IsOptional()
  transactionTypes?: TransactionType[];

  @ApiPropertyOptional({
    description: 'Statuts de transactions à inclure',
    example: [TransactionStatus.COMPLETED, TransactionStatus.PENDING],
    type: [String]
  })
  @IsArray()
  @IsEnum(TransactionStatus, { each: true })
  @IsOptional()
  statuses?: TransactionStatus[];

  @ApiPropertyOptional({
    description: 'Méthodes de paiement à inclure',
    example: [PaymentMethod.BANK_TRANSFER, PaymentMethod.CASH],
    type: [String]
  })
  @IsArray()
  @IsEnum(PaymentMethod, { each: true })
  @IsOptional()
  paymentMethods?: PaymentMethod[];

  @ApiPropertyOptional({
    description: 'ID du client',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'ID du fournisseur',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional({
    description: 'Date de début de la période',
    example: '2025-01-01T00:00:00Z'
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Date de fin de la période',
    example: '2025-01-31T23:59:59Z'
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Montant minimum',
    example: 1000
  })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Montant maximum',
    example: 5000
  })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'Devise',
    example: 'XOF'
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Rechercher dans la description',
    example: 'facture'
  })
  @IsString()
  @IsOptional()
  searchTerm?: string;

  @ApiPropertyOptional({
    description: 'IDs des catégories',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    type: [String]
  })
  @IsArray()
  @IsUUID(4, { each: true })
  @IsOptional()
  categoryIds?: string[];

  @ApiPropertyOptional({
    description: 'Inclure les sous-catégories dans la recherche',
    example: true,
    default: true
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  includeSubcategories?: boolean = true;
  
  @ApiPropertyOptional({
    description: 'Type de document associé',
    example: 'invoice'
  })
  @IsString()
  @IsOptional()
  relatedDocumentType?: string;

  @ApiPropertyOptional({
    description: 'ID du document associé',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsString()
  @IsOptional()
  relatedDocumentId?: string;

  @ApiPropertyOptional({
    description: 'Numéro de référence du document associé',
    example: 'FACT-2025-0124'
  })
  @IsString()
  @IsOptional()
  relatedDocumentNumber?: string;
}

export class TransactionSummaryDto {
  @ApiProperty({
    description: 'Total des entrées d\'argent',
    example: 15000.75
  })
  totalIncome: number;

  @ApiProperty({
    description: 'Total des sorties d\'argent',
    example: 8750.25
  })
  totalExpense: number;

  @ApiProperty({
    description: 'Balance (entrées - sorties)',
    example: 6250.50
  })
  balance: number;

  @ApiProperty({
    description: 'Nombre total de transactions',
    example: 42
  })
  totalCount: number;

  @ApiProperty({
    description: 'Répartition par type de transaction',
    example: {
      [TransactionType.SALE]: 5000.00,
      [TransactionType.CUSTOMER_PAYMENT]: 10000.75,
      [TransactionType.PURCHASE]: -7000.25,
      [TransactionType.EXPENSE]: -1750.00
    }
  })
  transactionTypeSummary: Record<string, number>;

  @ApiProperty({
    description: 'Répartition par catégorie',
    example: {
      'Ventes': 15000.75,
      'Achats': -7000.25,
      'Frais généraux': -1750.00
    }
  })
  categorySummary: Record<string, number>;
}

export class TransactionResponseDto {
  @ApiProperty({
    description: 'État de la réponse',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Liste des transactions',
    type: 'array',
    items: {
      type: 'object'
    }
  })
  data: any[];

  @ApiProperty({
    description: 'Informations de pagination',
    example: {
      total: 42,
      page: 1,
      limit: 10,
      pages: 5
    }
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };

  @ApiPropertyOptional({
    description: 'Résumé des transactions (si demandé)',
    type: TransactionSummaryDto
  })
  summary?: TransactionSummaryDto;
}
