
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsArray, IsBoolean, IsISO8601, IsUUID, Min, ValidateNested, IsNotEmpty, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { BillingCycle, SubscriptionStatus, InvoiceStatus, PaymentMethod, PaymentStatus, TransactionType, TransactionStatus as ApiTransactionStatus, TokenType, TokenTransactionType } from '../entities/finance.entity';
import { PaginatedResponse, APIResponse } from '../../../common/interfaces';

// Note: Removed custom PaginationDto in favor of standardized PaginatedResponse interface

// 1. Subscription Plan
export class SubscriptionPlanMetadataDto {
  @ApiProperty()
  @IsNumber()
  maxUsers: number;

  @ApiProperty()
  @IsString()
  storageLimit: string;
}

export class SubscriptionPlanDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: BillingCycle })
  billingCycle: BillingCycle;

  @ApiProperty({ type: [String] })
  features: string[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  trialPeriodDays: number;

  @ApiProperty({ type: SubscriptionPlanMetadataDto })
  metadata: SubscriptionPlanMetadataDto;
}

// 2. Subscription
export class ListSubscriptionsQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: SubscriptionStatus })
    @IsOptional()
    @IsEnum(SubscriptionStatus)
    status?: SubscriptionStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    planId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    customerId?: string;

    @ApiPropertyOptional({ enum: BillingCycle })
    @IsOptional()
    @IsEnum(BillingCycle)
    billingCycle?: BillingCycle;

    @ApiPropertyOptional({ description: 'ISO date format' })
    @IsOptional()
    @IsISO8601()
    startDateBefore?: string;

    @ApiPropertyOptional({ description: 'ISO date format' })
    @IsOptional()
    @IsISO8601()
    startDateAfter?: string;

    @ApiPropertyOptional({ description: 'ISO date format' })
    @IsOptional()
    @IsISO8601()
    endDateBefore?: string;

    @ApiPropertyOptional({ description: 'ISO date format' })
    @IsOptional()
    @IsISO8601()
    endDateAfter?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 10;
}

export class SubscriptionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  planId: string;

  @ApiProperty()
  planName: string;

  @ApiProperty({ enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiProperty()
  startDate: string;

  @ApiProperty()
  endDate: string;

  @ApiProperty()
  currentPeriodStart: string;

  @ApiProperty()
  currentPeriodEnd: string;

  @ApiProperty()
  nextBillingDate: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: BillingCycle })
  billingCycle: BillingCycle;

  @ApiProperty()
  autoRenew: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional()
  paymentMethodId?: string;

  @ApiPropertyOptional({ type: 'string', format: 'date-time', nullable: true })
  trialEndsAt?: string | null;

  @ApiPropertyOptional({ type: 'string', format: 'date-time', nullable: true })
  canceledAt?: string | null;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  cancellationReason?: string | null;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;
}

export class PaginatedSubscriptionsDto implements PaginatedResponse<SubscriptionDto> {
  @ApiProperty({ type: [SubscriptionDto] })
  @ValidateNested({ each: true })
  @Type(() => SubscriptionDto)
  items: SubscriptionDto[];

  @ApiProperty()
  @IsNumber()
  totalCount: number;

  @ApiProperty()
  @IsNumber()
  page: number;

  @ApiProperty()
  @IsNumber()
  totalPages: number;
}

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty()
  @IsString()
  planId: string;

  @ApiPropertyOptional({ description: 'ISO date format' })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  trialPeriodDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CancelSubscriptionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class CancelSubscriptionResponseDto extends SubscriptionDto {
    @ApiProperty({ enum: SubscriptionStatus, default: SubscriptionStatus.CANCELED })
    status: SubscriptionStatus.CANCELED;

    @ApiProperty({ type: 'string', format: 'date-time' })
    canceledAt: string;

    @ApiProperty()
    cancellationReason: string;

    @ApiProperty({ type: 'string', format: 'date-time' })
    endDate: string;
}

