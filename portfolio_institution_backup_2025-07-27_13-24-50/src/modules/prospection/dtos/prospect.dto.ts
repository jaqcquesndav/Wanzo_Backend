import { IsString, IsEnum, IsNumber, IsArray, ValidateNested, IsOptional, IsEmail, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProspectStatus, CompanySize, CompanySector } from '../entities/prospect.entity';

class FinancialMetricsDto {
  @ApiPropertyOptional({ description: 'Current ratio' })
  @IsOptional()
  @IsNumber()
  currentRatio?: number;

  @ApiPropertyOptional({ description: 'Quick ratio' })
  @IsOptional()
  @IsNumber()
  quickRatio?: number;

  @ApiPropertyOptional({ description: 'Debt to equity ratio' })
  @IsOptional()
  @IsNumber()
  debtToEquity?: number;

  @ApiPropertyOptional({ description: 'Profit margin' })
  @IsOptional()
  @IsNumber()
  profitMargin?: number;

  @ApiPropertyOptional({ description: 'Asset turnover' })
  @IsOptional()
  @IsNumber()
  assetTurnover?: number;
}

class HistoricalPerformanceDto {
  @ApiProperty({ description: 'Year' })
  @IsNumber()
  year!: number;

  @ApiProperty({ description: 'Annual revenue' })
  @IsNumber()
  revenue!: number;

  @ApiProperty({ description: 'Annual profit' })
  @IsNumber()
  profit!: number;

  @ApiProperty({ description: 'Total assets' })
  @IsNumber()
  assets!: number;

  @ApiProperty({ description: 'Total liabilities' })
  @IsNumber()
  liabilities!: number;
}

class FinancialDataDto {
  @ApiPropertyOptional({ description: 'Last audit date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastAuditDate?: Date;

  @ApiPropertyOptional({ description: 'Audit firm' })
  @IsOptional()
  @IsString()
  auditFirm?: string;

  @ApiProperty({ description: 'Key financial metrics' })
  @ValidateNested()
  @Type(() => FinancialMetricsDto)
  keyMetrics!: FinancialMetricsDto;

  @ApiProperty({ description: 'Historical performance', type: [HistoricalPerformanceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoricalPerformanceDto)
  historicalPerformance!: HistoricalPerformanceDto[];
}

export class CreateProspectDto {
  @ApiProperty({ description: 'Company name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Company size', enum: CompanySize })
  @IsEnum(CompanySize)
  size!: CompanySize;

  @ApiProperty({ description: 'Business sector', enum: CompanySector })
  @IsEnum(CompanySector)
  sector!: CompanySector;

  @ApiProperty({ description: 'RCCM number' })
  @IsString()
  rccm!: string;

  @ApiProperty({ description: 'IDNAT number' })
  @IsString()
  idnat!: string;

  @ApiProperty({ description: 'NIF number' })
  @IsString()
  nif!: string;

  @ApiProperty({ description: 'Company address' })
  @IsString()
  address!: string;

  @ApiProperty({ description: 'Contact phone' })
  @IsString()
  phone!: string;

  @ApiProperty({ description: 'Contact email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Website URL' })
  @IsString()
  website!: string;

  @ApiProperty({ description: 'Legal representative name' })
  @IsString()
  legalRepresentative!: string;

  @ApiProperty({ description: 'Annual revenue' })
  @IsNumber()
  annualRevenue!: number;

  @ApiProperty({ description: 'Number of employees' })
  @IsNumber()
  employeeCount!: number;

  @ApiProperty({ description: 'Company description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Financial data' })
  @ValidateNested()
  @Type(() => FinancialDataDto)
  financialData!: FinancialDataDto;
}

export class UpdateProspectDto {
  @ApiPropertyOptional({ description: 'Company name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Company size', enum: CompanySize })
  @IsOptional()
  @IsEnum(CompanySize)
  size?: CompanySize;

  @ApiPropertyOptional({ description: 'Business sector', enum: CompanySector })
  @IsOptional()
  @IsEnum(CompanySector)
  sector?: CompanySector;

  @ApiPropertyOptional({ description: 'Company status', enum: ProspectStatus })
  @IsOptional()
  @IsEnum(ProspectStatus)
  status?: ProspectStatus;

  @ApiPropertyOptional({ description: 'Annual revenue' })
  @IsOptional()
  @IsNumber()
  annualRevenue?: number;

  @ApiPropertyOptional({ description: 'Number of employees' })
  @IsOptional()
  @IsNumber()
  employeeCount?: number;

  @ApiPropertyOptional({ description: 'Financial data' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialDataDto)
  financialData?: FinancialDataDto;
}

export class ProspectFilterDto {
  @ApiPropertyOptional({ description: 'Filter by size', enum: CompanySize })
  @IsOptional()
  @IsEnum(CompanySize)
  size?: CompanySize;

  @ApiPropertyOptional({ description: 'Filter by sector', enum: CompanySector })
  @IsOptional()
  @IsEnum(CompanySector)
  sector?: CompanySector;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ProspectStatus })
  @IsOptional()
  @IsEnum(ProspectStatus)
  status?: ProspectStatus;

  @ApiPropertyOptional({ description: 'Minimum annual revenue' })
  @IsOptional()
  @IsNumber()
  minRevenue?: number;

  @ApiPropertyOptional({ description: 'Maximum annual revenue' })
  @IsOptional()
  @IsNumber()
  maxRevenue?: number;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;
}