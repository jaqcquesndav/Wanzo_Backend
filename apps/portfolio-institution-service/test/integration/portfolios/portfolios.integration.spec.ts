import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PortfoliosModule } from '../../../src/modules/portfolios/portfolios.module';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { Portfolio, PortfolioStatus, RiskProfile } from '../../../src/modules/portfolios/entities/portfolio.entity';
import { CreatePortfolioDto } from '../../../src/modules/portfolios/dtos/portfolio.dto';

describe('Portfolios Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;

  const testPortfolioData: CreatePortfolioDto = {
    name: 'Test Integration Portfolio',
    description: 'Portfolio for integration testing',
    manager_id: 'mgr-test-123',
    institution_id: 'inst-test-456',
    target_amount: 500000,
    target_return: 15,
    target_sectors: ['Technology', 'Finance'],
    risk_profile: RiskProfile.MODERATE,
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
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await dataSource.getRepository(Portfolio).clear();
  });

  describe('/portfolios/traditional (POST)', () => {
    it('should create a new portfolio', async () => {
      const response = await request(app.getHttpServer())
        .post('/portfolios/traditional')
        .set('Authorization', authToken)
        .send(testPortfolioData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: testPortfolioData.name,
        description: testPortfolioData.description,
        manager_id: testPortfolioData.manager_id,
        institution_id: testPortfolioData.institution_id,
        target_amount: testPortfolioData.target_amount,
        target_return: testPortfolioData.target_return,
        target_sectors: testPortfolioData.target_sectors,
        risk_profile: testPortfolioData.risk_profile,
        status: PortfolioStatus.ACTIVE,
      });
      expect(response.body.data.reference).toMatch(/^TRP-\d{4}-\d{3}$/);
      expect(response.body.data.id).toBeDefined();
    });

    it('should return 400 for invalid portfolio data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        target_amount: -1000, // Invalid: negative amount
      };

      await request(app.getHttpServer())
        .post('/portfolios/traditional')
        .set('Authorization', authToken)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('/portfolios/traditional (GET)', () => {
    beforeEach(async () => {
      // Create test portfolios
      const portfolioRepo = dataSource.getRepository(Portfolio);
      await portfolioRepo.save([
        {
          ...testPortfolioData,
          reference: 'TRP-2025-001',
          status: PortfolioStatus.ACTIVE,
        },
        {
          ...testPortfolioData,
          name: 'Inactive Portfolio',
          reference: 'TRP-2025-002',
          status: PortfolioStatus.INACTIVE,
        },
      ]);
    });

    it('should return all portfolios', async () => {
      const response = await request(app.getHttpServer())
        .get('/portfolios/traditional')
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

    it('should filter portfolios by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/portfolios/traditional')
        .query({ status: PortfolioStatus.ACTIVE })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe(PortfolioStatus.ACTIVE);
    });

    it('should paginate results', async () => {
      const response = await request(app.getHttpServer())
        .get('/portfolios/traditional')
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

  describe('/portfolios/traditional/:id (GET)', () => {
    let portfolioId: string;

    beforeEach(async () => {
      const portfolioRepo = dataSource.getRepository(Portfolio);
      const portfolio = await portfolioRepo.save({
        ...testPortfolioData,
        reference: 'TRP-2025-001',
        status: PortfolioStatus.ACTIVE,
      });
      portfolioId = portfolio.id;
    });

    it('should return a specific portfolio', async () => {
      const response = await request(app.getHttpServer())
        .get(`/portfolios/traditional/${portfolioId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: portfolioId,
        name: testPortfolioData.name,
        description: testPortfolioData.description,
        status: PortfolioStatus.ACTIVE,
      });
    });

    it('should return 404 for non-existent portfolio', async () => {
      await request(app.getHttpServer())
        .get('/portfolios/traditional/non-existent-id')
        .set('Authorization', authToken)
        .expect(404);
    });
  });

  describe('/portfolios/traditional/:id (PUT)', () => {
    let portfolioId: string;

    beforeEach(async () => {
      const portfolioRepo = dataSource.getRepository(Portfolio);
      const portfolio = await portfolioRepo.save({
        ...testPortfolioData,
        reference: 'TRP-2025-001',
        status: PortfolioStatus.ACTIVE,
      });
      portfolioId = portfolio.id;
    });

    it('should update a portfolio', async () => {
      const updateData = {
        name: 'Updated Portfolio Name',
        target_amount: 750000,
        risk_profile: RiskProfile.AGGRESSIVE,
      };

      const response = await request(app.getHttpServer())
        .put(`/portfolios/traditional/${portfolioId}`)
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: portfolioId,
        name: updateData.name,
        target_amount: updateData.target_amount,
        risk_profile: updateData.risk_profile,
      });
    });

    it('should return 404 for non-existent portfolio', async () => {
      const updateData = { name: 'Updated Name' };

      await request(app.getHttpServer())
        .put('/portfolios/traditional/non-existent-id')
        .set('Authorization', authToken)
        .send(updateData)
        .expect(404);
    });
  });

  describe('/portfolios/traditional/:id/close (POST)', () => {
    let portfolioId: string;

    beforeEach(async () => {
      const portfolioRepo = dataSource.getRepository(Portfolio);
      const portfolio = await portfolioRepo.save({
        ...testPortfolioData,
        reference: 'TRP-2025-001',
        status: PortfolioStatus.ACTIVE,
      });
      portfolioId = portfolio.id;
    });

    it('should close a portfolio', async () => {
      const closeData = {
        closureReason: 'Objectives achieved',
        closureNotes: 'All targets met successfully',
      };

      const response = await request(app.getHttpServer())
        .post(`/portfolios/traditional/${portfolioId}/close`)
        .set('Authorization', authToken)
        .send(closeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(PortfolioStatus.CLOSED);
    });

    it('should return 404 for non-existent portfolio', async () => {
      const closeData = { closureReason: 'Test closure' };

      await request(app.getHttpServer())
        .post('/portfolios/traditional/non-existent-id/close')
        .set('Authorization', authToken)
        .send(closeData)
        .expect(404);
    });
  });

  describe('/portfolios/traditional/:id (DELETE)', () => {
    let portfolioId: string;

    beforeEach(async () => {
      const portfolioRepo = dataSource.getRepository(Portfolio);
      const portfolio = await portfolioRepo.save({
        ...testPortfolioData,
        reference: 'TRP-2025-001',
        status: PortfolioStatus.ACTIVE,
      });
      portfolioId = portfolio.id;
    });

    it('should delete (close) a portfolio', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/portfolios/traditional/${portfolioId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Portfolio closed successfully');

      // Verify portfolio is closed
      const portfolioRepo = dataSource.getRepository(Portfolio);
      const portfolio = await portfolioRepo.findOne({ where: { id: portfolioId } });
      expect(portfolio?.status).toBe(PortfolioStatus.CLOSED);
    });

    it('should return 404 for non-existent portfolio', async () => {
      await request(app.getHttpServer())
        .delete('/portfolios/traditional/non-existent-id')
        .set('Authorization', authToken)
        .expect(404);
    });
  });
});
