import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSettings } from '../entities/user-settings.entity';
import { User } from '../entities/user.entity';
import {
  ModernUserSettingsDto,
  UpdateUserSettingsDto,
  UserNotificationPreferencesDto,
  UpdateNotificationPreferencesDto
} from '../dto/user.dto';

@Injectable()
export class UserSettingsService {
  constructor(
    @InjectRepository(UserSettings)
    private readonly userSettingsRepository: Repository<UserSettings>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  /**
   * Récupérer les paramètres d'un utilisateur
   */
  async getUserSettings(userId: string): Promise<ModernUserSettingsDto> {
    // Vérifier que l'utilisateur existe
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ['userSettings']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Si l'utilisateur n'a pas de paramètres, créer des paramètres par défaut
    if (!user.userSettings) {
      const defaultSettings = await this.createDefaultSettings(userId);
      return this.mapToDto(defaultSettings);
    }

    return this.mapToDto(user.userSettings);
  }

  /**
   * Mettre à jour les paramètres d'un utilisateur
   */
  async updateUserSettings(
    userId: string, 
    updateData: UpdateUserSettingsDto
  ): Promise<ModernUserSettingsDto> {
    // Vérifier que l'utilisateur existe
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ['userSettings']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let userSettings = user.userSettings;

    // Si l'utilisateur n'a pas de paramètres, en créer
    if (!userSettings) {
      userSettings = await this.createDefaultSettings(userId);
    }

    // Mettre à jour les paramètres
    if (updateData.notifications) {
      if (updateData.notifications.email) {
        userSettings.notifications.email = {
          ...userSettings.notifications.email,
          marketing: updateData.notifications.email.marketingEmails ?? userSettings.notifications.email.marketing,
          security: updateData.notifications.email.securityAlerts ?? userSettings.notifications.email.security,
          updates: updateData.notifications.email.systemUpdates ?? userSettings.notifications.email.updates,
          billing: updateData.notifications.email.subscriptionAlerts ?? userSettings.notifications.email.billing
        };
      }
      
      if (updateData.notifications.sms) {
        userSettings.notifications.sms = {
          ...userSettings.notifications.sms,
          security: updateData.notifications.sms.loginAlerts ?? userSettings.notifications.sms.security,
          billing: updateData.notifications.sms.subscriptionExpiry ?? userSettings.notifications.sms.billing,
          alerts: updateData.notifications.sms.criticalAlerts ?? userSettings.notifications.sms.alerts
        };
      }
      
      if (updateData.notifications.inApp) {
        userSettings.notifications.push = {
          ...userSettings.notifications.push,
          enabled: updateData.notifications.inApp.taskReminders ?? userSettings.notifications.push.enabled,
          marketing: updateData.notifications.inApp.featureAnnouncements ?? userSettings.notifications.push.marketing,
          updates: updateData.notifications.inApp.systemNotifications ?? userSettings.notifications.push.updates
        };
      }
    }

    if (updateData.privacy) {
      userSettings.privacy = {
        profileVisibility: (updateData.privacy.profileVisibility as any) ?? userSettings.privacy.profileVisibility,
        dataSharing: updateData.privacy.thirdPartySharing ?? userSettings.privacy.dataSharing,
        analyticsOptOut: updateData.privacy.analyticsConsent !== undefined 
          ? !updateData.privacy.analyticsConsent 
          : userSettings.privacy.analyticsOptOut
      };
    }

    if (updateData.display) {
      userSettings.display = {
        theme: (updateData.display.theme as any) ?? userSettings.display.theme,
        language: (updateData.display.language as any) ?? userSettings.display.language,
        timezone: updateData.display.timezone ?? userSettings.display.timezone,
        dateFormat: (updateData.display.dateFormat?.toLowerCase().replace(/\//g, '/') as any) ?? userSettings.display.dateFormat,
        currency: (updateData.display.currency as any) ?? userSettings.display.currency
      };
    }

    if (updateData.security) {
      userSettings.security = {
        twoFactorEnabled: updateData.security.twoFactorEnabled ?? userSettings.security.twoFactorEnabled,
        loginNotifications: updateData.security.loginNotifications ?? userSettings.security.loginNotifications,
        sessionTimeout: updateData.security.sessionTimeout 
          ? Math.floor(updateData.security.sessionTimeout / 60) // Convert seconds to minutes
          : userSettings.security.sessionTimeout,
        allowedIpAddresses: updateData.security.ipWhitelist ?? userSettings.security.allowedIpAddresses
      };
    }

    // Sauvegarder les modifications
    const updatedSettings = await this.userSettingsRepository.save(userSettings);

    return this.mapToDto(updatedSettings);
  }

  /**
   * Récupérer les préférences de notification spécifiquement
   */
  async getNotificationPreferences(userId: string): Promise<UserNotificationPreferencesDto> {
    const settings = await this.getUserSettings(userId);
    return {
      email: settings.notifications.email,
      sms: settings.notifications.sms,
      inApp: settings.notifications.inApp
    };
  }

  /**
   * Mettre à jour les préférences de notification
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: UpdateNotificationPreferencesDto
  ): Promise<UserNotificationPreferencesDto> {
    const updateData: UpdateUserSettingsDto = {
      notifications: {
        email: preferences.email,
        sms: preferences.sms,
        inApp: preferences.inApp
      }
    };

    const updatedSettings = await this.updateUserSettings(userId, updateData);
    
    return {
      email: updatedSettings.notifications.email,
      sms: updatedSettings.notifications.sms,
      inApp: updatedSettings.notifications.inApp
    };
  }

  /**
   * Réinitialiser les paramètres aux valeurs par défaut
   */
  async resetToDefaults(userId: string): Promise<ModernUserSettingsDto> {
    // Vérifier que l'utilisateur existe
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ['userSettings']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Supprimer les anciens paramètres s'ils existent
    if (user.userSettings) {
      await this.userSettingsRepository.remove(user.userSettings);
    }

    // Créer de nouveaux paramètres par défaut
    const defaultSettings = await this.createDefaultSettings(userId);
    return this.mapToDto(defaultSettings);
  }

  /**
   * Exporter les paramètres utilisateur
   */
  async exportUserSettings(userId: string): Promise<{
    userId: string;
    exportedAt: string;
    settings: ModernUserSettingsDto;
  }> {
    const settings = await this.getUserSettings(userId);
    
    return {
      userId,
      exportedAt: new Date().toISOString(),
      settings
    };
  }

  /**
   * Importer des paramètres utilisateur
   */
  async importUserSettings(
    userId: string,
    settingsData: ModernUserSettingsDto
  ): Promise<ModernUserSettingsDto> {
    try {
      // Valider les données importées
      this.validateSettingsData(settingsData);

      // Convertir en UpdateUserSettingsDto
      const updateData: UpdateUserSettingsDto = {
        notifications: settingsData.notifications,
        privacy: settingsData.privacy,
        display: settingsData.display,
        security: settingsData.security
      };

      return await this.updateUserSettings(userId, updateData);
    } catch (error) {
      throw new BadRequestException('Invalid settings data for import');
    }
  }

  /**
   * Valider la cohérence des paramètres
   */
  async validateUserSettings(userId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const settings = await this.getUserSettings(userId);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifications de cohérence
    if (settings.security.twoFactorEnabled && !settings.notifications.sms.loginAlerts) {
      warnings.push('Two-factor authentication is enabled but SMS login alerts are disabled');
    }

    if (settings.privacy.dataProcessingConsent === false && settings.notifications.email.marketingEmails === true) {
      warnings.push('Data processing consent is disabled but marketing emails are enabled');
    }

    if (settings.display.timezone && !this.isValidTimezone(settings.display.timezone)) {
      errors.push('Invalid timezone specified');
    }

    if (settings.display.language && !this.isValidLanguage(settings.display.language)) {
      errors.push('Invalid language specified');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Obtenir l'historique des modifications de paramètres
   */
  async getSettingsHistory(userId: string): Promise<{
    changes: {
      date: string;
      section: string;
      field: string;
      oldValue: any;
      newValue: any;
      changedBy: string;
    }[];
  }> {
    // Cette fonctionnalité nécessiterait un système d'audit
    // Pour l'instant, retourner un tableau vide
    return { changes: [] };
  }

  // ===== MÉTHODES PRIVÉES =====

  /**
   * Créer des paramètres par défaut pour un utilisateur
   */
  private async createDefaultSettings(userId: string): Promise<UserSettings> {
    const defaultSettings = this.userSettingsRepository.create({
      userId,
      notifications: {
        email: {
          marketing: false,
          security: true,
          updates: true,
          billing: true
        },
        sms: {
          security: true,
          billing: true,
          alerts: false
        },
        push: {
          enabled: true,
          marketing: false,
          updates: true
        }
      },
      privacy: {
        profileVisibility: 'private',
        dataSharing: false,
        analyticsOptOut: false
      },
      display: {
        theme: 'light',
        language: 'fr',
        dateFormat: 'dd/mm/yyyy',
        currency: 'USD',
        timezone: 'Africa/Kinshasa'
      },
      security: {
        twoFactorEnabled: false,
        loginNotifications: true,
        sessionTimeout: 30,
        allowedIpAddresses: []
      }
    });

    return await this.userSettingsRepository.save(defaultSettings);
  }

  /**
   * Mapper une entité UserSettings vers un DTO
   */
  private mapToDto(settings: UserSettings): ModernUserSettingsDto {
    return {
      notifications: {
        email: {
          systemUpdates: settings.notifications.email.updates,
          subscriptionAlerts: settings.notifications.email.billing,
          tokenUsageAlerts: settings.notifications.email.billing,
          securityAlerts: settings.notifications.email.security,
          marketingEmails: settings.notifications.email.marketing,
          weeklyReports: settings.notifications.email.updates,
          monthlyReports: settings.notifications.email.updates
        },
        sms: {
          criticalAlerts: settings.notifications.sms.alerts,
          subscriptionExpiry: settings.notifications.sms.billing,
          tokenDepletion: settings.notifications.sms.billing,
          loginAlerts: settings.notifications.sms.security
        },
        inApp: {
          systemNotifications: settings.notifications.push.updates,
          featureAnnouncements: settings.notifications.push.marketing,
          usageReports: settings.notifications.push.updates,
          taskReminders: settings.notifications.push.enabled
        }
      },
      privacy: {
        profileVisibility: settings.privacy.profileVisibility,
        dataProcessingConsent: !settings.privacy.analyticsOptOut,
        marketingConsent: settings.privacy.dataSharing,
        analyticsConsent: !settings.privacy.analyticsOptOut,
        thirdPartySharing: settings.privacy.dataSharing,
        dataRetentionPeriod: 'standard'
      },
      display: {
        theme: settings.display.theme,
        language: settings.display.language,
        timezone: settings.display.timezone,
        dateFormat: settings.display.dateFormat.toUpperCase().replace(/\//g, '/'),
        numberFormat: 'french',
        currency: settings.display.currency
      },
      security: {
        twoFactorEnabled: settings.security.twoFactorEnabled,
        sessionTimeout: settings.security.sessionTimeout * 60, // Convert minutes to seconds
        passwordStrength: 'medium',
        loginNotifications: settings.security.loginNotifications,
        deviceTracking: true,
        ipWhitelist: settings.security.allowedIpAddresses || []
      },
      lastUpdated: settings.updatedAt.toISOString()
    };
  }

  /**
   * Valider les données de paramètres
   */
  private validateSettingsData(data: ModernUserSettingsDto): void {
    if (!data.notifications || !data.privacy || !data.display || !data.security) {
      throw new Error('Missing required settings sections');
    }

    // Validation spécifique pour chaque section
    if (data.display.timezone && !this.isValidTimezone(data.display.timezone)) {
      throw new Error('Invalid timezone');
    }

    if (data.display.language && !this.isValidLanguage(data.display.language)) {
      throw new Error('Invalid language');
    }

    if (data.security.sessionTimeout < 300 || data.security.sessionTimeout > 86400) {
      throw new Error('Session timeout must be between 5 minutes and 24 hours');
    }
  }

  /**
   * Valider un fuseau horaire
   */
  private isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Valider un code de langue
   */
  private isValidLanguage(language: string): boolean {
    const supportedLanguages = ['fr', 'en', 'es', 'pt'];
    return supportedLanguages.includes(language);
  }

  /**
   * Obtenir les paramètres par défaut sans les sauvegarder
   */
  getDefaultSettings(): ModernUserSettingsDto {
    return {
      notifications: {
        email: {
          systemUpdates: true,
          subscriptionAlerts: true,
          tokenUsageAlerts: true,
          securityAlerts: true,
          marketingEmails: false,
          weeklyReports: true,
          monthlyReports: true
        },
        sms: {
          criticalAlerts: false,
          subscriptionExpiry: true,
          tokenDepletion: true,
          loginAlerts: true
        },
        inApp: {
          systemNotifications: true,
          featureAnnouncements: false,
          usageReports: true,
          taskReminders: true
        }
      },
      privacy: {
        profileVisibility: 'private',
        dataProcessingConsent: true,
        marketingConsent: false,
        analyticsConsent: true,
        thirdPartySharing: false,
        dataRetentionPeriod: 'standard'
      },
      display: {
        theme: 'light',
        language: 'fr',
        timezone: 'Africa/Kinshasa',
        dateFormat: 'dd/mm/yyyy',
        numberFormat: 'french',
        currency: 'USD'
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeout: 1800, // 30 minutes in seconds
        passwordStrength: 'medium',
        loginNotifications: true,
        deviceTracking: true,
        ipWhitelist: []
      },
      lastUpdated: new Date().toISOString()
    };
  }
}