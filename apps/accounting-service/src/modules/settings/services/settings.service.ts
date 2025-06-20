import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountingSettings } from '../entities/accounting-settings.entity';
import { UserSettings } from '../entities/user-settings.entity';
import { IntegrationsSettings } from '../entities/integrations-settings.entity';
import { SettingsDto } from '../dtos/settings.dto';
import { UpdateGeneralSettingsDto } from '../dtos/update-general-settings.dto';
import { UpdateAccountingSettingsDto } from '../dtos/update-accounting-settings.dto';
import { UpdateSecuritySettingsDto } from '../dtos/update-security-settings.dto';
import { UpdateNotificationsSettingsDto } from '../dtos/update-notifications-settings.dto';
import { UpdateIntegrationsSettingsDto } from '../dtos/update-integrations-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AccountingSettings)
    private accountingSettingsRepository: Repository<AccountingSettings>,
    @InjectRepository(UserSettings)
    private userSettingsRepository: Repository<UserSettings>,
    @InjectRepository(IntegrationsSettings)
    private integrationsSettingsRepository: Repository<IntegrationsSettings>,
  ) {}

  async getAllSettings(companyId: string, userId: string): Promise<SettingsDto> {
    const accountingSettings = await this.getOrCreateAccountingSettings(companyId);
    const userSettings = await this.getOrCreateUserSettings(userId);
    const integrationsSettings = await this.getOrCreateIntegrationsSettings(companyId);

    return {
      general: {
        language: userSettings.language,
        dateFormat: userSettings.dateFormat,
        timezone: userSettings.timezone,
        theme: userSettings.theme,
      },
      accounting: {
        defaultJournal: accountingSettings.defaultJournal,
        autoNumbering: accountingSettings.autoNumbering,
        voucherPrefix: accountingSettings.voucherPrefix,
        fiscalYearPattern: accountingSettings.fiscalYearPattern,
        accountingFramework: accountingSettings.accountingFramework,
        accountingLevels: accountingSettings.accountingLevels as any,
      },
      security: {
        twoFactorEnabled: userSettings.twoFactorEnabled,
        passwordPolicy: userSettings.passwordPolicy as any,
        sessionTimeout: userSettings.sessionTimeout,
        auditLogRetention: 90, // This seems to be a fixed value in the doc
      },
      notifications: userSettings.notifications as any,
      integrations: {
        googleDrive: integrationsSettings.googleDrive as any,
        ksPay: integrationsSettings.ksPay as any,
        slack: integrationsSettings.slack as any,
      },
    };
  }

  async updateGeneralSettings(userId: string, dto: UpdateGeneralSettingsDto): Promise<any> {
    const settings = await this.getOrCreateUserSettings(userId);
    const updatedSettings = this.userSettingsRepository.merge(settings, dto);
    return this.userSettingsRepository.save(updatedSettings);
  }

  async updateAccountingSettings(companyId: string, dto: UpdateAccountingSettingsDto): Promise<any> {
    const settings = await this.getOrCreateAccountingSettings(companyId);
    const updatedSettings = this.accountingSettingsRepository.merge(settings, dto);
    return this.accountingSettingsRepository.save(updatedSettings);
  }

  async updateSecuritySettings(userId: string, dto: UpdateSecuritySettingsDto): Promise<any> {
    const settings = await this.getOrCreateUserSettings(userId);
    const updatedSettings = this.userSettingsRepository.merge(settings, dto);
    return this.userSettingsRepository.save(updatedSettings);
  }

  async updateNotificationsSettings(userId: string, dto: UpdateNotificationsSettingsDto): Promise<any> {
    const settings = await this.getOrCreateUserSettings(userId);
    const currentNotifications = settings.notifications as object;
    const updatedNotifications = { ...currentNotifications, ...dto };
    settings.notifications = updatedNotifications;
    return this.userSettingsRepository.save(settings);
  }

  async updateIntegrationsSettings(companyId: string, dto: UpdateIntegrationsSettingsDto): Promise<any> {
    const settings = await this.getOrCreateIntegrationsSettings(companyId);
    const currentIntegrations = {
        googleDrive: settings.googleDrive,
        ksPay: settings.ksPay,
        slack: settings.slack
    };
    const updatedIntegrations = { ...currentIntegrations, ...dto };
    const finalSettings = this.integrationsSettingsRepository.merge(settings, updatedIntegrations);
    return this.integrationsSettingsRepository.save(finalSettings);
  }

  private async getOrCreateUserSettings(userId: string): Promise<UserSettings> {
    let settings = await this.userSettingsRepository.findOne({ where: { userId } });
    if (!settings) {
      settings = this.userSettingsRepository.create({ userId });
      await this.userSettingsRepository.save(settings);
    }
    return settings;
  }

  private async getOrCreateAccountingSettings(companyId: string): Promise<AccountingSettings> {
    let settings = await this.accountingSettingsRepository.findOne({ where: { companyId } });
    if (!settings) {
      settings = this.accountingSettingsRepository.create({ companyId });
      await this.accountingSettingsRepository.save(settings);
    }
    return settings;
  }

  private async getOrCreateIntegrationsSettings(companyId: string): Promise<IntegrationsSettings> {
    let settings = await this.integrationsSettingsRepository.findOne({ where: { companyId } });
    if (!settings) {
      settings = this.integrationsSettingsRepository.create({ companyId });
      await this.integrationsSettingsRepository.save(settings);
    }
    return settings;
  }
}
