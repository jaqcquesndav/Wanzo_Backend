import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PortfoliosModule } from '../../../src/modules/portfolios/portfolios.module';
import { InstitutionModule } from '../../../src/modules/institution/institution.module';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { Portfolio, PortfolioStatus, RiskProfile } from '../../../src/modules/portfolios/entities/portfolio.entity';
import { Institution, InstitutionType, RegulatoryStatus } from '../../../src/modules/institution/entities/institution.entity';
import { CreditRequest, CreditRequestStatus, Periodicity, ScheduleType } from '../../../src/modules/portfolios/entities/credit-request.entity';

describe('Portfolio Institution Service E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [__dirname + '/../../../src/**/*.entity{.ts,.js}'],
          synchronize: true,
          dropSchema: true,
        }),
        PortfoliosModule,
        InstitutionModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();

    // Mock authentication token for tests
    authToken = 'Bearer mock-jwt-token';
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up all entities before each test
    await dataSource.getRepository(CreditRequest).clear();
    await dataSource.getRepository(Portfolio).clear();
    await dataSource.getRepository(Institution).clear();
  });

  describe('Complete Portfolio Management Workflow', () => {
    it('should complete a full portfolio creation and management lifecycle', async () => {
      // Step 1: Create an institution
      const institutionData = {
        name: 'Test Financial Institution',
        type: InstitutionType.BANK,
        license_number: 'BNK-2025-E2E-001',
        license_type: 'Banking License',
        address: '123 E2E Test Street, Dakar, Senegal',
        phone: '+221771234567',
        email: 'contact@e2etest.sn',
        website: 'https://www.e2etest.sn',
        legal_representative: 'Jane Doe',
        tax_id: 'TAX-E2E-123456',
        regulatory_status: RegulatoryStatus.REGULATED,
      };

      const institutionResponse = await request(app.getHttpServer())
        .post('/institution')
        .set('Authorization', authToken)
        .send(institutionData)
        .expect(201);

      const institutionId = institutionResponse.body.data.id;
      expect(institutionId).toBeDefined();

      // Step 2: Create a portfolio for the institution
      const portfolioData = {
        name: 'E2E Test Portfolio',
        reference: 'E2E-PORTFOLIO-001',
        manager_id: 'mgr-e2e-123',
        institution_id: institutionId,
        target_amount: 2000000,
        target_return: 15.5,
        target_sectors: ['agriculture', 'commerce', 'services'],
        risk_profile: RiskProfile.MODERATE,
        currency: 'XOF',
        description: 'End-to-end test portfolio for integration testing',
      };

      const portfolioResponse = await request(app.getHttpServer())
        .post('/portfolios/traditional')
        .set('Authorization', authToken)
        .send(portfolioData)
        .expect(201);

      const portfolioId = portfolioResponse.body.data.id;
      expect(portfolioId).toBeDefined();
      expect(portfolioResponse.body.data.status).toBe(PortfolioStatus.ACTIVE);

      // Step 3: Verify institution-portfolio relationship
      const portfolioDetails = await request(app.getHttpServer())
        .get(`/portfolios/traditional/${portfolioId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(portfolioDetails.body.data.institution_id).toBe(institutionId);

      // Step 4: Create credit requests for the portfolio
      const creditRequestData = {
        portfolioId: portfolioId,
        memberId: 'member-e2e-001',
        productId: 'product-e2e-001',
        receptionDate: '2025-08-03',
        requestAmount: 500000,
        periodicity: Periodicity.MONTHLY,
        interestRate: 12.0,
        reason: 'E2E test credit request for business expansion',
        scheduleType: ScheduleType.CONSTANT,
        schedulesCount: 12,
        financingPurpose: 'Purchase of equipment and inventory',
        creditManagerId: 'mgr-e2e-123',
        isGroup: false,
        currency: 'XOF',
      };

      const creditRequestResponse = await request(app.getHttpServer())
        .post('/portfolios/traditional/credit-requests')
        .set('Authorization', authToken)
        .send(creditRequestData)
        .expect(201);

      const creditRequestId = creditRequestResponse.body.data.id;
      expect(creditRequestId).toBeDefined();
      expect(creditRequestResponse.body.data.status).toBe(CreditRequestStatus.DRAFT);

      // Step 5: Approve the credit request
      const approvalData = {
        notes: 'E2E test approval - all criteria met',
      };

      const approvalResponse = await request(app.getHttpServer())
        .post(`/portfolios/traditional/credit-requests/${creditRequestId}/approve`)
        .set('Authorization', authToken)
        .send(approvalData)
        .expect(200);

      expect(approvalResponse.body.data.status).toBe(CreditRequestStatus.APPROVED);

      // Step 6: Update portfolio metrics
      const portfolioUpdateData = {
        metrics: {
          totalCreditRequests: 1,
          approvedRequests: 1,
          rejectedRequests: 0,
          totalAmountRequested: 500000,
          totalAmountApproved: 500000,
          averageInterestRate: 12.0,
          portfolioUtilization: 25.0, // 500k out of 2M target
        },
      };

      const portfolioUpdateResponse = await request(app.getHttpServer())
        .put(`/portfolios/traditional/${portfolioId}`)
        .set('Authorization', authToken)
        .send(portfolioUpdateData)
        .expect(200);

      expect(portfolioUpdateResponse.body.data.metrics).toMatchObject(portfolioUpdateData.metrics);

      // Step 7: Verify complete workflow by fetching all related data
      const finalPortfolioCheck = await request(app.getHttpServer())
        .get(`/portfolios/traditional/${portfolioId}`)
        .set('Authorization', authToken)
        .expect(200);

      const finalInstitutionCheck = await request(app.getHttpServer())
        .get(`/institution/${institutionId}`)
        .set('Authorization', authToken)
        .expect(200);

      const finalCreditRequestCheck = await request(app.getHttpServer())
        .get(`/portfolios/traditional/credit-requests/${creditRequestId}`)
        .set('Authorization', authToken)
        .expect(200);

      // Verify all entities are properly linked and updated
      expect(finalPortfolioCheck.body.data).toMatchObject({
        id: portfolioId,
        name: portfolioData.name,
        institution_id: institutionId,
        status: PortfolioStatus.ACTIVE,
        metrics: portfolioUpdateData.metrics,
      });

        expect(finalInstitutionCheck.body.data).toMatchObject({
        id: institutionId,
        name: institutionData.name,
        regulatory_status: RegulatoryStatus.REGULATED,
      });      expect(finalCreditRequestCheck.body.data).toMatchObject({
        id: creditRequestId,
        portfolioId: portfolioId,
        status: CreditRequestStatus.APPROVED,
        requestAmount: creditRequestData.requestAmount,
      });
    });
  });

  describe('Institution Regulatory Workflow', () => {
    it('should handle institution regulatory status changes and portfolio impacts', async () => {
      // Step 1: Create an institution
      const institutionData = {
        name: 'Regulatory Test Bank',
        type: InstitutionType.BANK,
        license_number: 'BNK-REG-001',
        license_type: 'Banking License',
        address: '456 Regulatory Street, Dakar',
        phone: '+221771234568',
        email: 'regulatory@testbank.sn',
        regulatory_status: RegulatoryStatus.REGULATED,
      };

      const institutionResponse = await request(app.getHttpServer())
        .post('/institution')
        .set('Authorization', authToken)
        .send(institutionData)
        .expect(201);

      const institutionId = institutionResponse.body.data.id;

      // Step 2: Create portfolios for the institution
      const portfolio1Response = await request(app.getHttpServer())
        .post('/portfolios/traditional')
        .set('Authorization', authToken)
        .send({
          name: 'Portfolio 1',
          reference: 'REG-PORT-001',
          manager_id: 'mgr-reg-001',
          institution_id: institutionId,
          target_amount: 1000000,
          risk_profile: RiskProfile.CONSERVATIVE,
          currency: 'XOF',
        })
        .expect(201);

      const portfolio2Response = await request(app.getHttpServer())
        .post('/portfolios/traditional')
        .set('Authorization', authToken)
        .send({
          name: 'Portfolio 2',
          reference: 'REG-PORT-002',
          manager_id: 'mgr-reg-002',
          institution_id: institutionId,
          target_amount: 1500000,
          risk_profile: RiskProfile.AGGRESSIVE,
          currency: 'XOF',
        })
        .expect(201);

      // Step 3: Change institution regulatory status to suspended
      const statusUpdateResponse = await request(app.getHttpServer())
        .put(`/institution/${institutionId}/regulatory-status`)
        .set('Authorization', authToken)
        .send({
          regulatory_status: RegulatoryStatus.PENDING,
          reason: 'Compliance audit findings',
          notes: 'Temporary suspension pending corrective actions',
        })
        .expect(200);

      expect(statusUpdateResponse.body.data.regulatory_status).toBe(RegulatoryStatus.PENDING);

      // Step 4: Verify portfolios are still accessible but institution is suspended
      const portfoliosResponse = await request(app.getHttpServer())
        .get('/portfolios/traditional')
        .query({ institution_id: institutionId })
        .set('Authorization', authToken)
        .expect(200);

      expect(portfoliosResponse.body.data).toHaveLength(2);

      const institutionCheckResponse = await request(app.getHttpServer())
        .get(`/institution/${institutionId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(institutionCheckResponse.body.data.regulatory_status).toBe(RegulatoryStatus.PENDING);

      // Step 5: Reactivate institution
      const reactivationResponse = await request(app.getHttpServer())
        .put(`/institution/${institutionId}/regulatory-status`)
        .set('Authorization', authToken)
        .send({
          regulatory_status: RegulatoryStatus.REGULATED,
          reason: 'Corrective actions completed',
          notes: 'All compliance issues resolved',
        })
        .expect(200);

      expect(reactivationResponse.body.data.regulatory_status).toBe(RegulatoryStatus.REGULATED);
    });
  });

  describe('Credit Request Approval Workflow', () => {
    it('should handle complex credit request approval scenarios', async () => {
      // Setup: Create institution and portfolio
      const institutionResponse = await request(app.getHttpServer())
        .post('/institution')
        .set('Authorization', authToken)
        .send({
          name: 'Credit Test Institution',
          type: InstitutionType.MICROFINANCE,
          license_number: 'MFI-CREDIT-001',
          regulatory_status: RegulatoryStatus.REGULATED,
        })
        .expect(201);

      const portfolioResponse = await request(app.getHttpServer())
        .post('/portfolios/traditional')
        .set('Authorization', authToken)
        .send({
          name: 'Credit Test Portfolio',
          reference: 'CREDIT-PORT-001',
          manager_id: 'mgr-credit-001',
          institution_id: institutionResponse.body.data.id,
          target_amount: 5000000,
          risk_profile: RiskProfile.MODERATE,
          currency: 'XOF',
        })
        .expect(201);

      const portfolioId = portfolioResponse.body.data.id;

      // Create multiple credit requests
      const creditRequests: any[] = [];
      for (let i = 1; i <= 3; i++) {
        const creditRequestResponse = await request(app.getHttpServer())
          .post('/portfolios/traditional/credit-requests')
          .set('Authorization', authToken)
          .send({
            portfolioId: portfolioId,
            memberId: `member-${i}`,
            productId: `product-${i}`,
            receptionDate: '2025-08-03',
            requestAmount: 1000000 + (i * 100000),
            periodicity: Periodicity.MONTHLY,
            interestRate: 10 + i,
            reason: `Credit request ${i} for testing`,
            scheduleType: ScheduleType.CONSTANT,
            schedulesCount: 12 + i,
            financingPurpose: `Business purpose ${i}`,
            creditManagerId: 'mgr-credit-001',
            isGroup: false,
            currency: 'XOF',
          })
          .expect(201);

        creditRequests.push(creditRequestResponse.body.data);
      }

      // Approve first request
      await request(app.getHttpServer())
        .post(`/portfolios/traditional/credit-requests/${creditRequests[0].id}/approve`)
        .set('Authorization', authToken)
        .send({ notes: 'First approval' })
        .expect(200);

      // Reject second request
      await request(app.getHttpServer())
        .post(`/portfolios/traditional/credit-requests/${creditRequests[1].id}/reject`)
        .set('Authorization', authToken)
        .send({
          reason: 'Insufficient collateral',
          notes: 'Client needs to provide additional guarantees',
        })
        .expect(200);

      // Leave third request pending

      // Verify final states
      const approvedRequest = await request(app.getHttpServer())
        .get(`/portfolios/traditional/credit-requests/${creditRequests[0].id}`)
        .set('Authorization', authToken)
        .expect(200);

      const rejectedRequest = await request(app.getHttpServer())
        .get(`/portfolios/traditional/credit-requests/${creditRequests[1].id}`)
        .set('Authorization', authToken)
        .expect(200);

      const pendingRequest = await request(app.getHttpServer())
        .get(`/portfolios/traditional/credit-requests/${creditRequests[2].id}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(approvedRequest.body.data.status).toBe(CreditRequestStatus.APPROVED);
      expect(rejectedRequest.body.data.status).toBe(CreditRequestStatus.REJECTED);
      expect(pendingRequest.body.data.status).toBe(CreditRequestStatus.DRAFT);

      // Get summary statistics
      const allRequestsResponse = await request(app.getHttpServer())
        .get('/portfolios/traditional/credit-requests')
        .query({ portfolioId: portfolioId })
        .set('Authorization', authToken)
        .expect(200);

      expect(allRequestsResponse.body.data).toHaveLength(3);
      expect(allRequestsResponse.body.meta.total).toBe(3);
    });
  });
});
