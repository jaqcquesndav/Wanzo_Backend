import { IsString, IsDateString, IsArray, ValidateNested, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ImportJournalLineDto {
  @ApiProperty({ description: 'Account code' })
  @IsString()
  accountCode!: string;

  @ApiProperty({ description: 'Debit amount' })
  @IsNumber()
  debit!: number;

  @ApiProperty({ description: 'Credit amount' })
  @IsNumber()
  credit!: number;

  @ApiProperty({ description: 'Line description' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

class ImportJournalEntryDto {
  @ApiProperty({ description: 'Journal entry date' })
  @IsDateString()
  date!: string;

  @ApiProperty({ description: 'Journal entry reference' })
  @IsString()
  reference!: string;

  @ApiProperty({ description: 'Journal entry description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Journal lines', type: [ImportJournalLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportJournalLineDto)
  lines!: ImportJournalLineDto[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ImportJournalDataDto {
  @ApiProperty({ description: 'Fiscal year' })
  @IsString()
  fiscalYear!: string;

  @ApiProperty({ description: 'Journal entries', type: [ImportJournalEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportJournalEntryDto)
  entries!: ImportJournalEntryDto[];
}

export class ImportResultDto {
  @ApiProperty({ description: 'Total entries processed' })
  totalEntries!: number;

  @ApiProperty({ description: 'Successfully imported entries' })
  successfulEntries!: number;

  @ApiProperty({ description: 'Failed entries' })
  failedEntries!: number;

  @ApiProperty({ description: 'Import errors' })
  errors!: Array<{
    entry: ImportJournalEntryDto;
    error: string;
  }>;
}