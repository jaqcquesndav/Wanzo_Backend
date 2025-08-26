import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OHADAMetricsService } from '../services/ohada-metrics.service';
import { DashboardPreferencesService } from '../services/dashboard-preferences.service';
import { Portfolio } from '../../portfolios/entities/portfolio.entity';
import { FinancialProduct } from '../../portfolios/entities/financial-product.entity';
import { Contract } from '../../portfolios/entities/contract.entity';
import { Repayment } from '../../portfolios/entities/repayment.entity';
import { 
  RiskLevel, 
  RiskRating, 
  RegulatoryFramework, 
  ComplianceStatus,
  WidgetType 
} from '../interfaces/dashboard.interface';

describe('Dashboard OHADA Services', () => {
  let ohadaService: OHADAMetricsService;
  let preferencesService: DashboardPreferencesService;
  let portfolioRepository: Repository<Portfolio>;
  let productRepository: Repository<FinancialProduct>;
  let contractRepository: Repository<Contract>;
  let repaymentRepository: Repository<Repayment>;

  const mockPortfolioRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockProductRepository = {
    find: jest.fn(),
  };

  const mockContractRepository = {
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockRepaymentRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OHADAMetricsService,
        DashboardPreferencesService,
        {
          provide: getRepositoryToken(Portfolio),
          useValue: mockPortfolioRepository,
        },
        {
          provide: getRepositoryToken(FinancialProduct),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Contract),
          useValue: mockContractRepository,
        },
        {
          provide: getRepositoryToken(Repayment),
          useValue: mockRepaymentRepository,
        },
      ],
    }).compile();

    ohadaService = module.get<OHADAMetricsService>(OHADAMetricsService);
    preferencesService = module.get<DashboardPreferencesService>(DashboardPreferencesService);
    portfolioRepository = module.get<Repository<Portfolio>>(getRepositoryToken(Portfolio));
    productRepository = module.get<Repository<FinancialProduct>>(getRepositoryToken(FinancialProduct));
    contractRepository = module.get<Repository<Contract>>(getRepositoryToken(Contract));
    repaymentRepository = module.get<Repository<Repayment>>(getRepositoryToken(Repayment));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('OHADAMetricsService', () => {
    it('should be defined', () => {
      expect(ohadaService).toBeDefined();
    });

    it('should return OHADA metrics for institution', async () => {
      // Mock data
      const mockPortfolios = [
        {
          id: '123',
          name: 'Test Portfolio',
          target_sectors: ['PME'],
          total_amount: 1000000,
          institution_id: 'inst-123'
        }
      ];

      mockPortfolioRepository.find.mockResolvedValue(mockPortfolios);
      mockProductRepository.find.mockResolvedValue([]);
      mockContractRepository.find.mockResolvedValue([]);
      mockRepaymentRepository.find.mockResolvedValue([]);

      const result = await ohadaService.getOHADAMetrics('inst-123');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.metadata.regulatoryFramework).toBe(RegulatoryFramework.OHADA);
      expect(result.benchmarks).toBeDefined();
    });

    it('should return global metrics', async () => {
      const mockPortfolios = [
        {
          id: '123',
          name: 'Test Portfolio',
          target_sectors: ['PME'],
          total_amount: 1000000,
          institution_id: 'inst-123'
        }
      ];

      mockPortfolioRepository.find.mockResolvedValue(mockPortfolios);
      mockContractRepository.count.mockResolvedValue(50);

      const result = await ohadaService.getGlobalOHADAMetrics('inst-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('global');
      expect(result.name).toBe('Vue Globale');
      expect(result.totalAmount).toBe(1000000);
      expect(result.activeContracts).toBe(50);
    });

    it('should return compliance summary', async () => {
      const mockPortfolios = [
        {
          id: '123',
          name: 'Test Portfolio',
          target_sectors: ['PME'],
          total_amount: 1000000,
          institution_id: 'inst-123'
        }
      ];

      mockPortfolioRepository.find.mockResolvedValue(mockPortfolios);
      mockProductRepository.find.mockResolvedValue([]);
      mockContractRepository.find.mockResolvedValue([]);
      mockRepaymentRepository.find.mockResolvedValue([]);

      const result = await ohadaService.getComplianceSummary('inst-123');

      expect(result).toBeDefined();
      expect(result.totalPortfolios).toBe(1);
      expect(result.details.bceaoCompliance).toBeDefined();
      expect(result.details.ohadaProvisionCompliance).toBeDefined();
    });
  });

  describe('DashboardPreferencesService', () => {
    it('should be defined', () => {
      expect(preferencesService).toBeDefined();
    });

    it('should generate default preferences', async () => {
      const userId = 'user-123';
      const preferences = await preferencesService.getUserPreferences(userId);

      expect(preferences).toBeDefined();
      expect(preferences.userId).toBe(userId);
      expect(preferences.widgets).toBeDefined();
      expect(preferences.selectorPosition).toBeDefined();
    });

    it('should update widget visibility', async () => {
      const userId = 'user-123';
      
      await preferencesService.updateWidgetVisibility(
        userId, 
        WidgetType.OVERVIEW_METRICS, 
        false, 
        5
      );

      const preferences = await preferencesService.getUserPreferences(userId);
      expect(preferences.widgets[WidgetType.OVERVIEW_METRICS].visible).toBe(false);
      expect(preferences.widgets[WidgetType.OVERVIEW_METRICS].position).toBe(5);
    });

    it('should return available widgets', () => {
      const widgets = preferencesService.getAvailableWidgets();
      
      expect(widgets).toBeDefined();
      expect(widgets.length).toBeGreaterThan(0);
      expect(widgets[0]).toHaveProperty('id');
      expect(widgets[0]).toHaveProperty('title');
      expect(widgets[0]).toHaveProperty('category');
    });

    it('should reset preferences to default', async () => {
      const userId = 'user-123';
      
      // Modify preferences first
      await preferencesService.updateWidgetVisibility(
        userId, 
        WidgetType.OVERVIEW_METRICS, 
        false, 
        5
      );

      // Reset to default
      const resetPreferences = await preferencesService.resetToDefault(userId);
      
      expect(resetPreferences.widgets[WidgetType.OVERVIEW_METRICS].visible).toBe(true);
      expect(resetPreferences.widgets[WidgetType.OVERVIEW_METRICS].position).toBe(0);
    });
  });
});
