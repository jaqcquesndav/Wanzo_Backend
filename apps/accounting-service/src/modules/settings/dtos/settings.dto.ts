import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsBoolean, IsNumber, IsObject, ValidateNested, IsArray, IsOptional, IsEnum } from 'class-validator';

// Import enums from entities
import { DepreciationMethod, JournalEntryValidation } from '../entities/accounting-settings.entity';

// ===============================
// SHARED INTERNAL DTOs
// ===============================

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

class PasswordPolicyDto {
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

class NotificationChannelDto {
    @ApiProperty()
    @IsBoolean()
    email!: boolean;

    @ApiProperty()
    @IsBoolean()
    browser!: boolean;
}

class TaxRateDto {
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

class DataSourceDto {
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

class DataSourcesDto {
    @ApiProperty({ type: [DataSourceDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DataSourceDto)
    sources!: DataSourceDto[];
}

class AccountMappingDto {
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

// ===============================
// MAIN SETTINGS DTOs
// ===============================

class GeneralSettingsDto {
  @ApiProperty()
  @IsString()
  language!: string;

  @ApiProperty()
  @IsString()
  dateFormat!: string;

  @ApiProperty()
  @IsString()
  timezone!: string;

  @ApiProperty()
  @IsString()
  theme!: string;

  @ApiProperty()
  @IsString()
  baseCurrency!: string;

  @ApiProperty()
  @IsString()
  displayCurrency!: string;

  @ApiProperty()
  @IsObject()
  exchangeRates!: Record<string, number>;
}

class AccountingSettingsDto {
  @ApiProperty()
  @IsString()
  defaultJournal!: string;

  @ApiProperty()
  @IsBoolean()
  autoNumbering!: boolean;

  @ApiProperty()
  @IsString()
  voucherPrefix!: string;

  @ApiProperty()
  @IsString()
  fiscalYearPattern!: string;

  @ApiProperty()
  @IsString()
  accountingFramework!: string;

  @ApiProperty({ enum: DepreciationMethod })
  @IsEnum(DepreciationMethod)
  defaultDepreciationMethod!: DepreciationMethod;

  @ApiProperty()
  @IsNumber()
  defaultVatRate!: number;

  @ApiProperty({ enum: JournalEntryValidation })
  @IsEnum(JournalEntryValidation)
  journalEntryValidation!: JournalEntryValidation;

  @ApiProperty({ type: [AccountingLevelDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccountingLevelDto)
  accountingLevels!: AccountingLevelDto[];
}

class SecuritySettingsDto {
  @ApiProperty()
  @IsBoolean()
  twoFactorEnabled!: boolean;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => PasswordPolicyDto)
  passwordPolicy!: PasswordPolicyDto;

  @ApiProperty()
  @IsNumber()
  sessionTimeout!: number;

  @ApiProperty()
  @IsNumber()
  auditLogRetention!: number;
}

class NotificationsSettingsDto {
    @ApiProperty()
    @IsObject()
    @ValidateNested()
    @Type(() => NotificationChannelDto)
    journal_validation!: NotificationChannelDto;

    @ApiProperty()
    @IsObject()
    @ValidateNested()
    @Type(() => NotificationChannelDto)
    report_generation!: NotificationChannelDto;

    @ApiProperty()
    @IsObject()
    @ValidateNested()
    @Type(() => NotificationChannelDto)
    user_mention!: NotificationChannelDto;
}

// ===============================
// INTEGRATIONS DTOs - Conforme à la documentation
// ===============================

class GoogleDriveIntegrationDto {
    @ApiProperty()
    @IsBoolean()
    enabled!: boolean;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    linkedAccount?: string | null;
}

class KsPayIntegrationDto {
    @ApiProperty()
    @IsBoolean()
    enabled!: boolean;

    @ApiProperty()
    @IsString()
    apiKey!: string;
}

class SlackIntegrationDto {
    @ApiProperty()
    @IsBoolean()
    enabled!: boolean;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    webhookUrl?: string | null;
}

class DataSharingDto {
    @ApiProperty()
    @IsBoolean()
    banks!: boolean;

    @ApiProperty()
    @IsBoolean()
    microfinance!: boolean;

    @ApiProperty()
    @IsBoolean()
    coopec!: boolean;

    @ApiProperty()
    @IsBoolean()
    analysts!: boolean;

    @ApiProperty()
    @IsBoolean()
    partners!: boolean;

    @ApiProperty()
    @IsBoolean()
    consentGiven!: boolean;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    consentDate?: string | null;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    lastModified?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    modifiedBy?: string;
}

class BankIntegrationDto {
    @ApiProperty()
    @IsString()
    provider!: string;

    @ApiProperty()
    @IsBoolean()
    enabled!: boolean;

    @ApiProperty()
    @IsString()
    syncFrequency!: string;

    @ApiProperty({ type: [AccountMappingDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AccountMappingDto)
    accountMappings!: AccountMappingDto[];
}

class EInvoicingDto {
    @ApiProperty()
    @IsString()
    provider!: string;

    @ApiProperty()
    @IsBoolean()
    enabled!: boolean;

    @ApiProperty()
    @IsString()
    taxpayerNumber!: string;

    @ApiProperty()
    @IsBoolean()
    autoSubmit!: boolean;

    @ApiProperty()
    @IsBoolean()
    validateBeforeSubmit!: boolean;

    @ApiProperty()
    @IsBoolean()
    syncInvoices!: boolean;
}

class TaxIntegrationDto {
    @ApiProperty()
    @IsBoolean()
    dgiEnabled!: boolean;

    @ApiProperty()
    @IsString()
    taxpayerNumber!: string;

    @ApiProperty()
    @IsBoolean()
    autoCalculateTax!: boolean;

    @ApiProperty({ type: [TaxRateDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TaxRateDto)
    taxRates!: TaxRateDto[];

    @ApiProperty()
    @IsString()
    declarationFrequency!: string;
}

class PortfolioIntegrationDto {
    @ApiProperty()
    @IsBoolean()
    enabled!: boolean;

    @ApiProperty({ type: [String] })
    @IsArray()
    portfolioTypes!: string[];

    @ApiProperty()
    @IsBoolean()
    automaticValuation!: boolean;

    @ApiProperty()
    @IsString()
    valuationFrequency!: string;

    @ApiProperty()
    @IsBoolean()
    currencyConversion!: boolean;
}

class IntegrationsSettingsDto {
    @ApiProperty()
    @IsObject()
    @ValidateNested()
    @Type(() => GoogleDriveIntegrationDto)
    googleDrive!: GoogleDriveIntegrationDto;

    @ApiProperty()
    @IsObject()
    @ValidateNested()
    @Type(() => KsPayIntegrationDto)
    ksPay!: KsPayIntegrationDto;

    @ApiProperty()
    @IsObject()
    @ValidateNested()
    @Type(() => SlackIntegrationDto)
    slack!: SlackIntegrationDto;

    @ApiProperty()
    @IsObject()
    @ValidateNested()
    @Type(() => DataSharingDto)
    dataSharing!: DataSharingDto;

    @ApiProperty()
    @IsObject()
    @ValidateNested()
    @Type(() => DataSourcesDto)
    dataSources!: DataSourcesDto;

    @ApiProperty({ type: [BankIntegrationDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BankIntegrationDto)
    bankIntegrations!: BankIntegrationDto[];

    @ApiProperty()
    @IsObject()
    @ValidateNested()
    @Type(() => EInvoicingDto)
    eInvoicing!: EInvoicingDto;

    @ApiProperty()
    @IsObject()
    @ValidateNested()
    @Type(() => TaxIntegrationDto)
    taxIntegration!: TaxIntegrationDto;

    @ApiProperty()
    @IsObject()
    @ValidateNested()
    @Type(() => PortfolioIntegrationDto)
    portfolioIntegration!: PortfolioIntegrationDto;
}

// ===============================
// MAIN EXPORT - Settings Response DTO
// ===============================

export class SettingsDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => GeneralSettingsDto)
  general!: GeneralSettingsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => AccountingSettingsDto)
  accounting!: AccountingSettingsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => SecuritySettingsDto)
  security!: SecuritySettingsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => NotificationsSettingsDto)
  notifications!: NotificationsSettingsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => IntegrationsSettingsDto)
  integrations!: IntegrationsSettingsDto;
}

// ===============================
// UPDATE DTOs - Partielles et optionnelles
// ===============================

export class UpdateGeneralSettingsDto extends PartialType(GeneralSettingsDto) {}
export class UpdateAccountingSettingsDto extends PartialType(AccountingSettingsDto) {}
export class UpdateSecuritySettingsDto extends PartialType(SecuritySettingsDto) {}
export class UpdateNotificationsSettingsDto extends PartialType(NotificationsSettingsDto) {}
export class UpdateIntegrationsSettingsDto extends PartialType(IntegrationsSettingsDto) {}

// Exchange rates update DTO
export class ExchangeRateDto {
    @ApiProperty()
    @IsString()
    currencyCode!: string;

    @ApiProperty()
    @IsNumber()
    exchangeRate!: number;
}

export class UpdateExchangeRatesDto {
    @ApiProperty({ type: [ExchangeRateDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ExchangeRateDto)
    rates!: ExchangeRateDto[];
}

// Advanced settings DTOs for new features
export class UpdateDataSharingDto extends PartialType(DataSharingDto) {}
export class UpdateDataSourceDto extends PartialType(DataSourceDto) {}
export class UpdateBankIntegrationDto extends PartialType(BankIntegrationDto) {}

export class ValidateSettingsDto {
    @ApiProperty()
    @IsObject()
    @IsOptional()
    general?: any;

    @ApiProperty()
    @IsObject()
    @IsOptional()
    accounting?: any;

    @ApiProperty()
    @IsObject()
    @IsOptional()
    security?: any;

    @ApiProperty()
    @IsObject()
    @IsOptional()
    notifications?: any;

    @ApiProperty()
    @IsObject()
    @IsOptional()
    integrations?: any;
}

export class ImportSettingsDto {
    @ApiProperty()
    @IsObject()
    @IsOptional()
    general?: any;

    @ApiProperty()
    @IsObject()
    @IsOptional()
    accounting?: any;

    @ApiProperty()
    @IsObject()
    @IsOptional()
    security?: any;

    @ApiProperty()
    @IsObject()
    @IsOptional()
    notifications?: any;

    @ApiProperty()
    @IsObject()
    @IsOptional()
    integrations?: any;
}
