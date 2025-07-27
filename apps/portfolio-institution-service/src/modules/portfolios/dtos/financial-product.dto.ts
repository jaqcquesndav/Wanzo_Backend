import { IsString, IsEnum, IsNumber, IsArray, IsBoolean, IsOptional, ValidateNested, IsUUID, Min, Max, IsDecimal, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus, ProductType } from '../entities/financial-product.entity';

export class FeeDto {
  @ApiProperty({ description: 'Fee type' })
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Fee amount' })
  @IsNumber()
  amount!: number;

  @ApiProperty({ description: 'Whether the fee is a percentage' })
  @IsBoolean()
  is_percentage!: boolean;
}

export class EligibilityCriterionDto {
  @ApiProperty({ description: 'Criterion name' })
  @IsString()
  criterion!: string;

  @ApiProperty({ description: 'Criterion description' })
  @IsString()
  description!: string;
}

export class CreateFinancialProductDto {
  @ApiProperty({ description: 'Portfolio ID' })
  @IsUUID()
  portfolio_id!: string;

  @ApiProperty({ description: 'Product type', enum: ProductType, default: ProductType.CREDIT })
  @IsEnum(ProductType)
  type!: ProductType;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Base interest rate' })
  @IsNumber()
  @Min(0)
  @Max(100)
  base_interest_rate!: number;

  @ApiProperty({ description: 'Interest type (fixed, variable)' })
  @IsString()
  @IsOptional()
  interest_type?: string;

  @ApiProperty({ description: 'Interest calculation method' })
  @IsString()
  @IsOptional()
  interest_calculation_method?: string;

  @ApiProperty({ description: 'Minimum amount' })
  @IsNumber()
  @Min(0)
  min_amount!: number;

  @ApiProperty({ description: 'Maximum amount' })
  @IsNumber()
  @Min(0)
  max_amount!: number;

  @ApiProperty({ description: 'Minimum term in months' })
  @IsNumber()
  @Min(1)
  min_term!: number;

  @ApiProperty({ description: 'Maximum term in months' })
  @IsNumber()
  @Min(1)
  max_term!: number;

  @ApiProperty({ description: 'Term unit (days, months, years)' })
  @IsString()
  @IsOptional()
  term_unit?: string;

  @ApiProperty({ description: 'Required documents', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  required_documents?: string[];

  @ApiProperty({ description: 'Fees', type: [FeeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeDto)
  @IsOptional()
  fees?: FeeDto[];

  @ApiProperty({ description: 'Eligibility criteria', type: [EligibilityCriterionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EligibilityCriterionDto)
  @IsOptional()
  eligibility_criteria?: EligibilityCriterionDto[];
}

export class UpdateFinancialProductDto {
  @ApiPropertyOptional({ description: 'Product name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Status', enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ description: 'Base interest rate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  base_interest_rate?: number;

  @ApiPropertyOptional({ description: 'Interest type (fixed, variable)' })
  @IsOptional()
  @IsString()
  interest_type?: string;

  @ApiPropertyOptional({ description: 'Interest calculation method' })
  @IsOptional()
  @IsString()
  interest_calculation_method?: string;

  @ApiPropertyOptional({ description: 'Minimum amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_amount?: number;

  @ApiPropertyOptional({ description: 'Maximum amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_amount?: number;

  @ApiPropertyOptional({ description: 'Minimum term in months' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  min_term?: number;

  @ApiPropertyOptional({ description: 'Maximum term in months' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  max_term?: number;

  @ApiPropertyOptional({ description: 'Term unit (days, months, years)' })
  @IsOptional()
  @IsString()
  term_unit?: string;

  @ApiPropertyOptional({ description: 'Required documents', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  required_documents?: string[];

  @ApiPropertyOptional({ description: 'Fees', type: [FeeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeDto)
  fees?: FeeDto[];

  @ApiPropertyOptional({ description: 'Eligibility criteria', type: [EligibilityCriterionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EligibilityCriterionDto)
  eligibility_criteria?: EligibilityCriterionDto[];
}

export class ProductFilterDto {
  @ApiPropertyOptional({ description: 'Filter by portfolio ID' })
  @IsOptional()
  @IsUUID()
  portfolio_id?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ description: 'Filter by type', enum: ProductType })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Minimum interest rate' })
  @IsOptional()
  @IsNumber()
  min_interest_rate?: number;

  @ApiPropertyOptional({ description: 'Maximum interest rate' })
  @IsOptional()
  @IsNumber()
  max_interest_rate?: number;
}