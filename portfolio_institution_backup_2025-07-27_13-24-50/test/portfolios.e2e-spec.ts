import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PortfolioType, RiskProfile } from '../src/modules/portfolios/entities/portfolio.entity';
import { ProductType } from '../src/modules/portfolios/entities/financial-product.entity';

describe('PortfolioController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Get auth token
    // Note: In a real test, you would use a mock auth service
    authToken = 'test-token';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/portfolios (POST)', () => {
    it('should create a new portfolio', () => {
      return request(app.getHttpServer())
        .post('/portfolios')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Portfolio',
          type: PortfolioType.TRADITIONAL,
          targetAmount: 1000000,
          targetReturn: 10,
          targetSectors: ['Technology', 'Finance'],
          riskProfile: RiskProfile.MODERATE,
          metrics: {
            netValue: 0,
            averageReturn: 0,
            riskPortfolio: 0,
            sharpeRatio: 0,
            volatility: 0,
            alpha: 0,
            beta: 0,
          },
        })
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.portfolio).toBeDefined();
          expect(res.body.portfolio.name).toBe('Test Portfolio');
        });
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/portfolios')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)
        .expect(res => {
          expect(res.body.message).toBe('Validation failed');
          expect(res.body.errors).toBeDefined();
        });
    });
  });

  describe('/financial-products (POST)', () => {
    it('should create a new financial product', () => {
      return request(app.getHttpServer())
        .post('/financial-products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          portfolioId: 'portfolio-123',
          name: 'Test Product',
          type: ProductType.CREDIT,
          characteristics: {
            minAmount: 1000,
            maxAmount: 10000,
            minDuration: 12,
            maxDuration: 36,
            interestRateType: 'fixed',
            minInterestRate: 5,
            maxInterestRate: 15,
            requiredGuarantees: ['collateral'],
            eligibilityCriteria: ['minimum_revenue'],
          },
        })
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.product).toBeDefined();
          expect(res.body.product.name).toBe('Test Product');
        });
    });
  });

  describe('/equipment (POST)', () => {
    it('should create new equipment', () => {
      return request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          portfolioId: 'portfolio-123',
          name: 'Test Equipment',
          category: 'Heavy Machinery',
          price: 50000,
          specifications: {
            dimensions: '200x150x100',
            power: '500HP',
            weight: '2000kg',
            fuel: 'Diesel',
          },
          condition: 'new',
          maintenanceIncluded: true,
          insuranceRequired: true,
          imageUrl: 'https://example.com/image.jpg',
        })
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.equipment).toBeDefined();
          expect(res.body.equipment.name).toBe('Test Equipment');
        });
    });
  });

  describe('/portfolios (GET)', () => {
    it('should return paginated portfolios', () => {
      return request(app.getHttpServer())
        .get('/portfolios')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.portfolios)).toBe(true);
          expect(typeof res.body.total).toBe('number');
        });
    });

    it('should handle pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/portfolios?page=2&per_page=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.page).toBe(2);
          expect(res.body.perPage).toBe(5);
        });
    });
  });

  describe('/portfolios/:id (GET)', () => {
    it('should return a portfolio by ID', () => {
      const portfolioId = 'test-portfolio-id';
      return request(app.getHttpServer())
        .get(`/portfolios/${portfolioId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.portfolio).toBeDefined();
          expect(res.body.portfolio.id).toBe(portfolioId);
        });
    });

    it('should return 404 for non-existent portfolio', () => {
      return request(app.getHttpServer())
        .get('/portfolios/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/portfolios/:id/products (GET)', () => {
    it('should return portfolio with its products', () => {
      const portfolioId = 'test-portfolio-id';
      return request(app.getHttpServer())
        .get(`/portfolios/${portfolioId}/products`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.portfolio).toBeDefined();
          expect(Array.isArray(res.body.products)).toBe(true);
        });
    });
  });

  describe('/portfolios/:id/equipment (GET)', () => {
    it('should return portfolio with its equipment', () => {
      const portfolioId = 'test-portfolio-id';
      return request(app.getHttpServer())
        .get(`/portfolios/${portfolioId}/equipment`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.portfolio).toBeDefined();
          expect(Array.isArray(res.body.equipment)).toBe(true);
        });
    });
  });

  describe('/portfolios/:id (PUT)', () => {
    it('should update a portfolio', () => {
      const portfolioId = 'test-portfolio-id';
      return request(app.getHttpServer())
        .put(`/portfolios/${portfolioId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Portfolio',
          targetReturn: 12,
          riskProfile: RiskProfile.AGGRESSIVE,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.portfolio.name).toBe('Updated Portfolio');
        });
    });
  });

  describe('/portfolios/:id (DELETE)', () => {
    it('should delete a portfolio', () => {
      const portfolioId = 'test-portfolio-id';
      return request(app.getHttpServer())
        .delete(`/portfolios/${portfolioId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Portfolio deactivated successfully');
        });
    });
  });
});