import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountingSettings, DepreciationMethod, JournalEntryValidation } from '@/modules/settings/entities/accounting-settings.entity';
import { Currency } from '@/modules/settings/entities/currency.entity';
import { DataSharingSettings, DataSharingStatus, ProviderType, ProviderStatus } from '@/modules/settings/entities/data-sharing-settings.entity';
import { DataSource as SettingsDataSource, DataSourceStatus } from '@/modules/settings/entities/data-source.entity';
import { AccountingMode } from '@/modules/organization/entities/organization.entity';
import { UpdateAccountingSettingsDto } from '@/modules/settings/dtos/update-accounting-settings.dto';
import { EventsService } from '@/modules/events/events.service';
import { DataSharingConsentChangedEventData } from '@wanzo/shared/events/kafka-config'; // Using path alias

// Temporary interfaces to resolve import issues
export interface UpdateCurrencyDto {
  code: string;
  name?: string;
  symbol?: string;
  isDefault?: boolean;
  exchangeRate?: number;
}

export interface ExchangeRateDto {
  currencyCode: string;
  exchangeRate: number;
}

export interface UpdateExchangeRatesDto {
  rates: ExchangeRateDto[];
}

export interface SetDefaultCurrencyDto {
  currencyCode: string;
}

export interface ProviderDto {
  name: string;
  type: ProviderType;
  status: ProviderStatus;
}

export interface UpdateDataSharingSettingsDto {
  enabled: boolean;
  providers?: ProviderDto[];
  shareWithAll?: boolean;
  targetInstitutionTypes?: string[];
}

export interface DataSourceUpdateDto {
  id: string;
  status: DataSourceStatus;
}

export interface UpdateDataSourcesDto {
  sources: DataSourceUpdateDto[];
}

