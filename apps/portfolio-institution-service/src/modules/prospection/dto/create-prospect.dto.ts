import { IsString, IsEnum, IsOptional, IsNumber, IsUrl, IsEmail, IsNotEmpty, Min, Max, ValidateNested, IsArray, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { CompanySize, CompanySector, PortfolioType } from '../entities/prospect.entity';

class FinancialMetricDto {
  @IsNumber()
  @IsOptional()
  currentRatio?: number;

  @IsNumber()
  @IsOptional()
  quickRatio?: number;

  @IsNumber()
  @IsOptional()
  debtToEquity?: number;
}

class HistoricalPerformanceDto {
  @IsNumber()
  year: number;

  @IsNumber()
  revenue: number;

  @IsNumber()
  profit: number;

  @IsNumber()
  assets: number;

  @IsNumber()
  liabilities: number;
}

class FinancialDataDto {
  @IsObject()
  @ValidateNested()
  @Type(() => FinancialMetricDto)
  keyMetrics: FinancialMetricDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoricalPerformanceDto)
  historicalPerformance: HistoricalPerformanceDto[];
}

export class CreateProspectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(CompanySize)
  size: CompanySize;

  @IsEnum(CompanySector)
  sector: CompanySector;

  @IsString()
  @IsOptional()
  rccm?: string;

  @IsString()
  @IsOptional()
  idnat?: string;

  @IsString()
  @IsOptional()
  nif?: string;

  @IsString()
  address: string;

  @IsString()
  phone: string;

  @IsEmail()
  email: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  legalRepresentative: string;

  @IsNumber()
  @Min(0)
  annualRevenue: number;

  @IsNumber()
  @Min(1)
  employeeCount: number;

  @IsString()
  description: string;

  @IsEnum(PortfolioType)
  @IsOptional()
  portfolioType?: PortfolioType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  probability?: number;

  @IsString()
  @IsOptional()
  expectedCloseDate?: Date;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => FinancialDataDto)
  @IsOptional()
  financialData?: FinancialDataDto;
}
