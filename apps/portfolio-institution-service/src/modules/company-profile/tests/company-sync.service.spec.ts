import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanySyncService } from '../services/company-sync.service';
import { CompanyProfile } from '../entities/company-profile.entity';
import { AccountingIntegrationService } from '../../integration/accounting-integration.service';
import { CustomerCompanyProfileEventDto } from '../dtos/company-profile.dto';

describe('CompanySyncService', () => {
  let service: CompanySyncService;
  let repository: Repository<CompanyProfile>;
  let accountingService: AccountingIntegrationService;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockAccountingService = {
    getSMEFinancialData: jest.fn(),
    getSMESector: jest.fn(),
    getSMEEmployeeCount: jest.fn(),
    getSMEWebsite: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanySyncService,
        {
          provide: getRepositoryToken(CompanyProfile),
          useValue: mockRepository,
        },
        {
          provide: AccountingIntegrationService,
          useValue: mockAccountingService,
        },
      ],
    }).compile();

    service = module.get<CompanySyncService>(CompanySyncService);
    repository = module.get<Repository<CompanyProfile>>(getRepositoryToken(CompanyProfile));
    accountingService = module.get<AccountingIntegrationService>(AccountingIntegrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncFromAccounting', () => {
    const companyId = '550e8400-e29b-41d4-a716-446655440000';
    const mockFinancialData = {
      companyId,
      companyName: 'Test Company Ltd',
      totalRevenue: 5000000,
      annual_revenue: 5000000,
      netProfit: 800000,
      totalAssets: 10000000,
      totalLiabilities: 3000000,
      cashFlow: 1200000,
      debt_ratio: 0.3,
      working_capital: 2000000,
      credit_score: 75,
      financial_rating: 'A',
      revenue_growth: 15,
      profit_margin: 16,
      ebitda: 1000000,
      lastUpdated: new Date().toISOString(),
    };

    it('should create a new profile if none exists', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockAccountingService.getSMEFinancialData.mockResolvedValue(mockFinancialData);
      mockAccountingService.getSMESector.mockResolvedValue('Technology');
      mockAccountingService.getSMEEmployeeCount.mockResolvedValue(50);
      mockAccountingService.getSMEWebsite.mockResolvedValue('https://testcompany.com');

      const newProfile = {
        id: companyId,
        companyName: mockFinancialData.companyName,
        sector: 'Technology',
        totalRevenue: mockFinancialData.totalRevenue,
        creditScore: mockFinancialData.credit_score,
        profileCompleteness: 0,
        calculateCompleteness: jest.fn().mockReturnValue(65),
        recordSync: jest.fn(),
      };

      mockRepository.create.mockReturnValue(newProfile);
      mockRepository.save.mockResolvedValue(newProfile);

      const result = await service.syncFromAccounting(companyId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: companyId } });
      expect(mockAccountingService.getSMEFinancialData).toHaveBeenCalledWith(companyId);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(newProfile);
    });

    it('should update existing profile with accounting data', async () => {
      const existingProfile = {
        id: companyId,
        companyName: 'Old Company Name',
        creditScore: 60,
        needsAccountingSync: jest.fn().mockReturnValue(true),
        calculateCompleteness: jest.fn().mockReturnValue(70),
        recordConflict: jest.fn(),
        recordSync: jest.fn(),
      };

      mockRepository.findOne.mockResolvedValue(existingProfile);
      mockAccountingService.getSMEFinancialData.mockResolvedValue(mockFinancialData);
      mockAccountingService.getSMESector.mockResolvedValue('Technology');
      mockAccountingService.getSMEEmployeeCount.mockResolvedValue(50);
      mockRepository.save.mockResolvedValue(existingProfile);

      const result = await service.syncFromAccounting(companyId);

      expect(existingProfile.recordConflict).toHaveBeenCalledWith(
        'companyName',
        mockFinancialData.companyName,
        'Old Company Name',
        'accounting',
      );
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should skip sync if data is fresh and no force refresh', async () => {
      const freshProfile = {
        id: companyId,
        companyName: 'Test Company',
        needsAccountingSync: jest.fn().mockReturnValue(false),
      };

      mockRepository.findOne.mockResolvedValue(freshProfile);

      const result = await service.syncFromAccounting(companyId, false);

      expect(result).toEqual(freshProfile);
      expect(mockAccountingService.getSMEFinancialData).not.toHaveBeenCalled();
    });
  });

  describe('enrichFromCustomer', () => {
    const companyId = '550e8400-e29b-41d4-a716-446655440000';
    const mockCustomerEvent: CustomerCompanyProfileEventDto = {
      customerId: companyId,
      customerType: 'COMPANY',
      name: 'Customer Company Ltd',
      email: 'contact@customer.com',
      phone: '+243123456789',
      companyProfile: {
        legalForm: 'SARL',
        industry: 'Technology',
        rccm: 'CD/KIN/RCCM/12345',
        taxId: 'A1234567',
        capital: { amount: 1000000, currency: 'CDF' },
        owner: {
          id: 'owner-123',
          name: 'John Doe',
          email: 'john@owner.com',
        },
      },
    };

    it('should enrich existing profile with customer data', async () => {
      const existingProfile = {
        id: companyId,
        companyName: 'Test Company',
        sector: 'Technology',
        creditScore: 75,
        calculateCompleteness: jest.fn().mockReturnValue(85),
        recordConflict: jest.fn(),
        recordSync: jest.fn(),
      };

      mockRepository.findOne.mockResolvedValue(existingProfile);
      mockRepository.save.mockResolvedValue(existingProfile);

      const result = await service.enrichFromCustomer(mockCustomerEvent);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: companyId } });
      expect(result.legalForm).toEqual('SARL');
      expect(result.rccm).toEqual('CD/KIN/RCCM/12345');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should create minimal profile if none exists (customer before accounting)', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const newProfile = {
        id: companyId,
        companyName: mockCustomerEvent.name,
        calculateCompleteness: jest.fn().mockReturnValue(40),
        recordSync: jest.fn(),
      };

      mockRepository.create.mockReturnValue(newProfile);
      mockRepository.save.mockResolvedValue(newProfile);

      const result = await service.enrichFromCustomer(mockCustomerEvent);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(result.companyName).toEqual('Customer Company Ltd');
      expect(result.isAccountingDataFresh).toBe(false);
      expect(result.isCustomerDataFresh).toBe(true);
    });

    it('should detect and record name conflicts (accounting wins)', async () => {
      const existingProfile = {
        id: companyId,
        companyName: 'Accounting Name',
        calculateCompleteness: jest.fn().mockReturnValue(80),
        recordConflict: jest.fn(),
        recordSync: jest.fn(),
      };

      const eventWithDifferentName = {
        ...mockCustomerEvent,
        name: 'Different Customer Name',
      };

      mockRepository.findOne.mockResolvedValue(existingProfile);
      mockRepository.save.mockResolvedValue(existingProfile);

      await service.enrichFromCustomer(eventWithDifferentName);

      expect(existingProfile.recordConflict).toHaveBeenCalledWith(
        'companyName',
        'Accounting Name',
        'Different Customer Name',
        'accounting',
      );
      expect(existingProfile.companyName).toEqual('Accounting Name'); // Should keep accounting value
    });
  });

  describe('syncComplete', () => {
    const companyId = '550e8400-e29b-41d4-a716-446655440000';

    it('should perform complete sync from accounting', async () => {
      const mockProfile = {
        id: companyId,
        companyName: 'Test Company',
        needsCustomerSync: jest.fn().mockReturnValue(false),
        metadata: { conflicts: [] },
      };

      jest.spyOn(service, 'syncFromAccounting').mockResolvedValue(mockProfile as any);
      jest.spyOn(service, 'toDto').mockReturnValue({} as any);

      const result = await service.syncComplete(companyId, true);

      expect(result.success).toBe(true);
      expect(result.syncDetails?.accountingSynced).toBe(true);
      expect(result.syncDetails?.customerSynced).toBe(true);
    });

    it('should handle sync failures gracefully', async () => {
      jest.spyOn(service, 'syncFromAccounting').mockRejectedValue(new Error('Accounting service unavailable'));

      const result = await service.syncComplete(companyId, true);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Accounting service unavailable');
    });
  });

  describe('Conflict Resolution Strategy', () => {
    it('should prioritize accounting-service for companyName', async () => {
      const companyId = '550e8400-e29b-41d4-a716-446655440000';
      const profile = {
        id: companyId,
        companyName: 'Accounting Name',
        calculateCompleteness: jest.fn().mockReturnValue(75),
        recordConflict: jest.fn(),
        recordSync: jest.fn(),
      };

      const customerEvent: CustomerCompanyProfileEventDto = {
        customerId: companyId,
        customerType: 'COMPANY',
        name: 'Customer Name',
      };

      mockRepository.findOne.mockResolvedValue(profile);
      mockRepository.save.mockResolvedValue(profile);

      await service.enrichFromCustomer(customerEvent);

      expect(profile.companyName).toEqual('Accounting Name');
      expect(profile.recordConflict).toHaveBeenCalled();
    });

    it('should prioritize accounting-service for employeeCount', async () => {
      const companyId = '550e8400-e29b-41d4-a716-446655440000';
      const profile = {
        id: companyId,
        companyName: 'Test',
        employeeCount: 100, // From accounting
        calculateCompleteness: jest.fn().mockReturnValue(75),
        recordConflict: jest.fn(),
        recordSync: jest.fn(),
      };

      const customerEvent: CustomerCompanyProfileEventDto = {
        customerId: companyId,
        customerType: 'COMPANY',
        name: 'Test',
        companyProfile: {
          employeeCount: 50, // From customer - should be ignored
        },
      };

      mockRepository.findOne.mockResolvedValue(profile);
      mockRepository.save.mockResolvedValue(profile);

      await service.enrichFromCustomer(customerEvent);

      expect(profile.employeeCount).toEqual(100); // Accounting wins
      expect(profile.recordConflict).toHaveBeenCalled();
    });
  });

  describe('Data Freshness', () => {
    it('should calculate profile completeness correctly', () => {
      const profile = new CompanyProfile();
      profile.companyName = 'Test Company';
      profile.sector = 'Technology';
      profile.totalRevenue = 5000000;
      profile.annualRevenue = 5000000;
      profile.creditScore = 75;
      profile.legalForm = 'SARL';
      profile.rccm = 'CD/KIN/RCCM/12345';
      profile.taxId = 'A1234567';
      profile.owner = { id: '1', name: 'Owner', email: 'owner@test.com' };
      profile.email = 'contact@test.com';
      profile.phone = '+243123456789';
      profile.address = '123 Main St';
      profile.employeeCount = 50;
      profile.yearFounded = 2015;

      const completeness = profile.calculateCompleteness();

      expect(completeness).toBeGreaterThan(0);
      expect(completeness).toBeLessThanOrEqual(100);
    });
  });
});
