import { 
  IsString, 
  IsOptional, 
  IsNumber, 
  IsEnum, 
  IsArray, 
  IsBoolean, 
  IsISO8601,
  IsUUID,
  Min,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { 
  PlanStatus, 
  BillingCycle, 
  CustomerType, 
  SubscriptionStatus,
  InvoiceStatus,
  TransactionType,
  TransactionStatus
} from '../entities';

// SubscriptionPlan DTOs
export class SubscriptionPlanDto {
  id: string;
  name: string;
  description?: string;
  basePriceUSD: number;
  billingCycles: BillingCycle[];
  features: string[];
  tokenAllocation: number;
  maxUsers?: number;
  targetCustomerTypes: CustomerType[];
  status: PlanStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateSubscriptionPlanDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  basePriceUSD: number;

  @IsArray()
  @IsEnum(BillingCycle, { each: true })
  billingCycles: BillingCycle[];

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  tokenAllocation?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxUsers?: number;

  @IsArray()
  @IsEnum(CustomerType, { each: true })
  targetCustomerTypes: CustomerType[];

  @IsEnum(PlanStatus)
  @IsOptional()
  status?: PlanStatus;
}

export class UpdateSubscriptionPlanDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  basePriceUSD?: number;

  @IsArray()
  @IsEnum(BillingCycle, { each: true })
  @IsOptional()
  billingCycles?: BillingCycle[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  tokenAllocation?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxUsers?: number;

  @IsArray()
  @IsEnum(CustomerType, { each: true })
  @IsOptional()
  targetCustomerTypes?: CustomerType[];

  @IsEnum(PlanStatus)
  @IsOptional()
  status?: PlanStatus;
}

export class SubscriptionPlanQueryParamsDto {
  @IsEnum(CustomerType)
  @IsOptional()
  customerType?: CustomerType;

  @IsEnum(PlanStatus)
  @IsOptional()
  status?: PlanStatus;
}

// CustomerSubscription DTOs
export class CustomerSubscriptionDto {
  id: string;
  customerId: string;
  planId: string;
  plan: SubscriptionPlanDto;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  priceUSD: number;
  startDate: Date;
  endDate?: Date;
  trialEndDate?: Date;
  autoRenew: boolean;
  canceledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateCustomerSubscriptionDto {
  @IsString()
  customerId: string;

  @IsString()
  planId: string;

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @IsISO8601()
  startDate: string;

  @IsISO8601()
  @IsOptional()
  endDate?: string;

  @IsISO8601()
  @IsOptional()
  trialEndDate?: string;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}

export class UpdateCustomerSubscriptionDto {
  @IsString()
  @IsOptional()
  planId?: string;

  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priceUSD?: number;

  @IsISO8601()
  @IsOptional()
  endDate?: string;

  @IsISO8601()
  @IsOptional()
  trialEndDate?: string;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}

export class CancelSubscriptionDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

export class SubscriptionQueryParamsDto {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @IsString()
  @IsOptional()
  planId?: string;

  @IsISO8601()
  @IsOptional()
  startDate?: string;

  @IsISO8601()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  limit?: number = 10;
}

// Invoice DTOs
export class InvoiceItemDto {
  id: string;
  invoiceId: string;
  description: string;
  amount: number;
  quantity: number;
  periodStart?: Date;
  periodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateInvoiceItemDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsISO8601()
  @IsOptional()
  periodStart?: string;

  @IsISO8601()
  @IsOptional()
  periodEnd?: string;
}

export class InvoiceDto {
  id: string;
  subscriptionId: string;
  customerId: string;
  invoiceNumber: string;
  amountDue: number;
  amountPaid: number;
  dueDate: Date;
  status: InvoiceStatus;
  pdfUrl?: string;
  paymentId?: string;
  paymentMethod?: string;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  items: InvoiceItemDto[];
}

export class CreateInvoiceDto {
  @IsString()
  subscriptionId: string;

  @IsString()
  customerId: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsNumber()
  @Min(0)
  amountDue: number;

  @IsISO8601()
  dueDate: string;

  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}

export class UpdateInvoiceDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  amountDue?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amountPaid?: number;

  @IsISO8601()
  @IsOptional()
  dueDate?: string;

  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @IsString()
  @IsOptional()
  pdfUrl?: string;

  @IsString()
  @IsOptional()
  paymentId?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsISO8601()
  @IsOptional()
  paymentDate?: string;
}

export class InvoiceQueryParamsDto {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @IsISO8601()
  @IsOptional()
  startDate?: string;

  @IsISO8601()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  limit?: number = 10;
}

// Transaction DTOs
export class TransactionDto {
  id: string;
  customerId: string;
  invoiceId?: string;
  type: TransactionType;
  amount: number;
  currency?: string;
  status: TransactionStatus;
  paymentMethod?: string;
  paymentIntentId?: string;
  paymentMethodDetails?: string;
  failureCode?: string;
  failureMessage?: string;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateTransactionDto {
  @IsString()
  customerId: string;

  @IsString()
  @IsOptional()
  invoiceId?: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  paymentIntentId?: string;

  @IsString()
  @IsOptional()
  paymentMethodDetails?: string;

  @IsString()
  @IsOptional()
  failureCode?: string;

  @IsString()
  @IsOptional()
  failureMessage?: string;

  @IsString()
  @IsOptional()
  refundReason?: string;
}

export class UpdateTransactionDto {
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @IsString()
  @IsOptional()
  paymentIntentId?: string;

  @IsString()
  @IsOptional()
  paymentMethodDetails?: string;

  @IsString()
  @IsOptional()
  failureCode?: string;

  @IsString()
  @IsOptional()
  failureMessage?: string;

  @IsString()
  @IsOptional()
  refundReason?: string;
}

export class TransactionQueryParamsDto {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @IsISO8601()
  @IsOptional()
  startDate?: string;

  @IsISO8601()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  limit?: number = 10;
}

// Response DTOs
export class SubscriptionPlansResponseDto {
  data: SubscriptionPlanDto[];
}

export class SubscriptionPlanResponseDto {
  data: SubscriptionPlanDto;
}

export class CustomerSubscriptionsResponseDto {
  data: CustomerSubscriptionDto[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export class CustomerSubscriptionResponseDto {
  data: CustomerSubscriptionDto;
}

export class InvoicesResponseDto {
  data: InvoiceDto[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export class InvoiceResponseDto {
  data: InvoiceDto;
}

export class TransactionsResponseDto {
  data: TransactionDto[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export class TransactionResponseDto {
  data: TransactionDto;
}

// Statistics and reporting DTOs
export class RevenueStatisticsDto {
  totalRevenue: number;
  revenueByMonth: { month: string; amount: number }[]; // Changed type
  transactionCount: number;
  averageTransactionValue: number;
}

export class SubscriptionStatisticsDto {
  activeSubscriptions: number;
  subscriptionsByPlan: { [key: string]: number };
  mrr: number; // Added
  averageSubscriptionValue: number; // Added
}

export class FinanceDashboardDto {
  revenueStatistics: RevenueStatisticsDto;
  subscriptionStatistics: SubscriptionStatisticsDto;
  recentTransactions: TransactionDto[];
  pendingInvoices: InvoiceDto[];
}
