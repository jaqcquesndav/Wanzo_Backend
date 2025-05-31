import { IsString, IsEnum, IsNumber, IsArray, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PortfolioType, RiskProfile } from '../entities/portfolio.entity';

class MetricsDto {
  @ApiProperty({ description: 'Net portfolio value' })
  @IsNumber()
  netValue!: number;

  @ApiProperty({ description: 'Average return percentage' })
  @IsNumber()
  averageReturn!: number;

  @ApiProperty({ description: 'Portfolio risk score' })
  @IsNumber()
  riskPortfolio!: number;

  @ApiProperty({ description: 'Sharpe ratio' })
  @IsNumber()
  sharpeRatio!: number;

  @ApiProperty({ description: 'Portfolio volatility' })
  @IsNumber()
  volatility!: number;

  @ApiProperty({ description: 'Alpha value' })
  @IsNumber()
  alpha!: number;

  @ApiProperty({ description: 'Beta value' })
  @IsNumber()
  beta!: number;

  @ApiPropertyOptional({ description: 'Asset allocation' })
  @IsOptional()
  @IsArray()
  assetAllocation?: {
    type: string;
    percentage: number;
  }[];
}

export class CreatePortfolioDto {
  @ApiProperty({ description: 'Portfolio name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Portfolio type', enum: PortfolioType })
  @IsEnum(PortfolioType)
  type!: PortfolioType;

  @ApiProperty({ description: 'Target amount' })
  @IsNumber()
  targetAmount!: number;

  @ApiProperty({ description: 'Target return percentage' })
  @IsNumber()
  targetReturn!: number;

  @ApiProperty({ description: 'Target sectors', type: [String] })
  @IsArray()
  @IsString({ each: true })
  targetSectors!: string[];

  @ApiProperty({ description: 'Risk profile', enum: RiskProfile })
  @IsEnum(RiskProfile)
  riskProfile!: RiskProfile;

  @ApiProperty({ description: 'Portfolio metrics' })
  @ValidateNested()
  @Type(() => MetricsDto)
  metrics!: MetricsDto;
}

export class UpdatePortfolioDto {
  @ApiPropertyOptional({ description: 'Portfolio name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Target amount' })
  @IsOptional()
  @IsNumber()
  targetAmount?: number;

  @ApiPropertyOptional({ description: 'Target return percentage' })
  @IsOptional()
  @IsNumber()
  targetReturn?: number;

  @ApiPropertyOptional({ description: 'Target sectors', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetSectors?: string[];

  @ApiPropertyOptional({ description: 'Risk profile', enum: RiskProfile })
  @IsOptional()
  @IsEnum(RiskProfile)
  riskProfile?: RiskProfile;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Portfolio metrics' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MetricsDto)
  metrics?: MetricsDto;
}

export class PortfolioFilterDto {
  @ApiPropertyOptional({ description: 'Filter by type', enum: PortfolioType })
  @IsOptional()
  @IsEnum(PortfolioType)
  type?: PortfolioType;

  @ApiPropertyOptional({ description: 'Filter by risk profile', enum: RiskProfile })
  @IsOptional()
  @IsEnum(RiskProfile)
  riskProfile?: RiskProfile;

  @ApiPropertyOptional({ description: 'Filter by institution ID' })
  @IsOptional()
  @IsString()
  institutionId?: string;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;
}