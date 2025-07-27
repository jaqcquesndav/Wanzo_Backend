import { IsString, IsBoolean, IsOptional, IsObject, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SettingCategory } from '../entities/setting.entity';

export class CreateSettingDto {
  @ApiProperty({ description: 'Setting key' })
  @IsString()
  key!: string;

  @ApiProperty({ description: 'Setting category', enum: SettingCategory })
  @IsEnum(SettingCategory)
  @IsOptional()
  category?: SettingCategory;

  @ApiProperty({ description: 'Setting value' })
  @IsObject()
  value!: any;

  @ApiPropertyOptional({ description: 'Setting description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Public visibility' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateSettingDto {
  @ApiProperty({ description: 'Setting value' })
  @IsObject()
  value!: any;

  @ApiPropertyOptional({ description: 'Setting description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Public visibility' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

// DTOs pour les paramètres généraux
export class GeneralSettingsDto {
  @ApiProperty({ description: 'Application name' })
  @IsString()
  applicationName!: string;

  @ApiPropertyOptional({ description: 'Logo URL' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ description: 'Favicon URL' })
  @IsOptional()
  @IsString()
  favicon?: string;

  @ApiProperty({ description: 'Primary color' })
  @IsString()
  primaryColor!: string;

  @ApiPropertyOptional({ description: 'Secondary color' })
  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @ApiPropertyOptional({ description: 'Tertiary color' })
  @IsOptional()
  @IsString()
  tertiaryColor?: string;

  @ApiProperty({ description: 'Currency' })
  @IsString()
  currency!: string;

  @ApiProperty({ description: 'Language' })
  @IsString()
  language!: string;

  @ApiProperty({ description: 'Date format' })
  @IsString()
  dateFormat!: string;

  @ApiProperty({ description: 'Time format' })
  @IsString()
  timeFormat!: string;
}

// DTOs pour les paramètres de sécurité
export class PasswordPolicyDto {
  @ApiProperty({ description: 'Minimum password length' })
  @IsOptional()
  minLength?: number;

  @ApiPropertyOptional({ description: 'Require lowercase characters' })
  @IsOptional()
  @IsBoolean()
  requireLowercase?: boolean;

  @ApiPropertyOptional({ description: 'Require uppercase characters' })
  @IsOptional()
  @IsBoolean()
  requireUppercase?: boolean;

  @ApiPropertyOptional({ description: 'Require numbers' })
  @IsOptional()
  @IsBoolean()
  requireNumbers?: boolean;

  @ApiPropertyOptional({ description: 'Require special characters' })
  @IsOptional()
  @IsBoolean()
  requireSpecialChars?: boolean;

  @ApiPropertyOptional({ description: 'Password expiry in days' })
  @IsOptional()
  expiryDays?: number;
}

export class SecuritySettingsDto {
  @ApiPropertyOptional({ description: 'Password policy' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PasswordPolicyDto)
  passwordPolicy?: PasswordPolicyDto;

  @ApiPropertyOptional({ description: 'Session timeout in minutes' })
  @IsOptional()
  sessionTimeout?: number;

  @ApiPropertyOptional({ description: 'Multi-factor authentication enabled' })
  @IsOptional()
  @IsBoolean()
  mfaEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Multi-factor authentication methods' })
  @IsOptional()
  mfaMethods?: string[];
}

// DTOs pour les paramètres de notification
export class NotificationChannelSettingDto {
  @ApiProperty({ description: 'Notification enabled' })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({ description: 'Notification channels' })
  channels!: string[];
}

export class NotificationSettingsDto {
  @ApiProperty({ description: 'Email notifications enabled' })
  @IsBoolean()
  emailEnabled!: boolean;

  @ApiProperty({ description: 'Push notifications enabled' })
  @IsBoolean()
  pushEnabled!: boolean;

  @ApiPropertyOptional({ description: 'Desktop notifications enabled' })
  @IsOptional()
  @IsBoolean()
  desktopEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Notification settings per event type' })
  @IsOptional()
  @IsObject()
  notificationSettings?: Record<string, NotificationChannelSettingDto>;
}