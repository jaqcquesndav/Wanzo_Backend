import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { CompanySize, CompanySector, ProspectStatus } from '../src/modules/prospection/entities/prospect.entity';
import { AnalysisType, AnalysisStatus } from '../src/modules/prospection/entities/prospect-analysis.entity';

describe('ProspectionController (e2e)', () => {
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

  describe('/prospects (POST)', () => {
    it('should create a new prospect', () => {
      return request(app.getHttpServer())
        .post('/prospects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Company',
          size: CompanySize.SMALL,
          sector: CompanySector.TECHNOLOGY,
          rccm: 'RCCM123',
          idnat: 'IDNAT123',
          nif: 'NIF123',
          address: '123 Test St',
          phone: '+1234567890',
          email: 'test@company.com',
          website: 'https://test.com',
          legalRepresentative: 'John Doe',
          annualRevenue: 1000000,
          employeeCount: 50,
          description: 'Test company description',
          financialData: {
            keyMetrics: {
              currentRatio: 1.5,
              quickRatio: 1.2,
              debtToEquity: 0.8,
            },
            historicalPerformance: [
              {
                year: 2023,
                revenue: 900000,
                profit: 100000,
                assets: 500000,
                liabilities: 300000,
              },
            ],
          },
        })
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.prospect).toBeDefined();
          expect(res.body.prospect.name).toBe('Test Company');
          expect(res.body.prospect.status).toBe(ProspectStatus.NEW);
        });
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/prospects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)
        .expect(res => {
          expect(res.body.message).toBe('Validation failed');
          expect(res.body.errors).toBeDefined();
        });
    });
  });

  describe('/prospect-analysis (POST)', () => {
    it('should create a new analysis', () => {
      return request(app.getHttpServer())
        .post('/prospect-analysis/prospect-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: AnalysisType.FINANCIAL,
          criteria: [
            {
              category: 'profitability',
              weight: 0.4,
              score: 8,
              notes: 'Good profit margins',
            },
          ],
          overallScore: 8.5,
          summary: 'Strong financial position',
          strengths: ['Good profitability', 'Strong cash flow'],
          weaknesses: ['High debt levels'],
          opportunities: ['Market expansion'],
          threats: ['Increasing competition'],
          recommendations: [
            {
              category: 'financial',
              description: 'Reduce debt',
              priority: 'high',
              timeline: '6 months',
            },
          ],
        })
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.analysis).toBeDefined();
          expect(res.body.analysis.status).toBe(AnalysisStatus.IN_PROGRESS);
        });
    });
  });

  describe('/prospects (GET)', () => {
    it('should return paginated prospects', () => {
      return request(app.getHttpServer())
        .get('/prospects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.prospects)).toBe(true);
          expect(typeof res.body.total).toBe('number');
        });
    });

    it('should handle filters', () => {
      return request(app.getHttpServer())
        .get('/prospects')
        .query({
          size: CompanySize.SMALL,
          sector: CompanySector.TECHNOLOGY,
          status: ProspectStatus.NEW,
          min_revenue: 1000000,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.prospects)).toBe(true);
        });
    });
  });

  describe('/prospects/:id (GET)', () => {
    it('should return a prospect by ID', () => {
      return request(app.getHttpServer())
        .get('/prospects/prospect-123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.prospect).toBeDefined();
        });
    });

    it('should return 404 for non-existent prospect', () => {
      return request(app.getHttpServer())
        .get('/prospects/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/prospects/:id (PUT)', () => {
    it('should update a prospect', () => {
      return request(app.getHttpServer())
        .put('/prospects/prospect-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Company',
          status: ProspectStatus.IN_ANALYSIS,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.prospect.name).toBe('Updated Company');
          expect(res.body.prospect.status).toBe(ProspectStatus.IN_ANALYSIS);
        });
    });
  });

  describe('/prospects/:id/documents (POST)', () => {
    it('should add a document', () => {
      return request(app.getHttpServer())
        .post('/prospects/prospect-123/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Financial Statement',
          type: 'financial_statement',
          cloudinaryUrl: 'https://example.com/doc.pdf',
          description: 'Annual financial statement',
        })
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.document).toBeDefined();
          expect(res.body.document.name).toBe('Financial Statement');
        });
    });
  });

  describe('/prospects/:id/contact-history (POST)', () => {
    it('should add a contact history entry', () => {
      return request(app.getHttpServer())
        .post('/prospects/prospect-123/contact-history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'meeting',
          notes: 'Initial meeting',
          outcome: 'positive',
          nextSteps: 'Schedule follow-up',
        })
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.prospect.contactHistory).toBeDefined();
          expect(res.body.prospect.contactHistory).toHaveLength(1);
        });
    });
  });

  describe('/prospect-analysis/prospect/:prospectId (GET)', () => {
    it('should return analyses for a prospect', () => {
      return request(app.getHttpServer())
        .get('/prospect-analysis/prospect/prospect-123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.analyses)).toBe(true);
        });
    });
  });

  describe('/prospect-analysis/prospect/:prospectId/score (GET)', () => {
    it('should return aggregate analysis score', () => {
      return request(app.getHttpServer())
        .get('/prospect-analysis/prospect/prospect-123/score')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(typeof res.body.score).toBe('number');
        });
    });
  });
});