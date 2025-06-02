'''
import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from '../services/subscription.service';
import { JwtBlacklistGuard } from '../../auth/guards/jwt-blacklist.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SubscriptionPlan, SubscriptionStatus } from '../entities/institution.entity';
import { BadRequestException } from '@nestjs/common';

// Mock data
const mockInstitutionId = 'institution-123';
const mockUserId = 'user-456';
const mockUser = { id: mockUserId, institutionId: mockInstitutionId, roles: ['admin'] };
const mockRequest = { user: mockUser };

describe('SubscriptionController', () => {
  let controller: SubscriptionController;
  let subscriptionService: SubscriptionService;

  const mockSubscriptionService = {
    checkSubscriptionStatus: jest.fn(),
    updateSubscription: jest.fn(),
    getTokenBalance: jest.fn(),
    addTokens: jest.fn(),
    useTokens: jest.fn(),
  };

  const mockJwtBlacklistGuard = { canActivate: jest.fn(() => true) }; // Allow access by default
  const mockRolesGuard = { canActivate: jest.fn(() => true) }; // Allow access by default

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        {
          provide: SubscriptionService,
          useValue: mockSubscriptionService,
        },
      ],
    })
    .overrideGuard(JwtBlacklistGuard).useValue(mockJwtBlacklistGuard)
    .overrideGuard(RolesGuard).useValue(mockRolesGuard)
    .compile();

    controller = module.get<SubscriptionController>(SubscriptionController);
    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStatus', () => {
    it('should return subscription status', async () => {
      mockSubscriptionService.checkSubscriptionStatus.mockResolvedValue(true);
      const result = await controller.getStatus(mockRequest);
      expect(result).toEqual({ success: true, active: true });
      expect(subscriptionService.checkSubscriptionStatus).toHaveBeenCalledWith(mockInstitutionId);
    });
  });

  describe('updateSubscription', () => {
    const plan = SubscriptionPlan.PREMIUM;
    const expiresAt = new Date();
    const body = { plan, expiresAt };

    it('should update subscription and return updated details', async () => {
      const updatedInstitution = {
        subscriptionPlan: plan,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionExpiresAt: expiresAt,
      };
      mockSubscriptionService.updateSubscription.mockResolvedValue(updatedInstitution);

      const result = await controller.updateSubscription(body, mockRequest);

      expect(result).toEqual({ success: true, subscription: updatedInstitution });
      expect(subscriptionService.updateSubscription).toHaveBeenCalledWith(
        mockInstitutionId,
        plan,
        expiresAt, // The controller passes new Date(body.expiresAt)
        mockUserId,
      );
    });
  });

  describe('getTokens', () => {
    it('should return token balance and history', async () => {
      const tokenData = { balance: 100, used: 50, history: [] };
      mockSubscriptionService.getTokenBalance.mockResolvedValue(tokenData);
      const result = await controller.getTokens(mockRequest);
      expect(result).toEqual({ success: true, tokens: tokenData });
      expect(subscriptionService.getTokenBalance).toHaveBeenCalledWith(mockInstitutionId);
    });
  });

  describe('purchaseTokens', () => {
    const amount = 100;
    const body = { amount };

    it('should purchase tokens and return new balance', async () => {
      const institutionAfterPurchase = { tokenBalance: 150 }; // Assuming initial balance was 50
      mockSubscriptionService.addTokens.mockResolvedValue(institutionAfterPurchase);

      const result = await controller.purchaseTokens(body, mockRequest);

      expect(result).toEqual({ success: true, tokens: { balance: 150, added: amount } });
      expect(subscriptionService.addTokens).toHaveBeenCalledWith(
        mockInstitutionId,
        amount,
        mockUserId,
      );
    });
  });

  describe('useTokens', () => {
    const amount = 20;
    const operation = 'feature_usage';
    const body = { amount, operation };

    it('should use tokens and return remaining balance if successful', async () => {
      mockSubscriptionService.useTokens.mockResolvedValue(true);
      const tokenDataAfterUse = { balance: 80, used: 70, history: [] }; // Example data
      mockSubscriptionService.getTokenBalance.mockResolvedValue(tokenDataAfterUse);

      const result = await controller.useTokens(body, mockRequest);

      expect(result).toEqual({ success: true, tokens: tokenDataAfterUse });
      expect(subscriptionService.useTokens).toHaveBeenCalledWith(
        mockInstitutionId,
        amount,
        operation,
        mockUserId,
      );
      expect(subscriptionService.getTokenBalance).toHaveBeenCalledWith(mockInstitutionId);
    });

    it('should return error message if token usage fails (insufficient tokens)', async () => {
      mockSubscriptionService.useTokens.mockResolvedValue(false);

      const result = await controller.useTokens(body, mockRequest);

      expect(result).toEqual({ success: false, message: 'Insufficient tokens' });
      expect(subscriptionService.useTokens).toHaveBeenCalledWith(
        mockInstitutionId,
        amount,
        operation,
        mockUserId,
      );
      expect(subscriptionService.getTokenBalance).not.toHaveBeenCalled(); // Should not be called if useTokens fails
    });
  });
});
'''
