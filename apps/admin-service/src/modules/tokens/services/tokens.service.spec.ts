import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokensService } from './tokens.service';
import { EventsService } from '../../events/events.service';
import { TokenPackage, TokenBalance, TokenTransaction, TokenUsage, TokenTransactionType, AppType, CustomerType } from '../entities/token.entity';
import { PurchaseTokensDto, AllocateTokensDto, GetTokenUsageQueryDto, GetTokenHistoryQueryDto } from '../dtos/token.dto';
import { NotFoundException } from '@nestjs/common';
import { TokenPurchaseEvent, TokenAllocatedEvent } from '@wanzo/shared/events/kafka-config';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  })),
});

describe('TokensService', () => {
  let service: TokensService;
  let tokenPackageRepository: MockRepository<TokenPackage>;
  let tokenTransactionRepository: MockRepository<TokenTransaction>;
  let tokenUsageRepository: MockRepository<TokenUsage>;
  let eventsService: EventsService;

  const mockEventsService = {
    publishTokenPurchase: jest.fn(),
    publishTokenAllocated: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensService,
        { provide: getRepositoryToken(TokenPackage), useFactory: createMockRepository },
        { provide: getRepositoryToken(TokenBalance), useFactory: createMockRepository },
        { provide: getRepositoryToken(TokenTransaction), useFactory: createMockRepository },
        { provide: getRepositoryToken(TokenUsage), useFactory: createMockRepository },
        { provide: EventsService, useValue: mockEventsService },
      ],
    }).compile();

    service = module.get<TokensService>(TokensService);
    tokenPackageRepository = module.get(getRepositoryToken(TokenPackage));
    tokenTransactionRepository = module.get(getRepositoryToken(TokenTransaction));
    tokenUsageRepository = module.get(getRepositoryToken(TokenUsage));
    eventsService = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTokenBalance', () => {
    it('should calculate and return token balance', async () => {
      const customerId = 'cust-1';
      const transactions: Partial<TokenTransaction>[] = [
        { type: TokenTransactionType.PURCHASE, amount: 1000 },
        { type: TokenTransactionType.BONUS, amount: 100 },
        { type: TokenTransactionType.USAGE, amount: -50 },
        { type: TokenTransactionType.USAGE, amount: -20 },
      ];
      tokenTransactionRepository.find.mockResolvedValue(transactions);

      const result = await service.getTokenBalance(customerId);

      expect(result.allocated).toBe(1100);
      expect(result.used).toBe(70);
      expect(result.available).toBe(1030);
      expect(tokenTransactionRepository.find).toHaveBeenCalledWith({ where: { customerId } });
    });
  });

  describe('getAvailableTokenPackages', () => {
    it('should return available token packages', async () => {
      const packages: TokenPackage[] = [{ id: 'pkg-1', name: 'Basic', tokenAmount: 1000, priceUSD: 10, validityDays: 30, targetCustomerTypes: [CustomerType.PME] }];
      tokenPackageRepository.find.mockResolvedValue(packages);

      const result = await service.getAvailableTokenPackages();
      expect(result.items).toEqual(packages);
    });
  });

  describe('purchaseTokens', () => {
    it('should successfully purchase tokens and emit an event', async () => {
      const customerId = 'cust-1';
      const purchaseDto: PurchaseTokensDto = { packageId: 'pkg-1', paymentMethod: 'stripe' };
      const tokenPackage: TokenPackage = { id: 'pkg-1', name: 'Basic', tokenAmount: 5000, priceUSD: 50, validityDays: 30, localCurrency: 'USD', targetCustomerTypes: [CustomerType.PME] };
      
      tokenPackageRepository.findOne.mockResolvedValue(tokenPackage);
      jest.spyOn(service, 'getTokenBalance').mockResolvedValue({ available: 1000, allocated: 1000, used: 0, lastUpdated: '' });

      const result = await service.purchaseTokens(customerId, purchaseDto);

      expect(tokenPackageRepository.findOne).toHaveBeenCalledWith({ where: { id: purchaseDto.packageId } });
      expect(result.transaction.amount).toBe(tokenPackage.tokenAmount);
      expect(result.newBalance.available).toBe(6000);
      expect(eventsService.publishTokenPurchase).toHaveBeenCalledWith(expect.any(Object));
      const eventPayload = (eventsService.publishTokenPurchase as jest.Mock).mock.calls[0][0] as TokenPurchaseEvent;
      expect(eventPayload.customerId).toBe(customerId);
      expect(eventPayload.tokensPurchased).toBe(tokenPackage.tokenAmount);
    });

    it('should throw NotFoundException if package not found', async () => {
      tokenPackageRepository.findOne.mockResolvedValue(null);
      await expect(service.purchaseTokens('cust-1', { packageId: 'invalid-pkg', paymentMethod: 'stripe' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTokenUsageHistory', () => {
    it('should return token usage history with filters', async () => {
        const customerId = 'cust-1';
        const query: GetTokenUsageQueryDto = { page: 1, limit: 10, appType: AppType.WEB_DASHBOARD };
        const usageData = [{ id: 'usage-1', customerId, tokensUsed: 100, date: new Date(), appType: AppType.WEB_DASHBOARD, feature: 'test', prompt: 'test', responseTokens: 50, requestTokens: 50, cost: 0.01, userId: 'user-1' }] as TokenUsage[];
        const usageCount = 1;

        const mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            getRawOne: jest.fn().mockResolvedValue({ total: 100 }),
            getManyAndCount: jest.fn().mockResolvedValue([usageData, usageCount]),
        };
        (tokenUsageRepository.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

        const result = await service.getTokenUsageHistory(customerId, query);

        expect(result.items.length).toBe(1);
        expect(result.totalCount).toBe(usageCount);
        expect(result.totalTokensUsed).toBe(100);
        expect(result.page).toBe(1);
        expect(result.totalPages).toBe(1);
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('usage.appType = :appType', { appType: query.appType });
    });
  });

  describe('getTokenTransactionHistory', () => {
    it('should return token transaction history', async () => {
        const customerId = 'cust-1';
        const query: GetTokenHistoryQueryDto = { page: 1, limit: 10 };
        const transactionData = [{ id: 'trans-1', customerId, amount: 1000, type: TokenTransactionType.PURCHASE, timestamp: new Date(), balance: 1000, customer: { name: 'Test Corp' } }] as unknown as TokenTransaction[];
        const transactionCount = 1;

        const mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([transactionData, transactionCount]),
        };
        (tokenTransactionRepository.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

        const result = await service.getTokenTransactionHistory(customerId, query);

        expect(result.items.length).toBe(1);
        expect(result.totalCount).toBe(transactionCount);
        expect(result.page).toBe(1);
        expect(result.totalPages).toBe(1);
        expect(result.items[0].customerName).toBe('Test Corp');
    });
  });
  
  describe('allocateTokens', () => {
    it('should allocate tokens and emit an event', async () => {
        const adminId = 'admin-1';
        const allocateDto: AllocateTokensDto = { customerId: 'cust-1', amount: 500, reason: 'Bonus' };
        
        jest.spyOn(service, 'getTokenBalance').mockResolvedValue({ available: 1000, allocated: 1000, used: 0, lastUpdated: '' });

        const result = await service.allocateTokens(adminId, allocateDto);

        expect(result.transaction.amount).toBe(allocateDto.amount);
        expect(result.newBalance.available).toBe(1500);
        expect(eventsService.publishTokenAllocated).toHaveBeenCalled();
        const eventPayload = (eventsService.publishTokenAllocated as jest.Mock).mock.calls[0][0] as TokenAllocatedEvent;
        expect(eventPayload.customerId).toBe(allocateDto.customerId);
        expect(eventPayload.tokensAllocated).toBe(allocateDto.amount);
        expect(eventPayload.allocatedBy).toBe(adminId);
    });
  });

  // Mock tests for stats methods since they are returning static data
  describe('getTokenUsageStats', () => {
    it('should return mocked usage stats', async () => {
        const result = await service.getTokenUsageStats('cust-1', 'monthly');
        expect(result).toEqual({ '2024-05': 12500, '2024-04': 10750 });
    });
  });

  describe('getTokenUsageByFeature', () => {
    it('should return mocked usage by feature', async () => {
        const result = await service.getTokenUsageByFeature('cust-1');
        expect(result).toEqual({ 'text-generation': 18500, 'image-generation': 12000 });
    });
  });

  describe('getTokenUsageByApp', () => {
    it('should return mocked usage by app', async () => {
        const result = await service.getTokenUsageByApp('cust-1');
        expect(result).toEqual({ 'web-dashboard': 15200, 'mobile-app': 12800 });
    });
  });

  describe('getAllTokenStatistics', () => {
    it('should return mocked all token statistics', async () => {
        const result = await service.getAllTokenStatistics('monthly');
        expect(result.totalTokensAllocated).toBe(5000000);
    });
  });

});
