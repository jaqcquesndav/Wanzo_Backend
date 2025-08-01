import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessOperation, OperationStatus, OperationType } from '../../src/modules/operations/entities/business-operation.entity';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';

describe('BusinessOperationsController (e2e)', () => {
  let app: INestApplication;
  let mockBusinessOperationsRepository;
  const mockUser = { id: 'user-123', sub: 'user-123', username: 'testuser', roles: ['admin'] };

  beforeAll(async () => {
    // Mock pour le repository
    mockBusinessOperationsRepository = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };

    // Mock pour JwtAuthGuard
    const mockJwtGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const req = context.switchToHttp().getRequest();
        req.user = mockUser;
        return true;
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(BusinessOperation))
      .useValue(mockBusinessOperationsRepository)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/operations (GET)', () => {
    it('should return an empty array when no operations exist', () => {
      mockBusinessOperationsRepository.findAndCount.mockResolvedValueOnce([[], 0]);

      return request(app.getHttpServer())
        .get('/api/v1/operations')
        .expect(200)
        .expect(res => {
          expect(res.body.items).toEqual([]);
          expect(res.body.totalItems).toBe(0);
          expect(res.body.totalPages).toBe(0);
          expect(res.body.currentPage).toBe(1);
        });
    });

    it('should return paginated operations', () => {
      const mockOperations = [
        {
          id: 'op-1',
          type: OperationType.SALE,
          date: new Date().toISOString(),
          description: 'Test Sale',
          amountCdf: 1000,
          status: OperationStatus.COMPLETED,
        },
      ];

      mockBusinessOperationsRepository.findAndCount.mockResolvedValueOnce([mockOperations, 1]);

      return request(app.getHttpServer())
        .get('/api/v1/operations')
        .expect(200)
        .expect(res => {
          expect(res.body.items).toHaveLength(1);
          expect(res.body.totalItems).toBe(1);
          expect(res.body.items[0].type).toBe(OperationType.SALE);
        });
    });

    it('should apply filters from query parameters', () => {
      mockBusinessOperationsRepository.findAndCount.mockResolvedValueOnce([[], 0]);

      return request(app.getHttpServer())
        .get('/api/v1/operations')
        .query({
          type: OperationType.SALE,
          startDate: '2025-01-01',
          endDate: '2025-07-31',
          status: OperationStatus.COMPLETED,
        })
        .expect(200)
        .expect(() => {
          // Vérifier que findAndCount a été appelé avec les bons filtres
          const findOptions = mockBusinessOperationsRepository.findAndCount.mock.calls[0][0];
          expect(findOptions.where.type).toBe(OperationType.SALE);
          expect(findOptions.where.status).toBe(OperationStatus.COMPLETED);
        });
    });
  });

  describe('/api/v1/operations/:id (GET)', () => {
    it('should return operation by id', () => {
      const mockOperation = {
        id: 'op-123',
        type: OperationType.SALE,
        date: new Date().toISOString(),
        description: 'Test Sale',
        amountCdf: 1000,
        status: OperationStatus.COMPLETED,
      };

      mockBusinessOperationsRepository.findOneBy.mockResolvedValueOnce(mockOperation);

      return request(app.getHttpServer())
        .get('/api/v1/operations/op-123')
        .expect(200)
        .expect(res => {
          expect(res.body.id).toBe('op-123');
          expect(res.body.type).toBe(OperationType.SALE);
        });
    });

    it('should return 404 for non-existent operation', () => {
      mockBusinessOperationsRepository.findOneBy.mockResolvedValueOnce(null);

      return request(app.getHttpServer())
        .get('/api/v1/operations/non-existent')
        .expect(404);
    });
  });

  describe('/api/v1/operations (POST)', () => {
    it('should create a new operation', () => {
      const newOperation = {
        type: OperationType.SALE,
        date: new Date().toISOString(),
        description: 'New Sale',
        amountCdf: 1500,
        amountUsd: 75,
        relatedPartyId: 'customer-456',
        relatedPartyName: 'Test Customer',
        status: OperationStatus.COMPLETED,
      };

      const createdOperation = {
        id: 'op-new',
        ...newOperation,
        createdBy: mockUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockBusinessOperationsRepository.create.mockReturnValueOnce(createdOperation);
      mockBusinessOperationsRepository.save.mockResolvedValueOnce(createdOperation);

      return request(app.getHttpServer())
        .post('/api/v1/operations')
        .send(newOperation)
        .expect(201)
        .expect(res => {
          expect(res.body.id).toBe('op-new');
          expect(res.body.createdBy).toBe(mockUser.id);
        });
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/operations')
        .send({
          // Manque les champs obligatoires
        })
        .expect(400);
    });
  });

  describe('/api/v1/operations/summary/:period (GET)', () => {
    it('should return summary by period', () => {
      const mockSummary = {
        period: 'month',
        startDate: '2025-07-01',
        endDate: '2025-07-31',
        summary: {
          totalOperations: 10,
          byType: {
            [OperationType.SALE]: {
              count: 5,
              amountCdf: 10000,
              amountUsd: 500,
            },
            [OperationType.EXPENSE]: {
              count: 3,
              amountCdf: 7500,
              amountUsd: 375,
            },
          },
          byStatus: {
            [OperationStatus.COMPLETED]: 8,
            [OperationStatus.PENDING]: 2,
          },
        },
      };

      // Mock pour find qui est utilisé dans getOperationsSummary
      mockBusinessOperationsRepository.find.mockResolvedValueOnce([
        { type: OperationType.SALE, status: OperationStatus.COMPLETED, amountCdf: 5000, amountUsd: 250 },
        { type: OperationType.SALE, status: OperationStatus.COMPLETED, amountCdf: 5000, amountUsd: 250 },
        { type: OperationType.EXPENSE, status: OperationStatus.COMPLETED, amountCdf: 7500, amountUsd: 375 },
        // ... autres opérations simulées
      ]);

      return request(app.getHttpServer())
        .get('/api/v1/operations/summary/month')
        .expect(200)
        .expect(res => {
          expect(res.body.period).toBe('month');
          expect(res.body.summary).toBeDefined();
          expect(res.body.summary.totalOperations).toBeDefined();
        });
    });
  });
});
