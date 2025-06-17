import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  AdminProfile, 
  SecuritySetting, 
  SystemSetting,
  ActiveSession,
  LoginHistory,
  NotificationPreference,
  ApplicationSetting 
} from '../entities/settings.entity';
import {
  AllSettingsDto,
  GeneralSettingsDto,
  SecuritySettingsDto,
  NotificationSettingsDto,
  BillingSettingsDto,
  AppearanceSettingsDto,
  UserProfileDto,
  UpdateUserProfileDto,
  ChangePasswordDto,
  TwoFactorSettingsDto,
  ActiveSessionsResponseDto,
  LoginHistoryResponseDto,
  NotificationPreferencesResponseDto,
  UpdateNotificationPreferenceDto,
  UpdateAllNotificationPreferencesDto,
  UpdateSettingDto,
  AppSettingsResponseDto
} from '../dtos/settings.dto';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AdminProfile)
    private adminProfileRepository: Repository<AdminProfile>,
    @InjectRepository(SecuritySetting)
    private securitySettingRepository: Repository<SecuritySetting>,
    @InjectRepository(SystemSetting)
    private systemSettingRepository: Repository<SystemSetting>,
    @InjectRepository(ActiveSession)
    private activeSessionRepository: Repository<ActiveSession>,
    @InjectRepository(LoginHistory)
    private loginHistoryRepository: Repository<LoginHistory>,
    @InjectRepository(NotificationPreference)
    private notificationPreferenceRepository: Repository<NotificationPreference>,
    @InjectRepository(ApplicationSetting)
    private applicationSettingRepository: Repository<ApplicationSetting>
  ) {}

  /* System Settings Methods */

  async getAllSettings(): Promise<AllSettingsDto> {
    const general = await this.getSettingsBySection('general');
    const security = await this.getSettingsBySection('security');
    const notifications = await this.getSettingsBySection('notifications');
    const billing = await this.getSettingsBySection('billing');
    const appearance = await this.getSettingsBySection('appearance');

    return { general, security, notifications, billing, appearance };
  }

  async getSettingsBySection(section: string): Promise<any> {
    const validSections = ['general', 'security', 'notifications', 'billing', 'appearance'];
    
    if (!validSections.includes(section)) {
      throw new BadRequestException(`Invalid section: ${section}`);
    }

    const settings = await this.systemSettingRepository.findOne({
      where: { section }
    });

    if (!settings) {
      // Return default settings for this section
      return this.getDefaultSettings(section);
    }

    return settings.settings;
  }

  async updateSettings(section: string, updateDto: Record<string, any>): Promise<any> {
    const validSections = ['general', 'security', 'notifications', 'billing', 'appearance'];
    
    if (!validSections.includes(section)) {
      throw new BadRequestException(`Invalid section: ${section}`);
    }

    let settings = await this.systemSettingRepository.findOne({
      where: { section }
    });

    if (!settings) {
      settings = this.systemSettingRepository.create({
        section,
        settings: updateDto
      });
    } else {
      settings.settings = updateDto;
    }

    await this.systemSettingRepository.save(settings);
    return settings.settings;
  }

  private getDefaultSettings(section: string): any {
    const defaults: { [key: string]: any } = {
      general: {
        companyName: "Wanzo Admin",
        language: "fr",
        timezone: "Africa/Kinshasa",
        dateFormat: "DD/MM/YYYY",
        logoUrl: "https://example.com/logo.png",
        primaryColor: "#3B82F6",
        secondaryColor: "#10B981"
      },
      security: {
        passwordPolicy: {
          minLength: 10,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          expiryDays: 90
        },
        twoFactorEnabled: true,
        twoFactorMethods: ["email", "authenticator"],
        sessionTimeout: 30
      },
      notifications: {
        email: true,
        sms: false,
        push: true,
        inApp: true,
        notifyOn: {
          newCustomer: true,
          newInvoice: true,
          paymentReceived: true,
          lowTokens: true,
          securityAlerts: true
        }
      },
      billing: {
        defaultCurrency: "USD",
        taxRate: 16,
        paymentMethods: ["credit_card", "bank_transfer", "mobile_money"],
        invoiceDueDays: 15,
        invoiceNotes: "Paiement attendu dans les 15 jours.",
        autoGenerateInvoices: true
      },
      appearance: {
        theme: "system",
        density: "comfortable",
        fontFamily: "Inter",
        fontSize: "medium",
        customCss: null as string | null
      }
    };

    return defaults[section];
  }

  /* User Profile Methods */

  async getUserProfile(adminId: string): Promise<UserProfileDto> {
    const profile = await this.getOrCreateAdminProfile(adminId);
    
    // In a real implementation, we would fetch user data from the auth service
    // This is a simplified version
    return {
      id: adminId,
      name: profile.name,
      email: `admin_${adminId.slice(0, 8)}@example.com`,
      phoneNumber: profile.phoneNumber || '',
      position: profile.position || '',
      avatarUrl: profile.avatarUrl || '',
      role: 'admin', // This would come from the auth service
      language: profile.language,
      timezone: profile.timezone,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString()
    };
  }

  async updateUserProfile(adminId: string, updateDto: UpdateUserProfileDto): Promise<UserProfileDto> {
    const profile = await this.getOrCreateAdminProfile(adminId);

    // Update fields if they exist in the DTO
    if (updateDto.name !== undefined) profile.name = updateDto.name;
    if (updateDto.phoneNumber !== undefined) profile.phoneNumber = updateDto.phoneNumber;
    if (updateDto.position !== undefined) profile.position = updateDto.position;
    if (updateDto.language !== undefined) profile.language = updateDto.language;
    if (updateDto.timezone !== undefined) profile.timezone = updateDto.timezone;

    await this.adminProfileRepository.save(profile);
    return this.getUserProfile(adminId);
  }

  async updateAvatar(adminId: string, file: Express.Multer.File): Promise<{ avatarUrl: string; message: string }> {
    const profile = await this.getOrCreateAdminProfile(adminId);

    // In a real implementation, we might store the file in a cloud storage
    // For now, we'll just store the file path
    const relativePath = `/uploads/avatars/${file.filename}`;
    profile.avatarUrl = relativePath;

    await this.adminProfileRepository.save(profile);
    return { 
      avatarUrl: relativePath,
      message: 'Avatar updated successfully.'
    };
  }

  private async getOrCreateAdminProfile(adminId: string): Promise<AdminProfile> {
    let profile = await this.adminProfileRepository.findOne({
      where: { adminId }
    });

    if (!profile) {
      profile = this.adminProfileRepository.create({
        adminId,
        name: 'New Admin',
        language: 'fr',
        timezone: 'Africa/Kinshasa'
      });
      await this.adminProfileRepository.save(profile);
    }

    return profile;
  }

  /* Security Settings Methods */

  async getTwoFactorSettings(adminId: string): Promise<TwoFactorSettingsDto> {
    const securitySetting = await this.getOrCreateSecuritySetting(adminId);
    return { enabled: securitySetting.twoFactorEnabled };
  }

  async enableTwoFactor(adminId: string, token: string): Promise<{ success: boolean }> {
    // In a real app, verify the token from the authenticator app
    const securitySetting = await this.getOrCreateSecuritySetting(adminId);
    securitySetting.twoFactorEnabled = true;
    await this.securitySettingRepository.save(securitySetting);
    return { success: true };
  }

  async disableTwoFactor(adminId: string, token: string): Promise<{ success: boolean }> {
    // In a real app, you might require a password or 2FA code to disable
    const securitySetting = await this.getOrCreateSecuritySetting(adminId);
    securitySetting.twoFactorEnabled = false;
    await this.securitySettingRepository.save(securitySetting);
    return { success: true };
  }

  async getUserSecuritySettings(adminId: string): Promise<{ twoFactorEnabled: boolean }> {
    const securitySetting = await this.getOrCreateSecuritySetting(adminId);
    return { twoFactorEnabled: securitySetting.twoFactorEnabled };
  }

  async updateTwoFactorSettings(adminId: string, twoFactorDto: TwoFactorSettingsDto): Promise<{ twoFactorEnabled: boolean }> {
    const securitySetting = await this.getOrCreateSecuritySetting(adminId);
    securitySetting.twoFactorEnabled = twoFactorDto.enabled;
    
    await this.securitySettingRepository.save(securitySetting);
    return { twoFactorEnabled: securitySetting.twoFactorEnabled };
  }

  async changePassword(adminId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    // In a real implementation, we would verify the current password with the auth service
    // This is a simplified mock implementation
    if (currentPassword === 'wrong_password') {
      throw new BadRequestException('Current password is incorrect');
    }

    // In a real implementation, we would update the password in the auth service
    // For now, we'll just return a success message
    return { message: 'Password changed successfully.' };
  }

  async getActiveSessions(adminId: string): Promise<ActiveSessionsResponseDto> {
    const sessions = await this.activeSessionRepository.find({
      where: { adminId },
      order: { lastActive: 'DESC' }
    });

    return {
      sessions: sessions.map(session => ({
        id: session.id,
        device: session.device,
        location: session.location || '',
        ipAddress: session.ipAddress,
        lastActive: session.lastActive.toISOString(),
        isCurrent: session.isCurrent,
        browser: session.browser,
        os: session.os
      }))
    };
  }

  async revokeSession(adminId: string, sessionId: string): Promise<{ message: string }> {
    const session = await this.activeSessionRepository.findOne({
      where: { id: sessionId, adminId }
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.isCurrent) {
      throw new BadRequestException('Cannot terminate current session');
    }

    await this.activeSessionRepository.remove(session);
    return { message: 'Session terminated successfully.' };
  }

  async terminateAllOtherSessions(adminId: string): Promise<{ message: string }> {
    const sessions = await this.activeSessionRepository.find({
      where: { adminId, isCurrent: false }
    });

    await this.activeSessionRepository.remove(sessions);
    return { message: 'All other sessions terminated successfully.' };
  }

  async getLoginHistory(adminId: string, options: { page: number, limit: number }): Promise<LoginHistoryResponseDto> {
    const { page, limit } = options;
    const [history, total] = await this.loginHistoryRepository.findAndCount({
      where: { adminId },
      order: { date: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      history: history.map(entry => ({
        id: entry.id,
        date: entry.date.toISOString(),
        ipAddress: entry.ipAddress,
        device: entry.device,
        location: entry.location || '',
        status: entry.status,
        userAgent: entry.userAgent
      })),
      total,
      page,
      limit,
    };
  }

  private async getOrCreateSecuritySetting(adminId: string): Promise<SecuritySetting> {
    let securitySetting = await this.securitySettingRepository.findOne({
      where: { adminId }
    });

    if (!securitySetting) {
      securitySetting = this.securitySettingRepository.create({
        adminId,
        twoFactorEnabled: false
      });
      await this.securitySettingRepository.save(securitySetting);
    }

    return securitySetting;
  }

  /* Notification Preferences Methods */

  async getNotificationPreferences(adminId: string): Promise<NotificationPreferencesResponseDto> {
    await this.ensureDefaultNotificationPreferences(adminId);
    
    const preferences = await this.notificationPreferenceRepository.find({
      where: { adminId }
    });

    return {
      preferences: preferences.map(pref => ({
        id: pref.preferenceId,
        label: pref.label,
        description: pref.description,
        channel: pref.channel,
        type: pref.type,
        isEnabled: pref.isEnabled
      }))
    };
  }

  async updateNotificationPreference(
    adminId: string, 
    preferenceId: string, 
    isEnabled: boolean
  ): Promise<any> {
    const preference = await this.notificationPreferenceRepository.findOne({
      where: { adminId, preferenceId }
    });

    if (!preference) {
      throw new NotFoundException(`Notification preference with ID ${preferenceId} not found`);
    }

    preference.isEnabled = isEnabled;
    await this.notificationPreferenceRepository.save(preference);

    return {
      id: preference.preferenceId,
      label: preference.label,
      description: preference.description,
      channel: preference.channel,
      type: preference.type,
      isEnabled: preference.isEnabled
    };
  }

  async updateAllNotificationPreferences(
    adminId: string, 
    updateDto: UpdateAllNotificationPreferencesDto
  ): Promise<NotificationPreferencesResponseDto> {
    for (const item of updateDto.preferences) {
      const preference = await this.notificationPreferenceRepository.findOne({
        where: { adminId, preferenceId: item.id }
      });

      if (preference) {
        preference.isEnabled = item.isEnabled;
        await this.notificationPreferenceRepository.save(preference);
      }
    }

    return this.getNotificationPreferences(adminId);
  }

  private async ensureDefaultNotificationPreferences(adminId: string): Promise<void> {
    const count = await this.notificationPreferenceRepository.count({
      where: { adminId }
    });

    if (count === 0) {
      // Create default notification preferences
      const defaults = [
        {
          preferenceId: 'emailMarketing',
          label: 'Marketing Emails',
          description: 'Receive updates on new products and promotions.',
          channel: 'email' as const,
          type: 'marketing',
          isEnabled: true
        },
        {
          preferenceId: 'emailSecurity',
          label: 'Security Alerts',
          description: 'Receive alerts for important security events.',
          channel: 'email' as const,
          type: 'security',
          isEnabled: true
        },
        {
          preferenceId: 'pushActivity',
          label: 'Account Activity Push',
          description: 'Get push notifications for important account activities.',
          channel: 'push' as const,
          type: 'activity',
          isEnabled: true
        }
      ];

      for (const pref of defaults) {
        const newPref = this.notificationPreferenceRepository.create({
          adminId,
          ...pref
        });
        await this.notificationPreferenceRepository.save(newPref);
      }
    }
  }

  /* Application Settings Methods */

  async getApplicationSettings(): Promise<AppSettingsResponseDto> {
    await this.ensureDefaultApplicationSettings();
    
    const settings = await this.applicationSettingRepository.find();

    return {
      data: settings.map(setting => ({
        id: setting.settingId,
        name: setting.name,
        value: setting.value,
        description: setting.description,
        category: setting.category
      }))
    };
  }

  async updateApplicationSetting(settingId: string, updateDto: UpdateSettingDto): Promise<any> {
    const setting = await this.applicationSettingRepository.findOne({
      where: { settingId }
    });

    if (!setting) {
      throw new NotFoundException(`Setting with ID ${settingId} not found`);
    }

    setting.value = updateDto.value.toString();
    await this.applicationSettingRepository.save(setting);

    return {
      id: setting.settingId,
      name: setting.name,
      value: setting.value,
      description: setting.description,
      category: setting.category
    };
  }

  private async ensureDefaultApplicationSettings(): Promise<void> {
    const count = await this.applicationSettingRepository.count();

    if (count === 0) {
      // Create default application settings
      const defaults = [
        {
          settingId: 'max_file_size',
          name: 'Maximum File Size',
          value: '10',
          description: 'Maximum file size in MB for uploads',
          category: 'uploads'
        },
        {
          settingId: 'auto_logout',
          name: 'Auto Logout Time',
          value: '30',
          description: 'Minutes of inactivity before automatic logout',
          category: 'security'
        },
        {
          settingId: 'api_rate_limit',
          name: 'API Rate Limit',
          value: '100',
          description: 'Maximum API calls per minute',
          category: 'api'
        }
      ];

      for (const setting of defaults) {
        const newSetting = this.applicationSettingRepository.create(setting);
        await this.applicationSettingRepository.save(newSetting);
      }
    }
  }
}
