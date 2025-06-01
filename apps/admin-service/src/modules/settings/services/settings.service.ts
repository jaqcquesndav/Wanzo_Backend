import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  UserSetting, 
  SecuritySetting, 
  NotificationSetting, 
  SystemSetting 
} from '../entities';
import {
  UserProfileDto,
  UpdateUserProfileDto,
  ChangePasswordDto,
  TwoFactorSettingsDto,
  SessionSettingsDto,
  NotificationChannelsDto,
  NotificationPreferencesDto,
  SystemSettingsResponseDto,
  SystemSettingSection,
  UpdateSystemSettingDto
} from '../dtos';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(UserSetting)
    private userSettingRepository: Repository<UserSetting>,
    @InjectRepository(SecuritySetting)
    private securitySettingRepository: Repository<SecuritySetting>,
    @InjectRepository(NotificationSetting)
    private notificationSettingRepository: Repository<NotificationSetting>,
    @InjectRepository(SystemSetting)
    private systemSettingRepository: Repository<SystemSetting>
  ) {}

  // User Profile Settings
  async getUserProfile(userId: string): Promise<UserProfileDto> {
    const userSetting = await this.userSettingRepository.findOne({
      where: { userId }
    });

    if (!userSetting) {
      throw new NotFoundException(`User settings for user ${userId} not found`);
    }

    // In a real implementation, this would fetch user data from the users service
    return {
      id: userId,
      name: userSetting.name,
      email: `user_${userId}@example.com`, // This would come from the user service
      phoneNumber: userSetting.phoneNumber,
      position: userSetting.position,
      avatarUrl: userSetting.avatarUrl,
      role: 'user', // This would come from the user service
      createdAt: userSetting.createdAt,
      updatedAt: userSetting.updatedAt
    };
  }

  async updateUserProfile(userId: string, updateDto: UpdateUserProfileDto): Promise<UserProfileDto> {
    let userSetting = await this.userSettingRepository.findOne({
      where: { userId }
    });

    if (!userSetting) {
      // Create new settings if not exist
      userSetting = this.userSettingRepository.create({
        userId,
        name: updateDto.name || '',
        phoneNumber: updateDto.phoneNumber || '',
        position: updateDto.position
      });
    } else {
      // Update existing settings
      if (updateDto.name) userSetting.name = updateDto.name;
      if (updateDto.phoneNumber) userSetting.phoneNumber = updateDto.phoneNumber;
      if (updateDto.position !== undefined) userSetting.position = updateDto.position;
    }

    await this.userSettingRepository.save(userSetting);
    return this.getUserProfile(userId);
  }

  async updateUserAvatar(userId: string, avatarUrl: string): Promise<{ avatarUrl: string }> {
    let userSetting = await this.userSettingRepository.findOne({
      where: { userId }
    });

    if (!userSetting) {
      // Create new settings if not exist
      userSetting = this.userSettingRepository.create({
        userId,
        name: '',
        phoneNumber: '',
        avatarUrl
      });
    } else {
      userSetting.avatarUrl = avatarUrl;
    }

    await this.userSettingRepository.save(userSetting);
    return { avatarUrl };
  }

  // Security Settings
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword, confirmNewPassword } = changePasswordDto;

    // In a real implementation, this would verify the current password with the auth service
    if (currentPassword === 'wrong_password') {
      throw new BadRequestException('Current password is incorrect');
    }

    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    // Password complexity check is done via validation in DTO

    // In a real implementation, this would update the password in the auth service
    // For now, just update the last password change timestamp
    let securitySetting = await this.securitySettingRepository.findOne({
      where: { userId }
    });

    if (!securitySetting) {
      securitySetting = this.securitySettingRepository.create({
        userId,
        lastPasswordChange: new Date()
      });
    } else {
      securitySetting.lastPasswordChange = new Date();
    }

    await this.securitySettingRepository.save(securitySetting);
    
    return { message: 'Password changed successfully' };
  }

  async updateTwoFactorSettings(userId: string, twoFactorDto: TwoFactorSettingsDto): Promise<SecuritySetting> {
    let securitySetting = await this.securitySettingRepository.findOne({
      where: { userId }
    });

    if (!securitySetting) {
      securitySetting = this.securitySettingRepository.create({
        userId,
        twoFactorEnabled: twoFactorDto.enabled,
        twoFactorMethod: twoFactorDto.method
      });
    } else {
      securitySetting.twoFactorEnabled = twoFactorDto.enabled;
      if (twoFactorDto.method) {
        securitySetting.twoFactorMethod = twoFactorDto.method;
      }
    }

    return this.securitySettingRepository.save(securitySetting);
  }

  async updateSessionSettings(userId: string, sessionDto: SessionSettingsDto): Promise<SecuritySetting> {
    let securitySetting = await this.securitySettingRepository.findOne({
      where: { userId }
    });

    if (!securitySetting) {
      securitySetting = this.securitySettingRepository.create({
        userId,
        sessionTimeout: sessionDto.timeout
      });
    } else {
      securitySetting.sessionTimeout = sessionDto.timeout;
    }

    return this.securitySettingRepository.save(securitySetting);
  }

  // Notification Settings
  async getNotificationSettings(userId: string): Promise<NotificationSetting> {
    let notificationSetting = await this.notificationSettingRepository.findOne({
      where: { userId }
    });

    if (!notificationSetting) {
      // Create with default settings
      notificationSetting = this.notificationSettingRepository.create({
        userId,
        emailEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        pushEnabled: false,
        preferences: {
          newCustomer: true,
          newInvoice: true,
          paymentReceived: true,
          lowTokens: true,
          securityAlerts: true
        }
      });
      await this.notificationSettingRepository.save(notificationSetting);
    }

    return notificationSetting;
  }

  async updateNotificationChannels(userId: string, channelsDto: NotificationChannelsDto): Promise<NotificationSetting> {
    let notificationSetting = await this.getNotificationSettings(userId);

    notificationSetting.emailEnabled = channelsDto.emailEnabled;
    notificationSetting.smsEnabled = channelsDto.smsEnabled;
    notificationSetting.inAppEnabled = channelsDto.inAppEnabled;
    notificationSetting.pushEnabled = channelsDto.pushEnabled;

    return this.notificationSettingRepository.save(notificationSetting);
  }

  async updateNotificationPreferences(userId: string, preferencesDto: NotificationPreferencesDto): Promise<NotificationSetting> {
    let notificationSetting = await this.getNotificationSettings(userId);

    notificationSetting.preferences = preferencesDto.preferences;

    return this.notificationSettingRepository.save(notificationSetting);
  }

  // System Settings
  async getAllSystemSettings(): Promise<SystemSettingsResponseDto> {
    const settingsEntities = await this.systemSettingRepository.find();
    const settingsMap: Record<string, any> = {};

    // Initialize with defaults
    const defaultSettings: SystemSettingsResponseDto = {
      general: {
        companyName: 'Wanzobe',
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        logoUrl: null,
        primaryColor: null,
        secondaryColor: null
      },
      security: {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          expiryDays: 90
        },
        twoFactorEnabledGlobally: false,
        defaultTwoFactorMethods: ['email', 'authenticator'],
        sessionTimeout: 30
      },
      notifications: {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: false,
        inAppEnabled: true,
        defaultNotificationPreferences: {
          newCustomer: true,
          newInvoice: true,
          paymentReceived: true,
          lowTokens: true,
          securityAlerts: true
        }
      },
      billing: {
        defaultCurrency: 'USD',
        taxRate: null,
        defaultPaymentMethods: ['credit_card', 'bank_transfer'],
        invoiceDueDays: 14,
        invoiceNotes: null,
        autoGenerateInvoices: true
      },
      appearance: {
        defaultTheme: 'light',
        allowUserThemeOverride: true,
        density: 'comfortable',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        customCss: null
      }
    };

    // Map settings from database
    for (const setting of settingsEntities) {
      settingsMap[setting.section] = setting.settings;
    }

    // Merge defaults with database settings
    return {
      general: { ...defaultSettings.general, ...settingsMap.general },
      security: { ...defaultSettings.security, ...settingsMap.security },
      notifications: { ...defaultSettings.notifications, ...settingsMap.notifications },
      billing: { ...defaultSettings.billing, ...settingsMap.billing },
      appearance: { ...defaultSettings.appearance, ...settingsMap.appearance }
    };
  }

  async getSystemSettingsBySection(section: SystemSettingSection): Promise<any> {
    if (!Object.values(SystemSettingSection).includes(section)) {
      throw new BadRequestException(`Invalid section: ${section}`);
    }

    const settings = await this.systemSettingRepository.findOne({
      where: { section }
    });

    if (!settings) {
      // Return default settings for this section
      const allDefaults = await this.getAllSystemSettings();
      return allDefaults[section];
    }

    return settings.settings;
  }

  async updateSystemSettings(section: SystemSettingSection, updateDto: UpdateSystemSettingDto): Promise<any> {
    if (!Object.values(SystemSettingSection).includes(section)) {
      throw new BadRequestException(`Invalid section: ${section}`);
    }

    let settings = await this.systemSettingRepository.findOne({
      where: { section }
    });

    if (!settings) {
      settings = this.systemSettingRepository.create({
        section,
        settings: updateDto.settings
      });
    } else {
      settings.settings = { ...settings.settings, ...updateDto.settings };
    }

    await this.systemSettingRepository.save(settings);
    return settings.settings;
  }
}
