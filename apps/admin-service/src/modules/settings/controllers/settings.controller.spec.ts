import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from '../services/settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import {
  AllSettingsDto,
  GeneralSettingsDto,
  SecuritySettingsDto,
  NotificationSettingsDto,
  BillingSettingsDto,
  AppearanceSettingsDto,
  UpdateSettingDto,
  AppSettingsResponseDto
} from '../dtos/settings.dto';

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: SettingsService;

  const mockSettingsService = {
    getAllSettings: jest.fn(),
    getSettingsBySection: jest.fn(),
    updateSettings: jest.fn(),
    getApplicationSettings: jest.fn(),
    updateApplicationSetting: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SettingsController>(SettingsController);
    service = module.get<SettingsService>(SettingsService);

    // Reset all mocks after each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllSettings', () => {
    it('should return all settings', async () => {
      const mockSettings: AllSettingsDto = {
        general: { companyName: 'Test', language: 'en', timezone: 'UTC', dateFormat: 'YYYY-MM-DD' },
        security: { passwordPolicy: { minLength: 8, requireUppercase: true, requireLowercase: true, requireNumbers: true, requireSpecialChars: true, expiryDays: 90 }, twoFactorEnabled: true, twoFactorMethods: ['email'], sessionTimeout: 30 },
        notifications: { email: true, sms: false, push: true, inApp: true, notifyOn: { newCustomer: true, newInvoice: true, paymentReceived: true, lowTokens: true, securityAlerts: true } },
        billing: { defaultCurrency: 'USD', taxRate: 0, paymentMethods: ['stripe'], invoiceDueDays: 30, invoiceNotes: '', autoGenerateInvoices: false },
        appearance: { theme: 'light', density: 'compact', fontFamily: 'Inter', fontSize: '14px' },
      };
      
      mockSettingsService.getAllSettings.mockResolvedValue(mockSettings);
      
      const result = await controller.getAllSettings();
      
      expect(result).toEqual(mockSettings);
      expect(mockSettingsService.getAllSettings).toHaveBeenCalled();
    });
  });

  describe('getGeneralSettings', () => {
    it('should return general settings', async () => {
      const mockSettings: GeneralSettingsDto = { companyName: 'Test', language: 'en', timezone: 'UTC', dateFormat: 'YYYY-MM-DD' };
      
      mockSettingsService.getSettingsBySection.mockResolvedValue(mockSettings);
      
      const result = await controller.getGeneralSettings();
      
      expect(result).toEqual(mockSettings);
      expect(mockSettingsService.getSettingsBySection).toHaveBeenCalledWith('general');
    });
  });

  describe('updateSettings', () => {
    it('should update settings for a specific section', async () => {
      const section = 'general';
      const updateDto = { companyName: "Updated Company" };
      
      mockSettingsService.updateSettings.mockResolvedValue(updateDto);
      
      const result = await controller.updateSettings(section, updateDto);
      
      expect(result).toEqual(updateDto);
      expect(mockSettingsService.updateSettings).toHaveBeenCalledWith(section, updateDto);
    });
  });

  describe('getAppSettings', () => {
    it('should return app settings', async () => {
      const mockResponse: AppSettingsResponseDto = {
        data: [
          { id: 'setting1', name: 'Setting 1', value: 'value1', description: 'Desc 1', category: 'cat1' },
        ]
      };
      mockSettingsService.getApplicationSettings.mockResolvedValue(mockResponse);
      
      const result = await controller.getAppSettings();
      
      expect(result).toEqual(mockResponse);
      expect(mockSettingsService.getApplicationSettings).toHaveBeenCalled();
    });
  });

  describe('updateApplicationSetting', () => {
    it('should update an application setting', async () => {
      const settingId = 'setting1';
      const updateDto: UpdateSettingDto = { value: 'newValue' };
      const updatedSetting = { id: settingId, name: 'Setting 1', value: 'newValue', description: 'Desc 1', category: 'cat1' };

      mockSettingsService.updateApplicationSetting.mockResolvedValue(updatedSetting);
      
      const result = await controller.updateApplicationSetting(settingId, updateDto);
      
      expect(result).toEqual(updatedSetting);
      expect(mockSettingsService.updateApplicationSetting).toHaveBeenCalledWith(settingId, updateDto);
    });
  });
});