// 3. Invoice
export class ListInvoicesQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: InvoiceStatus })
    @IsOptional()
    @IsEnum(InvoiceStatus)
    status?: InvoiceStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    customerId?: string;

    @ApiPropertyOptional({ description: 'ISO date format' })
    @IsOptional()
    @IsISO8601()
    startDate?: string;

    @ApiPropertyOptional({ description: 'ISO date format' })
    @IsOptional()
    @IsISO8601()
    endDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 10;
}

export class InvoiceItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  subtotal: number;

  @ApiPropertyOptional()
  taxRate?: number;

  @ApiPropertyOptional()
  taxAmount?: number;
}

export class InvoiceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceNumber: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: InvoiceStatus })
  status: InvoiceStatus;

  @ApiProperty()
  issueDate: string;

  @ApiProperty()
  dueDate: string;

  @ApiPropertyOptional({ nullable: true })
  paidDate?: string | null;

  @ApiProperty({ type: [InvoiceItemDto] })
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  taxAmount: number;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty()
  totalAmount: number;

  @ApiPropertyOptional({ nullable: true })
  notes?: string | null;
}

export class PaginatedInvoicesDto implements PaginatedResponse<InvoiceDto> {
  @ApiProperty({ type: [InvoiceDto] })
  @ValidateNested({ each: true })
  @Type(() => InvoiceDto)
  items: InvoiceDto[];

  @ApiProperty()
  @IsNumber()
  totalCount: number;

  @ApiProperty()
  @IsNumber()
  page: number;

  @ApiProperty()
  @IsNumber()
  totalPages: number;
}

export class CreateInvoiceItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  subtotal: number;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty({ type: [CreateInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];

  @ApiProperty({ description: 'ISO date format' })
  @IsISO8601()
  dueDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currency: string;
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ description: 'ISO date format' })
  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SendInvoiceReminderResponseDto {
  @ApiProperty()
  message: string;
}

// 4. Payment
export class ListPaymentsQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: PaymentStatus })
    @IsOptional()
    @IsEnum(PaymentStatus)
    status?: PaymentStatus;

    @ApiPropertyOptional({ enum: PaymentMethod })
    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;

    @ApiPropertyOptional({ description: 'ISO date format' })
    @IsOptional()
    @IsISO8601()
    startDate?: string;

    @ApiPropertyOptional({ description: 'ISO date format' })
    @IsOptional()
    @IsISO8601()
    endDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    customerId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 10;
}

export class PaymentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceId: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty()
  proofType: string;

  @ApiProperty()
  proofUrl: string;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty()
  transactionReference: string;

  @ApiProperty()
  paidAt: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  verifiedBy: string;

  @ApiProperty()
  verifiedAt: string;

  @ApiProperty()
  metadata: { approvalNotes: string };
}

export class PaginatedPaymentsDto implements PaginatedResponse<PaymentDto> {
  @ApiProperty({ type: [PaymentDto] })
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  items: PaymentDto[];

  @ApiProperty()
  @IsNumber()
  totalCount: number;

  @ApiProperty()
  @IsNumber()
  page: number;

  @ApiProperty()
  @IsNumber()
  totalPages: number;
}

export class RecordManualPaymentDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty()
  @IsString()
  transactionReference: string;

  @ApiProperty({ description: 'ISO date format' })
  @IsISO8601()
  paidAt: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  proofType: string;

  @ApiProperty()
  @IsString()
  proofUrl: string;
}

export class VerifyPaymentDto {
  @ApiProperty()
  @IsUUID()
  paymentId: string;

  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  status: PaymentStatus.VERIFIED | PaymentStatus.REJECTED;

  @ApiProperty()
  @IsString()
  adminNotes: string;
}

export class VerifyPaymentResponseDto extends PaymentDto {
    @ApiProperty({ enum: PaymentStatus })
    status: PaymentStatus;

    @ApiProperty()
    verifiedBy: string;

    @ApiProperty({ type: 'string', format: 'date-time' })
    verifiedAt: string;

    @ApiProperty()
    metadata: { approvalNotes: string };
}

