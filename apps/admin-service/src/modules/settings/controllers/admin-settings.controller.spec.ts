import { Test, TestingModule } from '@nestjs/testing';
import { AdminSettingsController } from './admin-settings.controller';
import { SettingsService } from '../services/settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/entities/enums/user-role.enum';
import { UserStatus } from '../../users/entities/enums/user-status.enum';
import { UserType } from '../../users/entities/enums/user-type.enum';
import {
  UpdateUserProfileDto,
  UpdateNotificationPreferenceDto,
  UpdateAllNotificationPreferencesDto,
  TwoFactorSettingsDto,
  ChangePasswordDto,
  UpdatePreferenceItemDto,
  UserProfileDto,
  ActiveSessionsResponseDto,
  LoginHistoryResponseDto,
  NotificationPreferencesResponseDto
} from '../dtos/settings.dto';

describe('AdminSettingsController', () => {
  let controller: AdminSettingsController;
  let service: SettingsService;  const mockUser = {
    id: 'user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.COMPANY_USER,
    userType: UserType.INTERNAL,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    password: 'hashed-password',
    phoneNumber: '1234567890',
    position: 'Manager',
    avatarUrl: 'avatar.jpg',
    lastLogin: new Date(),
    isTwoFactorEnabled: false,
  } as unknown as User;
  const mockSettingsService = {
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    updateAvatar: jest.fn(),
    getTwoFactorSettings: jest.fn(),
    updateTwoFactorSettings: jest.fn(),
    changePassword: jest.fn(),
    getActiveSessions: jest.fn(),
    revokeSession: jest.fn(),
    terminateAllOtherSessions: jest.fn(),
    getLoginHistory: jest.fn(),
    getNotificationPreferences: jest.fn(),
    updateNotificationPreference: jest.fn(),
    updateAllNotificationPreferences: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminSettingsController],
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

    controller = module.get<AdminSettingsController>(AdminSettingsController);
    service = module.get<SettingsService>(SettingsService);

    // Reset all mocks after each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockProfile: UserProfileDto = { 
        id: 'profile-id', 
        name: 'Test User', 
        email: 'test@example.com',
        position: 'Manager',
        phoneNumber: '1234567890',
        avatarUrl: 'avatar.jpg',
        role: 'admin',
        language: 'fr',
        timezone: 'Africa/Kinshasa',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockSettingsService.getUserProfile.mockResolvedValue(mockProfile);
      
      const result = await controller.getProfile(mockUser);
      
      expect(result).toEqual(mockProfile);
      expect(mockSettingsService.getUserProfile).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateDto: UpdateUserProfileDto = {
        name: 'Updated Name',
        position: 'Senior Manager',
        phoneNumber: '9876543210',
        language: 'en',
        timezone: 'Europe/Paris',
      };
      
      const updatedProfile: UserProfileDto = {
        id: 'profile-id',
        name: 'Updated Name',
        email: 'test@example.com',
        position: 'Senior Manager',
        phoneNumber: '9876543210',
        avatarUrl: 'avatar.jpg',
        role: 'admin',
        language: 'en',
        timezone: 'Europe/Paris',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockSettingsService.updateUserProfile.mockResolvedValue(updatedProfile);
      
      const result = await controller.updateProfile(mockUser, updateDto);
      
      expect(result).toEqual(updatedProfile);
      expect(mockSettingsService.updateUserProfile).toHaveBeenCalledWith(mockUser.id, updateDto);
    });
  });
  describe('getSecuritySettings', () => {
    it('should return security settings', async () => {
      const mockSettings: TwoFactorSettingsDto = {
        enabled: true
      };
      
      mockSettingsService.getTwoFactorSettings.mockResolvedValue(mockSettings);
      
      const result = await controller.getSecuritySettings(mockUser);
      
      expect(result).toEqual(mockSettings);
      expect(mockSettingsService.getTwoFactorSettings).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('updateTwoFactorSettings', () => {
    it('should update two-factor settings', async () => {
      const updateDto: TwoFactorSettingsDto = {
        enabled: true
      };
      
      const updatedSettings = {
        twoFactorEnabled: true
      };
      
      mockSettingsService.updateTwoFactorSettings.mockResolvedValue(updatedSettings);
      
      const result = await controller.updateTwoFactorSettings(mockUser, updateDto);
      
      expect(result).toEqual(updatedSettings);
      expect(mockSettingsService.updateTwoFactorSettings).toHaveBeenCalledWith(mockUser.id, updateDto);
    });
  });

  describe('changePassword', () => {
    it('should change password', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword'
      };
      
      const response = { message: 'Password changed successfully' };
      
      mockSettingsService.changePassword.mockResolvedValue(response);
      
      const result = await controller.changePassword(mockUser, changePasswordDto);
      
      expect(result).toEqual(response);
      expect(mockSettingsService.changePassword).toHaveBeenCalledWith(mockUser.id, changePasswordDto);
    });
  });
  describe('getNotificationPreferences', () => {
    it('should return notification preferences', async () => {
      const mockPreferences: NotificationPreferencesResponseDto = {
        preferences: [
          { 
            id: 'pref1', 
            label: 'Email notifications', 
            description: 'Receive updates via email',
            channel: 'email',
            type: 'marketing',
            isEnabled: true 
          },
          { 
            id: 'pref2', 
            label: 'SMS notifications', 
            description: 'Receive updates via SMS',
            channel: 'sms',
            type: 'security',
            isEnabled: false 
          }
        ]
      };
      
      mockSettingsService.getNotificationPreferences.mockResolvedValue(mockPreferences);
      
      const result = await controller.getNotificationPreferences(mockUser);
      
      expect(result).toEqual(mockPreferences);
      expect(mockSettingsService.getNotificationPreferences).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('updateNotificationPreference', () => {
    it('should update notification preference', async () => {
      const preferenceId = 'pref1';
      const updateDto: UpdateNotificationPreferenceDto = {
        isEnabled: false
      };
      
      const updatedPreference = { 
        id: preferenceId,
        label: 'Email notifications',
        description: 'Receive updates via email',
        channel: 'email',
        type: 'marketing',
        isEnabled: false 
      };
      
      mockSettingsService.updateNotificationPreference.mockResolvedValue(updatedPreference);
      
      const result = await controller.updateNotificationPreference(mockUser, preferenceId, updateDto);
      
      expect(result).toEqual(updatedPreference);
      expect(mockSettingsService.updateNotificationPreference).toHaveBeenCalledWith(mockUser.id, preferenceId, updateDto.isEnabled);
    });
  });

  describe('updateAllNotificationPreferences', () => {
    it('should update all notification preferences', async () => {
      const updateDto: UpdateAllNotificationPreferencesDto = {
        preferences: [
          { id: 'pref1', isEnabled: true },
          { id: 'pref2', isEnabled: false }
        ]
      };
      
      const updatedPreferences: NotificationPreferencesResponseDto = {
        preferences: [
          { 
            id: 'pref1', 
            label: 'Email notifications', 
            description: 'Receive updates via email',
            channel: 'email',
            type: 'marketing',
            isEnabled: true 
          },
          { 
            id: 'pref2', 
            label: 'SMS notifications', 
            description: 'Receive updates via SMS',
            channel: 'sms',
            type: 'security',
            isEnabled: false 
          }
        ]
      };
      
      mockSettingsService.updateAllNotificationPreferences.mockResolvedValue(updatedPreferences);
      
      const result = await controller.updateAllNotificationPreferences(mockUser, updateDto);
      
      expect(result).toEqual(updatedPreferences);
      expect(mockSettingsService.updateAllNotificationPreferences).toHaveBeenCalledWith(mockUser.id, updateDto);
    });
  });
  describe('getActiveSessions', () => {
    it('should return active sessions', async () => {
      const mockSessions: ActiveSessionsResponseDto = {
        sessions: [
          { 
            id: 'session1', 
            device: 'Chrome on Windows', 
            location: 'New York, USA',
            ipAddress: '192.168.1.1',
            lastActive: new Date().toISOString(),
            isCurrent: true,
            browser: 'Chrome',
            os: 'Windows'
          },
          { 
            id: 'session2', 
            device: 'Firefox on Mac', 
            location: 'San Francisco, USA',
            ipAddress: '192.168.1.2',
            lastActive: new Date().toISOString(),
            isCurrent: false,
            browser: 'Firefox',
            os: 'MacOS'
          }
        ]
      };
      
      mockSettingsService.getActiveSessions.mockResolvedValue(mockSessions);
      
      const result = await controller.getActiveSessions(mockUser);
      
      expect(result).toEqual(mockSessions);
      expect(mockSettingsService.getActiveSessions).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session', async () => {
      const sessionId = 'session1';
      const response = { message: 'Session revoked successfully' };
      
      mockSettingsService.revokeSession.mockResolvedValue(response);
      
      const result = await controller.revokeSession(mockUser, sessionId);
      
      expect(result).toEqual(response);
      expect(mockSettingsService.revokeSession).toHaveBeenCalledWith(mockUser.id, sessionId);
    });
  });

  describe('revokeAllOtherSessions', () => {
    it('should revoke all other sessions', async () => {
      const response = { message: 'All other sessions revoked' };
      
      mockSettingsService.terminateAllOtherSessions.mockResolvedValue(response);
      
      const result = await controller.revokeAllOtherSessions(mockUser);
      
      expect(result).toEqual(response);
      expect(mockSettingsService.terminateAllOtherSessions).toHaveBeenCalledWith(mockUser.id);
    });
  });
  describe('getLoginHistory', () => {
    it('should return login history', async () => {
      const mockHistory: LoginHistoryResponseDto = {
        history: [
          { 
            id: 'login1', 
            date: new Date().toISOString(), 
            ipAddress: '192.168.1.1',
            device: 'Chrome on Windows',
            location: 'New York, USA',
            status: 'successful',
            userAgent: 'Mozilla/5.0'
          },
          { 
            id: 'login2', 
            date: new Date().toISOString(), 
            ipAddress: '192.168.1.2',
            device: 'Firefox on Mac',
            location: 'San Francisco, USA',
            status: 'failed',
            userAgent: 'Mozilla/5.0'
          }
        ],
        total: 2,
        page: 1,
        limit: 10
      };
      
      mockSettingsService.getLoginHistory.mockResolvedValue(mockHistory);
      
      const result = await controller.getLoginHistory(mockUser, 1, 10);
      
      expect(result).toEqual(mockHistory);
      expect(mockSettingsService.getLoginHistory).toHaveBeenCalledWith(mockUser.id, { page: 1, limit: 10 });
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar image', async () => {
      const mockFile = {
        filename: 'avatar.jpg',
        originalname: 'profile.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        path: '/path/to/avatar.jpg',
        buffer: Buffer.from('test')
      } as Express.Multer.File;
      
      const response = { 
        avatarUrl: '/uploads/avatars/avatar.jpg',
        message: 'Avatar updated successfully.'
      };
      
      mockSettingsService.updateAvatar.mockResolvedValue(response);
      
      const result = await controller.uploadAvatar(mockUser, mockFile);
      
      expect(result).toEqual(response);
      expect(mockSettingsService.updateAvatar).toHaveBeenCalledWith(mockUser.id, mockFile);
  });
});
});
