import { IsString, IsOptional, IsNumber, IsArray, IsEnum, IsDateString, ValidateNested, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Statuts disponibles pour les factures
 */
export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

/**
 * Statuts de paiement
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed'
}

/**
 * Devises supportées
 */
export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  CDF = 'CDF'
}

/**
 * DTO pour un élément de facture
 */
export class InvoiceItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsNumber()
  @Min(0)
  total!: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  productId?: string;
}

/**
 * DTO pour créer une nouvelle facture
 */
export class CreateInvoiceDto {
  @IsUUID()
  customerId!: string;

  @IsOptional()
  @IsDateString()
  issueDate?: Date;

  @IsDateString()
  dueDate!: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items!: InvoiceItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  purchaseOrder?: string;
}

/**
 * DTO pour mettre à jour une facture
 */
export class UpdateInvoiceDto {
  @IsOptional()
  @IsDateString()
  issueDate?: Date;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items?: InvoiceItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  purchaseOrder?: string;
}

/**
 * DTO de réponse pour une facture
 */
export class InvoiceResponseDto {
  id!: string;
  invoiceNumber!: string;
  customerId!: string;
  issueDate!: Date;
  dueDate!: Date;
  items!: InvoiceItemDto[];
  subtotal!: number;
  taxAmount!: number;
  discountAmount!: number;
  totalAmount!: number;
  currency!: string;
  status!: string;
  paymentStatus!: string;
  notes!: string;
  tags!: string[];
  paymentTerms?: string;
  purchaseOrder?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

/**
 * DTO pour les requêtes de recherche et filtrage
 */
export class InvoiceQueryDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsDateString()
  issueDateFrom?: Date;

  @IsOptional()
  @IsDateString()
  issueDateTo?: Date;

  @IsOptional()
  @IsDateString()
  dueDateFrom?: Date;

  @IsOptional()
  @IsDateString()
  dueDateTo?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amountMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amountMax?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

/**
 * DTO pour changer le statut d'une facture
 */
export class ChangeInvoiceStatusDto {
  @IsEnum(InvoiceStatus)
  status!: InvoiceStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * DTO pour marquer une facture comme payée
 */
export class MarkAsPaidDto {
  @IsOptional()
  @IsDateString()
  paymentDate?: Date;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO pour les statistiques de factures
 */
export class InvoiceStatsResponseDto {
  totalInvoices!: number;
  totalAmount!: number;
  paidAmount!: number;
  pendingAmount!: number;
  overdueAmount!: number;
  byStatus!: Record<string, number>;
  byPaymentStatus!: Record<string, number>;
  averageAmount!: number;
}