import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsIn, IsArray, ValidateNested, IsISO8601, IsObject, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerType, TokenTransactionType, AppType } from '../entities/token.entity';
import { PaginatedResponse, APIResponse } from '../../../common/interfaces';

// Sub-DTOs
class DiscountTierDto {
    @ApiProperty()
    @IsNumber()
    minAmount: number;

    @ApiProperty()
    @IsNumber()
    percentage: number;
}

class DiscountPercentagesDto {
    @ApiProperty()
    @ValidateNested()
    @Type(() => DiscountTierDto)
    tier1: DiscountTierDto;

    @ApiProperty()
    @ValidateNested()
    @Type(() => DiscountTierDto)
    tier2: DiscountTierDto;

    @ApiProperty()
    @ValidateNested()
    @Type(() => DiscountTierDto)
    tier3: DiscountTierDto;
}

class CustomerTypeSpecificMetadataDto {
    @ApiProperty({ enum: CustomerType })
    @IsEnum(CustomerType)
    type: CustomerType;

    @ApiProperty()
    @IsNumber()
    minimumPurchase: number;
}

// Main DTOs
export class TokenPackageDto {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty()
    @IsNumber()
    tokenAmount: number;

    @ApiProperty()
    @IsNumber()
    priceUSD: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    priceLocal?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    localCurrency?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isPopular?: boolean;

    @ApiProperty()
    @IsNumber()
    validityDays: number;

    @ApiProperty({ enum: CustomerType, isArray: true })
    @IsEnum(CustomerType, { each: true })
    targetCustomerTypes: CustomerType[];

    @ApiProperty({ type: [CustomerTypeSpecificMetadataDto], required: false })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CustomerTypeSpecificMetadataDto)
    customerTypeSpecific?: CustomerTypeSpecificMetadataDto[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    minimumPurchase?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @ValidateNested()
    @Type(() => DiscountPercentagesDto)
    discountPercentages?: DiscountPercentagesDto;
}

export class TokenBalanceDto {
    @ApiProperty()
    @IsNumber()
    available: number;

    @ApiProperty()
    @IsNumber()
    allocated: number;

    @ApiProperty()
    @IsNumber()
    used: number;

    @ApiProperty()
    @IsISO8601()
    lastUpdated: string;
}

export class TokenTransactionDto {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    customerId: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    customerName?: string; // As per response example

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    subscriptionId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    packageId?: string;

    @ApiProperty({ enum: TokenTransactionType })
    @IsEnum(TokenTransactionType)
    type: TokenTransactionType;

    @ApiProperty()
    @IsNumber()
    amount: number;

    @ApiProperty()
    @IsNumber()
    balance: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty()
    @IsISO8601()
    timestamp: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsISO8601()
    expiryDate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}

export class TokenUsageDto {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    customerId: string;

    @ApiProperty()
    @IsString()
    userId: string;

    @ApiProperty({ enum: AppType })
    @IsEnum(AppType)
    appType: AppType;

    @ApiProperty()
    @IsNumber()
    tokensUsed: number;

    @ApiProperty()
    @IsISO8601()
    date: string;

    @ApiProperty()
    @IsString()
    feature: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    prompt?: string;

    @ApiProperty()
    @IsNumber()
    responseTokens: number;

    @ApiProperty()
    @IsNumber()
    requestTokens: number;

    @ApiProperty()
    @IsNumber()
    cost: number;
}

class TokenUsageByPeriodDto {
    @ApiProperty()
    @IsString()
    period: string;

    @ApiProperty()
    @IsNumber()
    tokensUsed: number;
}

class TokenUsageByCustomerTypeDto {
    @ApiProperty()
    @IsNumber()
    pme: number;

    @ApiProperty()
    @IsNumber()
    financial: number;
}

class TopTokenConsumerDto {
    @ApiProperty()
    @IsString()
    customerId: string;

    @ApiProperty()
    @IsString()
    customerName: string;

    @ApiProperty()
    @IsNumber()
    tokensConsumed: number;
}

class TokenUsageTrendDto {
    @ApiProperty()
    @IsString()
    date: string;

    @ApiProperty()
    @IsNumber()
    used: number;

