import { IsString, IsEnum, IsOptional, IsBoolean, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountingMode } from '../../organization/entities/organization.entity';
import { DepreciationMethod, JournalEntryValidation } from '../entities/accounting-settings.entity';
import { Type } from 'class-transformer';

class AccountingLevelDto {
  @ApiProperty()
  @IsNumber()
  level!: number;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsNumber()
  digits!: number;
}

export class UpdateAccountingSettingsDto {
  @ApiPropertyOptional({ enum: AccountingMode })
  @IsEnum(AccountingMode)
  @IsOptional()
  accountingMode?: AccountingMode;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  defaultJournal?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  autoNumbering?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  voucherPrefix?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fiscalYearPattern?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  accountingFramework?: string;

  @ApiProperty({ type: [AccountingLevelDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccountingLevelDto)
  accountingLevels?: AccountingLevelDto[];
}
