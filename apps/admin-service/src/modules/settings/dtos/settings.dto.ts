import { 
  IsString, 
  IsOptional, 
  IsEmail, 
  IsBoolean, 
  IsObject, 
  IsNumber, 
  IsEnum, 
  IsArray,
  MinLength, 
  IsIn,
  Matches,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse, APIResponse } from '../../../common/interfaces';

// General Settings DTOs
export class GeneralSettingsDto {
  @IsString()
  companyName: string;

  @IsString()
  language: string;

  @IsString()
  timezone: string;

  @IsString()
  dateFormat: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;
}

// Security Settings DTOs
export class PasswordPolicyDto {
  @IsNumber()
  minLength: number;

  @IsBoolean()
  requireUppercase: boolean;

  @IsBoolean()
  requireLowercase: boolean;

  @IsBoolean()
  requireNumbers: boolean;

  @IsBoolean()
  requireSpecialChars: boolean;

  @IsNumber()
  expiryDays: number;
}

export class SecuritySettingsDto {
  @ValidateNested()
  @Type(() => PasswordPolicyDto)
  passwordPolicy: PasswordPolicyDto;

  @IsBoolean()
  twoFactorEnabled: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsIn(['email', 'sms', 'authenticator'], { each: true })
  twoFactorMethods: ('email' | 'sms' | 'authenticator')[];

  @IsNumber()
  sessionTimeout: number;
}

export class NotifyOnDto {
  @IsBoolean()
  newCustomer: boolean;

  @IsBoolean()
  newInvoice: boolean;

  @IsBoolean()
  paymentReceived: boolean;

  @IsBoolean()
  lowTokens: boolean;

  @IsBoolean()
  securityAlerts: boolean;
}

export class NotificationSettingsDto {
  @IsBoolean()
  email: boolean;

  @IsBoolean()
  sms: boolean;

  @IsBoolean()
  push: boolean;

  @IsBoolean()
  inApp: boolean;

  @ValidateNested()
  @Type(() => NotifyOnDto)
  notifyOn: NotifyOnDto;
}

export class BillingSettingsDto {
  @IsString()
  defaultCurrency: string;

  @IsNumber()
  taxRate: number;

  @IsArray()
  @IsString({ each: true })
  paymentMethods: string[];

  @IsNumber()
  invoiceDueDays: number;

  @IsString()
  invoiceNotes: string;

  @IsBoolean()
  autoGenerateInvoices: boolean;
}

export class AppearanceSettingsDto {
  @IsString()
  @IsIn(['light', 'dark', 'system'])
  theme: 'light' | 'dark' | 'system';

  @IsString()
  @IsIn(['compact', 'comfortable', 'spacious'])
  density: 'compact' | 'comfortable' | 'spacious';

  @IsString()
  fontFamily: string;

  @IsString()
  fontSize: string;

  @IsOptional()
  @IsString()
  customCss?: string;
}

export class AllSettingsDto {
  @ValidateNested()
  @Type(() => GeneralSettingsDto)
  general: GeneralSettingsDto;

  @ValidateNested()
  @Type(() => SecuritySettingsDto)
  security: SecuritySettingsDto;

  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications: NotificationSettingsDto;

  @ValidateNested()
  @Type(() => BillingSettingsDto)
  billing: BillingSettingsDto;

  @ValidateNested()
  @Type(() => AppearanceSettingsDto)
  appearance: AppearanceSettingsDto;
}

export class UpdateSettingDto {
  @IsObject()
  value: any;
}

// User Profile DTOs
export class UserProfileDto {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  position: string;
  avatarUrl: string;
  role: string;
  language: string;
  timezone: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

// Security Settings User-specific DTOs
export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class TwoFactorSettingsDto {
  @IsBoolean()
  enabled: boolean;
}

// Active Session DTOs
export class ActiveSessionDto {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  lastActive: string; // ISO date string
  isCurrent: boolean;
  browser?: string;
  os?: string;
}

export class ActiveSessionsResponseDto {
  @ApiProperty({ type: [ActiveSessionDto] })
  sessions: ActiveSessionDto[];
}

// Login History DTOs
export class LoginAttemptDto {
  id: string;
  date: string; // ISO date string
  ipAddress: string;
  device: string;
  location: string;
  status: string;
  userAgent?: string;
}

export class LoginHistoryResponseDto implements PaginatedResponse<LoginAttemptDto> {
  @ApiProperty({ type: [LoginAttemptDto] })
  items: LoginAttemptDto[];

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  totalPages: number;
}

// Notification Preferences DTOs
export class NotificationPreferenceDto {
  id: string;
  label: string;
  description: string;
  channel: string;
  type: string;
  isEnabled: boolean;
}

export class NotificationPreferencesResponseDto {
  @ApiProperty({ type: [NotificationPreferenceDto] })
  preferences: NotificationPreferenceDto[];
}

export class UpdateNotificationPreferenceDto {
  @IsBoolean()
  isEnabled: boolean;
}

export class UpdateAllNotificationPreferencesDto {
  @ValidateNested({ each: true })
  @Type(() => UpdatePreferenceItemDto)
  preferences: UpdatePreferenceItemDto[];
}

export class UpdatePreferenceItemDto {
  @IsString()
  id: string;

  @IsBoolean()
  isEnabled: boolean;
}

// Application Settings DTOs
export class AppSettingDto {
  id: string;
  name: string;
  value: string;
  description: string;
  category: string;
}

export class AppSettingsResponseDto {
  data: AppSettingDto[];
}
