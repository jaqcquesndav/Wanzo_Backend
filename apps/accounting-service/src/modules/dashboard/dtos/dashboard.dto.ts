import { IsString, IsOptional, IsDate, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum PeriodType {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom'
}

export enum ComparisonType {
  PREVIOUS_PERIOD = 'previous_period',
  PREVIOUS_YEAR = 'previous_year',
  BUDGET = 'budget',
  NONE = 'none'
}

export class DashboardFilterDto {
  @ApiPropertyOptional({ description: 'Time period: day, week, month, quarter, year', enum: PeriodType })
  @IsOptional()
  @IsEnum(PeriodType)
  period?: PeriodType;

  @ApiPropertyOptional({ description: 'ID of the fiscal year (default: current fiscal year)' })
  @IsOptional()
  @IsString()
  fiscalYearId?: string;

  @ApiPropertyOptional({ description: 'ID of the company' })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Start date for custom period filtering' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date for custom period filtering' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Type of comparison to perform', enum: ComparisonType })
  @IsOptional()
  @IsEnum(ComparisonType)
  comparison?: ComparisonType;

  // Alias for fiscalYearId to maintain compatibility with existing code
  get fiscalYear(): string | undefined {
    return this.fiscalYearId;
  }
}

// Types for dashboard response
export class QuickStatsDto {
  totalAssets!: number;
  revenue!: number;
  netIncome!: number;
  cashOnHand!: number;
  trends!: {
    assets: { value: number; isPositive: boolean };
    revenue: { value: number; isPositive: boolean };
    netIncome: { value: number; isPositive: boolean };
    cashOnHand: { value: number; isPositive: boolean };
  };
}

export class FinancialRatiosDto {
  grossProfitMargin!: number;
  breakEvenPoint!: number;
  daysSalesOutstanding!: number;
  daysPayableOutstanding!: number;
  workingCapital!: number;
  currentRatio!: number;
}

export class KeyPerformanceIndicatorsDto {
  creditScore!: number;
  financialRating!: string;
}

export class DateValueDto {
  date!: string;
  revenue?: number;
  expenses?: number;
}

export class DashboardResponseDto {
  quickStats!: QuickStatsDto;
  financialRatios!: FinancialRatiosDto;
  keyPerformanceIndicators!: KeyPerformanceIndicatorsDto;
  revenueData!: DateValueDto[];
  expensesData!: DateValueDto[];
  recentTransactions!: any[];
  alerts!: any[];
}