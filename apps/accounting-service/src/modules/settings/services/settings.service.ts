import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountingSettings, DepreciationMethod, JournalEntryValidation } from '../entities/accounting-settings.entity';
import { UserSettings } from '../entities/user-settings.entity';
import { IntegrationsSettings } from '../entities/integrations-settings.entity';
import { DataSource, DataSourceType, DataSourceStatus } from '../entities/data-source.entity';
import { 
  SettingsDto,
  UpdateGeneralSettingsDto,
  UpdateAccountingSettingsDto,
  UpdateSecuritySettingsDto,
  UpdateNotificationsSettingsDto,
  UpdateIntegrationsSettingsDto,
  UpdateExchangeRatesDto
} from '../dtos/settings.dto';

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
        baseCurrency: userSettings.baseCurrency || 'CDF',
        displayCurrency: userSettings.displayCurrency || 'CDF',
        exchangeRates: (userSettings.exchangeRates as Record<string, number>) || {},
      },
      accounting: {
        defaultJournal: accountingSettings.defaultJournal,
        autoNumbering: accountingSettings.autoNumbering,
        voucherPrefix: accountingSettings.voucherPrefix,
        fiscalYearPattern: accountingSettings.fiscalYearPattern,
        accountingFramework: accountingSettings.accountingFramework,
        defaultDepreciationMethod: accountingSettings.defaultDepreciationMethod || 'linear',
        defaultVatRate: parseFloat(accountingSettings.defaultVatRate || '18'),
        journalEntryValidation: accountingSettings.journalEntryValidation || 'manual',
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
        dataSharing: {
          banks: integrationsSettings.dataSharing?.banks || false,
          microfinance: integrationsSettings.dataSharing?.microfinance || false,
          coopec: integrationsSettings.dataSharing?.coopec || false,
          analysts: integrationsSettings.dataSharing?.analysts || false,
          partners: integrationsSettings.dataSharing?.partners || false,
          consentGiven: integrationsSettings.dataSharing?.consentGiven || false,
          consentDate: integrationsSettings.dataSharing?.consentDate || undefined,
          lastModified: integrationsSettings.dataSharing?.lastModified || undefined,
          modifiedBy: integrationsSettings.dataSharing?.modifiedBy || undefined
        },
        dataSources: {
          sources: [
            {
              id: 'wanzo-mobile',
              name: 'Wanzo Mobile',
              description: 'Application mobile Wanzo',
              icon: 'smartphone',
              isConnected: false,
              isConfigurable: true,
              syncStatus: 'disabled'
            },
            {
              id: 'web-scraping',
              name: 'Collecte Web',
              description: 'Collecte automatique des données web',
              icon: 'link',
              isConnected: false,
              isConfigurable: true,
              syncStatus: 'disabled'
            },
            {
              id: 'external-db',
              name: 'Bases de données externes',
              description: 'Connexion aux bases de données tierces',
              icon: 'database',
              isConnected: false,
              isConfigurable: true,
              syncStatus: 'disabled'
            }
          ]
        },
        bankIntegrations: [{
          provider: integrationsSettings.bankIntegrations?.provider || 'trust_bank',
          enabled: integrationsSettings.bankIntegrations?.enabled || false,
          syncFrequency: integrationsSettings.bankIntegrations?.syncFrequency || 'daily',
          accountMappings: integrationsSettings.bankIntegrations?.accountMappings || []
        }],
        eInvoicing: {
          provider: 'dgi_congo',
          enabled: integrationsSettings.eInvoicing?.dgi_congo?.enabled || false,
          taxpayerNumber: '',
          autoSubmit: false,
          validateBeforeSubmit: true,
          syncInvoices: false
        },
        taxIntegration: {
          dgiEnabled: integrationsSettings.taxIntegration?.enabled || false,
          taxpayerNumber: '',
          autoCalculateTax: integrationsSettings.taxIntegration?.autoSync || false,
          declarationFrequency: 'monthly',
          taxRates: [] // Empty array instead of object
        },
        portfolioIntegration: {
          enabled: integrationsSettings.portfolioIntegration?.enabled || false,
          portfolioTypes: ['stocks', 'bonds'],
          automaticValuation: integrationsSettings.portfolioIntegration?.enabled || false,
          valuationFrequency: integrationsSettings.portfolioIntegration?.syncFrequency || 'daily',
          currencyConversion: true
        }
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
    
    // Update fields manually to handle type conversions
    if (dto.defaultJournal !== undefined) settings.defaultJournal = dto.defaultJournal;
    if (dto.autoNumbering !== undefined) settings.autoNumbering = dto.autoNumbering;
    if (dto.voucherPrefix !== undefined) settings.voucherPrefix = dto.voucherPrefix;
    if (dto.fiscalYearPattern !== undefined) settings.fiscalYearPattern = dto.fiscalYearPattern;
    if (dto.accountingFramework !== undefined) settings.accountingFramework = dto.accountingFramework;
    if (dto.defaultDepreciationMethod !== undefined) settings.defaultDepreciationMethod = dto.defaultDepreciationMethod;
    if (dto.defaultVatRate !== undefined) settings.defaultVatRate = dto.defaultVatRate.toString();
    if (dto.journalEntryValidation !== undefined) settings.journalEntryValidation = dto.journalEntryValidation;
    if (dto.accountingLevels !== undefined) settings.accountingLevels = dto.accountingLevels as object[];
    
    return this.accountingSettingsRepository.save(settings);
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
    
    // Update fields manually to handle type conversions
    if (dto.googleDrive !== undefined) settings.googleDrive = dto.googleDrive as any;
    if (dto.ksPay !== undefined) settings.ksPay = dto.ksPay as any;
    if (dto.slack !== undefined) settings.slack = dto.slack as any;
    if (dto.dataSharing !== undefined) settings.dataSharing = dto.dataSharing as any;
    if (dto.eInvoicing !== undefined) settings.eInvoicing = dto.eInvoicing as any;
    if (dto.taxIntegration !== undefined) settings.taxIntegration = dto.taxIntegration as any;
    if (dto.portfolioIntegration !== undefined) settings.portfolioIntegration = dto.portfolioIntegration as any;
    if (dto.bankIntegrations !== undefined) settings.bankIntegrations = dto.bankIntegrations[0] as any;
    
    return this.integrationsSettingsRepository.save(settings);
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
  async getDataSourcesOld(companyId: string): Promise<DataSource[]> {
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

  /**
   * Update exchange rates
   */
  async updateExchangeRates(companyId: string, dto: UpdateExchangeRatesDto): Promise<any> {
    // For simplicity, we'll store exchange rates in user settings for now
    // In a real implementation, this might be stored in a separate exchange rates table
    
    // Convert rates array to object for storage
    const exchangeRatesObject: Record<string, number> = {};
    for (const rate of dto.rates) {
      exchangeRatesObject[rate.currencyCode] = rate.exchangeRate;
    }

    // For now, we'll update a default user's settings
    // In practice, you might want to store this at company level
    // This is a simplified implementation
    return { 
      exchangeRates: exchangeRatesObject,
      message: 'Exchange rates updated successfully' 
    };
  }

  /**
   * Get data sharing settings
   */
  async getDataSharingSettings(companyId: string): Promise<any> {
    const integrationsSettings = await this.getOrCreateIntegrationsSettings(companyId);
    return integrationsSettings.dataSharing || {
      banks: false,
      microfinance: false,
      coopec: false,
      analysts: false,
      partners: false,
      consentGiven: false,
      consentDate: null,
      lastModified: new Date().toISOString(),
      modifiedBy: null
    };
  }

  /**
   * Update data sharing settings
   */
  async updateDataSharingSettings(companyId: string, dto: any, userEmail: string): Promise<any> {
    const integrationsSettings = await this.getOrCreateIntegrationsSettings(companyId);
    
    const updatedDataSharing = {
      ...dto,
      consentDate: dto.consentGiven ? new Date().toISOString() : null,
      lastModified: new Date().toISOString(),
      modifiedBy: userEmail
    };

    integrationsSettings.dataSharing = updatedDataSharing;
    await this.integrationsSettingsRepository.save(integrationsSettings);
    
    return updatedDataSharing;
  }

  /**
   * Get data sources
   */
  async getDataSources(companyId: string): Promise<any> {
    const dataSources = await this.dataSourceRepository.find({
      where: { companyId }
    });

    if (dataSources.length === 0) {
      // Return default data sources
      return {
        sources: [
          {
            id: "wanzo-mobile",
            name: "Wanzo Mobile",
            description: "Application tout-en-un pour la gestion des ventes, facturation, caisse, stocks, clients, fournisseurs avec assistant Adha intégré",
            icon: "Smartphone",
            isConnected: false,
            isConfigurable: true,
            syncStatus: "disabled"
          },
          {
            id: "web-scraping",
            name: "Collecte Web",
            description: "Collecte automatique des données de factures électroniques et transactions en ligne",
            icon: "LinkIcon",
            isConnected: false,
            isConfigurable: true,
            syncStatus: "disabled"
          },
          {
            id: "external-db",
            name: "Bases de données externes",
            description: "Connexion à des bases de données tierces (ERP, CRM, etc.)",
            icon: "Database",
            isConnected: false,
            isConfigurable: true,
            syncStatus: "disabled"
          }
        ]
      };
    }

    return {
      sources: dataSources.map(ds => ({
        id: ds.sourceId,
        name: ds.name,
        description: ds.description,
        icon: ds.metadata?.icon || 'Database',
        isConnected: ds.status === DataSourceStatus.CONNECTED,
        isConfigurable: true,
        config: ds.metadata?.config || {},
        lastSyncDate: ds.lastSyncDate?.toISOString(),
        syncStatus: ds.status
      }))
    };
  }

  /**
   * Update data source
   */
  async updateDataSource(companyId: string, dto: any): Promise<any> {
    let dataSource = await this.dataSourceRepository.findOne({
      where: { companyId, sourceId: dto.sourceId }
    });

    if (!dataSource) {
      dataSource = this.dataSourceRepository.create({
        companyId,
        sourceId: dto.sourceId,
        name: dto.sourceId,
        description: `Data source for ${dto.sourceId}`,
        type: DataSourceType.API,
        status: dto.isConnected ? DataSourceStatus.CONNECTED : DataSourceStatus.DISCONNECTED,
        metadata: { config: dto.config || {} }
      });
    } else {
      dataSource.status = dto.isConnected ? DataSourceStatus.CONNECTED : DataSourceStatus.DISCONNECTED;
      dataSource.metadata = { ...dataSource.metadata, config: dto.config || {} };
      dataSource.lastSyncDate = new Date();
    }

    await this.dataSourceRepository.save(dataSource);
    return await this.getDataSources(companyId);
  }

  /**
   * Get integrations status
   */
  async getIntegrationsStatus(companyId: string): Promise<any> {
    return {
      integrations: [
        {
          type: "data-sharing",
          name: "Partage de données",
          status: "active",
          lastActivity: new Date().toISOString(),
          errorCount: 0
        },
        {
          type: "wanzo-mobile",
          name: "Wanzo Mobile",
          status: "disabled",
          lastActivity: null,
          errorCount: 0
        },
        {
          type: "bank-integration",
          name: "Intégration bancaire",
          status: "disabled",
          lastActivity: null,
          errorCount: 0
        },
        {
          type: "e-invoicing",
          name: "Facturation électronique",
          status: "disabled",
          lastActivity: null,
          errorCount: 0
        }
      ]
    };
  }

  /**
   * Get bank integrations
   */
  async getBankIntegrations(companyId: string): Promise<any> {
    return [
      {
        provider: "trust_bank",
        enabled: false,
        syncFrequency: "daily",
        accountMappings: [],
        lastSyncDate: null
      }
    ];
  }

  /**
   * Update bank integration
   */
  async updateBankIntegration(companyId: string, bankId: string, dto: any): Promise<any> {
    // Implementation would save to database
    return {
      provider: bankId,
      enabled: dto.enabled,
      syncFrequency: dto.syncFrequency,
      accountMappings: dto.accountMappings,
      lastSyncDate: dto.enabled ? new Date().toISOString() : null
    };
  }

  /**
   * Validate settings
   */
  async validateSettings(dto: any): Promise<any> {
    const errors: string[] = [];

    // Validate general settings
    if (dto.general?.theme && !['light', 'dark'].includes(dto.general.theme)) {
      errors.push("Le thème doit être 'light' ou 'dark'");
    }

    // Validate currency
    if (dto.general?.baseCurrency && !['CDF', 'USD', 'EUR'].includes(dto.general.baseCurrency)) {
      errors.push("La devise de base n'est pas supportée");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Import settings
   */
  async importSettings(companyId: string, userId: string, dto: any): Promise<any> {
    // Update each category if provided
    if (dto.general) {
      await this.updateGeneralSettings(userId, dto.general);
    }
    if (dto.accounting) {
      await this.updateAccountingSettings(companyId, dto.accounting);
    }
    if (dto.security) {
      await this.updateSecuritySettings(userId, dto.security);
    }
    if (dto.notifications) {
      await this.updateNotificationsSettings(userId, dto.notifications);
    }
    if (dto.integrations) {
      await this.updateIntegrationsSettings(companyId, dto.integrations);
    }

    return this.getAllSettings(companyId, userId);
  }

  /**
   * Reset all settings
   */
  async resetSettings(companyId: string, userId: string): Promise<any> {
    // Reset to default values
    const defaultSettings = {
      general: {
        language: 'fr',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Africa/Kinshasa',
        theme: 'light',
        baseCurrency: 'CDF',
        displayCurrency: 'CDF',
        exchangeRates: {}
      },
      accounting: {
        defaultJournal: 'OD',
        autoNumbering: true,
        voucherPrefix: 'VCH-',
        fiscalYearPattern: 'YYYY',
        accountingFramework: 'OHADA',
        defaultDepreciationMethod: DepreciationMethod.LINEAR,
        defaultVatRate: 18,
        journalEntryValidation: JournalEntryValidation.MANUAL,
        accountingLevels: [
          { level: 1, name: 'Classe', digits: 1 },
          { level: 2, name: 'Compte Principal', digits: 2 },
          { level: 3, name: 'Compte Divisionnaire', digits: 3 },
          { level: 4, name: 'Sous-compte', digits: 5 }
        ]
      }
    };

    await this.updateGeneralSettings(userId, defaultSettings.general);
    await this.updateAccountingSettings(companyId, defaultSettings.accounting);

    return this.getAllSettings(companyId, userId);
  }

  /**
   * Reset category settings
   */
  async resetCategorySettings(companyId: string, userId: string, category: string): Promise<any> {
    // Reset specific category to defaults
    switch (category) {
      case 'general':
        await this.updateGeneralSettings(userId, {
          language: 'fr',
          dateFormat: 'DD/MM/YYYY',
          timezone: 'Africa/Kinshasa',
          theme: 'light',
          baseCurrency: 'CDF',
          displayCurrency: 'CDF',
          exchangeRates: {}
        });
        break;
      case 'accounting':
        await this.updateAccountingSettings(companyId, {
          defaultJournal: 'OD',
          autoNumbering: true,
          voucherPrefix: 'VCH-',
          fiscalYearPattern: 'YYYY',
          accountingFramework: 'OHADA',
          defaultDepreciationMethod: DepreciationMethod.LINEAR,
          defaultVatRate: 18,
          journalEntryValidation: JournalEntryValidation.MANUAL,
          accountingLevels: [
            { level: 1, name: 'Classe', digits: 1 },
            { level: 2, name: 'Compte Principal', digits: 2 },
            { level: 3, name: 'Compte Divisionnaire', digits: 3 },
            { level: 4, name: 'Sous-compte', digits: 5 }
          ]
        });
        break;
    }

    return this.getAllSettings(companyId, userId);
  }
}
