import { IsString, IsEnum, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PeriodType {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export enum ComparisonType {
  PREVIOUS_PERIOD = 'previous_period',
  PREVIOUS_YEAR = 'previous_year',
  BUDGET = 'budget',
}

export class DashboardFilterDto {
  @ApiProperty({ description: 'Fiscal year' })
  @IsString()
  fiscalYear!: string;

  @ApiProperty({ description: 'Company ID' })
  @IsString()
  companyId!: string;

  @ApiProperty({ description: 'Period type', enum: PeriodType })
  @IsEnum(PeriodType)
  periodType!: PeriodType;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Comparison type', enum: ComparisonType })
  @IsOptional()
  @IsEnum(ComparisonType)
  comparison?: ComparisonType;
}