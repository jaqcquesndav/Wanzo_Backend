import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsBoolean, IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator';

/**
 * DTOs partagés entre les fichiers de settings
 * Évite la duplication et maintient la cohérence
 */

export class AccountingLevelDto {
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

export class PasswordPolicyDto {
    @ApiProperty()
    @IsNumber()
    minLength!: number;

    @ApiProperty()
    @IsBoolean()
    requireUppercase!: boolean;

    @ApiProperty()
    @IsBoolean()
    requireNumbers!: boolean;

    @ApiProperty()
    @IsBoolean()
    requireSymbols!: boolean;
}

export class NotificationChannelDto {
    @ApiProperty()
    @IsBoolean()
    email!: boolean;

    @ApiProperty()
    @IsBoolean()
    browser!: boolean;
}

export class TaxRateDto {
    @ApiProperty()
    @IsString()
    type!: string;

    @ApiProperty()
    @IsNumber()
    rate!: number;

    @ApiProperty()
    @IsString()
    description!: string;

    @ApiProperty()
    @IsString()
    accountId!: string;
}

export class DataSourceDto {
    @ApiProperty()
    @IsString()
    id!: string;

    @ApiProperty()
    @IsString()
    name!: string;

    @ApiProperty()
    @IsString()
    description!: string;

    @ApiProperty()
    @IsString()
    icon!: string;

    @ApiProperty()
    @IsBoolean()
    isConnected!: boolean;

    @ApiProperty()
    @IsBoolean()
    isConfigurable!: boolean;

    @ApiProperty()
    @IsString()
    syncStatus!: string; // 'active' | 'error' | 'disabled'
}

export class AccountMappingDto {
    @ApiProperty()
    @IsString()
    bankAccountId!: string;

    @ApiProperty()
    @IsString()
    accountingAccountId!: string;

    @ApiProperty()
    @IsString()
    description!: string;
}