// Original imports that cause issues - commented out
// import { UpdateCurrencyDto, UpdateExchangeRatesDto, SetDefaultCurrencyDto } from '../dtos/update-currency.dto';
// import { UpdateDataSharingSettingsDto } from '../dtos/update-data-sharing-settings.dto';
// import { UpdateDataSourcesDto } from '../dtos/update-data-sources.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AccountingSettings)
    private accountingSettingsRepository: Repository<AccountingSettings>,
    
    @InjectRepository(Currency)
    private currencyRepository: Repository<Currency>,
    
    @InjectRepository(DataSharingSettings)
    private dataSharingSettingsRepository: Repository<DataSharingSettings>,
    
    @InjectRepository(SettingsDataSource)
    private dataSourceRepository: Repository<SettingsDataSource>,

    @Inject(EventsService)
    private readonly eventsService: EventsService,
  ) {}

  // Accounting Settings
  async getAccountingSettings(companyId: string): Promise<AccountingSettings> {
    const settings = await this.accountingSettingsRepository.findOne({
      where: { companyId }
    });      if (!settings) {
      // Return default settings if not found
      const defaultSettings = new AccountingSettings();
      defaultSettings.companyId = companyId;
      defaultSettings.accountingMode = AccountingMode.SYSCOHADA;
      defaultSettings.defaultCurrency = 'CDF';
      defaultSettings.defaultDepreciationMethod = DepreciationMethod.LINEAR;
      defaultSettings.defaultVatRate = '18';
      defaultSettings.journalEntryValidation = JournalEntryValidation.AUTO;
      return defaultSettings;
    }
    
    return settings;
  }

  async updateAccountingSettings(
    companyId: string, 
    updateDto: UpdateAccountingSettingsDto
  ): Promise<AccountingSettings> {
    let settings = await this.accountingSettingsRepository.findOne({
      where: { companyId }
    });
    
    if (!settings) {
      settings = this.accountingSettingsRepository.create({
        companyId,
        ...updateDto,
      });
    } else {
      this.accountingSettingsRepository.merge(settings, updateDto);
    }
    
    return this.accountingSettingsRepository.save(settings);
  }

  // Currencies
  async getCurrencies(companyId: string): Promise<Currency[]> {
    return this.currencyRepository.find({
      where: { companyId },
      order: { isDefault: 'DESC', code: 'ASC' }
    });
  }

  async getDefaultCurrency(companyId: string): Promise<Currency> {
    const currency = await this.currencyRepository.findOne({
      where: { companyId, isDefault: true }
    });
    
    if (!currency) {
      throw new NotFoundException('Default currency not found');
    }
    
    return currency;
  }

  async setDefaultCurrency(companyId: string, currencyCode: string): Promise<Currency> {
    // Find the currency
    const currency = await this.currencyRepository.findOne({
      where: { companyId, code: currencyCode }
    });
    
    if (!currency) {
      throw new NotFoundException(`Currency with code ${currencyCode} not found`);
    }
    
    // Reset all currencies to non-default
    await this.currencyRepository.update(
      { companyId },
      { isDefault: false }
    );
    
    // Set the selected currency as default
    currency.isDefault = true;
    return this.currencyRepository.save(currency);
  }

  async updateExchangeRates(
    companyId: string, 
    updateDto: UpdateExchangeRatesDto
  ): Promise<Currency[]> {
    const updatedCurrencies: Currency[] = [];
    
    for (const rate of updateDto.rates) {
      const currency = await this.currencyRepository.findOne({
        where: { companyId, code: rate.currencyCode }
      });
      
      if (currency) {
        currency.exchangeRate = rate.exchangeRate;
        updatedCurrencies.push(await this.currencyRepository.save(currency));
      }
    }
    
    return updatedCurrencies;
  }

  // Data Sharing Settings
  async getDataSharingSettings(companyId: string): Promise<DataSharingSettings> {
    const settings = await this.dataSharingSettingsRepository.findOne({
      where: { companyId }
    });
      if (!settings) {
      // Return default settings if not found
      const defaultSettings = new DataSharingSettings();
      defaultSettings.companyId = companyId;
      defaultSettings.status = DataSharingStatus.ENABLED;
      defaultSettings.providers = [];
      return defaultSettings;
    }
    
    return settings;
  }

  async updateDataSharingSettings(
    companyId: string, 
    updateDto: UpdateDataSharingSettingsDto,
    userId: string,
  ): Promise<DataSharingSettings> {
    let settings = await this.dataSharingSettingsRepository.findOne({
      where: { companyId }
    });

    let isNewSettings = false;
    if (!settings) {
      isNewSettings = true;
      settings = new DataSharingSettings();
      settings.companyId = companyId;
    }

    let shareWithAll: boolean;
    let targetInstitutionTypes: string[] | null = null;

    if (typeof updateDto.shareWithAll === 'boolean') {
      shareWithAll = updateDto.shareWithAll;
      if (shareWithAll) {
        settings.providers = [];
      } else if (updateDto.targetInstitutionTypes) {
        settings.providers = updateDto.targetInstitutionTypes.map(type => ({ 
          type: type as ProviderType, 
          name: type,
          status: ProviderStatus.CONNECTED // Changed from ACTIVE to CONNECTED
        }));
        targetInstitutionTypes = updateDto.targetInstitutionTypes;
      } else {
        if (updateDto.providers) {
            settings.providers = updateDto.providers;
        }
        targetInstitutionTypes = settings.providers?.map(p => p.type) || [];
      }
    } else {
      if (updateDto.enabled && (!updateDto.providers || updateDto.providers.length === 0)) {
        shareWithAll = true;
        settings.providers = [];
      } else {
        shareWithAll = false;
        if (updateDto.providers) {
          settings.providers = updateDto.providers;
        }
        targetInstitutionTypes = settings.providers?.map(p => p.type) || [];
      }
    }

    settings.status = updateDto.enabled ? DataSharingStatus.ENABLED : DataSharingStatus.DISABLED;
    if (!updateDto.enabled) {
        shareWithAll = false;
        targetInstitutionTypes = [];
        settings.providers = [];
    }

    if (updateDto.providers && typeof updateDto.shareWithAll !== 'boolean') { 
        if (!settings.providers) {
          settings.providers = [];
        }
        for (const provider of updateDto.providers) {
          const existingIndex = settings.providers.findIndex(
            p => p.name === provider.name && p.type === provider.type
          );
          if (existingIndex >= 0) {
            settings.providers[existingIndex] = { ...settings.providers[existingIndex], ...provider };
          } else {
            settings.providers.push(provider);
          }
        }
        targetInstitutionTypes = settings.providers.map(p => p.type);
        shareWithAll = updateDto.enabled && settings.providers.length === 0;
    }


    const savedSettings = await this.dataSharingSettingsRepository.save(settings);

    const eventData: DataSharingConsentChangedEventData = {
      smeOrganizationId: companyId,
      consentingUserId: userId,
      shareWithAll: shareWithAll,
      targetInstitutionTypes: shareWithAll ? null : (targetInstitutionTypes || []),
      timestamp: new Date(),
      changedBy: userId,
    };
    await this.eventsService.publishDataSharingConsentChanged(eventData);
    
    return savedSettings;
  }
  // Data Sources
  async getDataSources(companyId: string): Promise<SettingsDataSource[]> {
    return this.dataSourceRepository.find({
      where: { companyId }
    });
  }
  async updateDataSources(
    companyId: string, 
    updateDto: UpdateDataSourcesDto
  ): Promise<SettingsDataSource[]> {
    const updatedSources: SettingsDataSource[] = [];
    
    for (const source of updateDto.sources) {
      const dataSource = await this.dataSourceRepository.findOne({
        where: { id: source.id, companyId }
      });
      
      if (dataSource) {
        this.dataSourceRepository.merge(dataSource, {
          status: source.status,
        });
        
        updatedSources.push(await this.dataSourceRepository.save(dataSource));
      }
    }
    
    return updatedSources;
  }
}
