import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TokenService } from '../../src/modules/tokens/services/token.service';
import { TokenUsage, TokenServiceType } from '../../src/modules/tokens/entities/token-usage.entity';
import { TokenPurchase } from '../../src/modules/tokens/entities/token-purchase.entity';
import { Customer } from '../../src/modules/customers/entities/customer.entity';
import { User } from '../../src/modules/system-users/entities/user.entity';
import { CustomerEventsProducer } from '../../src/modules/kafka/producers/customer-events.producer';
import { PurchaseTokenDto } from '../../src/modules/tokens/dto/purchase-token.dto';

describe('TokenService', () => {
  let service: TokenService;
  let tokenUsageRepository: Repository<TokenUsage>;
  let tokenPurchaseRepository: Repository<TokenPurchase>;
  let customerRepository: Repository<Customer>;
  let userRepository: Repository<User>;
  let customerEventsProducer: CustomerEventsProducer;

  const mockTokenUsage: Partial<TokenUsage> = {
    id: 'usage-123',
    customerId: 'customer-123',
    userId: 'user-123',
    amount: 10,
    serviceType: TokenServiceType.CHATBOT,
    timestamp: new Date(),
  };

  const mockTokenPurchase: Partial<TokenPurchase> = {
    id: 'purchase-123',
    customerId: 'customer-123',
    amount: 100,
    price: 10.00,
    currency: 'USD',
    purchaseDate: new Date(),
  };

  const mockCustomer: Partial<Customer> = {
    id: 'customer-123',
    name: 'Test Customer',
    email: 'test@example.com',
  };

  const mockUser: Partial<User> = {
    id: 'user-123',
    auth0Id: 'auth0|test123',
    email: 'test@example.com',
    customerId: 'customer-123',
  };

  beforeEach(async () => {
    const mockTokenUsageRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockTokenPurchaseRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockCustomerRepository = {
      findOne: jest.fn(),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
    };

    const mockCustomerEventsProducer = {
      emitTokenPurchased: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: getRepositoryToken(TokenUsage),
          useValue: mockTokenUsageRepository,
        },
        {
          provide: getRepositoryToken(TokenPurchase),
          useValue: mockTokenPurchaseRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: CustomerEventsProducer,
          useValue: mockCustomerEventsProducer,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    tokenUsageRepository = module.get<Repository<TokenUsage>>(getRepositoryToken(TokenUsage));
    tokenPurchaseRepository = module.get<Repository<TokenPurchase>>(getRepositoryToken(TokenPurchase));
    customerRepository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    customerEventsProducer = module.get<CustomerEventsProducer>(CustomerEventsProducer);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('purchaseTokens', () => {
    it('should purchase tokens successfully', async () => {
      const purchaseDto: PurchaseTokenDto = {
        customerId: 'customer-123',
        amount: 100,
        transactionId: 'trans-123',
        currency: 'USD',
        paymentMethod: 'card',
      };

      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(mockCustomer as Customer);
      jest.spyOn(tokenPurchaseRepository, 'create').mockReturnValue(mockTokenPurchase as TokenPurchase);
      jest.spyOn(tokenPurchaseRepository, 'save').mockResolvedValue(mockTokenPurchase as TokenPurchase);

      const result = await service.purchaseTokens(purchaseDto);

      expect(customerRepository.findOne).toHaveBeenCalledWith({ where: { id: 'customer-123' } });
      expect(tokenPurchaseRepository.create).toHaveBeenCalledWith(purchaseDto);
      expect(tokenPurchaseRepository.save).toHaveBeenCalled();
      expect(customerEventsProducer.emitTokenPurchased).toHaveBeenCalledWith(mockTokenPurchase);
      expect(result).toEqual(mockTokenPurchase);
    });

    it('should throw NotFoundException when customer not found', async () => {
      const purchaseDto: PurchaseTokenDto = {
        customerId: 'nonexistent',
        amount: 100,
        transactionId: 'trans-123',
        currency: 'USD',
        paymentMethod: 'card',
      };

      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(null);

      await expect(service.purchaseTokens(purchaseDto)).rejects.toThrow(NotFoundException);
      await expect(service.purchaseTokens(purchaseDto)).rejects.toThrow('Customer with ID nonexistent not found');
    });
  });

  describe('recordTokenUsage', () => {
    it('should record token usage successfully', async () => {
      const usageDto = {
        customerId: 'customer-123',
        userId: 'user-123',
        amount: 10,
        serviceType: TokenServiceType.CHATBOT,
        requestId: 'req-123',
      };

      jest.spyOn(tokenUsageRepository, 'create').mockReturnValue(mockTokenUsage as TokenUsage);
      jest.spyOn(tokenUsageRepository, 'save').mockResolvedValue(mockTokenUsage as TokenUsage);

      const result = await service.recordTokenUsage(usageDto);

      expect(tokenUsageRepository.create).toHaveBeenCalledWith({
        customerId: 'customer-123',
        userId: 'user-123',
        amount: 10,
        serviceType: TokenServiceType.CHATBOT,
        requestId: 'req-123',
        context: {},
        metadata: {},
        timestamp: expect.any(Date),
      });
      expect(tokenUsageRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTokenUsage);
    });
  });

  describe('getTokenBalanceByAuth0Id', () => {
    it('should return token balance for user', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      
      // Mock getTotalPurchasedTokens and getTotalTokenUsage
      jest.spyOn(service, 'getTotalPurchasedTokens').mockResolvedValue(100);
      jest.spyOn(service, 'getTotalTokenUsage').mockResolvedValue(30);

      const result = await service.getTokenBalanceByAuth0Id('auth0|test123');

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { auth0Id: 'auth0|test123' } });
      expect(result).toEqual({
        balance: 70,
        totalPurchased: 100,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getTokenBalanceByAuth0Id('auth0|nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.getTokenBalanceByAuth0Id('auth0|nonexistent')).rejects.toThrow('Utilisateur non trouvé');
    });
  });

  describe('getTokenTransactionsByAuth0Id', () => {
    it('should return token transactions for user', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(tokenPurchaseRepository, 'findAndCount').mockResolvedValue([
        [mockTokenPurchase as TokenPurchase],
        1
      ]);
      jest.spyOn(tokenUsageRepository, 'findAndCount').mockResolvedValue([
        [mockTokenUsage as TokenUsage],
        1
      ]);

      const result = await service.getTokenTransactionsByAuth0Id('auth0|test123', 1, 20);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { auth0Id: 'auth0|test123' } });
      expect(tokenPurchaseRepository.findAndCount).toHaveBeenCalled();
      expect(tokenUsageRepository.findAndCount).toHaveBeenCalled();
      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result.transactions).toBeInstanceOf(Array);
      expect(result.total).toBe(2); // 1 purchase + 1 usage
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getTokenTransactionsByAuth0Id('auth0|nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTotalPurchasedTokens', () => {
    it('should return total purchased tokens', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '100' }),
      };

      jest.spyOn(tokenPurchaseRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getTotalPurchasedTokens('customer-123');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('token_purchase.customerId = :customerId', { customerId: 'customer-123' });
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('SUM(token_purchase.amount)', 'total');
      expect(result).toBe(100);
    });

    it('should return 0 when no purchases found', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };

      jest.spyOn(tokenPurchaseRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getTotalPurchasedTokens('customer-123');

      expect(result).toBe(0);
    });
  });

  describe('getTotalTokenUsage', () => {
    it('should return total token usage', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '30' }),
      };

      jest.spyOn(tokenUsageRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getTotalTokenUsage('customer-123');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('tokenUsage.customerId = :customerId', { customerId: 'customer-123' });
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('SUM(tokenUsage.amount)', 'total');
      expect(result).toBe(30);
    });

    it('should return 0 when no usage found', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };

      jest.spyOn(tokenUsageRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getTotalTokenUsage('customer-123');

      expect(result).toBe(0);
    });
  });

  describe('getTokenBalance', () => {
    it('should return token balance', async () => {
      jest.spyOn(service, 'getTotalPurchasedTokens').mockResolvedValue(100);
      jest.spyOn(service, 'getTotalTokenUsage').mockResolvedValue(30);

      const result = await service.getTokenBalance('customer-123');

      expect(result).toBe(70);
    });
  });
});
