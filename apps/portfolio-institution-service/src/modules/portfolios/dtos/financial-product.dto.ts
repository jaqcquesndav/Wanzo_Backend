import { IsString, IsEnum, IsNumber, IsArray, IsBoolean, IsOptional, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '../entities/financial-product.entity';

class CharacteristicsDto {
  @ApiProperty({ description: 'Minimum amount' })
  @IsNumber()
  minAmount!: number;

  @ApiProperty({ description: 'Maximum amount' })
  @IsNumber()
  maxAmount!: number;

  @ApiProperty({ description: 'Minimum duration in months' })
  @IsNumber()
  minDuration!: number;

  @ApiProperty({ description: 'Maximum duration in months' })
  @IsNumber()
  maxDuration!: number;

  @ApiProperty({ description: 'Interest rate type (fixed, variable)' })
  @IsString()
  interestRateType!: string;

  @ApiProperty({ description: 'Minimum interest rate' })
  @IsNumber()
  minInterestRate!: number;

  @ApiProperty({ description: 'Maximum interest rate' })
  @IsNumber()
  maxInterestRate!: number;

  @ApiProperty({ description: 'Required guarantees', type: [String] })
  @IsArray()
  @IsString({ each: true })
  requiredGuarantees!: string[];

  @ApiProperty({ description: 'Eligibility criteria', type: [String] })
  @IsArray()
  @IsString({ each: true })
  eligibilityCriteria!: string[];
}

export class CreateFinancialProductDto {
  @ApiProperty({ description: 'Portfolio ID' })
  @IsUUID()
  portfolioId!: string;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Product type', enum: ProductType })
  @IsEnum(ProductType)
  type!: ProductType;

  @ApiProperty({ description: 'Product characteristics' })
  @ValidateNested()
  @Type(() => CharacteristicsDto)
  characteristics!: CharacteristicsDto;
}

export class UpdateFinancialProductDto {
  @ApiPropertyOptional({ description: 'Product name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Product characteristics' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CharacteristicsDto)
  characteristics?: CharacteristicsDto;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Product type', enum: ProductType })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @ApiPropertyOptional({ description: 'Description of the product' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ProductFilterDto {
  @ApiPropertyOptional({ description: 'Filter by portfolio ID' })
  @IsOptional()
  @IsUUID()
  portfolioId?: string;

  @ApiPropertyOptional({ description: 'Filter by type', enum: ProductType })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;
}