import { IsString, IsEnum, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '../entities/account.entity';
import { AccountingStandard } from '../../../common/enums/accounting.enum';

export class CreateAccountDto {
  @ApiProperty({ description: 'Account code (e.g. 411000)' })
  @IsString()
  code!: string;

  @ApiProperty({ description: 'Account name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Account type', enum: AccountType })
  @IsEnum(AccountType)
  type!: AccountType;

  @ApiPropertyOptional({ description: 'Parent account ID' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Whether this is an analytic account' })
  @IsOptional()
  @IsBoolean()
  isAnalytic?: boolean;

  @ApiPropertyOptional({ description: 'Account description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Company ID' })
  @IsUUID()
  companyId!: string;

  @ApiProperty({ description: 'Fiscal Year ID' }) // Added fiscalYearId
  @IsString() // Assuming fiscalYearId is a string, adjust if it's a UUID for example
  fiscalYearId!: string;
}

export class UpdateAccountDto {
  @ApiPropertyOptional({ description: 'Account name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Account type', enum: AccountType })
  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;

  @ApiPropertyOptional({ description: 'Parent account ID' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Whether this is an analytic account' })
  @IsOptional()
  @IsBoolean()
  isAnalytic?: boolean;

  @ApiPropertyOptional({ description: 'Account description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Account active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class AccountFilterDto {
  @ApiPropertyOptional({ description: 'Filter by account type', enum: AccountType })
  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;

  @ApiPropertyOptional({ description: 'Filter by parent account ID' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Filter by analytic accounts' })
  @IsOptional()
  @IsBoolean()
  isAnalytic?: boolean;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Filter by company ID' })
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Filter by fiscal year' })
  @IsOptional()
  @IsString()
  fiscalYear?: string;

  @ApiPropertyOptional({ description: 'Filter by accounting standard', enum: AccountingStandard })
  @IsOptional()
  @IsEnum(AccountingStandard)
  accountingStandard?: AccountingStandard;
}

export class JournalFilterDto {
  @ApiPropertyOptional({ description: 'Filter by company ID' })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Filter by fiscal year' })
  @IsOptional()
  @IsString()
  fiscalYear?: string;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;
}