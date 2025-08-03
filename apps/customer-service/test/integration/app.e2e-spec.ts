import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

describe('Customer Service Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  // Token de test simulé pour Auth0
  const mockAuth0Token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx0ZXN0MTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTY5NDEwMDAwMCwiZXhwIjoxNjk0MjAwMDAwfQ';

  beforeAll(async () => {
    // Créer une application de test avec une configuration de test
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('TEST_DB_HOST', 'localhost'),
            port: configService.get('TEST_DB_PORT', 5432),
            username: configService.get('TEST_DB_USERNAME', 'postgres'),
            password: configService.get('TEST_DB_PASSWORD', 'postgres'),
            database: configService.get('TEST_DB_DATABASE', 'customer_service_test'),
            entities: [__dirname + '/../../src/**/*.entity{.ts,.js}'],
            synchronize: true, // Seulement pour les tests
            dropSchema: true, // Reset DB pour chaque test
          }),
          inject: [ConfigService],
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body.status).toBe('ok');
        });
    });
  });

  describe('User Management', () => {
    it('/land/api/v1/users/me (GET) - should require authentication', () => {
      return request(app.getHttpServer())
        .get('/land/api/v1/users/me')
        .expect(401);
    });

    it('/land/api/v1/users/me (GET) - should return user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/land/api/v1/users/me')
        .set('Authorization', mockAuth0Token)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body.success).toBe(true);
          expect(res.body).toHaveProperty('data');
        });
    });

    it('/land/api/v1/users/sync (POST) - should sync user from Auth0', () => {
      const syncData = {
        auth0Id: 'auth0|test123',
        email: 'test@example.com',
        name: 'Test User'
      };

      return request(app.getHttpServer())
        .post('/land/api/v1/users/sync')
        .set('Authorization', mockAuth0Token)
        .send(syncData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.email).toBe(syncData.email);
        });
    });
  });

  describe('Financial Institutions', () => {
    it('/land/api/v1/financial-institutions (POST) - should create financial institution', () => {
      const institutionData = {
        name: 'Test Bank',
        type: 'bank',
        category: 'commercial',
        address: {
          street: '123 Test Street',
          city: 'Kinshasa',
          province: 'Kinshasa',
          country: 'RDC'
        },
        contacts: {
          email: 'contact@testbank.cd',
          phone: '+243 123 456 789'
        }
      };

      return request(app.getHttpServer())
        .post('/land/api/v1/financial-institutions')
        .set('Authorization', mockAuth0Token)
        .send(institutionData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.name).toBe(institutionData.name);
        });
    });

    it('/land/api/v1/financial-institutions (GET) - should list financial institutions', () => {
      return request(app.getHttpServer())
        .get('/land/api/v1/financial-institutions')
        .set('Authorization', mockAuth0Token)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeInstanceOf(Array);
        });
    });
  });

  describe('Subscription Plans', () => {
    it('/land/api/v1/subscription/plans (GET) - should return subscription plans', () => {
      return request(app.getHttpServer())
        .get('/land/api/v1/subscription/plans')
        .set('Authorization', mockAuth0Token)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Array);
        });
    });
  });

  describe('Token Management', () => {
    it('/land/api/v1/tokens/balance (GET) - should return user token balance', () => {
      return request(app.getHttpServer())
        .get('/land/api/v1/tokens/balance')
        .set('Authorization', mockAuth0Token)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('balance');
          expect(res.body).toHaveProperty('totalPurchased');
        });
    });

    it('/land/api/v1/tokens/transactions (GET) - should return token transactions', () => {
      return request(app.getHttpServer())
        .get('/land/api/v1/tokens/transactions')
        .set('Authorization', mockAuth0Token)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('transactions');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(res.body.transactions).toBeInstanceOf(Array);
        });
    });
  });

  describe('Payments', () => {
    it('/land/api/v1/payments (GET) - should return user payments', () => {
      return request(app.getHttpServer())
        .get('/land/api/v1/payments')
        .set('Authorization', mockAuth0Token)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('payments');
          expect(res.body).toHaveProperty('total');
          expect(res.body.payments).toBeInstanceOf(Array);
        });
    });
  });

  describe('AI Services', () => {
    it('/land/api/v1/ai/chat (POST) - should process chat request', () => {
      const chatData = {
        message: 'Hello, can you help me?',
        context: 'customer support'
      };

      return request(app.getHttpServer())
        .post('/land/api/v1/ai/chat')
        .set('Authorization', mockAuth0Token)
        .send(chatData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('response');
          expect(res.body.data).toHaveProperty('conversationId');
        });
    });

    it('/land/api/v1/ai/transcribe (POST) - should transcribe audio', () => {
      const transcribeData = {
        audioUrl: 'https://example.com/audio.mp3',
        language: 'fr'
      };

      return request(app.getHttpServer())
        .post('/land/api/v1/ai/transcribe')
        .set('Authorization', mockAuth0Token)
        .send(transcribeData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('transcription');
          expect(res.body.data).toHaveProperty('confidence');
        });
    });
  });
});
