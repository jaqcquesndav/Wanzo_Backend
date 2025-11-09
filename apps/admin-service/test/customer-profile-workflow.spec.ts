import { Test, TestingModule } from '@nestjs/testing';
import { CustomerProfileWorkflowService } from '../src/modules/customers/services/customer-profile-workflow.service';
import { CustomersService } from '../src/modules/customers/services/customers.service';
import { EventsService } from '../src/modules/events/events.service';
import { Logger } from '@nestjs/common';
import { CustomerDetailedProfile, ProfileType, AdminStatus, ComplianceRating } from '../src/modules/customers/entities/customer-detailed-profile.entity';

describe('CustomerProfileWorkflowService', () => {
  let service: CustomerProfileWorkflowService;
  let workflowService: CustomerProfileWorkflowService;
  let customersService: jest.Mocked<CustomersService>;
  let eventsService: jest.Mocked<EventsService>;

  // Helper function to create mock CustomerDetailedProfile
  const createMockProfile = (overrides: Partial<CustomerDetailedProfile> = {}): CustomerDetailedProfile => {
    const baseProfile: CustomerDetailedProfile = {
      id: 'profile-1',
      customerId: 'customer-1',
      customerType: 'PME' as 'PME' | 'FINANCIAL_INSTITUTION',
      profileType: ProfileType.COMPANY,
      profileData: {},
      profileCompleteness: 85,
      adminStatus: AdminStatus.UNDER_REVIEW,
      complianceRating: ComplianceRating.MEDIUM,
      needsResync: false,
      lastSyncAt: new Date(),
      name: 'Test Company',
      email: 'test@company.com',
      status: 'active',
      syncMetadata: {
        lastSyncFromCustomerService: 'sync-123',
        dataSource: 'customer-service'
      },
      syncStatus: 'synced' as any,
      reviewPriority: 'medium' as any,
      requiresAttention: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      requiresAdminAttention: function(): boolean {
        return this.adminStatus === AdminStatus.FLAGGED ||
               this.adminStatus === AdminStatus.SUSPENDED ||
               this.profileCompleteness < 70 ||
               this.complianceRating === ComplianceRating.CRITICAL;
      },
      isCompliant: function(): boolean {
        return this.complianceRating === ComplianceRating.HIGH ||
               this.complianceRating === ComplianceRating.MEDIUM;
      },
      getAdminSummary: function() {
        return {
          id: this.id,
          customerId: this.customerId,
          customerType: this.customerType,
          profileType: this.profileType,
          name: this.name,
          email: this.email,
          status: this.status,
          adminStatus: this.adminStatus,
          complianceRating: this.complianceRating,
          profileCompleteness: this.profileCompleteness,
          riskFlags: this.riskFlags,
          requiresAttention: this.requiresAdminAttention(),
          isCompliant: this.isCompliant(),
          lastSyncAt: this.lastSyncAt,
          needsResync: this.needsResync,
        };
      }
    };

    return { ...baseProfile, ...overrides } as CustomerDetailedProfile;
  };

  beforeEach(async () => {
    const mockCustomersService = {
      getCustomerDetailedProfile: jest.fn(),
      updateCustomerSpecificData: jest.fn(),
      updateCustomerCompleteness: jest.fn(),
      updateCustomerAssets: jest.fn(),
      updateFinancialMetrics: jest.fn(),
      updateCustomerStocks: jest.fn(),
      createStockAlerts: jest.fn(),
      updateInventoryMetrics: jest.fn(),
      updateCustomerExtendedIdentification: jest.fn(),
      updateCustomerValidationStatus: jest.fn(),
      updateCustomerRiskProfile: jest.fn(),
      processCompleteProfileV21: jest.fn(),
      updateCustomerInsights: jest.fn(),
      scheduleProfileRevalidation: jest.fn(),
    };

    const mockEventsService = {
      publishCustomerSyncRequested: jest.fn(),
      publishAdminNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerProfileWorkflowService,
        {
          provide: CustomersService,
          useValue: mockCustomersService,
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    service = module.get<CustomerProfileWorkflowService>(CustomerProfileWorkflowService);
    workflowService = service;
    customersService = module.get(CustomersService);
    eventsService = module.get(EventsService);
  });

  describe('orchestrateCompleteProfileSync', () => {
    it('should handle successful sync orchestration', async () => {
      const mockProfile = createMockProfile({
        syncStatus: 'synced'
      });

      jest.spyOn(customersService, 'getCustomerDetailedProfile').mockResolvedValue(mockProfile);
      jest.spyOn(eventsService, 'publishCustomerSyncRequested').mockResolvedValue();

      const result = await workflowService.orchestrateCompleteProfileSync({
        customerId: 'customer-1',
        customerType: 'COMPANY',
        triggerReason: 'profile_updated',
        requestingService: 'admin-service',
        priority: 'high',
      });

      expect(result.success).toBe(true);
      expect(result.syncId).toBeDefined();
      expect(result.steps).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(0);
      expect(eventsService.publishCustomerSyncRequested).toHaveBeenCalled();
    });

    it('should handle profile sync for financial institution', async () => {
      const mockProfile = createMockProfile({
        customerId: 'customer-2',
        customerType: 'FINANCIAL_INSTITUTION',
        profileCompleteness: 85,
        syncStatus: 'synced',
      });

      jest.spyOn(customersService, 'getCustomerDetailedProfile').mockResolvedValue(mockProfile);
      jest.spyOn(eventsService, 'publishCustomerSyncRequested').mockResolvedValue();

      const result = await workflowService.orchestrateCompleteProfileSync({
        customerId: 'customer-2',
        customerType: 'FINANCIAL_INSTITUTION',
        triggerReason: 'validation_completed',
        requestingService: 'admin-service',
        priority: 'medium',
      });

      expect(result.success).toBe(true);
      expect(eventsService.publishCustomerSyncRequested).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'customer-2',
          priority: 'medium',
          requestedData: expect.arrayContaining([
            'basic_info',
            'institution_specific_data',
            'regulatory_data',
            'compliance_info',
          ]),
        })
      );
    });
  });

  describe('validateProfileConformity', () => {
    it('should validate company profile conformity', async () => {
      const mockProfile = createMockProfile({
        customerType: 'PME',
        profileCompleteness: 80,
        companyProfile: {
          legalForm: 'SARL',
          industry: 'Technology',
          rccm: 'CD/KSA/RCCM/123456',
          activities: ['Software Development'],
        },
        extendedProfile: {
          isComplete: true,
        },
        patrimoine: {
          assets: [{ nom: 'Laptop', valeurActuelle: 1500 }],
          stocks: [],
          totalAssetsValue: 1500,
        },
      });

      jest.spyOn(customersService, 'getCustomerDetailedProfile').mockResolvedValue(mockProfile);

      const result = await workflowService.validateProfileConformity('customer-1');

      expect(result.isConform).toBe(true);
      expect(result.overallScore).toBeGreaterThan(70);
      expect(result.issues).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should identify non-conforming financial institution profile', async () => {
      const mockProfile = createMockProfile({
        customerId: 'customer-2',
        customerType: 'FINANCIAL_INSTITUTION',
        profileCompleteness: 45,
        institutionProfile: undefined, // Missing critical data
        regulatoryProfile: undefined,
      });

      jest.spyOn(customersService, 'getCustomerDetailedProfile').mockResolvedValue(mockProfile);

      const result = await workflowService.validateProfileConformity('customer-2');

      expect(result.isConform).toBe(false);
      expect(result.overallScore).toBeLessThan(70);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(issue => issue.severity === 'critical')).toBe(true);
    });
  });

  describe('processProfileUpdateNotification', () => {
    it('should trigger immediate sync for high impact updates', async () => {
      const orchestrateSpy = jest.spyOn(workflowService, 'orchestrateCompleteProfileSync')
        .mockResolvedValue({
          success: true,
          syncId: 'sync-123',
          steps: [],
        });

      await workflowService.processProfileUpdateNotification({
        customerId: 'customer-1',
        customerType: 'COMPANY',
        updatedSections: ['basic_info', 'financial_data'],
        updateSource: 'form_submission',
        impact: 'high',
        metadata: {},
      });

      expect(orchestrateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'customer-1',
          customerType: 'COMPANY',
          triggerReason: 'profile_updated',
          priority: 'urgent',
        })
      );
    });

    it('should schedule delayed sync for low impact updates', async () => {
      const scheduleDelaySpy = jest.spyOn(workflowService as any, 'scheduleDelayedSync')
        .mockResolvedValue(undefined);

      await workflowService.processProfileUpdateNotification({
        customerId: 'customer-1',
        customerType: 'COMPANY',
        updatedSections: ['contact_info'],
        updateSource: 'admin_action',
        impact: 'low',
        metadata: {},
      });

      expect(scheduleDelaySpy).toHaveBeenCalled();
    });
  });

  describe('handleSyncFailure', () => {
    it('should schedule retry for non-max attempts', async () => {
      const mockProfile = createMockProfile({
        syncErrors: [],
      });

      jest.spyOn(customersService, 'getCustomerDetailedProfile').mockResolvedValue(mockProfile);
      const scheduleRetrySpy = jest.spyOn(workflowService as any, 'scheduleRetry')
        .mockResolvedValue(undefined);

      await workflowService.handleSyncFailure({
        customerId: 'customer-1',
        syncId: 'sync-123',
        error: 'Connection timeout',
        attemptNumber: 2,
        maxRetries: 3,
      });

      expect(scheduleRetrySpy).toHaveBeenCalledWith('customer-1', 'sync-123', 3);
    });

    it('should notify admins for max retry failures', async () => {
      const mockProfile = createMockProfile({
        syncErrors: [],
        alerts: [],
      });

      jest.spyOn(customersService, 'getCustomerDetailedProfile').mockResolvedValue(mockProfile);
      const notifyAdminsSpy = jest.spyOn(workflowService as any, 'notifyAdminsSyncFailure')
        .mockResolvedValue(undefined);

      await workflowService.handleSyncFailure({
        customerId: 'customer-1',
        syncId: 'sync-123',
        error: 'Maximum retries exceeded',
        attemptNumber: 3,
        maxRetries: 3,
      });

      expect(notifyAdminsSpy).toHaveBeenCalledWith('customer-1', 'sync-123', 'Maximum retries exceeded');
    });
  });
});

// Tests d'intégration
describe('Integration Tests', () => {
  it('should validate complete workflow for company profile update', async () => {
    // Ce test nécessiterait une base de données test et des services réels
    // À implémenter avec des données de test complètes
    console.log('Integration test placeholder - requires full test environment');
  });

  it('should validate complete workflow for institution profile sync', async () => {
    // Test d'intégration pour les institutions financières
    console.log('Integration test placeholder - requires full test environment');
  });
});

console.log('✅ Tests de workflow v2.1 configurés - Exécuter avec: npm test');
console.log('📊 Coverage des fonctionnalités principales:');
console.log('  - Orchestration de synchronisation complète');
console.log('  - Validation de conformité des profils');
console.log('  - Gestion des notifications de mise à jour');
console.log('  - Traitement des échecs de synchronisation');
console.log('  - Support complet PME et institutions financières');