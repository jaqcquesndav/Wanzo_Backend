import { IsString, IsEnum, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  PORTFOLIO_SUMMARY = 'portfolio_summary',
  OPERATIONS_ANALYSIS = 'operations_analysis',
  ASSET_VALUATION = 'asset_valuation',
  RISK_ASSESSMENT = 'risk_assessment'
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'xlsx',
  CSV = 'csv'
}

export class ReportPeriod {
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
  type!: ReportType;

  @ApiProperty({ description: 'Report period' })
  @Type(() => ReportPeriod)
  period!: ReportPeriod;

  @ApiPropertyOptional({ description: 'Report format', enum: ReportFormat })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;
}