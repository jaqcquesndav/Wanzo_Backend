import { IsString, IsDate, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountingFramework } from './report.dto';

export class BalanceSheetQueryDto {
  @ApiProperty({ description: 'Fiscal year' })
  @IsString()
  fiscalYear!: string;

  @ApiProperty({ description: 'Balance sheet date' })
  @IsDate()
  @Type(() => Date)
  asOfDate!: Date;

  @ApiPropertyOptional({ description: 'Accounting framework', enum: AccountingFramework })
  @IsOptional()
  @IsEnum(AccountingFramework)
  framework?: AccountingFramework;
}

export class IncomeStatementQueryDto {
  @ApiProperty({ description: 'Fiscal year' })
  @IsString()
  fiscalYear!: string;

  @ApiProperty({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @ApiProperty({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate!: Date;

  @ApiPropertyOptional({ description: 'Accounting framework', enum: AccountingFramework })
  @IsOptional()
  @IsEnum(AccountingFramework)
  framework?: AccountingFramework;
}

export class CashFlowQueryDto {
  @ApiProperty({ description: 'Fiscal year' })
  @IsString()
  fiscalYear!: string;

  @ApiProperty({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @ApiProperty({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate!: Date;

  @ApiPropertyOptional({ description: 'Accounting framework', enum: AccountingFramework })
  @IsOptional()
  @IsEnum(AccountingFramework)
  framework?: AccountingFramework;
}

export class GeneralLedgerQueryDto {
  @ApiProperty({ description: 'Fiscal year' })
  @IsString()
  fiscalYear!: string;

  @ApiProperty({ description: 'Start date' })
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @ApiProperty({ description: 'End date' })
  @IsDate()
  @Type(() => Date)
  endDate!: Date;
}

export class TrialBalanceQueryDto {
  @ApiProperty({ description: 'Fiscal year' })
  @IsString()
  fiscalYear!: string;

  @ApiProperty({ description: 'Trial balance date' })
  @IsDate()
  @Type(() => Date)
  asOfDate!: Date;
}
