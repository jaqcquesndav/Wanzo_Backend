import { 
  IsString, 
  IsOptional, 
  IsEmail, 
  IsBoolean, 
  IsObject, 
  IsNumber, 
  IsEnum, 
  MinLength, 
  Matches 
} from 'class-validator';

// User Profile DTOs
export class UserProfileDto {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  position: string;
  avatarUrl: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
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
}

// Security Settings DTOs
export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
  })
  newPassword: string;

  @IsString()
  confirmNewPassword: string;
}

export class TwoFactorSettingsDto {
  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsString()
  method?: 'email' | 'sms' | 'authenticator';
}

export class SessionSettingsDto {
  @IsNumber()
  timeout: number; // in minutes
}

// Notification Settings DTOs
export class NotificationChannelsDto {
  @IsBoolean()
  emailEnabled: boolean;

  @IsBoolean()
  smsEnabled: boolean;

  @IsBoolean()
  inAppEnabled: boolean;

  @IsBoolean()
  pushEnabled: boolean;
}

export class NotificationPreferencesDto {
  @IsObject()
  preferences: Record<string, boolean>;
}

// System Settings DTOs
export enum SystemSettingSection {
  GENERAL = 'general',
  SECURITY = 'security',
  NOTIFICATIONS = 'notifications',
  BILLING = 'billing',
  APPEARANCE = 'appearance'
}

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

export class SecuritySettingsDto {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expiryDays: number;
  };
  twoFactorEnabledGlobally: boolean;
  defaultTwoFactorMethods: string[];
  sessionTimeout: number;
}

export class NotificationSettingsDto {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  defaultNotificationPreferences: Record<string, boolean>;
}

export class BillingSettingsDto {
  defaultCurrency: string;
  taxRate?: number;
  defaultPaymentMethods: string[];
  invoiceDueDays: number;
  invoiceNotes?: string;
  autoGenerateInvoices: boolean;
}

export class AppearanceSettingsDto {
  defaultTheme: 'light' | 'dark' | 'system';
  allowUserThemeOverride: boolean;
  density: 'compact' | 'comfortable' | 'spacious';
  fontFamily: string;
  fontSize: string;
  customCss?: string;
}

export class SystemSettingsResponseDto {
  general: GeneralSettingsDto;
  security: SecuritySettingsDto;
  notifications: NotificationSettingsDto;
  billing: BillingSettingsDto;
  appearance: AppearanceSettingsDto;
}

export class UpdateSystemSettingDto {
  @IsObject()
  settings: Record<string, any>;
}
