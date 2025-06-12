import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountingMode } from '../../organization/entities/organization.entity';
import { DepreciationMethod, JournalEntryValidation } from '../entities/accounting-settings.entity';

export class UpdateAccountingSettingsDto {
  @ApiPropertyOptional({ enum: AccountingMode })
  @IsEnum(AccountingMode)
  @IsOptional()
  accountingMode?: AccountingMode;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  defaultCurrency?: string;

  @ApiPropertyOptional({ enum: DepreciationMethod })
  @IsEnum(DepreciationMethod)
  @IsOptional()
  defaultDepreciationMethod?: DepreciationMethod;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  defaultVatRate?: string;

  @ApiPropertyOptional({ enum: JournalEntryValidation })
  @IsEnum(JournalEntryValidation)
  @IsOptional()
  journalEntryValidation?: JournalEntryValidation;
}
