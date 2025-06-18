import { Test, TestingModule } from '@nestjs/testing';
import { FinanceController } from './finance.controller';
import { FinanceService } from '../services/finance.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CreateSubscriptionDto, UpdateSubscriptionDto, CancelSubscriptionDto } from '../dtos';

describe('FinanceController', () => {
  let controller: FinanceController;
  let service: FinanceService;

  const mockFinanceService = {
    listSubscriptionPlans: jest.fn(),
    listSubscriptions: jest.fn(),
    getSubscriptionById: jest.fn(),
    createSubscription: jest.fn(),
    updateSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
    listInvoices: jest.fn(),
    getInvoiceById: jest.fn(),
    createInvoice: jest.fn(),
    updateInvoice: jest.fn(),
    deleteInvoice: jest.fn(),
    sendInvoiceReminder: jest.fn(),
    listPayments: jest.fn(),
    getPaymentById: jest.fn(),
    recordManualPayment: jest.fn(),
    verifyPayment: jest.fn(),
    getFinancialSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinanceController],
      providers: [
        {
          provide: FinanceService,
          useValue: mockFinanceService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FinanceController>(FinanceController);
    service = module.get<FinanceService>(FinanceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSubscriptionPlans', () => {
    it('should return an array of subscription plans', async () => {
      const result = [{ id: 'plan1', name: 'Basic Plan' }];
      mockFinanceService.listSubscriptionPlans.mockResolvedValue(result);

      expect(await controller.getSubscriptionPlans({})).toBe(result);
      expect(mockFinanceService.listSubscriptionPlans).toHaveBeenCalled();
    });
  });

  describe('listSubscriptions', () => {
    it('should return a paginated list of subscriptions', async () => {
      const query = { page: 1, limit: 10 };
      const result = { 
        items: [{ id: 'sub1', planId: 'plan1' }], 
        totalCount: 1, 
        page: 1, 
        totalPages: 1 
      };
      mockFinanceService.listSubscriptions.mockResolvedValue(result);

      expect(await controller.listSubscriptions(query)).toBe(result);
      expect(mockFinanceService.listSubscriptions).toHaveBeenCalledWith(query);
    });
  });

  describe('getSubscriptionById', () => {
    it('should return a subscription by id', async () => {
      const result = { id: 'sub1', planId: 'plan1' };
      mockFinanceService.getSubscriptionById.mockResolvedValue(result);

      expect(await controller.getSubscriptionById('sub1')).toBe(result);
      expect(mockFinanceService.getSubscriptionById).toHaveBeenCalledWith('sub1');
    });
  });

  describe('createSubscription', () => {
    it('should create a new subscription', async () => {
      const dto: CreateSubscriptionDto = { customerId: 'customer1', planId: 'plan1' };
      const result = { id: 'sub1', customerId: 'customer1', planId: 'plan1' };
      mockFinanceService.createSubscription.mockResolvedValue(result);

      expect(await controller.createSubscription(dto)).toBe(result);
      expect(mockFinanceService.createSubscription).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateSubscription', () => {
    it('should update an existing subscription', async () => {
      const dto: UpdateSubscriptionDto = { planId: 'plan2' };
      const result = { id: 'sub1', planId: 'plan2' };
      mockFinanceService.updateSubscription.mockResolvedValue(result);

      expect(await controller.updateSubscription('sub1', dto)).toBe(result);
      expect(mockFinanceService.updateSubscription).toHaveBeenCalledWith('sub1', dto);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel a subscription', async () => {
      const dto: CancelSubscriptionDto = { reason: 'No longer needed' };
      const result = { id: 'sub1', status: 'canceled', cancellationReason: 'No longer needed' };
      mockFinanceService.cancelSubscription.mockResolvedValue(result);

      expect(await controller.cancelSubscription('sub1', dto)).toBe(result);
      expect(mockFinanceService.cancelSubscription).toHaveBeenCalledWith('sub1', dto);
    });
  });
});
