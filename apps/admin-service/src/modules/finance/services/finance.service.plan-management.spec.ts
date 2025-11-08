import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceService } from '../services/finance.service';
import { 
  SubscriptionPlan, 
  Subscription, 
  Invoice, 
  Transaction, 
  PlanStatus, 
  CustomerType, 
  FeatureCode 
} from '../entities/finance.entity';
import { User } from '../../users/entities/user.entity';
import { EventsService } from '../../events/events.service';
import { CreatePlanDto } from '../dtos/finance.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('FinanceService - Plan Management', () => {
  let service: FinanceService;
  let planRepository: Repository<SubscriptionPlan>;
  let subscriptionRepository: Repository<Subscription>;
  let eventsService: EventsService;

  const mockPlanRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockSubscriptionRepository = {
    count: jest.fn(),
    find: jest.fn(),
  };

  const mockEventsService = {
    emitPlanEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        {
          provide: getRepositoryToken(SubscriptionPlan),
          useValue: mockPlanRepository,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
    planRepository = module.get<Repository<SubscriptionPlan>>(getRepositoryToken(SubscriptionPlan));
    subscriptionRepository = module.get<Repository<Subscription>>(getRepositoryToken(Subscription));
    eventsService = module.get<EventsService>(EventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPlan', () => {
    const createPlanDto: CreatePlanDto = {
      name: 'Test Plan',
      description: 'A test subscription plan',
      customerType: CustomerType.SME,
      price: 99.99,
      currency: 'USD',
      billingCycle: 'monthly' as any,
      tokenConfig: {
        monthlyTokens: 1000,
        rolloverAllowed: true,
        maxRolloverMonths: 3,
        tokenRates: {
          [FeatureCode.CREDIT_ANALYSIS]: 1.0,
          [FeatureCode.RISK_ASSESSMENT]: 1.5,
        } as any,
      },
      features: {
        [FeatureCode.BASIC_REPORTS]: {
          enabled: true,
          limit: 10,
        },
        [FeatureCode.CREDIT_ANALYSIS]: {
          enabled: true,
        },
      } as any,
      limits: {
        maxUsers: 5,
        maxAPICallsPerDay: 1000,
        maxDataStorageGB: 10,
        maxReportsPerMonth: 50,
        maxConcurrentSessions: 3,
        maxDashboards: 5,
        maxCustomFields: 20,
      },
    };

    it('should create a new plan successfully', async () => {
      const userId = 'user-123';
      const savedPlan = {
        id: 'plan-123',
        ...createPlanDto,
        status: PlanStatus.DRAFT,
        version: 1,
        createdBy: userId,
        analytics: {
          totalSubscriptions: 0,
          activeSubscriptions: 0,
          churnRate: 0,
          averageLifetimeValue: 0,
          monthlyRecurringRevenue: 0,
          conversionRate: 0,
          popularFeatures: [],
          customerSatisfactionScore: 0,
          supportTicketsPerMonth: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPlanRepository.findOne.mockResolvedValue(null); // No existing plan
      mockPlanRepository.create.mockReturnValue(savedPlan);
      mockPlanRepository.save.mockResolvedValue(savedPlan);

      const result = await service.createPlan(createPlanDto, userId);

      expect(mockPlanRepository.findOne).toHaveBeenCalledWith({
        where: {
          name: createPlanDto.name,
          customerType: createPlanDto.customerType,
          status: expect.any(Object), // Not deleted
        },
      });

      expect(mockPlanRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createPlanDto,
          status: PlanStatus.DRAFT,
          version: 1,
          createdBy: userId,
          updatedBy: userId,
        })
      );

      expect(mockPlanRepository.save).toHaveBeenCalledWith(savedPlan);
      expect(mockEventsService.emitPlanEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CREATED',
          planId: savedPlan.id,
          triggeredBy: userId,
        })
      );

      expect(result).toEqual(expect.objectContaining({
        id: savedPlan.id,
        name: savedPlan.name,
        status: PlanStatus.DRAFT,
      }));
    });

    it('should throw ConflictException if plan name already exists', async () => {
      const userId = 'user-123';
      const existingPlan = { id: 'existing-plan', name: createPlanDto.name };

      mockPlanRepository.findOne.mockResolvedValue(existingPlan);

      await expect(service.createPlan(createPlanDto, userId)).rejects.toThrow(
        `A plan with name "${createPlanDto.name}" already exists for ${createPlanDto.customerType} customers`
      );

      expect(mockPlanRepository.save).not.toHaveBeenCalled();
      expect(mockEventsService.emitPlanEvent).not.toHaveBeenCalled();
    });
  });

  describe('deployPlan', () => {
    it('should deploy a draft plan successfully', async () => {
      const planId = 'plan-123';
      const userId = 'user-123';
      const deployDto = { deploymentNotes: 'Ready for production' };
      
      const draftPlan = {
        id: planId,
        name: 'Test Plan',
        status: PlanStatus.DRAFT,
        isActive: true,
        canBeDeployed: () => true,
      };

      const deployedPlan = {
        ...draftPlan,
        status: PlanStatus.DEPLOYED,
        deployedAt: expect.any(Date),
        deployedBy: userId,
      };

      mockPlanRepository.findOne.mockResolvedValue(draftPlan);
      mockPlanRepository.save.mockResolvedValue(deployedPlan);

      const result = await service.deployPlan(planId, deployDto, userId);

      expect(mockPlanRepository.findOne).toHaveBeenCalledWith({ where: { id: planId } });
      expect(mockPlanRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PlanStatus.DEPLOYED,
          deployedBy: userId,
        })
      );

      expect(mockEventsService.emitPlanEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'DEPLOYED',
          planId: planId,
          triggeredBy: userId,
          reason: deployDto.deploymentNotes,
        })
      );
    });

    it('should throw NotFoundException if plan does not exist', async () => {
      const planId = 'nonexistent-plan';
      const userId = 'user-123';
      const deployDto = {};

      mockPlanRepository.findOne.mockResolvedValue(null);

      await expect(service.deployPlan(planId, deployDto, userId)).rejects.toThrow(
        `Plan with ID ${planId} not found`
      );
    });

    it('should throw BadRequestException if plan cannot be deployed', async () => {
      const planId = 'plan-123';
      const userId = 'user-123';
      const deployDto = {};
      
      const nonDeployablePlan = {
        id: planId,
        status: PlanStatus.ARCHIVED,
        isActive: false,
        canBeDeployed: () => false,
      };

      mockPlanRepository.findOne.mockResolvedValue(nonDeployablePlan);

      await expect(service.deployPlan(planId, deployDto, userId)).rejects.toThrow(
        `Plan cannot be deployed. Current status: ${nonDeployablePlan.status}, Active: ${nonDeployablePlan.isActive}`
      );
    });
  });

  describe('getPlanAnalytics', () => {
    it('should calculate and return plan analytics', async () => {
      const planId = 'plan-123';
      const plan = {
        id: planId,
        name: 'Test Plan',
        analytics: {
          popularFeatures: [],
          customerSatisfactionScore: 4.5,
          supportTicketsPerMonth: 5,
        },
      };

      const subscriptions = [
        { id: 'sub-1', planId, status: 'active', amount: 99.99, billingCycle: 'monthly' },
        { id: 'sub-2', planId, status: 'active', amount: 99.99, billingCycle: 'monthly' },
        { id: 'sub-3', planId, status: 'canceled', amount: 99.99, billingCycle: 'monthly' },
      ];

      mockPlanRepository.findOne.mockResolvedValue(plan);
      mockSubscriptionRepository.count
        .mockResolvedValueOnce(3) // Total subscriptions
        .mockResolvedValueOnce(2); // Active subscriptions
      mockSubscriptionRepository.find.mockResolvedValue(subscriptions);
      mockPlanRepository.save.mockResolvedValue(plan);

      const analytics = await service.getPlanAnalytics(planId);

      expect(analytics).toEqual(
        expect.objectContaining({
          totalSubscriptions: 3,
          activeSubscriptions: 2,
          churnRate: expect.any(Number),
          averageLifetimeValue: expect.any(Number),
          monthlyRecurringRevenue: expect.any(Number),
          conversionRate: expect.any(Number),
        })
      );

      expect(mockPlanRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          analytics: expect.objectContaining({
            totalSubscriptions: 3,
            activeSubscriptions: 2,
          }),
        })
      );
    });
  });
});