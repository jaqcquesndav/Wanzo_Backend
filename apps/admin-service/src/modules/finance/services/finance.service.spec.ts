import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, Like } from 'typeorm';
import { FinanceService } from './finance.service';
import {
  SubscriptionPlan,
  Subscription,
  Invoice,
  Transaction,
  SubscriptionStatus,
  BillingCycle
} from '../entities/finance.entity';
import { User } from '../../users/entities/user.entity';
import { EventsService } from '../../events/events.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto, CancelSubscriptionDto, SubscriptionDto } from '../dtos';
import { NotFoundException, ConflictException } from '@nestjs/common';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const createMockRepository = <T = any>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAndCount: jest.fn(),
  count: jest.fn(),
});

describe('FinanceService', () => {
  let service: FinanceService;
  let subscriptionPlanRepository: MockRepository<SubscriptionPlan>;
  let subscriptionRepository: MockRepository<Subscription>;
  let invoiceRepository: MockRepository<Invoice>;
  let transactionRepository: MockRepository<Transaction>;
  let userRepository: MockRepository<User>;
  let eventsService: Partial<EventsService>;

  beforeEach(async () => {
    subscriptionPlanRepository = createMockRepository();
    subscriptionRepository = createMockRepository();
    invoiceRepository = createMockRepository();
    transactionRepository = createMockRepository();
    userRepository = createMockRepository();
      eventsService = {
      emit: jest.fn(),
      publishInvoiceCreated: jest.fn(),
      publishInvoiceStatusChanged: jest.fn(),
      publishPaymentReceived: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: getRepositoryToken(SubscriptionPlan), useValue: subscriptionPlanRepository },
        { provide: getRepositoryToken(Subscription), useValue: subscriptionRepository },
        { provide: getRepositoryToken(Invoice), useValue: invoiceRepository },
        { provide: getRepositoryToken(Transaction), useValue: transactionRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: EventsService, useValue: eventsService },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listSubscriptionPlans', () => {
    it('should return an array of subscription plans', async () => {
      const mockPlans = [
        {
          id: 'plan1',
          name: 'Basic Plan',
          price: 9.99,
          billingCycle: BillingCycle.MONTHLY,
          description: 'Basic plan for small businesses',
          features: ['Feature 1', 'Feature 2']
        }
      ];
      subscriptionPlanRepository.find.mockResolvedValue(mockPlans);

      const result = await service.listSubscriptionPlans({});
      expect(result).toHaveLength(1);
      expect(subscriptionPlanRepository.find).toHaveBeenCalled();
    });

    it('should filter plans by billing cycle', async () => {
      const query = { billingCycle: BillingCycle.MONTHLY };
      subscriptionPlanRepository.find.mockResolvedValue([]);

      await service.listSubscriptionPlans(query);
      expect(subscriptionPlanRepository.find).toHaveBeenCalledWith({
        where: { billingCycle: BillingCycle.MONTHLY }
      });
    });
  });

  describe('getSubscriptionById', () => {
    it('should return a subscription by id', async () => {
      const mockSubscription = {
        id: 'sub1',
        customerId: 'customer1',
        planId: 'plan1',
        status: SubscriptionStatus.ACTIVE,
        plan: {
          id: 'plan1',
          name: 'Basic Plan'
        }
      };
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.getSubscriptionById('sub1');
      expect(result).toBeDefined();
      expect(result.id).toBe('sub1');
      expect(subscriptionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'sub1' },
        relations: ['plan']
      });
    });

    it('should throw NotFoundException when subscription not found', async () => {
      subscriptionRepository.findOne.mockResolvedValue(null);

      await expect(service.getSubscriptionById('sub1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createSubscription', () => {
    it('should create a new subscription', async () => {
      const dto: CreateSubscriptionDto = { customerId: 'customer1', planId: 'plan1' };
      
      userRepository.findOne.mockResolvedValue({ id: 'customer1' });
      subscriptionPlanRepository.findOne.mockResolvedValue({ id: 'plan1' });
      subscriptionRepository.findOne.mockResolvedValue(null);
      
      const newSubscription = {
        id: 'sub1',
        ...dto,
        status: SubscriptionStatus.ACTIVE,
        startDate: expect.any(Date)
      };
      
      subscriptionRepository.create.mockReturnValue(newSubscription);
      subscriptionRepository.save.mockResolvedValue(newSubscription);
      
      // Mock getSubscriptionById to be called after save
      jest.spyOn(service, 'getSubscriptionById').mockResolvedValue({
        id: 'sub1',
        customerId: 'customer1',
        planId: 'plan1',
        status: SubscriptionStatus.ACTIVE
      } as SubscriptionDto);

      const result = await service.createSubscription(dto);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('sub1');
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 'customer1' } });
      expect(subscriptionPlanRepository.findOne).toHaveBeenCalledWith({ where: { id: 'plan1' } });
      expect(subscriptionRepository.create).toHaveBeenCalled();
      expect(subscriptionRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when customer not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.createSubscription({ customerId: 'customer1', planId: 'plan1' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when plan not found', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'customer1' });
      subscriptionPlanRepository.findOne.mockResolvedValue(null);

      await expect(service.createSubscription({ customerId: 'customer1', planId: 'plan1' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when customer already has an active subscription to the plan', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'customer1' });
      subscriptionPlanRepository.findOne.mockResolvedValue({ id: 'plan1' });
      subscriptionRepository.findOne.mockResolvedValue({
        id: 'sub1',
        customerId: 'customer1',
        planId: 'plan1',
        status: SubscriptionStatus.ACTIVE
      });

      await expect(service.createSubscription({ customerId: 'customer1', planId: 'plan1' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('updateSubscription', () => {
    it('should update an existing subscription', async () => {
      const dto: UpdateSubscriptionDto = { planId: 'plan2' };
      const existingSubscription = {
        id: 'sub1',
        customerId: 'customer1',
        planId: 'plan1',
        status: SubscriptionStatus.ACTIVE
      };
      
      subscriptionRepository.findOneBy.mockResolvedValue(existingSubscription);
      subscriptionPlanRepository.findOne.mockResolvedValue({ id: 'plan2' });
      
      const updatedSubscription = { ...existingSubscription, ...dto };
      subscriptionRepository.save.mockResolvedValue(updatedSubscription);
      
      // Mock getSubscriptionById to be called after save
      jest.spyOn(service, 'getSubscriptionById').mockResolvedValue({
        id: 'sub1',
        customerId: 'customer1',
        planId: 'plan2',
        status: SubscriptionStatus.ACTIVE
      } as SubscriptionDto);

      const result = await service.updateSubscription('sub1', dto);
      
      expect(result).toBeDefined();
      expect(result.planId).toBe('plan2');
      expect(subscriptionRepository.findOneBy).toHaveBeenCalledWith({ id: 'sub1' });
      expect(subscriptionPlanRepository.findOne).toHaveBeenCalledWith({ where: { id: 'plan2' } });
      expect(subscriptionRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when subscription not found', async () => {
      subscriptionRepository.findOneBy.mockResolvedValue(null);

      await expect(service.updateSubscription('sub1', { planId: 'plan2' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when new plan not found', async () => {
      subscriptionRepository.findOneBy.mockResolvedValue({ id: 'sub1' });
      subscriptionPlanRepository.findOne.mockResolvedValue(null);

      await expect(service.updateSubscription('sub1', { planId: 'plan2' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel an active subscription', async () => {
      const dto: CancelSubscriptionDto = { reason: 'No longer needed' };
      const existingSubscription = {
        id: 'sub1',
        customerId: 'customer1',
        planId: 'plan1',
        status: SubscriptionStatus.ACTIVE
      };
      
      subscriptionRepository.findOneBy.mockResolvedValue(existingSubscription);
        const canceledSubscription = {
        ...existingSubscription,
        status: SubscriptionStatus.CANCELED,
        cancellationReason: dto.reason,
        canceledAt: new Date() // Utiliser un vrai objet Date au lieu de expect.any(Date)
      };
      
      subscriptionRepository.save.mockResolvedValue(canceledSubscription);

      const result = await service.cancelSubscription('sub1', dto);
      
      expect(result).toBeDefined();
      expect(result.status).toBe(SubscriptionStatus.CANCELED);
      expect(result.cancellationReason).toBe(dto.reason);
      expect(subscriptionRepository.findOneBy).toHaveBeenCalledWith({ id: 'sub1' });
      expect(subscriptionRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when subscription not found', async () => {
      subscriptionRepository.findOneBy.mockResolvedValue(null);

      await expect(service.cancelSubscription('sub1', { reason: 'test' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when subscription is already canceled', async () => {
      subscriptionRepository.findOneBy.mockResolvedValue({
        id: 'sub1',
        status: SubscriptionStatus.CANCELED
      });

      await expect(service.cancelSubscription('sub1', { reason: 'test' }))
        .rejects.toThrow(ConflictException);
    });
  });
});
