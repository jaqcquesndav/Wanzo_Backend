import { IsString, IsEnum, IsDate, IsBoolean, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  BALANCE_SHEET = 'balance-sheet',
  INCOME_STATEMENT = 'income-statement',
  CASH_FLOW = 'cash-flow',
  TRIAL_BALANCE = 'trial-balance',
  GENERAL_LEDGER = 'general-ledger',
  JOURNAL_BOOK = 'journal-book',
  // Types supplémentaires selon la documentation API
  EQUITY_CHANGES = 'equity-changes',
  NOTES = 'notes',
  RECONCILIATION = 'reconciliation',
  ANALYTICAL = 'analytical',
  SOCIAL = 'social',
  STATISTICS = 'statistics',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'xlsx',
  CSV = 'csv',
}

export enum AccountingFramework {
  SYSCOHADA = 'SYSCOHADA',
  IFRS = 'IFRS',
}

export class ReportPeriodDto {
  @ApiProperty({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @ApiProperty({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate!: Date;
}

export class GenerateReportDto {
  @ApiProperty({ description: 'Report type', enum: ReportType })
  @IsEnum(ReportType)
  reportType!: ReportType;

  @ApiProperty({ description: 'Report period' })
  @Type(() => ReportPeriodDto)
  period!: ReportPeriodDto;

  @ApiProperty({ description: 'Currency code (e.g. USD)' })
  @IsString()
  currency!: string;

  @ApiProperty({ description: 'Accounting framework', enum: AccountingFramework })
  @IsEnum(AccountingFramework)
  framework!: AccountingFramework;

  @ApiPropertyOptional({ description: 'Compare with previous year' })
  @IsOptional()
  @IsBoolean()
  compareN1?: boolean;

  @ApiPropertyOptional({ description: 'Include analytic accounts' })
  @IsOptional()
  @IsBoolean()
  includeAnalytics?: boolean;

  @ApiPropertyOptional({ description: 'Additional options' })
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}

export class ExportReportDto {
  @ApiProperty({ description: 'Report type', enum: ReportType })
  @IsEnum(ReportType)
  reportType!: ReportType;

  @ApiProperty({ description: 'Fiscal year' })
  @IsString()
  fiscalYear!: string;

  @ApiProperty({ description: 'Export format', enum: ReportFormat })
  @IsEnum(ReportFormat)
  format!: ReportFormat;

  @ApiPropertyOptional({ description: 'Additional options' })
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}