    @ApiProperty()
    @IsNumber()
    cost: number;

    @ApiProperty()
    @IsNumber()
    revenue: number;
}

export class TokenStatisticsDto {
    @ApiProperty()
    @IsNumber()
    totalTokensAllocated: number;

    @ApiProperty()
    @IsNumber()
    totalTokensUsed: number;

    @ApiProperty()
    @IsNumber()
    totalTokensPurchased: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    totalTokenCost?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    tokenUsageGrowth?: number;

    @ApiProperty({ type: [TokenUsageByPeriodDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TokenUsageByPeriodDto)
    tokenUsageByPeriod: TokenUsageByPeriodDto[];

    @ApiProperty()
    @ValidateNested()
    @Type(() => TokenUsageByCustomerTypeDto)
    tokenUsageByCustomerType: TokenUsageByCustomerTypeDto;

    @ApiProperty()
    @IsNumber()
    averageTokensPerCustomer: number;

    @ApiProperty({ type: [TopTokenConsumerDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TopTokenConsumerDto)
    top10TokenConsumers: TopTokenConsumerDto[];

    @ApiProperty({ type: [TokenUsageTrendDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TokenUsageTrendDto)
    tokenUsageTrend: TokenUsageTrendDto[];
}

// Request DTOs
export class PurchaseTokensDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    packageId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    paymentMethod: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    transactionReference?: string;

    // proofDocument would be handled by a file upload interceptor
}

export class AllocateTokensDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    customerId: string;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    reason: string;
}

// Query DTOs
export class GetTokenUsageQueryDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsISO8601()
    startDate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsISO8601()
    endDate?: string;

    @ApiProperty({ required: false, enum: AppType })
    @IsOptional()
    @IsEnum(AppType)
    appType?: AppType;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    feature?: string;

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @IsNumber()
    page?: number;

    @ApiProperty({ required: false, default: 20 })
    @IsOptional()
    @IsNumber()
    limit?: number;
}

export class GetTokenHistoryQueryDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsISO8601()
    startDate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsISO8601()
    endDate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString() // Assuming status is a string like 'completed', 'pending' etc.
    status?: string;

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @IsNumber()
    page?: number;

    @ApiProperty({ required: false, default: 20 })
    @IsOptional()
    @IsNumber()
    limit?: number;
}

export class GetTokenStatsQueryDto {
    @ApiProperty({ required: false, enum: ['daily', 'weekly', 'monthly', 'yearly'], default: 'monthly' })
    @IsOptional()
    @IsIn(['daily', 'weekly', 'monthly', 'yearly'])
    period?: string;
}

// Response DTOs using standardized interfaces
export class TokenPackagesResponseDto implements PaginatedResponse<TokenPackageDto> {
    @ApiProperty({ type: [TokenPackageDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TokenPackageDto)
    items: TokenPackageDto[];

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

export class PurchaseTokensResponseDto {
    @ApiProperty()
    @ValidateNested()
    @Type(() => TokenTransactionDto)
    transaction: TokenTransactionDto;

    @ApiProperty()
    @ValidateNested()
    @Type(() => TokenBalanceDto)
    newBalance: TokenBalanceDto;
}

export class TokenUsageResponseDto implements PaginatedResponse<TokenUsageDto> {
    @ApiProperty({ type: [TokenUsageDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TokenUsageDto)
    items: TokenUsageDto[];

    @ApiProperty()
    @IsNumber()
    totalCount: number;

    @ApiProperty()
    @IsNumber()
    page: number;

    @ApiProperty()
    @IsNumber()
    totalPages: number;

    @ApiProperty()
    @IsNumber()
    totalTokensUsed: number;
}

export class TokenHistoryResponseDto implements PaginatedResponse<TokenTransactionDto> {
    @ApiProperty({ type: [TokenTransactionDto] })
    @IsArray()
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

export class AllocateTokensResponseDto {
    @ApiProperty()
    @ValidateNested()
    @Type(() => TokenTransactionDto)
    transaction: TokenTransactionDto;

    @ApiProperty()
    @ValidateNested()
    @Type(() => TokenBalanceDto)
    newBalance: TokenBalanceDto;
}