// 5. Transaction
export class ListTransactionsQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: TransactionType })
    @IsOptional()
    @IsEnum(TransactionType)
    type?: TransactionType;

    @ApiPropertyOptional({ enum: ApiTransactionStatus })
    @IsOptional()
    @IsEnum(ApiTransactionStatus)
    status?: ApiTransactionStatus;

    @ApiPropertyOptional({ enum: PaymentMethod })
    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;

    @ApiPropertyOptional({ description: 'ISO date format' })
    @IsOptional()
    @IsISO8601()
    startDate?: string;

    @ApiPropertyOptional({ description: 'ISO date format' })
    @IsOptional()
    @IsISO8601()
    endDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    customerId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 10;
}

export class TransactionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reference: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: TransactionType })
  type: TransactionType;

  @ApiProperty({ enum: ApiTransactionStatus })
  status: ApiTransactionStatus;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  customerName: string;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional()
  metadata?: { invoiceId: string; paymentId: string };
}

export class PaginatedTransactionsDto implements PaginatedResponse<TransactionDto> {
  @ApiProperty({ type: [TransactionDto] })
  @ValidateNested({ each: true })
  @Type(() => TransactionDto)
  items: TransactionDto[];

  @ApiProperty()
  @IsNumber()
  totalCount: number;

  @ApiProperty()
  @IsNumber()
  page: number;

  @ApiProperty()
  @IsNumber()
  totalPages: number;
}

export class CreateTransactionDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: { approvedBy: string; reason: string };
}

// 6. Token
export class TokenPackageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  tokensIncluded: number;

  @ApiProperty({ enum: TokenType })
  tokenType: TokenType;

  @ApiProperty()
  isActive: boolean;
}

export class ListTokenTransactionsQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    customerId?: string;

    @ApiPropertyOptional({ enum: TokenTransactionType })
    @IsOptional()
    @IsEnum(TokenTransactionType)
    type?: TokenTransactionType;

    @ApiPropertyOptional({ enum: TokenType })
    @IsOptional()
    @IsEnum(TokenType)
    tokenType?: TokenType;

    @ApiPropertyOptional({ description: 'ISO date format' })
    @IsOptional()
    @IsISO8601()
    startDate?: string;

    @ApiPropertyOptional({ description: 'ISO date format' })
    @IsOptional()
    @IsISO8601()
    endDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 10;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    sortDirection?: 'ASC' | 'DESC';
}

export class TokenTransactionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  customerName: string;

  @ApiProperty({ enum: TokenTransactionType })
  type: TokenTransactionType;

  @ApiProperty({ enum: TokenType })
  tokenType: TokenType;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  balanceAfterTransaction: number;

  @ApiProperty()
  transactionDate: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  relatedPurchaseId?: string;

  @ApiPropertyOptional()
  relatedInvoiceId?: string;
}

export class PaginatedTokenTransactionsDto implements PaginatedResponse<TokenTransactionDto> {
  @ApiProperty({ type: [TokenTransactionDto] })
  @ValidateNested({ each: true })
  @Type(() => TokenTransactionDto)
  items: TokenTransactionDto[];

  @ApiProperty()
  @IsNumber()
  totalCount: number;

  @ApiProperty()
  @IsNumber()
  page: number;

  @ApiProperty()
  @IsNumber()
  totalPages: number;
}

export class GetTokenBalanceQueryDto {
  @ApiPropertyOptional({ enum: TokenType })
  @IsOptional()
  @IsEnum(TokenType)
  tokenType?: TokenType;
}

export class TokenBalanceDto {
  @ApiProperty()
  customerId: string;

  @ApiProperty({ enum: TokenType })
  tokenType: TokenType;

  @ApiProperty()
  balance: number;

  @ApiProperty()
  lastUpdatedAt: string;
}

// 7. Financial Summary
export class GetFinancialSummaryQueryDto {
  @ApiPropertyOptional({ enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'])
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;
}

export class TopCustomerDto {
  @ApiProperty()
  customerId: string;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  totalSpent: number;
}

export class FinancialSummaryDto {
  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  pendingInvoices: number;

  @ApiProperty()
  pendingAmount: number;

  @ApiProperty()
  overdueAmount: number;

  @ApiProperty()
  paidInvoices: number;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  revenueByMonth: Record<string, number>;

  @ApiProperty({ type: [TopCustomerDto] })
  topCustomers: TopCustomerDto[];
}
