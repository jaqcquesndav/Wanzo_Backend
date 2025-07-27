import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { OperationType, OperationStatus } from '../src/modules/operations/entities/operation.entity';
import { WorkflowStatus } from '../src/modules/operations/entities/workflow.entity';
import { StepStatus } from '../src/modules/operations/entities/workflow-step.entity';

describe('OperationsController (e2e)', () => {
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

  describe('/operations (POST)', () => {
    it('should create a new credit operation', () => {
      return request(app.getHttpServer())
        .post('/operations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: OperationType.CREDIT,
          portfolioId: 'portfolio-123',
          productId: 'product-123',
          dateEmission: new Date(),
          rateOrYield: 5.5,
          quantity: 1,
          duration: 12,
          description: 'Test credit operation',
          requestedAmount: 10000,
        })
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.operation).toBeDefined();
          expect(res.body.operation.type).toBe(OperationType.CREDIT);
          expect(res.body.operation.status).toBe(OperationStatus.PENDING);
        });
    });

    it('should create a new leasing operation', () => {
      return request(app.getHttpServer())
        .post('/operations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: OperationType.LEASING,
          portfolioId: 'portfolio-123',
          equipmentId: 'equipment-123',
          dateEmission: new Date(),
          rateOrYield: 8.0,
          quantity: 1,
          duration: 36,
          description: 'Test leasing operation',
          initialPayment: 5000,
        })
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.operation).toBeDefined();
          expect(res.body.operation.type).toBe(OperationType.LEASING);
        });
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/operations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)
        .expect(res => {
          expect(res.body.message).toBe('Validation failed');
          expect(res.body.errors).toBeDefined();
        });
    });
  });

  describe('/operations (GET)', () => {
    it('should return paginated operations', () => {
      return request(app.getHttpServer())
        .get('/operations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.operations)).toBe(true);
          expect(typeof res.body.total).toBe('number');
        });
    });

    it('should handle filters', () => {
      return request(app.getHttpServer())
        .get('/operations')
        .query({
          type: OperationType.CREDIT,
          status: OperationStatus.PENDING,
          portfolio_id: 'portfolio-123',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.operations)).toBe(true);
        });
    });
  });

  describe('/operations/:id (GET)', () => {
    it('should return an operation by ID', () => {
      const operationId = 'test-operation-id';
      return request(app.getHttpServer())
        .get(`/operations/${operationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.operation).toBeDefined();
          expect(res.body.operation.id).toBe(operationId);
        });
    });

    it('should return 404 for non-existent operation', () => {
      return request(app.getHttpServer())
        .get('/operations/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/operations/:id (PUT)', () => {
    it('should update an operation', () => {
      const operationId = 'test-operation-id';
      return request(app.getHttpServer())
        .put(`/operations/${operationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: OperationStatus.ACTIVE,
          rateOrYield: 6.0,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.operation.status).toBe(OperationStatus.ACTIVE);
        });
    });
  });

  describe('/operations/:id (DELETE)', () => {
    it('should delete a pending operation', () => {
      const operationId = 'test-operation-id';
      return request(app.getHttpServer())
        .delete(`/operations/${operationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Operation deleted successfully');
        });
    });
  });

  describe('/workflows/operation/:operationId (GET)', () => {
    it('should return workflow for operation', () => {
      const operationId = 'test-operation-id';
      return request(app.getHttpServer())
        .get(`/workflows/operation/${operationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.workflow).toBeDefined();
          expect(res.body.workflow.status).toBeDefined();
        });
    });
  });

  describe('/workflows/:id/steps/:stepId (PUT)', () => {
    it('should update workflow step', () => {
      return request(app.getHttpServer())
        .put('/workflows/workflow-123/steps/step-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: StepStatus.COMPLETED,
          files: [
            {
              name: 'document.pdf',
              cloudinaryUrl: 'https://example.com/doc.pdf',
              type: 'application/pdf',
            },
          ],
        })
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.step.status).toBe(StepStatus.COMPLETED);
        });
    });
  });

  describe('/workflows/:id/steps/:stepId/manager-validation (PUT)', () => {
    it('should handle manager validation', () => {
      return request(app.getHttpServer())
        .put('/workflows/workflow-123/steps/step-123/manager-validation')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: StepStatus.COMPLETED,
          comment: 'Approved',
        })
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.step.status).toBe(StepStatus.COMPLETED);
          expect(res.body.step.metadata.managerValidation).toBeDefined();
        });
    });
  });

  describe('/workflows/:id/steps/:stepId/system-check (PUT)', () => {
    it('should handle system check', () => {
      return request(app.getHttpServer())
        .put('/workflows/workflow-123/steps/step-123/system-check')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: StepStatus.COMPLETED,
          checkedAt: new Date().toISOString(),
          result: 'Pass',
        })
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.step.status).toBe(StepStatus.COMPLETED);
          expect(res.body.step.metadata.systemCheck).toBeDefined();
        });
    });
  });

  describe('/workflows/:id/refresh (PUT)', () => {
    it('should refresh workflow', () => {
      return request(app.getHttpServer())
        .put('/workflows/workflow-123/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.workflow).toBeDefined();
        });
    });
  });
});