import { IsString, IsEnum, IsNumber, IsOptional, ValidateNested, IsObject, IsUUID, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RiskToleranceLevel, PortfolioStatus, RiskProfile, PortfolioType } from '../entities/portfolio.entity';

class PortfolioSettingsDto {
  @ApiProperty({ description: 'Maximum loan amount' })
  @IsNumber()
  maxLoanAmount!: number;

  @ApiProperty({ description: 'Interest rate range' })
  @IsObject()
  interestRateRange!: {
    min: number;
    max: number;
  };

  @ApiProperty({ description: 'Loan term range in months' })
  @IsObject()
  loanTermRange!: {
    min: number;
    max: number;
  };

  @ApiProperty({ description: 'Risk tolerance level', enum: RiskToleranceLevel })
  @IsEnum(RiskToleranceLevel)
  riskToleranceLevel!: RiskToleranceLevel;
}

export class CreatePortfolioDto {
  @ApiProperty({ description: 'Portfolio name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Portfolio description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Portfolio type', enum: PortfolioType, default: PortfolioType.TRADITIONAL })
  @IsEnum(PortfolioType)
  @IsOptional()
  type?: PortfolioType = PortfolioType.TRADITIONAL;

  @ApiProperty({ description: 'Manager ID' })
  @IsUUID()
  manager_id!: string;

  @ApiProperty({ description: 'Institution ID' })
  @IsUUID()
  institution_id!: string;

  @ApiProperty({ description: 'Target amount' })
  @IsNumber()
  target_amount!: number;

  @ApiPropertyOptional({ description: 'Target return percentage' })
  @IsOptional()
  @IsNumber()
  target_return?: number;

  @ApiPropertyOptional({ description: 'Target sectors', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  target_sectors?: string[];

  @ApiProperty({ description: 'Risk profile', enum: RiskProfile })
  @IsEnum(RiskProfile)
  risk_profile!: RiskProfile;

  @ApiPropertyOptional({ description: 'Currency code', default: 'XOF' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Client ID' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Portfolio settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PortfolioSettingsDto)
  settings?: PortfolioSettingsDto;
}

export class UpdatePortfolioDto {
  @ApiPropertyOptional({ description: 'Portfolio name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Portfolio description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Portfolio status', enum: PortfolioStatus })
  @IsOptional()
  @IsEnum(PortfolioStatus)
  status?: PortfolioStatus;

  @ApiPropertyOptional({ description: 'Manager ID' })
  @IsOptional()
  @IsUUID()
  manager_id?: string;

  @ApiPropertyOptional({ description: 'Target amount' })
  @IsOptional()
  @IsNumber()
  target_amount?: number;

  @ApiPropertyOptional({ description: 'Target return percentage' })
  @IsOptional()
  @IsNumber()
  target_return?: number;

  @ApiPropertyOptional({ description: 'Target sectors', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  target_sectors?: string[];

  @ApiPropertyOptional({ description: 'Risk profile', enum: RiskProfile })
  @IsOptional()
  @IsEnum(RiskProfile)
  risk_profile?: RiskProfile;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Client ID' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Portfolio settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PortfolioSettingsDto)
  settings?: PortfolioSettingsDto;
}

export class PortfolioFilterDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: PortfolioStatus })
  @IsOptional()
  @IsEnum(PortfolioStatus)
  status?: PortfolioStatus;

  @ApiPropertyOptional({ description: 'Filter by risk profile', enum: RiskProfile })
  @IsOptional()
  @IsEnum(RiskProfile)
  riskProfile?: RiskProfile;

  @ApiPropertyOptional({ description: 'Filter by minimum target amount' })
  @IsOptional()
  @IsNumber()
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Filter by sector' })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({ description: 'Filter by manager ID' })
  @IsOptional()
  @IsString()
  manager?: string;
  
  @ApiPropertyOptional({ description: 'Filter by institution ID' })
  @IsOptional()
  @IsString()
  institutionId?: string;

  @ApiPropertyOptional({ description: 'Filter by client ID' })
  @IsOptional()
  @IsString()
  client?: string;

  @ApiPropertyOptional({ description: 'Filter by creation date (start)' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by creation date (end)' })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Search text (name, reference)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['created_at', 'name', 'target_amount'] })
  @IsOptional()
  @IsEnum(['created_at', 'name', 'target_amount'])
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string;
}