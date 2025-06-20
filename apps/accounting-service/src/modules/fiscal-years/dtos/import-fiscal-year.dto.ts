import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsArray, ValidateNested, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class FiscalYearDataDto {
  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;

  @ApiProperty()
  @IsString()
  code!: string;
}

class JournalEntryImportDto {
  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty()
  @IsString()
  journal!: string;

  @ApiProperty()
  @IsString()
  account!: string;

  @ApiProperty()
  @IsString()
  label!: string;

  @ApiProperty()
  @IsNumber()
  debit!: number;

  @ApiProperty()
  @IsNumber()
  credit!: number;

  @ApiProperty()
  @IsString()
  reference!: string;
}

export class ImportFiscalYearDto {
  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => FiscalYearDataDto)
  fiscalYear!: FiscalYearDataDto;

  @ApiProperty({ type: [JournalEntryImportDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryImportDto)
  journalEntries!: JournalEntryImportDto[];
}
