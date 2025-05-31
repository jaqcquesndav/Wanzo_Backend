import { IsString, IsEnum, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PerformanceMetric {
  RETURN = 'return',
  VOLATILITY = 'volatility',
  SHARPE_RATIO = 'sharpe_ratio',
  ALPHA = 'alpha',
  BETA = 'beta',
  TRACKING_ERROR = 'tracking_error',
  INFORMATION_RATIO = 'information_ratio',
  MAX_DRAWDOWN = 'max_drawdown'
}

export class PerformancePeriod {
  @ApiProperty({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @ApiProperty({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate!: Date;
}

export class CalculatePerformanceDto {
  @ApiProperty({ description: 'Portfolio ID' })
  @IsString()
  portfolioId!: string;

  @ApiProperty({ description: 'Performance period' })
  @Type(() => PerformancePeriod)
  period!: PerformancePeriod;

  @ApiPropertyOptional({ description: 'Specific metrics to calculate', enum: PerformanceMetric, isArray: true })
  @IsOptional()
  @IsEnum(PerformanceMetric, { each: true })
  metrics?: PerformanceMetric[];
}