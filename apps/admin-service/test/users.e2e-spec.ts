import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { UserRole } from '../src/modules/users/dtos/user.dto';

describe('UserController (e2e)', () => {
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

  describe('/users (POST)', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
          role: UserRole.USER,
          permissions: [],
          companyId: 'company-123',
        })
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe('test@example.com');
        });
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)
        .expect(res => {
          expect(res.body.message).toBe('Validation failed');
          expect(res.body.errors).toBeDefined();
        });
    });
  });

  describe('/users (GET)', () => {
    it('should return paginated users', () => {
      return request(app.getHttpServer())
        .get('/users')
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
        .get('/users?page=2&per_page=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.page).toBe(2);
          expect(res.body.perPage).toBe(5);
        });
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return a user by ID', () => {
      const userId = 'test-user-id';
      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.user).toBeDefined();
          expect(res.body.user.id).toBe(userId);
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/users/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/users/:id (PUT)', () => {
    it('should update a user', () => {
      const userId = 'test-user-id';
      return request(app.getHttpServer())
        .put(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          role: UserRole.MANAGER,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.user.name).toBe('Updated Name');
          expect(res.body.user.role).toBe(UserRole.MANAGER);
        });
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('should delete a user', () => {
      const userId = 'test-user-id';
      return request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('User deleted successfully');
        });
    });
  });
});