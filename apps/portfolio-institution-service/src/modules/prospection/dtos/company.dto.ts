import { IsString, IsNumber, IsEnum, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsNumber()
  revenue_growth!: number;

  @IsNumber()
  profit_margin!: number;

  @IsNumber()
  cash_flow!: number;

  @IsNumber()
  debt_ratio!: number;

  @IsNumber()
  working_capital!: number;

  @IsNumber()
  credit_score!: number;

  @IsString()
  financial_rating!: string;

  @IsOptional()
  @IsNumber()
  ebitda?: number;
}

class GenderRatioDto {
  @IsNumber()
  male!: number;

  @IsNumber()
  female!: number;
}

class ESGMetricsDto {
  @IsNumber()
  carbon_footprint!: number;

  @IsString()
  environmental_rating!: string;

  @IsString()
  social_rating!: string;

  @IsString()
  governance_rating!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GenderRatioDto)
  gender_ratio?: GenderRatioDto;
}

export class CreateCompanyDto {
  @IsString()
  name!: string;

  @IsString()
  sector!: string;

  @IsEnum(CompanySize)
  size!: CompanySize;

  @IsNumber()
  annual_revenue!: number;

  @IsNumber()
  employee_count!: number;

  @IsOptional()
  @IsString()
  website_url?: string;

  @IsEnum(CompanyStatus)
  status!: CompanyStatus;

  @IsObject()
  @ValidateNested()
  @Type(() => FinancialMetricsDto)
  financial_metrics!: FinancialMetricsDto;

  @IsObject()
  @ValidateNested()
  @Type(() => ESGMetricsDto)
  esg_metrics!: ESGMetricsDto;
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsEnum(CompanySize)
  size?: CompanySize;

  @IsOptional()
  @IsNumber()
  annual_revenue?: number;

  @IsOptional()
  @IsNumber()
  employee_count?: number;

  @IsOptional()
  @IsString()
  website_url?: string;

  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FinancialMetricsDto)
  financial_metrics?: FinancialMetricsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ESGMetricsDto)
  esg_metrics?: ESGMetricsDto;
}

export class CompanyFiltersDto {
  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsEnum(CompanySize)
  size?: CompanySize;

  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}