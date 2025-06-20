import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsBoolean, IsNumber, IsObject, ValidateNested, IsArray } from 'class-validator';

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

  @ApiProperty({ type: [AccountingLevelDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccountingLevelDto)
  accountingLevels!: AccountingLevelDto[];
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

class NotificationChannelDto {
    @ApiProperty()
    @IsBoolean()
    email!: boolean;

    @ApiProperty()
    @IsBoolean()
    browser!: boolean;
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

class GoogleDriveIntegrationDto {
    @ApiProperty()
    @IsBoolean()
    enabled!: boolean;

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    linkedAccount!: string | null;
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
    @IsString()
    webhookUrl!: string | null;
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
}


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
