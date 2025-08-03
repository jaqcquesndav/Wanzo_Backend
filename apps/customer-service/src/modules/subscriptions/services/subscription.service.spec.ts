import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionService } from './subscription.service';
import { Subscription, SubscriptionStatus, SubscriptionPlan, SubscriptionPlanType } from '../entities/subscription.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';

// Define DTOs inline as they don't exist
interface CreateSubscriptionDto {
  customerId: string;
  planId: string;
  startDate: Date;
  endDate: Date;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  paymentReference?: string;
  autoRenew?: boolean;
  metadata?: Record<string, any>;
}

interface UpdateSubscriptionDto {
  planId?: string;
  status?: SubscriptionStatus;
  endDate?: Date;
  autoRenew?: boolean;
  metadata?: Record<string, any>;
}

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let subscriptionRepository: Repository<Subscription>;
  let planRepository: Repository<SubscriptionPlan>;
  let customerEventsProducer: CustomerEventsProducer;

  const mockPlan: Partial<SubscriptionPlan> = {
    id: 'plan-premium-123',
    name: 'Premium Plan',
    description: 'Premium subscription plan',
    priceUSD: 29.99,
    type: SubscriptionPlanType.MONTHLY,
    durationDays: 30,
    includedTokens: 1000,
    features: { ai_chat: true, analytics: true },
    isPopular: false,
  };

  const mockSubscription: Partial<Subscription> = {
    id: 'sub-123',
    customerId: 'customer-123',
    planId: 'plan-premium-123',
    status: SubscriptionStatus.ACTIVE,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    amount: 29.99,
    currency: 'USD',
    autoRenew: false,
  };

  beforeEach(async () => {
    const mockSubscriptionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      manager: {
        getRepository: jest.fn(),
      },
    };

    const mockPlanRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const mockCustomerEventsProducer = {
      emitSubscriptionEvent: jest.fn(),
      emitSubscriptionCreated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: getRepositoryToken(SubscriptionPlan),
          useValue: mockPlanRepository,
        },
        {
          provide: CustomerEventsProducer,
          useValue: mockCustomerEventsProducer,
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    subscriptionRepository = module.get<Repository<Subscription>>(getRepositoryToken(Subscription));
    planRepository = module.get<Repository<SubscriptionPlan>>(getRepositoryToken(SubscriptionPlan));
    customerEventsProducer = module.get<CustomerEventsProducer>(CustomerEventsProducer);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create subscription successfully', async () => {
      const createDto: CreateSubscriptionDto = {
        customerId: 'customer-123',
        planId: 'plan-premium-123',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        amount: 29.99,
        currency: 'USD',
        autoRenew: false,
      };

      jest.spyOn(planRepository, 'findOne').mockResolvedValue(mockPlan as SubscriptionPlan);
      jest.spyOn(subscriptionRepository, 'create').mockReturnValue(mockSubscription as Subscription);
      jest.spyOn(subscriptionRepository, 'save').mockResolvedValue(mockSubscription as Subscription);

      const result = await service.create(createDto);

      expect(planRepository.findOne).toHaveBeenCalledWith({ where: { id: 'plan-premium-123' } });
      expect(subscriptionRepository.create).toHaveBeenCalled();
      expect(subscriptionRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockSubscription);
    });

    it('should throw error when plan not found', async () => {
      const createDto: CreateSubscriptionDto = {
        customerId: 'customer-123',
        planId: 'nonexistent-plan',
        startDate: new Date(),
        endDate: new Date(),
        amount: 29.99,
        currency: 'USD',
        autoRenew: false,
      };

      jest.spyOn(planRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow('Plan with ID nonexistent-plan not found');
    });
  });

  describe('findOne', () => {
    it('should return subscription by id', async () => {
      jest.spyOn(subscriptionRepository, 'findOne').mockResolvedValue(mockSubscription as Subscription);

      const result = await service.findOne('sub-123');

      expect(subscriptionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        relations: ['plan', 'customer'],
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should throw error when subscription not found', async () => {
      jest.spyOn(subscriptionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow('Subscription with ID nonexistent not found');
    });
  });

  describe('update', () => {
    it('should update subscription successfully', async () => {
      const updateDto: UpdateSubscriptionDto = {
        planId: 'plan-enterprise-123',
        autoRenew: true,
      };

      const updatedSubscription = { ...mockSubscription, ...updateDto };

      jest.spyOn(subscriptionRepository, 'findOne').mockResolvedValue(mockSubscription as Subscription);
      jest.spyOn(subscriptionRepository, 'save').mockResolvedValue(updatedSubscription as Subscription);

      const result = await service.update('sub-123', updateDto);

      expect(subscriptionRepository.save).toHaveBeenCalledWith(updatedSubscription);
      expect(result).toEqual(updatedSubscription);
    });
  });

  describe('cancel', () => {
    it('should cancel subscription successfully', async () => {
      const cancelledSubscription = { 
        ...mockSubscription, 
        status: SubscriptionStatus.CANCELED,
        autoRenew: false,
        canceledAt: expect.any(Date),
        cancelReason: 'Cancelled by customer',
      };

      jest.spyOn(subscriptionRepository, 'findOne').mockResolvedValue(mockSubscription as Subscription);
      jest.spyOn(subscriptionRepository, 'save').mockResolvedValue(cancelledSubscription as Subscription);

      const result = await service.cancel('sub-123');

      expect(subscriptionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        relations: ['plan', 'customer'],
      });
      expect(subscriptionRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(SubscriptionStatus.CANCELED);
      expect(result.autoRenew).toBe(false);
    });
  });

  describe('activate', () => {
    it('should activate subscription successfully', async () => {
      const activatedSubscription = { 
        ...mockSubscription, 
        status: SubscriptionStatus.ACTIVE,
      };

      jest.spyOn(subscriptionRepository, 'findOne').mockResolvedValue(mockSubscription as Subscription);
      jest.spyOn(subscriptionRepository, 'save').mockResolvedValue(activatedSubscription as Subscription);

      const result = await service.activate('sub-123');

      expect(subscriptionRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    });
  });

  describe('getSubscriptionPlans', () => {
    it('should return all subscription plans', async () => {
      const mockPlans = [mockPlan];
      jest.spyOn(planRepository, 'find').mockResolvedValue(mockPlans as SubscriptionPlan[]);

      const result = await service.getSubscriptionPlans();

      expect(planRepository.find).toHaveBeenCalledWith({
        order: { priceUSD: 'ASC' },
      });
      expect(result).toEqual(mockPlans);
    });
  });

  describe('getCurrentSubscriptionByAuth0Id', () => {
    it('should return current subscription for user', async () => {
      const mockUser = { auth0Id: 'auth0|test123', customerId: 'customer-123' };
      const mockUserRepository = {
        findOne: jest.fn().mockResolvedValue(mockUser),
      };

      jest.spyOn(subscriptionRepository.manager, 'getRepository').mockReturnValue(mockUserRepository as any);
      jest.spyOn(subscriptionRepository, 'findOne').mockResolvedValue(mockSubscription as Subscription);

      const result = await service.getCurrentSubscriptionByAuth0Id('auth0|test123');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { auth0Id: 'auth0|test123' } });
      expect(subscriptionRepository.findOne).toHaveBeenCalledWith({
        where: {
          customerId: 'customer-123',
          status: SubscriptionStatus.ACTIVE,
        },
        relations: ['customer', 'plan'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should return null when user not found', async () => {
      const mockUserRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      jest.spyOn(subscriptionRepository.manager, 'getRepository').mockReturnValue(mockUserRepository as any);

      const result = await service.getCurrentSubscriptionByAuth0Id('auth0|nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('cancelCurrentSubscriptionByAuth0Id', () => {
    it('should cancel current subscription successfully', async () => {
      const mockUser = { auth0Id: 'auth0|test123', customerId: 'customer-123' };
      const mockUserRepository = {
        findOne: jest.fn().mockResolvedValue(mockUser),
      };

      const cancelledSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELED,
        autoRenew: false,
        canceledAt: expect.any(Date),
        cancelReason: 'Cancelled by customer',
      };

      jest.spyOn(subscriptionRepository.manager, 'getRepository').mockReturnValue(mockUserRepository as any);
      jest.spyOn(subscriptionRepository, 'findOne')
        .mockResolvedValueOnce(mockSubscription as Subscription) // for getCurrentSubscriptionByAuth0Id
        .mockResolvedValueOnce(mockSubscription as Subscription); // for cancel method
      jest.spyOn(subscriptionRepository, 'save').mockResolvedValue(cancelledSubscription as Subscription);

      const result = await service.cancelCurrentSubscriptionByAuth0Id('auth0|test123');

      expect(result.status).toBe(SubscriptionStatus.CANCELED);
    });

    it('should throw error when no active subscription found', async () => {
      const mockUser = { auth0Id: 'auth0|test123', customerId: 'customer-123' };
      const mockUserRepository = {
        findOne: jest.fn().mockResolvedValue(mockUser),
      };

      jest.spyOn(subscriptionRepository.manager, 'getRepository').mockReturnValue(mockUserRepository as any);
      jest.spyOn(subscriptionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.cancelCurrentSubscriptionByAuth0Id('auth0|test123'))
        .rejects.toThrow('Aucun abonnement actuel trouvé pour cet utilisateur');
    });
  });
});
