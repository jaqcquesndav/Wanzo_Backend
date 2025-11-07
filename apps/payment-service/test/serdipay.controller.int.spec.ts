import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// We intentionally do not import AppModule to avoid real DB connections in tests.
import { SerdiPayController } from '../src/modules/payments/controllers/serdipay.controller';
import { PaymentsService } from '../src/modules/payments/services/payments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentTransaction } from '../src/modules/payments/entities/payment-transaction.entity';
import * as request from 'supertest';

// This integration test boots the Nest app in-memory and hits HTTP routes directly.
// It stubs the SerdiPay provider by overriding its provider with a fake.
import { SerdiPayProvider } from '../src/modules/payments/providers/serdipay.provider';

class SerdiPayProviderFake {
  async initiatePayment() {
    return {
      status: 'pending',
      httpStatus: 202,
      providerMessage: 'Accepted',
      providerTransactionId: 'prov-456',
      sessionId: 'sess-456',
    };
  }
  async handleCallback() {
    return;
  }
}

describe('SerdiPayController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SerdiPayController],
      providers: [
        PaymentsService,
        { provide: SerdiPayProvider, useClass: SerdiPayProviderFake },
        {
          provide: getRepositoryToken(PaymentTransaction),
          useValue: {
            create: jest.fn((x) => x),
            save: jest.fn(async (x) => ({ id: 'uuid-1', ...x })),
            update: jest.fn(async () => ({})),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    // Silence Kafka emits
    const svc = app.get(PaymentsService);
    // @ts-ignore
    svc['kafkaClient'] = { emit: () => ({ toPromise: async () => undefined }) } as any;
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /serdipay/mobile should return 202 pending', async () => {
    await request(app.getHttpServer())
      .post('/serdipay/mobile')
      .send({
        clientPhone: '243994972450',
        amount: 400,
        currency: 'CDF',
        telecom: 'AM',
        channel: 'merchant',
      })
      .expect(201) // Controller returns default 201; service carries httpStatus in body
      .expect(({ body }) => {
        expect(body.status).toBe('pending');
        expect(body.httpStatus).toBe(202);
      });
  });

  it('POST /serdipay/callback should ack ok', async () => {
    await request(app.getHttpServer())
      .post('/serdipay/callback')
      .send({ status: 200, payment: { status: 'success', transactionId: 'prov-456' } })
      .expect(200)
      .expect(({ body }) => expect(body).toEqual({ ok: true }));
  });
});
