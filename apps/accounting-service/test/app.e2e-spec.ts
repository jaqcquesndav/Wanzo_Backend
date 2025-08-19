import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { JournalType, JournalStatus } from '../src/modules/journals/entities/journal.entity';
import { AccountType } from '../src/modules/accounts/entities/account.entity';

describe('AccountingController (e2e)', () => {
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

  describe('/accounts (POST)', () => {
    it('should create a new account', () => {
      return request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: '411000',
          name: 'Clients',
          type: AccountType.ASSET,
          isAnalytic: false,
        })
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.account).toBeDefined();
          expect(res.body.account.code).toBe('411000');
        });
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)
        .expect(res => {
          expect(res.body.message).toBe('Validation failed');
          expect(res.body.errors).toBeDefined();
        });
    });
  });

  describe('/journals (POST)', () => {
    it('should create a new journal entry', () => {
      return request(app.getHttpServer())
        .post('/journals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fiscalYear: '2024',
          type: JournalType.GENERAL,
          reference: 'JRN-2024-001',
          date: new Date(),
          description: 'Test journal entry',
          lines: [
            {
              accountId: 'account-1',
              debit: 1000,
              credit: 0,
              description: 'Debit line',
            },
            {
              accountId: 'account-2',
              debit: 0,
              credit: 1000,
              description: 'Credit line',
            },
          ],
        })
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.journal).toBeDefined();
          expect(res.body.journal.status).toBe(JournalStatus.DRAFT);
        });
    });
  });

  describe('/reports/financial-statements (GET)', () => {
    it('should generate balance sheet', () => {
      return request(app.getHttpServer())
        .get('/reports/financial-statements/balance-sheet')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          fiscal_year: '2024',
          as_of_date: new Date().toISOString(),
        })
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.balanceSheet).toBeDefined();
        });
    });

    it('should generate income statement', () => {
      return request(app.getHttpServer())
        .get('/reports/financial-statements/income-statement')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          fiscal_year: '2024',
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
        })
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.incomeStatement).toBeDefined();
        });
    });
  });

  describe('/chat (POST)', () => {
    it('should create a new chat session', () => {
      return request(app.getHttpServer())
        .post('/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Accounting Help',
          isActive: true,
        })
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.chat).toBeDefined();
          expect(res.body.chat.title).toBe('Accounting Help');
        });
    });

    it('should add message to chat', () => {
      return request(app.getHttpServer())
        .post('/chat/chat-123/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'user',
          content: 'How do I create a journal entry?',
        })
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBeDefined();
          expect(res.body.message.role).toBe('user');
        });
    });
  });
});
