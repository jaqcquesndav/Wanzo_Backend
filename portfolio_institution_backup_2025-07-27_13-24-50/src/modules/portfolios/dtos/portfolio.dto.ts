import { IsString, IsEnum, IsNumber, IsOptional, ValidateNested, IsObject, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RiskToleranceLevel } from '../entities/portfolio.entity';

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

  @ApiProperty({ description: 'Portfolio total amount' })
  @IsNumber()
  totalAmount!: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'XOF' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Manager ID' })
  @IsOptional()
  @IsUUID()
  managerId?: string;

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

  @ApiPropertyOptional({ description: 'Portfolio status', enum: ['active', 'closed', 'suspended'] })
  @IsOptional()
  @IsEnum(['active', 'closed', 'suspended'])
  status?: string;

  @ApiPropertyOptional({ description: 'Portfolio total amount' })
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Manager ID' })
  @IsOptional()
  @IsUUID()
  managerId?: string;

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
  @ApiPropertyOptional({ description: 'Filter by status', enum: ['active', 'closed', 'suspended'] })
  @IsOptional()
  @IsEnum(['active', 'closed', 'suspended'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by manager ID' })
  @IsOptional()
  @IsString()
  manager?: string;

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

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['createdAt', 'name', 'totalAmount'] })
  @IsOptional()
  @IsEnum(['createdAt', 'name', 'totalAmount'])
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string;
}