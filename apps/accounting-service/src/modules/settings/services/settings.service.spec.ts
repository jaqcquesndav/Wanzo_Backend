import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsService } from './settings.service';
import { AccountingSettings } from '../entities/accounting-settings.entity';
import { UserSettings } from '../entities/user-settings.entity';
import { IntegrationsSettings } from '../entities/integrations-settings.entity';
import { UpdateGeneralSettingsDto } from '../dtos/update-general-settings.dto';
import { UpdateAccountingSettingsDto } from '../dtos/update-accounting-settings.dto';
import { UpdateSecuritySettingsDto } from '../dtos/update-security-settings.dto';
import { UpdateNotificationsSettingsDto } from '../dtos/update-notifications-settings.dto';
import { UpdateIntegrationsSettingsDto } from '../dtos/update-integrations-settings.dto';

// Define mock repository factory
const createMockRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  merge: jest.fn(),
});

describe('SettingsService', () => {
  let service: SettingsService;
  let accountingSettingsRepository: ReturnType<typeof createMockRepository>;
  let userSettingsRepository: ReturnType<typeof createMockRepository>;
  let integrationsSettingsRepository: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    accountingSettingsRepository = createMockRepository();
    userSettingsRepository = createMockRepository();
    integrationsSettingsRepository = createMockRepository();

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
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllSettings', () => {
    it('should return all settings for a user and company', async () => {
      const companyId = 'company-id';
      const userId = 'user-id';
      
      const mockAccountingSettings = {
        defaultJournal: 'main-journal',
        autoNumbering: true,
        voucherPrefix: 'VCH',
        fiscalYearPattern: 'YYYY',
        accountingFramework: 'syscohada',
        accountingLevels: [],
      };
      
      const mockUserSettings = {
        language: 'fr',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'UTC+1',
        theme: 'dark',
        twoFactorEnabled: false,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSymbols: false,
        },
        sessionTimeout: 30,
        notifications: {
          journal_validation: {
            email: true,
            browser: false,
          },
        },
      };
      
      const mockIntegrationsSettings = {
        googleDrive: {
          enabled: false,
        },
        ksPay: {
          enabled: true,
          apiKey: 'test-key',
        },
        slack: {
          enabled: false,
        },
      };

      accountingSettingsRepository.findOne.mockResolvedValue(mockAccountingSettings);
      userSettingsRepository.findOne.mockResolvedValue(mockUserSettings);
      integrationsSettingsRepository.findOne.mockResolvedValue(mockIntegrationsSettings);

      const result = await service.getAllSettings(companyId, userId);

      expect(result).toEqual({
        general: {
          language: 'fr',
          dateFormat: 'DD/MM/YYYY',
          timezone: 'UTC+1',
          theme: 'dark',
        },
        accounting: {
          defaultJournal: 'main-journal',
          autoNumbering: true,
          voucherPrefix: 'VCH',
          fiscalYearPattern: 'YYYY',
          accountingFramework: 'syscohada',
          accountingLevels: [],
        },
        security: {
          twoFactorEnabled: false,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireNumbers: true,
            requireSymbols: false,
          },
          sessionTimeout: 30,
          auditLogRetention: 90,
        },
        notifications: {
          journal_validation: {
            email: true,
            browser: false,
          },
        },
        integrations: {
          googleDrive: {
            enabled: false,
          },
          ksPay: {
            enabled: true,
            apiKey: 'test-key',
          },
          slack: {
            enabled: false,
          },
        },
      });

      expect(accountingSettingsRepository.findOne).toHaveBeenCalledWith({ where: { companyId } });
      expect(userSettingsRepository.findOne).toHaveBeenCalledWith({ where: { userId } });
      expect(integrationsSettingsRepository.findOne).toHaveBeenCalledWith({ where: { companyId } });
    });

    it('should create settings if they do not exist', async () => {
      const companyId = 'company-id';
      const userId = 'user-id';
      
      accountingSettingsRepository.findOne.mockResolvedValue(null);
      userSettingsRepository.findOne.mockResolvedValue(null);
      integrationsSettingsRepository.findOne.mockResolvedValue(null);
      
      const mockNewAccountingSettings = {
        companyId,
      };
      const mockNewUserSettings = {
        userId,
      };
      const mockNewIntegrationsSettings = {
        companyId,
      };
      
      accountingSettingsRepository.create.mockReturnValue(mockNewAccountingSettings);
      userSettingsRepository.create.mockReturnValue(mockNewUserSettings);
      integrationsSettingsRepository.create.mockReturnValue(mockNewIntegrationsSettings);
      
      accountingSettingsRepository.save.mockResolvedValue(mockNewAccountingSettings);
      userSettingsRepository.save.mockResolvedValue(mockNewUserSettings);
      integrationsSettingsRepository.save.mockResolvedValue(mockNewIntegrationsSettings);

      await service.getAllSettings(companyId, userId);

      expect(accountingSettingsRepository.create).toHaveBeenCalledWith({ companyId });
      expect(userSettingsRepository.create).toHaveBeenCalledWith({ userId });
      expect(integrationsSettingsRepository.create).toHaveBeenCalledWith({ companyId });
      
      expect(accountingSettingsRepository.save).toHaveBeenCalledWith(mockNewAccountingSettings);
      expect(userSettingsRepository.save).toHaveBeenCalledWith(mockNewUserSettings);
      expect(integrationsSettingsRepository.save).toHaveBeenCalledWith(mockNewIntegrationsSettings);
    });
  });

  describe('updateGeneralSettings', () => {
    it('should update general settings', async () => {
      const userId = 'user-id';
      const dto: UpdateGeneralSettingsDto = { language: 'en' };
      const existingSettings = { userId, language: 'fr' };
      const mergedSettings = { ...existingSettings, ...dto };
      
      userSettingsRepository.findOne.mockResolvedValue(existingSettings);
      userSettingsRepository.merge.mockReturnValue(mergedSettings);
      userSettingsRepository.save.mockResolvedValue(mergedSettings);

      const result = await service.updateGeneralSettings(userId, dto);

      expect(result).toEqual(mergedSettings);
      expect(userSettingsRepository.findOne).toHaveBeenCalledWith({ where: { userId } });
      expect(userSettingsRepository.merge).toHaveBeenCalledWith(existingSettings, dto);
      expect(userSettingsRepository.save).toHaveBeenCalledWith(mergedSettings);
    });
  });

  describe('updateAccountingSettings', () => {
    it('should update accounting settings', async () => {
      const companyId = 'company-id';
      const dto: UpdateAccountingSettingsDto = { defaultJournal: 'new-journal' };
      const existingSettings = { companyId, defaultJournal: 'old-journal' };
      const mergedSettings = { ...existingSettings, ...dto };
      
      accountingSettingsRepository.findOne.mockResolvedValue(existingSettings);
      accountingSettingsRepository.merge.mockReturnValue(mergedSettings);
      accountingSettingsRepository.save.mockResolvedValue(mergedSettings);

      const result = await service.updateAccountingSettings(companyId, dto);

      expect(result).toEqual(mergedSettings);
      expect(accountingSettingsRepository.findOne).toHaveBeenCalledWith({ where: { companyId } });
      expect(accountingSettingsRepository.merge).toHaveBeenCalledWith(existingSettings, dto);
      expect(accountingSettingsRepository.save).toHaveBeenCalledWith(mergedSettings);
    });
  });

  describe('updateSecuritySettings', () => {
    it('should update security settings', async () => {
      const userId = 'user-id';
      const dto: UpdateSecuritySettingsDto = { twoFactorEnabled: true };
      const existingSettings = { userId, twoFactorEnabled: false };
      const mergedSettings = { ...existingSettings, ...dto };
      
      userSettingsRepository.findOne.mockResolvedValue(existingSettings);
      userSettingsRepository.merge.mockReturnValue(mergedSettings);
      userSettingsRepository.save.mockResolvedValue(mergedSettings);

      const result = await service.updateSecuritySettings(userId, dto);

      expect(result).toEqual(mergedSettings);
      expect(userSettingsRepository.findOne).toHaveBeenCalledWith({ where: { userId } });
      expect(userSettingsRepository.merge).toHaveBeenCalledWith(existingSettings, dto);
      expect(userSettingsRepository.save).toHaveBeenCalledWith(mergedSettings);
    });
  });

  describe('updateNotificationsSettings', () => {
    it('should update notifications settings', async () => {
      const userId = 'user-id';
      const dto: UpdateNotificationsSettingsDto = { 
        journal_validation: { email: true } 
      };
      const existingSettings = { 
        userId, 
        notifications: { report_generation: { email: false } } 
      };
      const expectedSavedSettings = {
        ...existingSettings,
        notifications: {
          report_generation: { email: false },
          journal_validation: { email: true }
        }
      };
      
      userSettingsRepository.findOne.mockResolvedValue(existingSettings);
      userSettingsRepository.save.mockResolvedValue(expectedSavedSettings);

      const result = await service.updateNotificationsSettings(userId, dto);

      expect(result).toEqual(expectedSavedSettings);
      expect(userSettingsRepository.findOne).toHaveBeenCalledWith({ where: { userId } });
      expect(userSettingsRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        notifications: expect.objectContaining({
          report_generation: { email: false },
          journal_validation: { email: true }
        })
      }));
    });
  });

  describe('updateIntegrationsSettings', () => {
    it('should update integrations settings', async () => {
      const companyId = 'company-id';
      const dto: UpdateIntegrationsSettingsDto = { 
        ksPay: { enabled: true, apiKey: 'new-key' } 
      };
      const existingSettings = { 
        companyId,
        googleDrive: { enabled: false },
        ksPay: { enabled: false, apiKey: 'old-key' },
        slack: { enabled: false }
      };
      const mergedSettings = {
        ...existingSettings,
        ksPay: { enabled: true, apiKey: 'new-key' }
      };
      
      integrationsSettingsRepository.findOne.mockResolvedValue(existingSettings);
      integrationsSettingsRepository.merge.mockReturnValue(mergedSettings);
      integrationsSettingsRepository.save.mockResolvedValue(mergedSettings);

      const result = await service.updateIntegrationsSettings(companyId, dto);

      expect(result).toEqual(mergedSettings);
      expect(integrationsSettingsRepository.findOne).toHaveBeenCalledWith({ where: { companyId } });
      expect(integrationsSettingsRepository.merge).toHaveBeenCalled();
      expect(integrationsSettingsRepository.save).toHaveBeenCalled();
    });
  });
});
