import { IsString, IsEnum, IsDate, IsNumber, IsArray, ValidateNested, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JournalType, JournalStatus } from '../entities/journal.entity';

export class JournalLineDto {
  @ApiProperty({ description: 'Account ID' })
  @IsUUID()
  accountId!: string;

  @ApiProperty({ description: 'Debit amount in default currency (CDF)' })
  @IsNumber()
  debit!: number;

  @ApiProperty({ description: 'Credit amount in default currency (CDF)' })
  @IsNumber()
  credit!: number;

  @ApiPropertyOptional({ description: 'Original debit amount in transaction currency' })
  @IsOptional()
  @IsNumber()
  originalDebit?: number;

  @ApiPropertyOptional({ description: 'Original credit amount in transaction currency' })
  @IsOptional()
  @IsNumber()
  originalCredit?: number;

  @ApiPropertyOptional({ description: 'Transaction currency (default: CDF)' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Exchange rate to CDF' })
  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @ApiProperty({ description: 'Line description' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateJournalDto {
  @ApiProperty({ description: 'Fiscal year' })
  @IsString()
  fiscalYear!: string;

  @ApiProperty({ description: 'Journal type', enum: JournalType })
  @IsEnum(JournalType)
  type!: JournalType;

  @ApiProperty({ description: 'Journal reference' })
  @IsString()
  reference!: string;

  @ApiProperty({ description: 'Journal date' })
  @IsDate()
  @Type(() => Date)
  date!: Date;

  @ApiProperty({ description: 'Journal description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Journal lines', type: [JournalLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines!: JournalLineDto[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Company ID' }) // Changed from ApiPropertyOptional
  @IsUUID()
  companyId!: string; // Changed from optional
}

export class UpdateJournalStatusDto {
  @ApiProperty({ description: 'Journal status', enum: JournalStatus })
  @IsEnum(JournalStatus)
  status!: JournalStatus;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class JournalFilterDto {
  @ApiPropertyOptional({ description: 'Filter by fiscal year' })
  @IsOptional()
  @IsString()
  fiscalYear?: string;

  @ApiPropertyOptional({ description: 'Filter by journal type', enum: JournalType })
  @IsOptional()
  @IsEnum(JournalType)
  type?: JournalType;

  @ApiPropertyOptional({ description: 'Filter by journal type (alias for type)', enum: JournalType })
  @IsOptional()
  @IsEnum(JournalType)
  journalType?: JournalType;

  @ApiPropertyOptional({ description: 'Filter by journal status', enum: JournalStatus })
  @IsOptional()
  @IsEnum(JournalStatus)
  status?: JournalStatus;

  @ApiPropertyOptional({ description: 'Filter by start date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Filter by end date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Search term for description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by company ID' })
  @IsOptional()
  @IsUUID()
  companyId?: string;
  
  @ApiPropertyOptional({ description: 'Filter by source (manual, agent)', enum: ['manual', 'agent'] })
  @IsOptional()
  @IsString()
  source?: string;
}