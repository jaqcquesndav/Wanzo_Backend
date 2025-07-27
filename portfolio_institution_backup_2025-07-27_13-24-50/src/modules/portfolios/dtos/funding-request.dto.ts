import { IsString, IsEnum, IsNumber, IsOptional, IsUUID, IsArray, ValidateNested, IsDate, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DurationUnit, FundingRequestStatus } from '../entities/funding-request.entity';

class FinancialDataDto {
  @ApiProperty({ description: 'Annual revenue' })
  @IsNumber()
  annual_revenue!: number;

  @ApiProperty({ description: 'Net profit' })
  @IsNumber()
  net_profit!: number;

  @ApiProperty({ description: 'Existing debts' })
  @IsNumber()
  existing_debts!: number;

  @ApiProperty({ description: 'Cash flow' })
  @IsNumber()
  cash_flow!: number;

  @ApiProperty({ description: 'Assets' })
  @IsNumber()
  assets!: number;

  @ApiProperty({ description: 'Liabilities' })
  @IsNumber()
  liabilities!: number;
}

class GuaranteeDto {
  @ApiProperty({ description: 'Guarantee type', example: 'real_estate' })
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Guarantee description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Guarantee value' })
  @IsNumber()
  value!: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'XOF' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class CreateFundingRequestDto {
  @ApiProperty({ description: 'Portfolio ID' })
  @IsUUID()
  portfolio_id!: string;

  @ApiProperty({ description: 'Client ID' })
  @IsUUID()
  client_id!: string;

  @ApiProperty({ description: 'Company name' })
  @IsString()
  company_name!: string;

  @ApiProperty({ description: 'Product type' })
  @IsString()
  product_type!: string;

  @ApiProperty({ description: 'Requested amount' })
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'XOF' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Purpose of funding' })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiProperty({ description: 'Loan duration' })
  @IsNumber()
  duration!: number;

  @ApiPropertyOptional({ description: 'Duration unit', enum: DurationUnit, default: DurationUnit.MONTHS })
  @IsOptional()
  @IsEnum(DurationUnit)
  duration_unit?: DurationUnit;

  @ApiPropertyOptional({ description: 'Proposed start date' })
  @IsOptional()
  @IsDate()
  proposed_start_date?: Date;

  @ApiPropertyOptional({ description: 'Financial data' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialDataDto)
  financial_data?: FinancialDataDto;

  @ApiPropertyOptional({ description: 'Proposed guarantees' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuaranteeDto)
  proposed_guarantees?: GuaranteeDto[];
}

export class UpdateFundingRequestDto {
  @ApiPropertyOptional({ description: 'Product type' })
  @IsOptional()
  @IsString()
  product_type?: string;

  @ApiPropertyOptional({ description: 'Requested amount' })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Purpose of funding' })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({ description: 'Loan duration' })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ description: 'Duration unit', enum: DurationUnit })
  @IsOptional()
  @IsEnum(DurationUnit)
  duration_unit?: DurationUnit;

  @ApiPropertyOptional({ description: 'Proposed start date' })
  @IsOptional()
  @IsDate()
  proposed_start_date?: Date;

  @ApiPropertyOptional({ description: 'Status', enum: FundingRequestStatus })
  @IsOptional()
  @IsEnum(FundingRequestStatus)
  status?: FundingRequestStatus;

  @ApiPropertyOptional({ description: 'Assigned to user ID' })
  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @ApiPropertyOptional({ description: 'Financial data' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialDataDto)
  financial_data?: FinancialDataDto;

  @ApiPropertyOptional({ description: 'Proposed guarantees' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuaranteeDto)
  proposed_guarantees?: GuaranteeDto[];
}

export class FundingRequestFilterDto {
  @ApiPropertyOptional({ description: 'Filter by portfolio ID' })
  @IsOptional()
  @IsUUID()
  portfolioId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: FundingRequestStatus })
  @IsOptional()
  @IsEnum(FundingRequestStatus)
  status?: FundingRequestStatus;

  @ApiPropertyOptional({ description: 'Filter by client ID' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Filter by product type' })
  @IsOptional()
  @IsString()
  productType?: string;

  @ApiPropertyOptional({ description: 'Filter by creation date (start)' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by creation date (end)' })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Search text (request number, client name)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['created_at', 'amount', 'client_name'] })
  @IsOptional()
  @IsEnum(['created_at', 'amount', 'client_name'])
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string;
}
