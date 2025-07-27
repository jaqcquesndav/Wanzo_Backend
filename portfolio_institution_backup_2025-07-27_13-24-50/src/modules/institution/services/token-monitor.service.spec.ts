import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TokenMonitorService } from './token-monitor.service';
import { Institution } from '../entities/institution.entity';
import { EventsService } from '../../events/events.service';
import { InstitutionUser } from '../entities/institution-user.entity'; // Corrected import path
import { EntityType } from '@wanzo/shared/events/subscription-types';
import { LessThan } from 'typeorm';

// Mock User and Institution data
const mockAdminUser = { id: 'admin-user-1', role: 'admin' } as unknown as InstitutionUser;
const mockRegularUser = { id: 'regular-user-1', role: 'user' } as unknown as InstitutionUser;

const mockInstitutionWithLowBalanceAdmin = {
  id: 'institution-1',
  tokenBalance: 5,
  users: [mockAdminUser, mockRegularUser],
  tokenUsageHistory: [],
} as unknown as Institution; // Corrected type casting

const mockInstitutionWithLowBalanceNoAdmin = {
  id: 'institution-2',
  tokenBalance: 3,
  users: [mockRegularUser],
  tokenUsageHistory: [],
} as unknown as Institution; // Corrected type casting

// Removed unused mockInstitutionWithOkBalance

const mockInstitutionForAnalytics = {
  id: 'institution-analytics-1',
  tokenBalance: 100,
  users: [mockAdminUser],
  tokenUsageHistory: [
    { date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), operation: 'use', amount: 10, description: 'Feature A' },
    { date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), operation: 'purchase', amount: 50, description: 'Token pack' },
    { date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), operation: 'use', amount: 5, description: 'Feature B' },
    { date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(), operation: 'use', amount: 15, description: 'Feature A' },
    { date: new Date(new Date().setDate(new Date().getDate() - 35)).toISOString(), operation: 'use', amount: 20, description: 'Old Feature' }, // Older than 30 days
  ],
} as unknown as Institution; // Cast to unknown first, then to Institution for complex mock

const mockInstitutionNoHistory = {
  id: 'institution-no-history',
  tokenBalance: 20,
  users: [mockAdminUser],
  tokenUsageHistory: [],
} as unknown as Institution; // Corrected: Cast to unknown first

