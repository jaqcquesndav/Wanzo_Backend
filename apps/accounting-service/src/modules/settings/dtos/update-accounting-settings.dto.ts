import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAccountingSettingsDto {
  @ApiPropertyOptional({ description: 'Default currency' })
  @IsOptional()
  @IsString()
  defaultCurrency?: string;

  @ApiPropertyOptional({ description: 'Default tax rate' })
  @IsOptional()
  @IsNumber()
  defaultTaxRate?: number;

  @ApiPropertyOptional({ description: 'Default journal' })
  @IsOptional()
  @IsString()
  defaultJournal?: string;

  @ApiPropertyOptional({ description: 'Auto-generate journal entries' })
  @IsOptional()
  @IsBoolean()
  autoGenerateJournalEntries?: boolean;

  @ApiPropertyOptional({ description: 'Require approval for journal entries' })
  @IsOptional()
  @IsBoolean()
  requireApproval?: boolean;

  @ApiPropertyOptional({ description: 'Chart of accounts template' })
  @IsOptional()
  @IsString()
  chartOfAccountsTemplate?: string;
}
