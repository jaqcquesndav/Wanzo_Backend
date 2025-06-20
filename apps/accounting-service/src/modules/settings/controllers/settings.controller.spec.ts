import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from '../services/settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UpdateGeneralSettingsDto } from '../dtos/update-general-settings.dto';
import { UpdateAccountingSettingsDto } from '../dtos/update-accounting-settings.dto';
import { UpdateSecuritySettingsDto } from '../dtos/update-security-settings.dto';
import { UpdateNotificationsSettingsDto } from '../dtos/update-notifications-settings.dto';
import { UpdateIntegrationsSettingsDto } from '../dtos/update-integrations-settings.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: SettingsService;

  const mockSettingsService = {
    getAllSettings: jest.fn(),
    updateGeneralSettings: jest.fn(),
    updateAccountingSettings: jest.fn(),
    updateSecuritySettings: jest.fn(),
    updateNotificationsSettings: jest.fn(),
    updateIntegrationsSettings: jest.fn(),
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
      .compile();

    controller = module.get<SettingsController>(SettingsController);
    service = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllSettings', () => {
    it('should return all settings for a user and company', async () => {
      const req = { user: { companyId: 'company-id', id: 'user-id' } };
      const settingsDto = {}; // Mock DTO
      mockSettingsService.getAllSettings.mockResolvedValue(settingsDto);

      const result = await controller.getAllSettings(req as any);

      expect(result).toEqual(settingsDto);
      expect(mockSettingsService.getAllSettings).toHaveBeenCalledWith('company-id', 'user-id');
    });
  });

  describe('updateSettingsCategory', () => {
    const req = { user: { companyId: 'company-id', id: 'user-id' } };

    it('should update general settings', async () => {
      const dto: UpdateGeneralSettingsDto = { language: 'fr' };
      mockSettingsService.updateGeneralSettings.mockResolvedValue({ success: true });
      const result = await controller.updateSettingsCategory('general', dto, req as any);
      expect(result).toEqual({ success: true, data: { success: true } });
      expect(mockSettingsService.updateGeneralSettings).toHaveBeenCalledWith('user-id', dto);
    });

    it('should update accounting settings', async () => {
      const dto: UpdateAccountingSettingsDto = { defaultJournal: 'some-journal' };
       mockSettingsService.updateAccountingSettings.mockResolvedValue({ success: true });
      const result = await controller.updateSettingsCategory('accounting', dto, req as any);
      expect(result).toEqual({ success: true, data: { success: true } });
      expect(mockSettingsService.updateAccountingSettings).toHaveBeenCalledWith('company-id', dto);
    });

    it('should update security settings', async () => {
      const dto: UpdateSecuritySettingsDto = { twoFactorEnabled: true };
      mockSettingsService.updateSecuritySettings.mockResolvedValue({ success: true });
      const result = await controller.updateSettingsCategory('security', dto, req as any);
      expect(result).toEqual({ success: true, data: { success: true } });
      expect(mockSettingsService.updateSecuritySettings).toHaveBeenCalledWith('user-id', dto);
    });

    it('should update notifications settings', async () => {
      const dto: UpdateNotificationsSettingsDto = { journal_validation: { email: true } };
      mockSettingsService.updateNotificationsSettings.mockResolvedValue({ success: true });
      const result = await controller.updateSettingsCategory('notifications', dto, req as any);
      expect(result).toEqual({ success: true, data: { success: true } });
      expect(mockSettingsService.updateNotificationsSettings).toHaveBeenCalledWith('user-id', dto);
    });

    it('should update integrations settings', async () => {
      const dto: UpdateIntegrationsSettingsDto = { ksPay: { enabled: true, apiKey: 'some-key' } };
      mockSettingsService.updateIntegrationsSettings.mockResolvedValue({ success: true });
      const result = await controller.updateSettingsCategory('integrations', dto, req as any);
      expect(result).toEqual({ success: true, data: { success: true } });
      expect(mockSettingsService.updateIntegrationsSettings).toHaveBeenCalledWith('company-id', dto);
    });

    it('should throw an error for an invalid category', async () => {
      const dto = {};
      await expect(controller.updateSettingsCategory('invalid', dto, req as any)).rejects.toThrow(
        new HttpException('Invalid settings category', HttpStatus.BAD_REQUEST),
      );
    });
  });
});
