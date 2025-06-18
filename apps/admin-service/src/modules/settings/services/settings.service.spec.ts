import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsService } from './settings.service';
import {
  AdminProfile,
  SecuritySetting,
  SystemSetting,
  ActiveSession,
  LoginHistory,
  NotificationPreference,
  ApplicationSetting
} from '../entities/settings.entity';
import {
  UpdateUserProfileDto,
  NotificationPreferencesResponseDto,
  UpdateNotificationPreferenceDto,
  TwoFactorSettingsDto,
} from '../dtos/settings.dto';

// Mock repositories
const mockUserSettingsRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};
const mockNotificationSettingsRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
};
const mockUserSecuritySettingsRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
  genSalt: jest.fn(),
  hashSync: jest.fn(),
  compareSync: jest.fn(),
  genSaltSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: getRepositoryToken(AdminProfile),
          useValue: mockUserSettingsRepository,
        },
        {
          provide: getRepositoryToken(SecuritySetting),
          useValue: mockUserSecuritySettingsRepository,
        },
        {
          provide: getRepositoryToken(SystemSetting),
          useValue: mockUserSettingsRepository,
        },
        {
          provide: getRepositoryToken(ActiveSession),
          useValue: mockUserSettingsRepository,
        },
        {
          provide: getRepositoryToken(LoginHistory),
          useValue: mockUserSettingsRepository,
        },
        {
          provide: getRepositoryToken(NotificationPreference),
          useValue: mockNotificationSettingsRepository,
        },
        {
          provide: getRepositoryToken(ApplicationSetting),
          useValue: mockUserSettingsRepository,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      const userId = 'user-id';
      const mockProfile = {
        id: 'profile-id',
        adminId: userId,
        name: 'Test User',
        position: 'Manager',
        phoneNumber: '1234567890',
        avatarUrl: 'avatar.jpg',
        language: 'fr',
        timezone: 'Africa/Kinshasa',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserSettingsRepository.findOne.mockResolvedValue(mockProfile);

      const result = await service.getUserProfile(userId);

      expect(result.id).toEqual(userId);
      expect(result.name).toEqual(mockProfile.name);
      expect(result.position).toEqual(mockProfile.position);
      expect(result.phoneNumber).toEqual(mockProfile.phoneNumber);
      expect(result.avatarUrl).toEqual(mockProfile.avatarUrl);
      expect(result.language).toEqual(mockProfile.language);
      expect(result.timezone).toEqual(mockProfile.timezone);

      expect(mockUserSettingsRepository.findOne).toHaveBeenCalledWith({ where: { adminId: userId } });
    });

    it('should create a new profile if not found', async () => {
      const userId = 'user-id';

      mockUserSettingsRepository.findOne.mockResolvedValue(null);

      const newProfile = {
        id: 'new-profile-id',
        adminId: userId,
        name: 'New Admin',
        language: 'fr',
        timezone: 'Africa/Kinshasa',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserSettingsRepository.create.mockReturnValue(newProfile);
      mockUserSettingsRepository.save.mockResolvedValue(newProfile);

      const result = await service.getUserProfile(userId);

      expect(result.name).toEqual(newProfile.name);
      expect(mockUserSettingsRepository.create).toHaveBeenCalled();
      expect(mockUserSettingsRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile', async () => {
      const userId = 'user-id';
      const updateDto: UpdateUserProfileDto = {
        name: 'Updated Name',
        position: 'Senior Manager',
        phoneNumber: '9876543210',
        language: 'en',
        timezone: 'Europe/Paris',
      };

      const existingProfile = {
        id: 'profile-id',
        adminId: userId,
        name: 'Test User',
        position: 'Manager',
        phoneNumber: '1234567890',
        avatarUrl: 'avatar.jpg',
        language: 'fr',
        timezone: 'Africa/Kinshasa',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedProfile = {
        ...existingProfile,
        ...updateDto,
      };

      mockUserSettingsRepository.findOne.mockResolvedValue(existingProfile);
      mockUserSettingsRepository.save.mockResolvedValue(updatedProfile);

      const result = await service.updateUserProfile(userId, updateDto);

      expect(result.name).toEqual(updateDto.name);
      expect(result.position).toEqual(updateDto.position);
      expect(result.language).toEqual(updateDto.language);
      expect(result.timezone).toEqual(updateDto.timezone);

      expect(mockUserSettingsRepository.findOne).toHaveBeenCalledWith({ where: { adminId: userId } });
      expect(mockUserSettingsRepository.save).toHaveBeenCalled();
    });
  });

  describe('getNotificationPreferences', () => {
    it('should return notification preferences', async () => {
      const userId = 'user-id';
      const mockPreferences = [
        {
          preferenceId: 'pref1',
          adminId: userId,
          label: 'Marketing Emails',
          description: '... promotions.',
          channel: 'email' as const,
          type: 'marketing',
          isEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockNotificationSettingsRepository.find.mockResolvedValue(mockPreferences);
      mockNotificationSettingsRepository.count.mockResolvedValue(1);

      const result: NotificationPreferencesResponseDto = await service.getNotificationPreferences(userId);

      expect(result.preferences.length).toBe(1);
      expect(result.preferences[0].type).toBe('marketing');
      expect(result.preferences[0].isEnabled).toBe(true);
      expect(mockNotificationSettingsRepository.find).toHaveBeenCalledWith({ where: { adminId: userId } });
    });
  });

  describe('updateNotificationPreference', () => {
    it('should update an existing notification preference', async () => {
      const adminId = '1';
      const preferenceId = 'emailMarketing';
      const isEnabled = false;

      const existingPreference = {
        adminId,
        preferenceId,
        isEnabled: true,
      };

      mockNotificationSettingsRepository.findOne.mockResolvedValue(existingPreference);
      mockNotificationSettingsRepository.save.mockResolvedValue({ ...existingPreference, isEnabled: false });

      await service.updateNotificationPreference(adminId, preferenceId, isEnabled);
      expect(mockNotificationSettingsRepository.findOne).toHaveBeenCalledWith({ where: { adminId, preferenceId } });
      expect(mockNotificationSettingsRepository.save).toHaveBeenCalledWith({ ...existingPreference, isEnabled: false });
    });
  });

  describe('getUserSecuritySettings', () => {
    it('should return user security settings', async () => {
      const userId = '1';
      const securitySettings = {
        userId,
        twoFactorEnabled: true,
      };
      mockUserSecuritySettingsRepository.findOne.mockResolvedValue(securitySettings);
      mockUserSecuritySettingsRepository.create.mockReturnValue(securitySettings);
      mockUserSecuritySettingsRepository.save.mockResolvedValue(securitySettings);


      const result = await service.getUserSecuritySettings(userId);
      expect(result.twoFactorEnabled).toEqual(securitySettings.twoFactorEnabled);
    });

    it('should return default security settings if none are found', async () => {
      const userId = '1';
      mockUserSecuritySettingsRepository.findOne.mockResolvedValue(null);
      mockUserSecuritySettingsRepository.create.mockReturnValue({ userId, twoFactorEnabled: false });
      mockUserSecuritySettingsRepository.save.mockResolvedValue({ userId, twoFactorEnabled: false });

      const result = await service.getUserSecuritySettings(userId);
      expect(result.twoFactorEnabled).toBe(false);
    });
  });

  describe('updateTwoFactorSettings', () => {
    it('should update user security settings', async () => {
      const adminId = '1';
      const settingsDto: TwoFactorSettingsDto = { enabled: true };
      const existingSettings = {
        adminId,
        twoFactorEnabled: false,
      };

      mockUserSecuritySettingsRepository.findOne.mockResolvedValue(existingSettings);
      mockUserSecuritySettingsRepository.create.mockReturnValue(existingSettings);
      mockUserSecuritySettingsRepository.save.mockResolvedValue({ ...existingSettings, twoFactorEnabled: true });

      const result = await service.updateTwoFactorSettings(adminId, settingsDto);

      expect(result.twoFactorEnabled).toEqual(settingsDto.enabled);
      expect(mockUserSecuritySettingsRepository.save).toHaveBeenCalledWith(expect.objectContaining({ twoFactorEnabled: true }));
    });
  });
});
