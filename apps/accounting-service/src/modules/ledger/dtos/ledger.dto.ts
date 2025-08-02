import { IsOptional, IsString, IsDateString, IsEnum, IsNumber, IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class AccountBalanceQueryDto {
  @ApiPropertyOptional({ description: 'Date for balance calculation (YYYY-MM-DD format)' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Currency code for conversion (e.g., CDF, USD, EUR)' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class AccountMovementsQueryDto {
  @ApiPropertyOptional({ description: 'Start date for filtering (YYYY-MM-DD format)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering (YYYY-MM-DD format)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by journal type',
    enum: ['sales', 'purchases', 'bank', 'cash', 'general', 'all']
  })
  @IsOptional()
  @IsEnum(['sales', 'purchases', 'bank', 'cash', 'general', 'all'])
  journalType?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by status',
    enum: ['draft', 'pending', 'approved', 'posted', 'all']
  })
  @IsOptional()
  @IsEnum(['draft', 'pending', 'approved', 'posted', 'all'])
  status?: string;

  @ApiPropertyOptional({ description: 'Currency code for conversion' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Minimum transaction amount filter' })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum transaction amount filter' })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  maxAmount?: number;

  @ApiPropertyOptional({ 
    description: 'Sort field',
    enum: ['date', 'amount', 'reference']
  })
  @IsOptional()
  @IsEnum(['date', 'amount', 'reference'])
  sortBy?: string;

  @ApiPropertyOptional({ 
    description: 'Sort order',
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of entries per page', default: 50 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number = 50;
}

export class TrialBalanceQueryDto {
  @ApiPropertyOptional({ description: 'Start date for trial balance (YYYY-MM-DD format)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for trial balance (YYYY-MM-DD format)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Fiscal year ID' })
  @IsOptional()
  @IsUUID()
  fiscalYearId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by account type',
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense', 'all']
  })
  @IsOptional()
  @IsEnum(['asset', 'liability', 'equity', 'revenue', 'expense', 'all'])
  accountType?: string;

  @ApiPropertyOptional({ description: 'Currency code for conversion' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Include zero balance accounts', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeZeroBalance?: boolean = false;

  @ApiPropertyOptional({ 
    description: 'Export format',
    enum: ['json', 'csv', 'excel', 'pdf']
  })
  @IsOptional()
  @IsEnum(['json', 'csv', 'excel', 'pdf'])
  export?: string;
}

export class ExportLedgerQueryDto {
  @ApiPropertyOptional({ 
    description: 'Export format',
    enum: ['json', 'csv', 'excel', 'pdf']
  })
  @IsOptional()
  @IsEnum(['json', 'csv', 'excel', 'pdf'])
  format?: string;

  @ApiPropertyOptional({ description: 'Array of specific account IDs to export' })
  @IsOptional()
  @IsString({ each: true })
  accountIds?: string[];

  @ApiPropertyOptional({ description: 'Start date for export (YYYY-MM-DD format)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for export (YYYY-MM-DD format)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Accounting standard',
    enum: ['SYSCOHADA', 'IFRS']
  })
  @IsOptional()
  @IsEnum(['SYSCOHADA', 'IFRS'])
  mode?: string;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Include detailed transaction information', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeDetails?: boolean = false;
}

export class ExportBalanceSheetQueryDto {
  @ApiPropertyOptional({ 
    description: 'Export format',
    enum: ['pdf', 'excel', 'csv']
  })
  @IsOptional()
  @IsEnum(['pdf', 'excel', 'csv'])
  format?: string;

  @ApiPropertyOptional({ 
    description: 'Accounting standard',
    enum: ['SYSCOHADA', 'IFRS']
  })
  @IsOptional()
  @IsEnum(['SYSCOHADA', 'IFRS'])
  mode?: string;

  @ApiPropertyOptional({ description: 'Date for balance calculation (YYYY-MM-DD format)' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Include detailed account information', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeDetails?: boolean = false;
}

export class SearchLedgerQueryDto {
  @ApiPropertyOptional({ description: 'Search term for description, reference, or account' })
  @IsString()
  query!: string;

  @ApiPropertyOptional({ description: 'Start date filter (YYYY-MM-DD format)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (YYYY-MM-DD format)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by account type',
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense']
  })
  @IsOptional()
  @IsEnum(['asset', 'liability', 'equity', 'revenue', 'expense'])
  accountType?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by journal type',
    enum: ['sales', 'purchases', 'bank', 'cash', 'general']
  })
  @IsOptional()
  @IsEnum(['sales', 'purchases', 'bank', 'cash', 'general'])
  journalType?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by entry status',
    enum: ['draft', 'pending', 'approved', 'posted']
  })
  @IsOptional()
  @IsEnum(['draft', 'pending', 'approved', 'posted'])
  status?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of entries per page', default: 50 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number = 50;
}
