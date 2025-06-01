import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
  IsUrl,
  IsArray,
  Min,
  Max,
  IsDateString,
  ValidateNested,
  IsIn
} from 'class-validator';
import { Type } from 'class-transformer';
import { TokenTransactionType, TokenTransactionStatus } from '../entities';

// Token Balance DTOs
export class TokenBalanceDto {
  available: number;
  allocated: number;
  used: number;
  lastUpdated: Date;
}

// Token Package DTOs
export class TokenPackageDto {
  id: string;
  name: string;
  description: string;
  tokens: number;
  price: number;
  currency: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  bonusPercentage?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class TokenPackagesResponseDto {
  packages: TokenPackageDto[];
}

export class CreateTokenPackageDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(1)
  tokens: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bonusPercentage?: number;
}

export class UpdateTokenPackageDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  tokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bonusPercentage?: number;
}

export class TokenPackageQueryDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// Token Transaction DTOs
export class TokenTransactionDto {
  id: string;
  userId: string;
  customerAccountId?: string;
  type: TokenTransactionType;
  tokenAmount: number;
  amount: number;
  currency: string;
  packageId?: string;
  paymentMethod?: string;
  status: TokenTransactionStatus;
  transactionReference?: string;
  proofDocumentUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TransactionResponseDto {
  transaction: TokenTransactionDto;
  newBalance?: TokenBalanceDto;
}

export class CreateTokenTransactionDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  customerAccountId?: string;

  @IsEnum(TokenTransactionType)
  type: TokenTransactionType;

  @IsNumber()
  @Min(1)
  tokenAmount: number;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @IsOptional()
  @IsUUID()
  packageId?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsEnum(TokenTransactionStatus)
  status?: TokenTransactionStatus = TokenTransactionStatus.COMPLETED;

  @IsOptional()
  @IsString()
  transactionReference?: string;

  @IsOptional()
  @IsUrl()
  proofDocumentUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTokenTransactionDto {
  @IsOptional()
  @IsEnum(TokenTransactionStatus)
  status?: TokenTransactionStatus;

  @IsOptional()
  @IsString()
  transactionReference?: string;

  @IsOptional()
  @IsUrl()
  proofDocumentUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class TokenTransactionQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  customerAccountId?: string;

  @IsOptional()
  @IsEnum(TokenTransactionType)
  type?: TokenTransactionType;

  @IsOptional()
  @IsEnum(TokenTransactionStatus)
  status?: TokenTransactionStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class TokenTransactionsResponseDto {
  transactions: TokenTransactionDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Token Purchase DTOs
export class PurchaseTokensDto {
  @IsUUID()
  packageId: string;

  @IsString()
  @IsIn(['credit_card', 'bank_transfer', 'paypal', 'crypto', 'mobile_money'])
  paymentMethod: string;

  @IsOptional()
  @IsString()
  transactionReference?: string;

  @IsOptional()
  @IsUrl()
  proofDocumentUrl?: string;

  @IsOptional()
  @IsString()
  proofDocumentPublicId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  customerAccountId?: string;
}

// Token Consumption DTOs
export class TokenConsumptionLogDto {
  id: string;
  userId: string;
  customerAccountId?: string;
  tokensConsumed: number;
  featureUsed: string;
  resourceId?: string;
  resourceType?: string;
  sessionId?: string;
  timestamp: Date;
}

export class CreateTokenConsumptionLogDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  customerAccountId?: string;

  @IsNumber()
  @Min(1)
  tokensConsumed: number;

  @IsString()
  featureUsed: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsString()
  resourceType?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class TokenConsumptionQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  customerAccountId?: string;

  @IsOptional()
  @IsString()
  featureUsed?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class TokenConsumptionLogsResponseDto {
  logs: TokenConsumptionLogDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Token Analytics DTOs
export class TokenUsageByFeatureDto {
  featureUsed: string;
  tokensConsumed: number;
  percentage: number;
}

export class TokenUsageByDayDto {
  date: string;
  tokensConsumed: number;
}

export class TokenAnalyticsDto {
  totalTokensPurchased: number;
  totalTokensConsumed: number;
  consumptionRate: number;
  usageByFeature: TokenUsageByFeatureDto[];
  usageByDay: TokenUsageByDayDto[];
}

export class TokenAnalyticsQueryDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  customerAccountId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
