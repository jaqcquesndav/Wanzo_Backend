import { IsString, IsNumber, IsEnum, IsOptional, IsObject, ValidateNested, IsEmail, IsUrl, IsUUID, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CompanySize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export enum CompanyStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  REJECTED = 'rejected',
  FUNDED = 'funded',
  CONTACTED = 'contacted'
}

class FinancialMetricsDto {
  @ApiProperty({ description: 'Revenue growth percentage' })
  @IsNumber()
  revenue_growth!: number;

  @ApiProperty({ description: 'Profit margin percentage' })
  @IsNumber()
  profit_margin!: number;

  @ApiProperty({ description: 'Cash flow amount' })
  @IsNumber()
  cash_flow!: number;

  @ApiProperty({ description: 'Debt ratio' })
  @IsNumber()
  debt_ratio!: number;

  @ApiProperty({ description: 'Working capital' })
  @IsNumber()
  working_capital!: number;

  @ApiProperty({ description: 'Credit score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  credit_score!: number;

  @ApiProperty({ description: 'Financial rating' })
  @IsString()
  financial_rating!: string;

  @ApiPropertyOptional({ description: 'EBITDA' })
  @IsOptional()
  @IsNumber()
  ebitda?: number;
}

class GenderRatioDto {
  @ApiProperty({ description: 'Male ratio percentage' })
  @IsNumber()
  male!: number;

  @ApiProperty({ description: 'Female ratio percentage' })
  @IsNumber()
  female!: number;
}

class ESGMetricsDto {
  @ApiProperty({ description: 'Carbon footprint' })
  @IsNumber()
  carbon_footprint!: number;

  @ApiProperty({ description: 'Environmental rating' })
  @IsString()
  environmental_rating!: string;

  @ApiProperty({ description: 'Social rating' })
  @IsString()
  social_rating!: string;

  @ApiProperty({ description: 'Governance rating' })
  @IsString()
  governance_rating!: string;

  @ApiPropertyOptional({ description: 'Gender ratio' })
  @IsOptional()
  @ValidateNested()
  @Type(() => GenderRatioDto)
  gender_ratio?: GenderRatioDto;
}

class ContactInfoDto {
  @ApiProperty({ description: 'Contact email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Contact phone' })
  @IsString()
  phone!: string;

  @ApiPropertyOptional({ description: 'Contact address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsOptional()
  @IsUrl()
  website?: string;
}

export class CreateCompanyDto {
  @ApiProperty({ description: 'Company name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Business sector' })
  @IsString()
  sector!: string;

  @ApiProperty({ description: 'Company size', enum: CompanySize })
  @IsEnum(CompanySize)
  size!: CompanySize;

  @ApiPropertyOptional({ description: 'Company description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Registration number' })
  @IsOptional()
  @IsString()
  registration_number?: string;

  @ApiPropertyOptional({ description: 'Years in business' })
  @IsOptional()
  @IsNumber()
  years_in_business?: number;

  @ApiPropertyOptional({ description: 'Number of employees' })
  @IsOptional()
  @IsNumber()
  number_of_employees?: number;

  @ApiProperty({ description: 'Contact information' })
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contact_info!: ContactInfoDto;

  @ApiPropertyOptional({ description: 'Financial metrics' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialMetricsDto)
  financial_metrics?: FinancialMetricsDto;

  @ApiPropertyOptional({ description: 'ESG metrics' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ESGMetricsDto)
  esg_metrics?: ESGMetricsDto;

  @ApiPropertyOptional({ description: 'Institution ID' })
  @IsOptional()
  @IsUUID()
  institution_id?: string;
}

export class UpdateCompanyDto {
  @ApiPropertyOptional({ description: 'Company name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Business sector' })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({ description: 'Company size', enum: CompanySize })
  @IsOptional()
  @IsEnum(CompanySize)
  size?: CompanySize;

  @ApiPropertyOptional({ description: 'Company status', enum: CompanyStatus })
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @ApiPropertyOptional({ description: 'Company description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Registration number' })
  @IsOptional()
  @IsString()
  registration_number?: string;

  @ApiPropertyOptional({ description: 'Years in business' })
  @IsOptional()
  @IsNumber()
  years_in_business?: number;

  @ApiPropertyOptional({ description: 'Number of employees' })
  @IsOptional()
  @IsNumber()
  number_of_employees?: number;

  @ApiPropertyOptional({ description: 'Contact information' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contact_info?: ContactInfoDto;

  @ApiPropertyOptional({ description: 'Financial metrics' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialMetricsDto)
  financial_metrics?: FinancialMetricsDto;

  @ApiPropertyOptional({ description: 'ESG metrics' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ESGMetricsDto)
  esg_metrics?: ESGMetricsDto;
}

export class CompanyFiltersDto {
  @ApiPropertyOptional({ description: 'Filter by sector' })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({ description: 'Filter by size', enum: CompanySize })
  @IsOptional()
  @IsEnum(CompanySize)
  size?: CompanySize;

  @ApiPropertyOptional({ description: 'Filter by status', enum: CompanyStatus })
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @ApiPropertyOptional({ description: 'Search term for name or description' })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}