import { Injectable, Logger, NotFoundException, Inject, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountingSettings, DepreciationMethod, JournalEntryValidation } from '../entities/accounting-settings.entity';
import { UserSettings } from '../entities/user-settings.entity';
import { IntegrationsSettings } from '../entities/integrations-settings.entity';
import { DataSource, DataSourceType, DataSourceStatus } from '../entities/data-source.entity';
import { Organization } from '../../organization/entities/organization.entity';
import { FiscalYear, FiscalYearStatus } from '../../fiscal-years/entities/fiscal-year.entity';
import { Account } from '../../accounts/entities/account.entity';
import { JournalService } from '../../journals/services/journal.service';
import { EventsService } from '../../events/events.service';
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
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(FiscalYear)
    private fiscalYearRepository: Repository<FiscalYear>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private readonly journalService: JournalService,
    @Optional() private readonly eventsService: EventsService,
  ) {}

  /**
   * Get default settings for super admin or users without valid organization
   * @returns Default settings structure
   */
  async getDefaultSettings(): Promise<SettingsDto> {
    return {
      general: {
        language: 'fr',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Africa/Kinshasa',
        theme: 'light',
        baseCurrency: 'CDF',
        displayCurrency: 'CDF',
        exchangeRates: {},
      },
      accounting: {
        defaultJournal: '',
        autoNumbering: true,
        voucherPrefix: 'V',
        fiscalYearPattern: 'YYYY',
        accountingFramework: 'OHADA',
        defaultDepreciationMethod: DepreciationMethod.LINEAR,
        defaultVatRate: 18,
        journalEntryValidation: JournalEntryValidation.MANUAL,
        accountingLevels: [],
      },
      security: {
        twoFactorEnabled: false,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSymbols: true,
        },
        sessionTimeout: 3600,
        auditLogRetention: 90,
      },
      notifications: {
        journal_validation: {
          email: false,
          browser: false,
        },
        report_generation: {
          email: false,
          browser: false,
        },
        user_mention: {
          email: false,
          browser: false,
        },
      },
      integrations: {
        googleDrive: {
          enabled: false,
        },
        ksPay: {
          enabled: false,
          apiKey: '',
        },
        slack: {
          enabled: false,
        },
        portfolioIntegration: {
          enabled: false,
          portfolioTypes: [],
          automaticValuation: false,
          valuationFrequency: 'monthly',
          currencyConversion: false,
        },
        dataSharing: {
          banks: false,
          microfinance: false,
          coopec: false,
          analysts: false,
          partners: false,
          consentGiven: false,
        },
        dataSources: {
          sources: []
        },
        bankIntegrations: [],
        eInvoicing: {
          provider: 'dgi_congo',
          enabled: false,
          taxpayerNumber: '',
          autoSubmit: false,
          validateBeforeSubmit: true,
          syncInvoices: false
        },
        taxIntegration: {
          dgiEnabled: false,
          taxpayerNumber: '',
          autoCalculateTax: false,
          declarationFrequency: 'monthly',
          taxRates: []
        },
      },
    };
  }

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
    
    // Si le consentement est donné et que partners/analysts sont autorisés,
    // publier les données financières incluant la trésorerie
    if (dto.consentGiven && (dto.partners || dto.analysts || dto.banks || dto.microfinance || dto.coopec)) {
      await this.publishFinancialDataWithTreasury(companyId, dto);
    }
    
    return updatedDataSharing;
  }

  /**
   * Récupère et publie les données financières avec détails de trésorerie
   */
  private async publishFinancialDataWithTreasury(companyId: string, dataSharingSettings: any): Promise<void> {
    try {
      // Récupérer les informations de l'organisation
      const organization = await this.organizationRepository.findOne({ where: { id: companyId } });
      if (!organization) {
        this.logger.warn(`Organization ${companyId} not found for financial data publishing`);
        return;
      }

      // Récupérer le dernier exercice fiscal actif
      const fiscalYear = await this.fiscalYearRepository.findOne({
        where: { companyId, status: FiscalYearStatus.OPEN },
        order: { startDate: 'DESC' }
      });

      if (!fiscalYear) {
        this.logger.warn(`No active fiscal year found for company ${companyId}`);
        return;
      }

      // Récupérer les comptes de trésorerie (classe 52 en SYSCOHADA)
      const treasuryAccounts = await this.accountRepository.find({
        where: { companyId },
        order: { code: 'ASC' }
      });

      const treasuryAccountsData: Array<{
        accountCode: string;
        accountName: string;
        balance: number;
        currency: string;
        bankName?: string;
        accountNumber?: string;
      }> = [];
      for (const account of treasuryAccounts.filter(a => a.code.startsWith('52'))) {
        try {
          const balance = await this.journalService.getAccountBalance(
            account.id,
            fiscalYear.id,
            companyId,
            new Date()
          );

          treasuryAccountsData.push({
            accountCode: account.code,
            accountName: account.name,
            balance: balance.balance,
            currency: organization.currency || 'CDF',
            bankName: account.metadata?.bankName,
            accountNumber: account.metadata?.accountNumber
          });
        } catch (error) {
          const err = error as Error;
          this.logger.warn(`Failed to get balance for account ${account.code}: ${err.message}`);
        }
      }

      // Calculer les métriques financières agrégées
      const allAccounts = treasuryAccounts;
      const currentDate = new Date();
      
      let totalRevenue = 0;
      let totalExpenses = 0;
      let totalAssets = 0;
      let totalLiabilities = 0;

      for (const account of allAccounts) {
        try {
          const balance = await this.journalService.getAccountBalance(
            account.id,
            fiscalYear.id,
            companyId,
            currentDate
          );

          // Classe 7: Produits (Revenue)
          if (account.code.startsWith('7')) {
            totalRevenue += Math.abs(balance.balance);
          }
          // Classe 6: Charges (Expenses)
          else if (account.code.startsWith('6')) {
            totalExpenses += Math.abs(balance.balance);
          }
          // Classe 2, 3, 4, 5: Actif
          else if (account.code.startsWith('2') || account.code.startsWith('3') || 
                   account.code.startsWith('4') || account.code.startsWith('5')) {
            if (balance.balance > 0) {
              totalAssets += balance.balance;
            }
          }
          // Classe 1, 4: Passif
          else if (account.code.startsWith('1') || (account.code.startsWith('4') && balance.balance < 0)) {
            totalLiabilities += Math.abs(balance.balance);
          }
        } catch (error) {
          const err = error as Error;
          this.logger.debug(`Error calculating balance for ${account.code}: ${err.message}`);
        }
      }

      const netProfit = totalRevenue - totalExpenses;
      const cashFlow = treasuryAccountsData.reduce((sum, acc) => sum + acc.balance, 0);

      // Calculer un score de crédit simple basé sur les métriques
      const debtRatio = totalLiabilities / (totalAssets || 1);
      const profitMargin = netProfit / (totalRevenue || 1);
      let creditScore = 50; // Score de base
      
      if (debtRatio < 0.5) creditScore += 20;
      else if (debtRatio < 0.7) creditScore += 10;
      
      if (profitMargin > 0.1) creditScore += 20;
      else if (profitMargin > 0) creditScore += 10;
      
      if (cashFlow > 0) creditScore += 10;

      const financialRating = creditScore >= 80 ? 'A' : 
                             creditScore >= 60 ? 'B' : 
                             creditScore >= 40 ? 'C' : 'D';

      // Déterminer qui peut accéder aux données
      const consentGrantedTo: string[] = [];
      if (dataSharingSettings.banks) consentGrantedTo.push('banks');
      if (dataSharingSettings.microfinance) consentGrantedTo.push('microfinance');
      if (dataSharingSettings.coopec) consentGrantedTo.push('coopec');
      if (dataSharingSettings.analysts) consentGrantedTo.push('analysts');
      if (dataSharingSettings.partners) consentGrantedTo.push('partners');

      // Générer les données de trésorerie sur plusieurs échelles temporelles
      const treasuryTimeseries = await this.generateTreasuryTimeseries(
        treasuryAccounts.filter(a => a.code.startsWith('52') || a.code.startsWith('53') || 
                                     a.code.startsWith('54') || a.code.startsWith('57')),
        fiscalYear,
        companyId
      );

      // Publier l'événement via EventsService (si disponible)
      if (this.eventsService) {
        await this.eventsService.publishCompanyFinancialDataShared({
          companyId,
          companyName: organization.name,
          consentGrantedTo,
          accountingStandard: organization.accountingMode || 'SYSCOHADA',
          financialData: {
            totalRevenue,
            netProfit,
            totalAssets,
            totalLiabilities,
            cashFlow,
            creditScore,
            financialRating
          },
          treasuryAccounts: treasuryAccountsData,
          treasuryTimeseries, // Données sur plusieurs échelles temporelles
          timestamp: new Date().toISOString()
        });

        this.logger.log(
          `Published financial data with ${treasuryAccountsData.length} treasury accounts ` +
          `and timeseries data (${treasuryTimeseries.weekly.length}W/${treasuryTimeseries.monthly.length}M/` +
          `${treasuryTimeseries.quarterly.length}Q/${treasuryTimeseries.annual.length}Y) for company ${companyId}`
        );
      }

    } catch (error) {
      this.logger.error(
        `Failed to publish financial data with treasury for company ${companyId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      // Ne pas throw - ne pas bloquer la mise à jour des settings
    }
  }

  /**
   * Génère les données de trésorerie sur plusieurs échelles temporelles
   * Conforme SYSCOHADA et IFRS
   */
  private async generateTreasuryTimeseries(
    treasuryAccounts: Account[],
    fiscalYear: FiscalYear,
    companyId: string
  ): Promise<{
    weekly: any[];
    monthly: any[];
    quarterly: any[];
    annual: any[];
  }> {
    const now = new Date();
    const results: {
      weekly: any[];
      monthly: any[];
      quarterly: any[];
      annual: any[];
    } = { weekly: [], monthly: [], quarterly: [], annual: [] };

    try {
      // Données hebdomadaires (12 dernières semaines)
      for (let i = 0; i < 12; i++) {
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() - (i * 7));
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);

        const periodData = await this.calculateTreasuryPeriod(
          treasuryAccounts,
          fiscalYear.id,
          companyId,
          startDate,
          endDate,
          'weekly'
        );
        results.weekly.unshift(periodData);
      }

      // Données mensuelles (12 derniers mois)
      for (let i = 0; i < 12; i++) {
        const endDate = new Date(now.getFullYear(), now.getMonth() - i, 0); // Dernier jour du mois
        const startDate = new Date(now.getFullYear(), now.getMonth() - i - 1, 1); // Premier jour du mois

        const periodData = await this.calculateTreasuryPeriod(
          treasuryAccounts,
          fiscalYear.id,
          companyId,
          startDate,
          endDate,
          'monthly'
        );
        results.monthly.unshift(periodData);
      }

      // Données trimestrielles (4 derniers trimestres)
      for (let i = 0; i < 4; i++) {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const quarterStartMonth = (currentQuarter - i) * 3;
        const year = now.getFullYear() + Math.floor(quarterStartMonth / 12);
        const month = ((quarterStartMonth % 12) + 12) % 12;
        
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 3, 0);

        const periodData = await this.calculateTreasuryPeriod(
          treasuryAccounts,
          fiscalYear.id,
          companyId,
          startDate,
          endDate,
          'quarterly'
        );
        results.quarterly.unshift(periodData);
      }

      // Données annuelles (3 dernières années)
      for (let i = 0; i < 3; i++) {
        const year = now.getFullYear() - i;
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);

        const periodData = await this.calculateTreasuryPeriod(
          treasuryAccounts,
          fiscalYear.id,
          companyId,
          startDate,
          endDate,
          'annual'
        );
        results.annual.unshift(periodData);
      }

    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Error generating treasury timeseries: ${err.message}`);
    }

    return results;
  }

  /**
   * Calcule les données de trésorerie pour une période donnée
   */
  private async calculateTreasuryPeriod(
    accounts: Account[],
    fiscalYearId: string,
    companyId: string,
    startDate: Date,
    endDate: Date,
    periodType: 'weekly' | 'monthly' | 'quarterly' | 'annual'
  ): Promise<any> {
    const accountsData: Array<{
      accountCode: string;
      accountName: string;
      balance: number;
      currency: string;
      accountType: string;
    }> = [];
    let totalBalance = 0;

    for (const account of accounts) {
      try {
        const balance = await this.journalService.getAccountBalance(
          account.id,
          fiscalYearId,
          companyId,
          endDate
        );

        accountsData.push({
          accountCode: account.code,
          accountName: account.name,
          balance: balance.balance,
          currency: account.metadata?.currency || 'CDF',
          accountType: account.code.startsWith('521') ? 'bank' :
                      account.code.startsWith('53') ? 'cash' :
                      account.code.startsWith('54') ? 'short_term_investment' :
                      'cash_in_transit'
        });

        totalBalance += balance.balance;
      } catch (error) {
        const err = error as Error;
        this.logger.debug(`Error getting balance for ${account.code}: ${err.message}`);
      }
    }

    return {
      periodId: this.formatPeriodId(startDate, periodType),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      periodType,
      treasuryAccounts: accountsData,
      totalTreasuryBalance: totalBalance
    };
  }

  /**
   * Formate l'identifiant de période selon le type
   */
  private formatPeriodId(date: Date, type: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const week = Math.ceil(date.getDate() / 7);
    const quarter = Math.ceil((date.getMonth() + 1) / 3);

    switch (type) {
      case 'weekly': return `${year}-W${week}`;
      case 'monthly': return `${year}-${month}`;
      case 'quarterly': return `${year}-Q${quarter}`;
      case 'annual': return `${year}`;
      default: return `${year}`;
    }
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
