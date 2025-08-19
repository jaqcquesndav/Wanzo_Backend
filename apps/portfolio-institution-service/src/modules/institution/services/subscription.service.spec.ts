import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionService } from './subscription.service';
import { Institution, SubscriptionStatus, SubscriptionPlan } from '../entities/institution.entity';
import { TokenEventHandler } from './token-event.handler';
import { EventsService } from '../../events/events.service';
import { BadRequestException, Logger } from '@nestjs/common';
import { EntityType, SubscriptionStatusType } from '@wanzobe/shared/events/subscription-types';

// Mock data
const mockInstitutionId = 'institution-123';
const mockUserId = 'user-456';
const mockDate = new Date();

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  const mockInstitutionRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockTokenEventHandler = {
    handleTokenPurchase: jest.fn(),
    handleTokenUsage: jest.fn(),
  };

  const mockEventsService = {
    publishSubscriptionChanged: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: getRepositoryToken(Institution),
          useValue: mockInstitutionRepository,
        },
        {
          provide: TokenEventHandler,
          useValue: mockTokenEventHandler,
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
        Logger, // Add Logger to providers if it's not globally available
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkSubscriptionStatus', () => {
    it('should return true for active subscription not expired', async () => {
      const institution = {
        id: mockInstitutionId,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionExpiresAt: new Date(mockDate.getTime() + 86400000), // Expires tomorrow
      } as Institution;
      mockInstitutionRepository.findOne.mockResolvedValue(institution);
      const isActive = await service.checkSubscriptionStatus(mockInstitutionId);
      expect(isActive).toBe(true);
      expect(mockInstitutionRepository.findOne).toHaveBeenCalledWith({ where: { id: mockInstitutionId } });
    });

    it('should return false for inactive subscription', async () => {
      const institution = {
        id: mockInstitutionId,
        subscriptionStatus: SubscriptionStatus.EXPIRED, // Corrected: Was INACTIVE
      } as Institution;
      mockInstitutionRepository.findOne.mockResolvedValue(institution);
      const isActive = await service.checkSubscriptionStatus(mockInstitutionId);
      expect(isActive).toBe(false);
    });

    it('should return false and update status for expired subscription', async () => {
      const institution = {
        id: mockInstitutionId,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionExpiresAt: new Date(mockDate.getTime() - 86400000), // Expired yesterday
      } as Institution;
      mockInstitutionRepository.findOne.mockResolvedValue(institution);
      mockInstitutionRepository.save.mockResolvedValue({...institution, subscriptionStatus: SubscriptionStatus.EXPIRED });
      const isActive = await service.checkSubscriptionStatus(mockInstitutionId);
      expect(isActive).toBe(false);
      expect(institution.subscriptionStatus).toBe(SubscriptionStatus.EXPIRED);
      expect(mockInstitutionRepository.save).toHaveBeenCalledWith(institution);
    });

    it('should throw BadRequestException if institution not found', async () => {
      mockInstitutionRepository.findOne.mockResolvedValue(null);
      await expect(service.checkSubscriptionStatus(mockInstitutionId)).rejects.toThrow(
        new BadRequestException('Institution not found'),
      );
    });
  });

  describe('updateSubscription', () => {
    const plan = SubscriptionPlan.PROFESSIONAL; // Corrected: Was PREMIUM
    const expiresAt = new Date(mockDate.getTime() + 30 * 86400000); // Expires in 30 days

    it('should update subscription and publish event', async () => {
      const initialInstitution = {
        id: mockInstitutionId,
        subscriptionPlan: SubscriptionPlan.BASIC,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionExpiresAt: new Date(),
      } as Institution;
      const updatedInstitutionData = {
        ...initialInstitution,
        subscriptionPlan: plan,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionExpiresAt: expiresAt,
      };

      mockInstitutionRepository.findOne.mockResolvedValue(initialInstitution);
      mockInstitutionRepository.save.mockResolvedValue(updatedInstitutionData);

      const result = await service.updateSubscription(
        mockInstitutionId,
        plan,
        expiresAt,
        mockUserId,
      );

      expect(mockInstitutionRepository.findOne).toHaveBeenCalledWith({ where: { id: mockInstitutionId } });
      expect(initialInstitution.subscriptionPlan).toBe(plan);
      expect(initialInstitution.subscriptionStatus).toBe(SubscriptionStatus.ACTIVE);
      expect(initialInstitution.subscriptionExpiresAt).toBe(expiresAt);
      expect(mockInstitutionRepository.save).toHaveBeenCalledWith(initialInstitution);
      expect(result).toEqual(updatedInstitutionData);
      expect(mockEventsService.publishSubscriptionChanged).toHaveBeenCalledWith({
        userId: mockUserId,
        entityId: mockInstitutionId,
        entityType: EntityType.INSTITUTION,
        previousPlan: SubscriptionPlan.BASIC,
        newPlan: plan,
        status: SubscriptionStatusType.ACTIVE,
        expiresAt,
        timestamp: expect.any(Date),
        changedBy: mockUserId,
        reason: 'Subscription updated',
      });
      expect(service['logger'].log).toHaveBeenCalledWith(
        `Institution ${mockInstitutionId} subscription updated to ${plan}`,
      );
    });

    it('should throw BadRequestException if institution not found', async () => {
      mockInstitutionRepository.findOne.mockResolvedValue(null);
      await expect(
        service.updateSubscription(mockInstitutionId, plan, expiresAt, mockUserId),
      ).rejects.toThrow(new BadRequestException('Institution not found'));
    });
  });

  describe('addTokens', () => {
    const amount = 100;
    it('should add tokens, save history, and publish event', async () => {
      const initialInstitution = {
        id: mockInstitutionId,
        tokenBalance: 50,
        tokenUsageHistory: [],
      } as unknown as Institution; // Corrected type casting
      const updatedInstitutionData = {
        ...initialInstitution,
        tokenBalance: initialInstitution.tokenBalance + amount,
        tokenUsageHistory: [
          {
            date: expect.any(Date),
            amount,
            operation: 'purchase',
            balance: initialInstitution.tokenBalance + amount,
          },
        ],
      };

      mockInstitutionRepository.findOne.mockResolvedValue(initialInstitution);
      mockInstitutionRepository.save.mockResolvedValue(updatedInstitutionData);

      const result = await service.addTokens(mockInstitutionId, amount, mockUserId);

      expect(mockInstitutionRepository.findOne).toHaveBeenCalledWith({ where: { id: mockInstitutionId } });
      expect(initialInstitution.tokenBalance).toBe(150);
      expect(initialInstitution.tokenUsageHistory.length).toBe(1);
      expect(initialInstitution.tokenUsageHistory[0]).toMatchObject({
        amount,
        operation: 'purchase',
        balance: 150,
      });
      expect(mockInstitutionRepository.save).toHaveBeenCalledWith(initialInstitution);
      expect(result).toEqual(updatedInstitutionData);
      expect(mockTokenEventHandler.handleTokenPurchase).toHaveBeenCalledWith(
        mockUserId,
        mockInstitutionId,
        amount,
        150,
      );
      expect(service['logger'].log).toHaveBeenCalledWith(
        `Institution ${mockInstitutionId} purchased ${amount} tokens. New balance: 150`,
      );
    });

    it('should throw BadRequestException if institution not found', async () => {
      mockInstitutionRepository.findOne.mockResolvedValue(null);
      await expect(service.addTokens(mockInstitutionId, amount, mockUserId)).rejects.toThrow(
        new BadRequestException('Institution not found'),
      );
    });
  });

  describe('useTokens', () => {
    const amount = 20;
    const operation = 'feature_usage';

    it('should use tokens, save history, and publish event if userId is provided', async () => {
      const initialInstitution = {
        id: mockInstitutionId,
        tokenBalance: 50,
        tokensUsed: 10,
        tokenUsageHistory: [],
      } as unknown as Institution; // Corrected type casting
      const updatedInstitutionData = {
        ...initialInstitution,
        tokenBalance: initialInstitution.tokenBalance - amount,
        tokensUsed: initialInstitution.tokensUsed + amount,
        tokenUsageHistory: [
          {
            date: expect.any(Date),
            amount: -amount,
            operation,
            balance: initialInstitution.tokenBalance - amount,
          },
        ],
      };

      mockInstitutionRepository.findOne.mockResolvedValue(initialInstitution);
      mockInstitutionRepository.save.mockResolvedValue(updatedInstitutionData);

      const result = await service.useTokens(mockInstitutionId, amount, operation, mockUserId);

      expect(result).toBe(true);
      expect(mockInstitutionRepository.findOne).toHaveBeenCalledWith({ where: { id: mockInstitutionId } });
      expect(initialInstitution.tokenBalance).toBe(30);
      expect(initialInstitution.tokensUsed).toBe(30);
      expect(initialInstitution.tokenUsageHistory.length).toBe(1);
      expect(initialInstitution.tokenUsageHistory[0]).toMatchObject({
        amount: -amount,
        operation,
        balance: 30,
      });
      expect(mockInstitutionRepository.save).toHaveBeenCalledWith(initialInstitution);
      expect(mockTokenEventHandler.handleTokenUsage).toHaveBeenCalledWith(
        mockUserId,
        mockInstitutionId,
        amount,
        30,
        operation,
      );
      expect(service['logger'].log).toHaveBeenCalledWith(
        `Institution ${mockInstitutionId} used ${amount} tokens for ${operation}. Remaining balance: 30`,
      );
    });

    it('should use tokens and save history, but not publish event if userId is not provided', async () => {
      const initialInstitution = {
        id: mockInstitutionId,
        tokenBalance: 50,
        tokensUsed: 10,
        tokenUsageHistory: [],
      } as unknown as Institution; // Corrected type casting
      mockInstitutionRepository.findOne.mockResolvedValue(initialInstitution);
      mockInstitutionRepository.save.mockResolvedValue({ ...initialInstitution } as Institution); // Simplified mock

      const result = await service.useTokens(mockInstitutionId, amount, operation);

      expect(result).toBe(true);
      expect(initialInstitution.tokenBalance).toBe(30);
      expect(initialInstitution.tokensUsed).toBe(30);
      expect(mockInstitutionRepository.save).toHaveBeenCalledWith(initialInstitution);
      expect(mockTokenEventHandler.handleTokenUsage).not.toHaveBeenCalled();
      expect(service['logger'].log).not.toHaveBeenCalled(); // Logger is called only if userId is present
    });

    it('should return false if token balance is insufficient', async () => {
      const institution = {
        id: mockInstitutionId,
        tokenBalance: 10, // Not enough tokens
      } as Institution;
      mockInstitutionRepository.findOne.mockResolvedValue(institution);
      const result = await service.useTokens(mockInstitutionId, amount, operation, mockUserId);
      expect(result).toBe(false);
      expect(mockInstitutionRepository.save).not.toHaveBeenCalled();
      expect(mockTokenEventHandler.handleTokenUsage).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if institution not found', async () => {
      mockInstitutionRepository.findOne.mockResolvedValue(null);
      await expect(
        service.useTokens(mockInstitutionId, amount, operation, mockUserId),
      ).rejects.toThrow(new BadRequestException('Institution not found'));
    });
  });

  describe('getTokenBalance', () => {
    it('should return token balance, used tokens, and history', async () => {
      const institution = {
        id: mockInstitutionId,
        tokenBalance: 100,
        tokensUsed: 50,
        tokenUsageHistory: [{ date: new Date(), amount: 10, operation: 'test' }],
      } as Institution;
      mockInstitutionRepository.findOne.mockResolvedValue(institution);

      const result = await service.getTokenBalance(mockInstitutionId);

      expect(mockInstitutionRepository.findOne).toHaveBeenCalledWith({ where: { id: mockInstitutionId } });
      expect(result).toEqual({
        balance: institution.tokenBalance,
        used: institution.tokensUsed,
        history: institution.tokenUsageHistory,
      });
    });

    it('should throw BadRequestException if institution not found', async () => {
      mockInstitutionRepository.findOne.mockResolvedValue(null);
      await expect(service.getTokenBalance(mockInstitutionId)).rejects.toThrow(
        new BadRequestException('Institution not found'),
      );
    });
  });
});
