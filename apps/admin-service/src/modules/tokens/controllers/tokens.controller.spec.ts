import { Test, TestingModule } from '@nestjs/testing';
import { TokensController } from './tokens.controller';
import { TokensService } from '../services/tokens.service';
import { User } from '../../users/entities/user.entity';
import { TokenBalanceDto, PurchaseTokensDto, GetTokenUsageQueryDto, GetTokenHistoryQueryDto, GetTokenStatsQueryDto, AllocateTokensDto, TokenPackageDto, TokenUsageDto, TokenTransactionDto } from '../dtos/token.dto';
import { UserRole, UserType, UserStatus } from '../../users/entities/enums';

describe('TokensController', () => {
  let controller: TokensController;
  let service: TokensService;

  const mockUser: User = {
    id: 'user-id-123',
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.COMPANY_ADMIN,
    userType: UserType.EXTERNAL,
    status: UserStatus.ACTIVE,
    customerAccountId: 'cust-account-id-456',
    createdAt: new Date(),
  } as User;

  const mockTokensService = {
    getTokenBalance: jest.fn(),
    getAvailableTokenPackages: jest.fn(),
    purchaseTokens: jest.fn(),
    getTokenUsageHistory: jest.fn(),
    getTokenTransactionHistory: jest.fn(),
    getTokenUsageStats: jest.fn(),
    getTokenUsageByFeature: jest.fn(),
    getTokenUsageByApp: jest.fn(),
    getAllTokenStatistics: jest.fn(),
    allocateTokens: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokensController],
      providers: [
        {
          provide: TokensService,
          useValue: mockTokensService,
        },
      ],
    }).compile();

    controller = module.get<TokensController>(TokensController);
    service = module.get<TokensService>(TokensService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTokenBalance', () => {
    it('should return token balance', async () => {
      const result: TokenBalanceDto = { available: 1000, allocated: 1500, used: 500, lastUpdated: new Date().toISOString() };
      mockTokensService.getTokenBalance.mockResolvedValue(result);

      expect(await controller.getTokenBalance(mockUser)).toBe(result);
      expect(service.getTokenBalance).toHaveBeenCalledWith(mockUser.customerAccountId);
    });
  });

  describe('getAvailableTokenPackages', () => {
    it('should return available token packages', async () => {
      const result: { packages: TokenPackageDto[] } = { packages: [] }; // Explicitly typed
      mockTokensService.getAvailableTokenPackages.mockResolvedValue(result);

      expect(await controller.getAvailableTokenPackages()).toBe(result);
      expect(service.getAvailableTokenPackages).toHaveBeenCalled();
    });
  });

  describe('purchaseTokens', () => {
    it('should purchase tokens', async () => {
      const purchaseDto: PurchaseTokensDto = { packageId: 'pkg-1', paymentMethod: 'stripe' };
      const proofDocument = {} as Express.Multer.File;
      const result = { transaction: {} as any, newBalance: {} as any };
      mockTokensService.purchaseTokens.mockResolvedValue(result);

      expect(await controller.purchaseTokens(mockUser, purchaseDto, proofDocument)).toBe(result);
      expect(service.purchaseTokens).toHaveBeenCalledWith(mockUser.customerAccountId, purchaseDto, proofDocument);
    });
  });

  describe('getTokenUsageHistory', () => {
    it('should return token usage history', async () => {
      const query: GetTokenUsageQueryDto = { page: 1, limit: 10 };
      const result: { usages: TokenUsageDto[], totalCount: number, totalTokensUsed: number } = { usages: [], totalCount: 0, totalTokensUsed: 0 }; // Explicitly typed
      mockTokensService.getTokenUsageHistory.mockResolvedValue(result);

      expect(await controller.getTokenUsageHistory(mockUser, query)).toBe(result);
      expect(service.getTokenUsageHistory).toHaveBeenCalledWith(mockUser.customerAccountId, query);
    });
  });

  describe('getTokenTransactionHistory', () => {
    it('should return token transaction history', async () => {
      const query: GetTokenHistoryQueryDto = { page: 1, limit: 10 };
      const result: { transactions: TokenTransactionDto[], totalCount: number } = { transactions: [], totalCount: 0 }; // Explicitly typed
      mockTokensService.getTokenTransactionHistory.mockResolvedValue(result);

      expect(await controller.getTokenTransactionHistory(mockUser, query)).toBe(result);
      expect(service.getTokenTransactionHistory).toHaveBeenCalledWith(mockUser.customerAccountId, query);
    });
  });

  describe('getTokenUsageStats', () => {
    it('should return token usage stats', async () => {
      const query: GetTokenStatsQueryDto = { period: 'monthly' };
      const result = { '2024-05': 12500 };
      mockTokensService.getTokenUsageStats.mockResolvedValue(result);

      expect(await controller.getTokenUsageStats(mockUser, query)).toBe(result);
      expect(service.getTokenUsageStats).toHaveBeenCalledWith(mockUser.customerAccountId, query.period);
    });
  });

  describe('getTokenUsageByFeature', () => {
    it('should return token usage by feature', async () => {
      const result = { 'text-generation': 18500 };
      mockTokensService.getTokenUsageByFeature.mockResolvedValue(result);

      expect(await controller.getTokenUsageByFeature(mockUser)).toBe(result);
      expect(service.getTokenUsageByFeature).toHaveBeenCalledWith(mockUser.customerAccountId);
    });
  });

  describe('getTokenUsageByApp', () => {
    it('should return token usage by app', async () => {
      const result = { 'web-dashboard': 15200 };
      mockTokensService.getTokenUsageByApp.mockResolvedValue(result);

      expect(await controller.getTokenUsageByApp(mockUser)).toBe(result);
      expect(service.getTokenUsageByApp).toHaveBeenCalledWith(mockUser.customerAccountId);
    });
  });

  describe('getAllTokenStatistics', () => {
    it('should return all token statistics for admin', async () => {
      const query: GetTokenStatsQueryDto = { period: 'monthly' };
      const result = { totalTokensAllocated: 5000000 } as any;
      mockTokensService.getAllTokenStatistics.mockResolvedValue(result);

      expect(await controller.getAllTokenStatistics(query)).toBe(result);
      expect(service.getAllTokenStatistics).toHaveBeenCalledWith(query.period);
    });
  });

  describe('allocateTokens', () => {
    it('should allocate tokens for admin', async () => {
      const allocateDto: AllocateTokensDto = { customerId: 'cust-1', amount: 10000, reason: 'Bonus' };
      const result = { transaction: {} as any, newBalance: {} as any };
      mockTokensService.allocateTokens.mockResolvedValue(result);

      expect(await controller.allocateTokens(mockUser, allocateDto)).toBe(result);
      expect(service.allocateTokens).toHaveBeenCalledWith(mockUser.id, allocateDto);
    });
  });
});
