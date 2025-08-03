import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PortfoliosModule } from '../../../src/modules/portfolios/portfolios.module';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { CreditRequest, CreditRequestStatus, Periodicity, ScheduleType } from '../../../src/modules/portfolios/entities/credit-request.entity';
import { Portfolio, PortfolioStatus, RiskProfile } from '../../../src/modules/portfolios/entities/portfolio.entity';
import { CreateCreditRequestDto } from '../../../src/modules/portfolios/dtos/credit-request.dto';

describe('Credit Requests Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let testPortfolioId: string;

  const testCreditRequestData: CreateCreditRequestDto = {
    memberId: 'member-test-123',
    productId: 'product-test-456',
    receptionDate: '2025-08-03',
    requestAmount: 100000,
    periodicity: Periodicity.MONTHLY,
    interestRate: 12.5,
    reason: 'Business expansion for integration testing',
    scheduleType: ScheduleType.CONSTANT,
    schedulesCount: 24,
    deferredPaymentsCount: 0,
    financingPurpose: 'Purchase of inventory and equipment',
    creditManagerId: 'manager-test-789',
    isGroup: false,
    currency: 'XOF',
  };

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
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();

    // Mock authentication token for tests
    authToken = 'Bearer mock-jwt-token';

    // Create a test portfolio
    const portfolioRepo = dataSource.getRepository(Portfolio);
    const portfolio = await portfolioRepo.save({
      name: 'Test Portfolio for Credit Requests',
      reference: 'TRP-2025-TEST',
      manager_id: 'mgr-test-123',
      institution_id: 'inst-test-456',
      target_amount: 1000000,
      risk_profile: RiskProfile.MODERATE,
      status: PortfolioStatus.ACTIVE,
      currency: 'XOF',
    });
    testPortfolioId = portfolio.id;
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up credit requests before each test
    await dataSource.getRepository(CreditRequest).clear();
  });

  describe('/portfolios/traditional/credit-requests (POST)', () => {
    it('should create a new credit request', async () => {
      const requestData = {
        ...testCreditRequestData,
        portfolioId: testPortfolioId,
      };

      const response = await request(app.getHttpServer())
        .post('/portfolios/traditional/credit-requests')
        .set('Authorization', authToken)
        .send(requestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        memberId: requestData.memberId,
        productId: requestData.productId,
        requestAmount: requestData.requestAmount,
        periodicity: requestData.periodicity,
        interestRate: requestData.interestRate,
        reason: requestData.reason,
        scheduleType: requestData.scheduleType,
        schedulesCount: requestData.schedulesCount,
        financingPurpose: requestData.financingPurpose,
        creditManagerId: requestData.creditManagerId,
        isGroup: requestData.isGroup,
        status: CreditRequestStatus.DRAFT,
        portfolioId: testPortfolioId,
      });
      expect(response.body.data.id).toBeDefined();
    });

    it('should return 400 for invalid credit request data', async () => {
      const invalidData = {
        memberId: '', // Invalid: empty memberId
        requestAmount: -5000, // Invalid: negative amount
        interestRate: 'invalid', // Invalid: not a number
      };

      await request(app.getHttpServer())
        .post('/portfolios/traditional/credit-requests')
        .set('Authorization', authToken)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('/portfolios/traditional/credit-requests (GET)', () => {
    beforeEach(async () => {
      // Create test credit requests
      const creditRequestRepo = dataSource.getRepository(CreditRequest);
      await creditRequestRepo.save([
        {
          ...testCreditRequestData,
          receptionDate: new Date('2025-08-03'),
          portfolioId: testPortfolioId,
          status: CreditRequestStatus.PENDING,
        },
        {
          ...testCreditRequestData,
          memberId: 'member-test-456',
          requestAmount: 75000,
          receptionDate: new Date('2025-08-02'),
          portfolioId: testPortfolioId,
          status: CreditRequestStatus.APPROVED,
        },
      ]);
    });

    it('should return all credit requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/portfolios/traditional/credit-requests')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta).toMatchObject({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter credit requests by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/portfolios/traditional/credit-requests')
        .query({ status: CreditRequestStatus.PENDING })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe(CreditRequestStatus.PENDING);
    });

    it('should filter credit requests by portfolio', async () => {
      const response = await request(app.getHttpServer())
        .get('/portfolios/traditional/credit-requests')
        .query({ portfolioId: testPortfolioId })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach((request: any) => {
        expect(request.portfolioId).toBe(testPortfolioId);
      });
    });

    it('should paginate results', async () => {
      const response = await request(app.getHttpServer())
        .get('/portfolios/traditional/credit-requests')
        .query({ page: 1, limit: 1 })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta).toMatchObject({
        total: 2,
        page: 1,
        limit: 1,
        totalPages: 2,
      });
    });
  });

  describe('/portfolios/traditional/credit-requests/:id (GET)', () => {
    let creditRequestId: string;

    beforeEach(async () => {
      const creditRequestRepo = dataSource.getRepository(CreditRequest);
      const creditRequest = await creditRequestRepo.save({
        ...testCreditRequestData,
        receptionDate: new Date('2025-08-03'),
        portfolioId: testPortfolioId,
        status: CreditRequestStatus.PENDING,
      });
      creditRequestId = creditRequest.id;
    });

    it('should return a specific credit request', async () => {
      const response = await request(app.getHttpServer())
        .get(`/portfolios/traditional/credit-requests/${creditRequestId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: creditRequestId,
        memberId: testCreditRequestData.memberId,
        productId: testCreditRequestData.productId,
        requestAmount: testCreditRequestData.requestAmount,
        status: CreditRequestStatus.PENDING,
      });
    });

    it('should return 404 for non-existent credit request', async () => {
      await request(app.getHttpServer())
        .get('/portfolios/traditional/credit-requests/non-existent-id')
        .set('Authorization', authToken)
        .expect(404);
    });
  });

  describe('/portfolios/traditional/credit-requests/:id (PUT)', () => {
    let creditRequestId: string;

    beforeEach(async () => {
      const creditRequestRepo = dataSource.getRepository(CreditRequest);
      const creditRequest = await creditRequestRepo.save({
        ...testCreditRequestData,
        receptionDate: new Date('2025-08-03'),
        portfolioId: testPortfolioId,
        status: CreditRequestStatus.DRAFT,
      });
      creditRequestId = creditRequest.id;
    });

    it('should update a credit request', async () => {
      const updateData = {
        requestAmount: 150000,
        interestRate: 10.5,
        reason: 'Updated business expansion plan',
      };

      const response = await request(app.getHttpServer())
        .put(`/portfolios/traditional/credit-requests/${creditRequestId}`)
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: creditRequestId,
        requestAmount: updateData.requestAmount,
        interestRate: updateData.interestRate,
        reason: updateData.reason,
      });
    });

    it('should return 404 for non-existent credit request', async () => {
      const updateData = { requestAmount: 150000 };

      await request(app.getHttpServer())
        .put('/portfolios/traditional/credit-requests/non-existent-id')
        .set('Authorization', authToken)
        .send(updateData)
        .expect(404);
    });
  });

  describe('/portfolios/traditional/credit-requests/:id/approve (POST)', () => {
    let creditRequestId: string;

    beforeEach(async () => {
      const creditRequestRepo = dataSource.getRepository(CreditRequest);
      const creditRequest = await creditRequestRepo.save({
        ...testCreditRequestData,
        receptionDate: new Date('2025-08-03'),
        portfolioId: testPortfolioId,
        status: CreditRequestStatus.PENDING,
      });
      creditRequestId = creditRequest.id;
    });

    it('should approve a credit request', async () => {
      const approvalData = {
        notes: 'Approved after thorough review',
      };

      const response = await request(app.getHttpServer())
        .post(`/portfolios/traditional/credit-requests/${creditRequestId}/approve`)
        .set('Authorization', authToken)
        .send(approvalData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(CreditRequestStatus.APPROVED);
    });

    it('should return 404 for non-existent credit request', async () => {
      const approvalData = { notes: 'Test approval' };

      await request(app.getHttpServer())
        .post('/portfolios/traditional/credit-requests/non-existent-id/approve')
        .set('Authorization', authToken)
        .send(approvalData)
        .expect(404);
    });
  });

  describe('/portfolios/traditional/credit-requests/:id/reject (POST)', () => {
    let creditRequestId: string;

    beforeEach(async () => {
      const creditRequestRepo = dataSource.getRepository(CreditRequest);
      const creditRequest = await creditRequestRepo.save({
        ...testCreditRequestData,
        receptionDate: new Date('2025-08-03'),
        portfolioId: testPortfolioId,
        status: CreditRequestStatus.PENDING,
      });
      creditRequestId = creditRequest.id;
    });

    it('should reject a credit request', async () => {
      const rejectionData = {
        reason: 'Insufficient collateral',
        notes: 'Client needs to provide additional guarantees',
      };

      const response = await request(app.getHttpServer())
        .post(`/portfolios/traditional/credit-requests/${creditRequestId}/reject`)
        .set('Authorization', authToken)
        .send(rejectionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(CreditRequestStatus.REJECTED);
    });

    it('should return 400 for missing rejection reason', async () => {
      const rejectionData = {
        notes: 'Missing reason',
      };

      await request(app.getHttpServer())
        .post(`/portfolios/traditional/credit-requests/${creditRequestId}/reject`)
        .set('Authorization', authToken)
        .send(rejectionData)
        .expect(400);
    });
  });

  describe('/portfolios/traditional/credit-requests/:id (DELETE)', () => {
    let creditRequestId: string;

    beforeEach(async () => {
      const creditRequestRepo = dataSource.getRepository(CreditRequest);
      const creditRequest = await creditRequestRepo.save({
        ...testCreditRequestData,
        receptionDate: new Date('2025-08-03'),
        portfolioId: testPortfolioId,
        status: CreditRequestStatus.DRAFT,
      });
      creditRequestId = creditRequest.id;
    });

    it('should delete a draft credit request', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/portfolios/traditional/credit-requests/${creditRequestId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Credit request deleted successfully');

      // Verify credit request is deleted
      const creditRequestRepo = dataSource.getRepository(CreditRequest);
      const creditRequest = await creditRequestRepo.findOne({ where: { id: creditRequestId } });
      expect(creditRequest).toBeNull();
    });

    it('should return 404 for non-existent credit request', async () => {
      await request(app.getHttpServer())
        .delete('/portfolios/traditional/credit-requests/non-existent-id')
        .set('Authorization', authToken)
        .expect(404);
    });
  });
});
