import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { InstitutionType, LicenseType, RegulatoryStatus } from '../src/modules/institution/entities/institution.entity';
import { UserRole } from '../src/modules/institution/entities/institution-user.entity';

describe('InstitutionController (e2e)', () => {
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

  describe('/institution/profile (POST)', () => {
    it('should create an institution profile', () => {
      return request(app.getHttpServer())
        .post('/institution/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Bank',
          type: InstitutionType.BANK,
          licenseNumber: '123456789',
          licenseType: LicenseType.NATIONAL,
          address: '123 Test St',
          phone: '+1234567890',
          email: 'test@bank.com',
          website: 'https://testbank.com',
          legalRepresentative: 'John Doe',
          taxId: 'TAX123',
          regulatoryStatus: RegulatoryStatus.COMPLIANT,
          documents: [
            {
              name: 'License',
              type: 'license',
              url: 'https://example.com/license.pdf',
            },
          ],
        })
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.institution).toBeDefined();
          expect(res.body.institution.name).toBe('Test Bank');
        });
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/institution/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)
        .expect(res => {
          expect(res.body.message).toBe('Validation failed');
          expect(res.body.errors).toBeDefined();
        });
    });
  });

  describe('/institution/users (POST)', () => {
    it('should create a new institution user', () => {
      return request(app.getHttpServer())
        .post('/institution/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          role: UserRole.ANALYST,
          permissions: [
            {
              application: 'portfolios',
              access: 'read',
            },
          ],
        })
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.user).toBeDefined();
          expect(res.body.user.name).toBe('John Doe');
        });
    });
  });

  describe('/institution/profile (GET)', () => {
    it('should return institution profile', () => {
      return request(app.getHttpServer())
        .get('/institution/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.institution).toBeDefined();
        });
    });
  });

  describe('/institution/users (GET)', () => {
    it('should return paginated users', () => {
      return request(app.getHttpServer())
        .get('/institution/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.users)).toBe(true);
          expect(typeof res.body.total).toBe('number');
        });
    });

    it('should handle pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/institution/users?page=2&per_page=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.page).toBe(2);
          expect(res.body.perPage).toBe(5);
        });
    });
  });

  describe('/institution/users/:id (PUT)', () => {
    it('should update a user', () => {
      return request(app.getHttpServer())
        .put('/institution/users/user-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          role: UserRole.MANAGER,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.user.name).toBe('Updated Name');
        });
    });
  });

  describe('/institution/users/:id (DELETE)', () => {
    it('should deactivate a user', () => {
      return request(app.getHttpServer())
        .delete('/institution/users/user-123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('User deactivated successfully');
        });
    });
  });

  describe('/institution/documents (POST)', () => {
    it('should add a document', () => {
      return request(app.getHttpServer())
        .post('/institution/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Document',
          type: 'license',
          cloudinaryUrl: 'https://example.com/doc.pdf',
          description: 'Test document',
        })
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.document).toBeDefined();
          expect(res.body.document.name).toBe('New Document');
        });
    });
  });

  describe('/institution/documents (GET)', () => {
    it('should return institution documents', () => {
      return request(app.getHttpServer())
        .get('/institution/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.documents)).toBe(true);
        });
    });
  });
});