describe('TokenMonitorService', () => {
  let service: TokenMonitorService;

  const mockInstitutionRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockEventsService = {
    publishTokenAlert: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenMonitorService,
        {
          provide: getRepositoryToken(Institution),
          useValue: mockInstitutionRepository,
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    service = module.get<TokenMonitorService>(TokenMonitorService);
    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('monitorLowTokenBalances', () => {
    it('should find institutions with low balance and send alerts for those with admin users', async () => {
      mockInstitutionRepository.find.mockResolvedValueOnce([
        mockInstitutionWithLowBalanceAdmin,
        mockInstitutionWithLowBalanceNoAdmin,
      ]);

      await service.monitorLowTokenBalances();

      expect(mockInstitutionRepository.find).toHaveBeenCalledWith({
        where: { tokenBalance: LessThan(service['LOW_TOKEN_THRESHOLD']) }, // Changed to use LessThan
        relations: ['users'],
      });
      expect(mockEventsService.publishTokenAlert).toHaveBeenCalledTimes(1);
      expect(mockEventsService.publishTokenAlert).toHaveBeenCalledWith({
        userId: mockAdminUser.id,
        entityId: mockInstitutionWithLowBalanceAdmin.id,
        entityType: EntityType.INSTITUTION,
        amount: mockInstitutionWithLowBalanceAdmin.tokenBalance,
        operation: 'alert',
        currentBalance: mockInstitutionWithLowBalanceAdmin.tokenBalance,
        timestamp: expect.any(Date),
        metadata: {
          alertType: 'low_balance',
          threshold: service['LOW_TOKEN_THRESHOLD'],
        },
      });
      expect(service['logger'].log).toHaveBeenCalledWith(
        `Found 2 institutions with low token balance`,
      );
      expect(service['logger'].log).toHaveBeenCalledWith(
        `Sent low token balance alert for institution ${mockInstitutionWithLowBalanceAdmin.id}`,
      );
    });

    it('should not send alerts if no institutions have low balance', async () => {
      mockInstitutionRepository.find.mockResolvedValueOnce([]);
      await service.monitorLowTokenBalances();
      expect(mockEventsService.publishTokenAlert).not.toHaveBeenCalled();
      expect(service['logger'].log).toHaveBeenCalledWith(
        `Found 0 institutions with low token balance`,
      );
    });

    it('should not send alerts for institutions with low balance but no admin users', async () => {
      mockInstitutionRepository.find.mockResolvedValueOnce([
        mockInstitutionWithLowBalanceNoAdmin,
      ]);
      await service.monitorLowTokenBalances();
      expect(mockEventsService.publishTokenAlert).not.toHaveBeenCalled();
      expect(service['logger'].log).toHaveBeenCalledWith(
        `Found 1 institutions with low token balance`,
      );
    });
    
    it('should handle errors during monitoring', async () => {
      const errorMessage = 'Database error';
      const error = new Error(errorMessage);
      mockInstitutionRepository.find.mockRejectedValueOnce(error);
      await service.monitorLowTokenBalances();
      expect(mockEventsService.publishTokenAlert).not.toHaveBeenCalled();      expect(service['logger'].error).toHaveBeenCalledWith(
        `Error monitoring token balances: ${errorMessage}`,
        error.stack
      );
    });
  });

  describe('generateTokenUsageAnalytics', () => {
    it('should generate token usage analytics correctly for an institution', async () => {
      mockInstitutionRepository.findOne.mockResolvedValueOnce(mockInstitutionForAnalytics);

      const analytics = await service.generateTokenUsageAnalytics(mockInstitutionForAnalytics.id);

      expect(mockInstitutionRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockInstitutionForAnalytics.id },
      });

      // totalUsed should be sum of 'use' operations in the last 30 days (10 + 5 + 15 = 30)
      expect(analytics.totalUsed).toBe(30);
      // dailyAverage = totalUsed / 30
      expect(analytics.dailyAverage).toBe(1); // 30 / 30 = 1
      // daysRemaining = tokenBalance / dailyAverage
      expect(analytics.daysRemaining).toBe(100); // 100 / 1 = 100
      expect(analytics.usageByOperation.use).toBe(30);
      expect(analytics.usageHistory.length).toBe(4); // 4 entries in the last 30 days (3 use, 1 purchase)
    });

    it('should handle institution not found', async () => {
      mockInstitutionRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.generateTokenUsageAnalytics('non-existent-id')).rejects.toThrow(
        'Institution not found',
      );
    });

    it('should handle institution with no token usage history', async () => {
      mockInstitutionRepository.findOne.mockResolvedValueOnce(mockInstitutionNoHistory);
      const analytics = await service.generateTokenUsageAnalytics(mockInstitutionNoHistory.id);
      expect(analytics.totalUsed).toBe(0);
      expect(analytics.dailyAverage).toBe(0);
      // daysRemaining will be tokenBalance / 1 (as dailyAverage is 0, it defaults to 1 in calculation)
      expect(analytics.daysRemaining).toBe(mockInstitutionNoHistory.tokenBalance);
      expect(analytics.usageByOperation).toEqual({});
      expect(analytics.usageHistory.length).toBe(0);
    });

    it('should handle division by zero for daysRemaining if dailyAverage is 0 and balance is 0', async () => {
      const mockInstitutionZeroBalanceNoHistory = {
        ...mockInstitutionNoHistory,
        tokenBalance: 0,
      } as Institution;
      mockInstitutionRepository.findOne.mockResolvedValueOnce(mockInstitutionZeroBalanceNoHistory);
      const analytics = await service.generateTokenUsageAnalytics(mockInstitutionZeroBalanceNoHistory.id);
      expect(analytics.totalUsed).toBe(0);
      expect(analytics.dailyAverage).toBe(0);
      expect(analytics.daysRemaining).toBe(0); // 0 / 1 = 0
    });
  });
});
