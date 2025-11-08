import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminPlanEventsConsumer } from './admin-plan-events.consumer';
import { SubscriptionPlan } from '../../subscriptions/entities/subscription.entity';

describe('AdminPlanEventsConsumer', () => {
  let consumer: AdminPlanEventsConsumer;
  let planRepository: Repository<SubscriptionPlan>;

  const mockPlanRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPlanEventsConsumer,
        {
          provide: getRepositoryToken(SubscriptionPlan),
          useValue: mockPlanRepository,
        },
      ],
    }).compile();

    consumer = module.get<AdminPlanEventsConsumer>(AdminPlanEventsConsumer);
    planRepository = module.get<Repository<SubscriptionPlan>>(getRepositoryToken(SubscriptionPlan));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handlePlanCreated', () => {
    it('should create a new plan when plan does not exist', async () => {
      const mockEvent = {
        value: JSON.stringify({
          eventId: 'evt_123',
          timestamp: '2025-11-08T10:00:00Z',
          eventType: 'subscription.plan.created',
          data: {
            planId: 'premium_pme_v2',
            name: 'Premium PME v2',
            description: 'Plan premium pour PME',
            planType: 'premium',
            customerType: 'pme',
            status: 'deployed',
            pricing: {
              amount: 99.99,
              currency: 'USD',
              billingCycle: 'monthly'
            },
            tokens: {
              baseAllocation: 50000,
              overageRate: 0.01,
              maxOverage: 100000
            },
            features: ['ADVANCED_ANALYTICS', 'PRIORITY_SUPPORT'],
            version: 1
          }
        })
      };

      mockPlanRepository.findOne.mockResolvedValue(null);
      mockPlanRepository.create.mockReturnValue({
        configId: 'premium_pme_v2',
        name: 'Premium PME v2'
      });
      mockPlanRepository.save.mockResolvedValue({
        id: 'plan_123',
        configId: 'premium_pme_v2'
      });

      await consumer.handlePlanCreated(mockEvent);

      expect(mockPlanRepository.findOne).toHaveBeenCalledWith({
        where: { configId: 'premium_pme_v2' }
      });
      expect(mockPlanRepository.create).toHaveBeenCalled();
      expect(mockPlanRepository.save).toHaveBeenCalled();
    });

    it('should skip creation if plan already exists', async () => {
      const mockEvent = {
        value: JSON.stringify({
          eventId: 'evt_123',
          eventType: 'subscription.plan.created',
          data: {
            planId: 'premium_pme_v2',
            name: 'Premium PME v2'
          }
        })
      };

      mockPlanRepository.findOne.mockResolvedValue({
        id: 'existing_plan',
        configId: 'premium_pme_v2'
      });

      await consumer.handlePlanCreated(mockEvent);

      expect(mockPlanRepository.findOne).toHaveBeenCalled();
      expect(mockPlanRepository.create).not.toHaveBeenCalled();
      expect(mockPlanRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('handlePlanDeployed', () => {
    it('should activate plan when deployed', async () => {
      const mockEvent = {
        value: JSON.stringify({
          eventId: 'evt_456',
          timestamp: '2025-11-08T11:00:00Z',
          eventType: 'subscription.plan.deployed',
          data: {
            planId: 'premium_pme_v2',
            name: 'Premium PME v2',
            version: 1,
            deployedAt: '2025-11-08T11:00:00Z',
            effectiveDate: '2025-11-08T11:00:00Z',
            previousStatus: 'draft'
          }
        })
      };

      const mockPlan = {
        id: 'plan_123',
        configId: 'premium_pme_v2',
        isActive: false,
        isVisible: false,
        metadata: {}
      };

      mockPlanRepository.findOne.mockResolvedValue(mockPlan);
      mockPlanRepository.save.mockResolvedValue({
        ...mockPlan,
        isActive: true,
        isVisible: true
      });

      await consumer.handlePlanDeployed(mockEvent);

      expect(mockPlanRepository.findOne).toHaveBeenCalledWith({
        where: { configId: 'premium_pme_v2' }
      });
      expect(mockPlanRepository.save).toHaveBeenCalledWith({
        ...mockPlan,
        isActive: true,
        isVisible: true,
        metadata: expect.objectContaining({
          deployedAt: '2025-11-08T11:00:00Z',
          effectiveDate: '2025-11-08T11:00:00Z',
          version: 1
        })
      });
    });
  });

  describe('handlePlanArchived', () => {
    it('should deactivate plan when archived', async () => {
      const mockEvent = {
        value: JSON.stringify({
          eventId: 'evt_789',
          timestamp: '2025-11-08T12:00:00Z',
          eventType: 'subscription.plan.archived',
          data: {
            planId: 'premium_pme_v1',
            name: 'Premium PME v1',
            version: 1,
            archivedAt: '2025-11-08T12:00:00Z',
            reason: 'Replaced by v2',
            activeSubscriptions: 5,
            migrationPlanId: 'premium_pme_v2'
          }
        })
      };

      const mockPlan = {
        id: 'plan_123',
        configId: 'premium_pme_v1',
        isActive: true,
        isVisible: true,
        metadata: {}
      };

      mockPlanRepository.findOne.mockResolvedValue(mockPlan);
      mockPlanRepository.save.mockResolvedValue({
        ...mockPlan,
        isActive: false,
        isVisible: false
      });

      await consumer.handlePlanArchived(mockEvent);

      expect(mockPlanRepository.save).toHaveBeenCalledWith({
        ...mockPlan,
        isActive: false,
        isVisible: false,
        metadata: expect.objectContaining({
          archivedAt: '2025-11-08T12:00:00Z',
          archivalReason: 'Replaced by v2',
          activeSubscriptions: 5,
          migrationPlanId: 'premium_pme_v2'
        })
      });
    });
  });

  describe('utility methods', () => {
    it('should map billing cycle to subscription plan type correctly', () => {
      const consumer = new AdminPlanEventsConsumer(planRepository);
      
      // Accès aux méthodes privées pour les tests
      expect((consumer as any).mapBillingCycleToType('monthly')).toBe('MONTHLY');
      expect((consumer as any).mapBillingCycleToType('quarterly')).toBe('QUARTERLY');
      expect((consumer as any).mapBillingCycleToType('annually')).toBe('ANNUAL');
      expect((consumer as any).mapBillingCycleToType('one_time')).toBe('ONE_TIME');
    });

    it('should map plan type to tier correctly', () => {
      const consumer = new AdminPlanEventsConsumer(planRepository);
      
      expect((consumer as any).mapPlanTypeToTier('basic')).toBe('BASIC');
      expect((consumer as any).mapPlanTypeToTier('standard')).toBe('STANDARD');
      expect((consumer as any).mapPlanTypeToTier('premium')).toBe('PREMIUM');
      expect((consumer as any).mapPlanTypeToTier('enterprise')).toBe('ENTERPRISE');
      expect((consumer as any).mapPlanTypeToTier('custom')).toBe('CUSTOM');
    });

    it('should calculate duration days correctly', () => {
      const consumer = new AdminPlanEventsConsumer(planRepository);
      
      expect((consumer as any).getDurationDays('monthly')).toBe(30);
      expect((consumer as any).getDurationDays('quarterly')).toBe(90);
      expect((consumer as any).getDurationDays('annually')).toBe(365);
      expect((consumer as any).getDurationDays('biennially')).toBe(730);
      expect((consumer as any).getDurationDays('one_time')).toBe(0);
    });

    it('should map features to plan features correctly', () => {
      const consumer = new AdminPlanEventsConsumer(planRepository);
      const features = ['PRIORITY_SUPPORT', 'ADVANCED_ANALYTICS', 'API_ACCESS'];
      
      const mappedFeatures = (consumer as any).mapFeaturesToPlanFeatures(features);
      
      expect(mappedFeatures.prioritySupport).toBe(true);
      expect(mappedFeatures.advancedAnalytics).toBe(true);
      expect(mappedFeatures.apiAccess).toBe(true);
      expect(mappedFeatures.dataExport).toBe(true); // Par défaut activé
      expect(mappedFeatures.whiteLabeling).toBe(false); // Non activé
    });
  });
});