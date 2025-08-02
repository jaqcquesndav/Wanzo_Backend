import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsService } from './settings.service';
import { AccountingSettings } from '../entities/accounting-settings.entity';
import { UserSettings } from '../entities/user-settings.entity';
import { IntegrationsSettings } from '../entities/integrations-settings.entity';
import { DataSource } from '../entities/data-source.entity';
import { 
  SettingsDto, 
  UpdateGeneralSettingsDto,
  UpdateAccountingSettingsDto,
  UpdateSecuritySettingsDto,
  UpdateNotificationsSettingsDto
} from '../dtos/settings.dto';
import { NotFoundException } from '@nestjs/common';

// Define mock repository factory
const createMockRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  merge: jest.fn(),
  update: jest.fn(),
});

describe('SettingsService', () => {
  let service: SettingsService;
  let accountingSettingsRepository: ReturnType<typeof createMockRepository>;
  let userSettingsRepository: ReturnType<typeof createMockRepository>;
  let integrationsSettingsRepository: ReturnType<typeof createMockRepository>;
  let dataSourceRepository: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    accountingSettingsRepository = createMockRepository();
    userSettingsRepository = createMockRepository();
    integrationsSettingsRepository = createMockRepository();
    dataSourceRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: getRepositoryToken(AccountingSettings),
          useValue: accountingSettingsRepository,
        },
        {
          provide: getRepositoryToken(UserSettings),
          useValue: userSettingsRepository,
        },
        {
          provide: getRepositoryToken(IntegrationsSettings),
          useValue: integrationsSettingsRepository,
        },
        {
          provide: getRepositoryToken(DataSource),
          useValue: dataSourceRepository,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllSettings', () => {
    it('should return consolidated settings from all entities', async () => {
      const mockAccountingSettings = {
        id: 'accounting-1',
        companyId: 'company-1',
        defaultJournal: 'General',
        autoNumbering: true,
        fiscalYearStart: new Date('2024-01-01'),
        fiscalYearEnd: new Date('2024-12-31'),
      };

      const mockUserSettings = {
        id: 'user-1',
        userId: 'user-1',
        language: 'fr',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Africa/Kinshasa',
        theme: 'light',
        baseCurrency: 'CDF',
        displayCurrency: 'CDF',
      };

      const mockIntegrationsSettings = {
        id: 'integrations-1',
        companyId: 'company-1',
        bankSyncEnabled: true,
        portfolioSyncEnabled: false,
      };

      accountingSettingsRepository.findOne.mockResolvedValue(mockAccountingSettings);
      userSettingsRepository.findOne.mockResolvedValue(mockUserSettings);
      integrationsSettingsRepository.findOne.mockResolvedValue(mockIntegrationsSettings);
      dataSourceRepository.find.mockResolvedValue([]);

      const result = await service.getAllSettings('company-1', 'user-1');

      expect(result).toBeDefined();
      expect(result.general.language).toBe('fr');
      expect(result.accounting.defaultJournal).toBe('General');
      expect(accountingSettingsRepository.findOne).toHaveBeenCalledWith({
        where: { companyId: 'company-1' }
      });
      expect(userSettingsRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-1' }
      });
    });

    it('should create default settings if none exist', async () => {
      accountingSettingsRepository.findOne.mockResolvedValue(null);
      userSettingsRepository.findOne.mockResolvedValue(null);
      integrationsSettingsRepository.findOne.mockResolvedValue(null);
      dataSourceRepository.find.mockResolvedValue([]);

      const mockDefaultAccountingSettings = {
        companyId: 'company-1',
        defaultJournal: 'Journal Général',
        autoNumbering: true,
      };
      const mockDefaultUserSettings = {
        userId: 'user-1',
        language: 'fr',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Africa/Kinshasa',
      };
      const mockDefaultIntegrationsSettings = {
        companyId: 'company-1',
        bankSyncEnabled: false,
      };

      accountingSettingsRepository.create.mockReturnValue(mockDefaultAccountingSettings);
      userSettingsRepository.create.mockReturnValue(mockDefaultUserSettings);
      integrationsSettingsRepository.create.mockReturnValue(mockDefaultIntegrationsSettings);

      accountingSettingsRepository.save.mockResolvedValue(mockDefaultAccountingSettings);
      userSettingsRepository.save.mockResolvedValue(mockDefaultUserSettings);
      integrationsSettingsRepository.save.mockResolvedValue(mockDefaultIntegrationsSettings);

      const result = await service.getAllSettings('company-1', 'user-1');

      expect(accountingSettingsRepository.create).toHaveBeenCalled();
      expect(userSettingsRepository.create).toHaveBeenCalled();
      expect(integrationsSettingsRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('updateGeneralSettings', () => {
    it('should update user general settings', async () => {
      const mockUserSettings = {
        id: 'user-1',
        userId: 'user-1',
        language: 'fr',
        theme: 'light',
      };

      const updateDto: UpdateGeneralSettingsDto = {
        language: 'en',
        theme: 'dark',
        timezone: 'UTC',
      };

      userSettingsRepository.findOne.mockResolvedValue(mockUserSettings);
      userSettingsRepository.save.mockResolvedValue({
        ...mockUserSettings,
        ...updateDto,
      });

      const result = await service.updateGeneralSettings('user-1', updateDto);

      expect(result.language).toBe('en');
      expect(result.theme).toBe('dark');
      expect(userSettingsRepository.save).toHaveBeenCalled();
    });

    it('should create default settings if user settings do not exist and then update them', async () => {
      userSettingsRepository.findOne.mockResolvedValue(null);
      const newSettings = { id: 'new-id', userId: 'user-1', language: 'en' };
      userSettingsRepository.create.mockReturnValue(newSettings);
      userSettingsRepository.save.mockResolvedValue(newSettings);
      userSettingsRepository.merge.mockReturnValue({ ...newSettings, language: 'en' });

      const updateDto: UpdateGeneralSettingsDto = {
        language: 'en',
      };

      const result = await service.updateGeneralSettings('user-1', updateDto);

      expect(userSettingsRepository.create).toHaveBeenCalledWith({ userId: 'user-1' });
      expect(userSettingsRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('updateAccountingSettings', () => {
    it('should update accounting settings', async () => {
      const mockAccountingSettings = {
        id: 'accounting-1',
        companyId: 'company-1',
        defaultJournal: 'General',
        autoNumbering: true,
      };

      const updateDto: UpdateAccountingSettingsDto = {
        defaultJournal: 'Ventes',
        autoNumbering: false,
      };

      accountingSettingsRepository.findOne.mockResolvedValue(mockAccountingSettings);
      accountingSettingsRepository.save.mockResolvedValue({
        ...mockAccountingSettings,
        ...updateDto,
      });

      const result = await service.updateAccountingSettings('company-1', updateDto);

      expect(result.defaultJournal).toBe('Ventes');
      expect(result.autoNumbering).toBe(false);
      expect(accountingSettingsRepository.save).toHaveBeenCalled();
    });

    it('should create default accounting settings if they do not exist and then update them', async () => {
      accountingSettingsRepository.findOne.mockResolvedValue(null);
      const newSettings = { 
        id: 'new-id', 
        companyId: 'company-1', 
        defaultJournal: 'Ventes',
        autoNumbering: true 
      };
      accountingSettingsRepository.create.mockReturnValue(newSettings);
      accountingSettingsRepository.save.mockResolvedValue(newSettings);

      const updateDto: UpdateAccountingSettingsDto = {
        defaultJournal: 'Ventes',
      };

      const result = await service.updateAccountingSettings('company-1', updateDto);

      expect(accountingSettingsRepository.create).toHaveBeenCalledWith({ companyId: 'company-1' });
      expect(accountingSettingsRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('updateSecuritySettings', () => {
    it('should update security settings', async () => {
      const mockUserSettings = {
        id: 'user-1',
        userId: 'user-1',
        twoFactorEnabled: false,
        sessionTimeout: 30,
      };

      const updateDto: UpdateSecuritySettingsDto = {
        twoFactorEnabled: true,
        sessionTimeout: 60,
      };

      userSettingsRepository.findOne.mockResolvedValue(mockUserSettings);
      userSettingsRepository.save.mockResolvedValue({
        ...mockUserSettings,
        ...updateDto,
      });

      const result = await service.updateSecuritySettings('user-1', updateDto);

      expect(result.twoFactorEnabled).toBe(true);
      expect(result.sessionTimeout).toBe(60);
      expect(userSettingsRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateNotificationsSettings', () => {
    it('should update notification settings', async () => {
      const mockUserSettings = {
        id: 'user-1',
        userId: 'user-1',
        journal_validation: { email: true, browser: false },
        report_generation: { email: false, browser: true },
      };

      const updateDto: UpdateNotificationsSettingsDto = {
        journal_validation: { email: false, browser: true },
        report_generation: { email: true, browser: false },
      };

      userSettingsRepository.findOne.mockResolvedValue(mockUserSettings);
      userSettingsRepository.save.mockResolvedValue({
        ...mockUserSettings,
        ...updateDto,
      });

      const result = await service.updateNotificationsSettings('user-1', updateDto);

      expect(result.journal_validation.email).toBe(false);
      expect(result.journal_validation.browser).toBe(true);
      expect(userSettingsRepository.save).toHaveBeenCalled();
    });
  });

  describe('getDataSources', () => {
    it('should return all available data sources', async () => {
      const mockDataSources = [
        {
          id: 'ecobank',
          name: 'Ecobank',
          type: 'bank',
          status: 'active',
        },
        {
          id: 'portfolio',
          name: 'Portfolio Service',
          type: 'api',
          status: 'inactive',
        },
      ];

      dataSourceRepository.find.mockResolvedValue(mockDataSources);

      const result = await service.getDataSources('company-1');

      expect(result.sources).toHaveLength(2);
      expect(result.sources[0].name).toBe('Ecobank');
      expect(dataSourceRepository.find).toHaveBeenCalledWith({
        where: { companyId: 'company-1' }
      });
    });
  });
});
