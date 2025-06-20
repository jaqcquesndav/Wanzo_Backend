import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardFilterDto {
  @ApiPropertyOptional({ description: 'ID of the fiscal year (default: current fiscal year)' })
  @IsOptional()
  @IsString()
  fiscalYearId?: string;
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