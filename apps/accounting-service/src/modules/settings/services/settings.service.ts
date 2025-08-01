import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountingSettings } from '../entities/accounting-settings.entity';
import { UserSettings } from '../entities/user-settings.entity';
import { IntegrationsSettings } from '../entities/integrations-settings.entity';
import { DataSource, DataSourceType, DataSourceStatus } from '../entities/data-source.entity';
import { SettingsDto } from '../dtos/settings.dto';
import { UpdateGeneralSettingsDto } from '../dtos/update-general-settings.dto';
import { UpdateAccountingSettingsDto } from '../dtos/update-accounting-settings.dto';
import { UpdateSecuritySettingsDto } from '../dtos/update-security-settings.dto';
import { UpdateNotificationsSettingsDto } from '../dtos/update-notifications-settings.dto';
import { UpdateIntegrationsSettingsDto } from '../dtos/update-integrations-settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(AccountingSettings)
    private accountingSettingsRepository: Repository<AccountingSettings>,
    @InjectRepository(UserSettings)
    private userSettingsRepository: Repository<UserSettings>,
    @InjectRepository(IntegrationsSettings)
    private integrationsSettingsRepository: Repository<IntegrationsSettings>,
    @InjectRepository(DataSource)
    private dataSourceRepository: Repository<DataSource>,
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

  /**
   * Vérifie si une source de données spécifique est activée pour une entreprise
   * @param companyId ID de l'entreprise
   * @param sourceName Nom de la source (ex: "commerce_operations")
   * @returns true si la source est activée, false sinon
   */
  async isDataSourceEnabled(companyId: string, sourceName: string): Promise<boolean> {
    try {
      const dataSource = await this.dataSourceRepository.findOne({
        where: {
          companyId,
          name: sourceName
        }
      });

      // Si la source n'existe pas, considérer qu'elle n'est pas activée
      if (!dataSource) {
        this.logger.debug(`Data source ${sourceName} not found for company ${companyId}`);
        return false;
      }

      // Vérifier si la source est active
      return dataSource.status === DataSourceStatus.ACTIVE;
    } catch (error: any) {
      this.logger.error(`Error checking data source status: ${error.message || 'Unknown error'}`, error.stack || '');
      // En cas d'erreur, par défaut ne pas autoriser l'accès
      return false;
    }
  }

  /**
   * Obtient toutes les sources de données pour une entreprise
   * @param companyId ID de l'entreprise
   * @returns Liste des sources de données
   */
  async getDataSources(companyId: string): Promise<DataSource[]> {
    return this.dataSourceRepository.find({
      where: { companyId }
    });
  }

  /**
   * Active une source de données pour une entreprise
   * @param companyId ID de l'entreprise
   * @param sourceName Nom de la source
   * @param userId ID de l'utilisateur qui effectue l'action
   * @returns La source de données activée
   */
  async enableDataSource(companyId: string, sourceName: string, userId: string): Promise<DataSource> {
    let dataSource = await this.dataSourceRepository.findOne({
      where: {
        companyId,
        name: sourceName
      }
    });

    if (!dataSource) {
      // Si la source n'existe pas, la créer
      dataSource = this.dataSourceRepository.create({
        companyId,
        name: sourceName,
        type: sourceName.includes('commerce') ? DataSourceType.EXTERNAL : DataSourceType.INTERNAL,
        status: DataSourceStatus.ACTIVE,
        createdBy: userId,
        lastUpdated: new Date()
      });
    } else {
      // Si elle existe, l'activer
      dataSource.status = DataSourceStatus.ACTIVE;
      dataSource.lastUpdated = new Date();
    }

    return this.dataSourceRepository.save(dataSource);
  }

  /**
   * Désactive une source de données pour une entreprise
   * @param companyId ID de l'entreprise
   * @param sourceName Nom de la source
   * @returns La source de données désactivée
   */
  async disableDataSource(companyId: string, sourceName: string): Promise<DataSource> {
    const dataSource = await this.dataSourceRepository.findOne({
      where: {
        companyId,
        name: sourceName
      }
    });

    if (!dataSource) {
      throw new NotFoundException(`Data source ${sourceName} not found for company ${companyId}`);
    }

    dataSource.status = DataSourceStatus.INACTIVE;
    dataSource.lastUpdated = new Date();

    return this.dataSourceRepository.save(dataSource);
  }
}
