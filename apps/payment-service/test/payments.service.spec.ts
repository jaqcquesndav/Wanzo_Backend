import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from '../src/modules/payments/services/payments.service';
import { SerdiPayProvider } from '../src/modules/payments/providers/serdipay.provider';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTransaction } from '../src/modules/payments/entities/payment-transaction.entity';

// Minimal mock provider
class SerdiPayProviderMock {
  async initiatePayment() {
    return {
      status: 'pending',
      httpStatus: 202,
      providerMessage: 'Accepted',
      providerTransactionId: 'prov-123',
      sessionId: 'sess-123',
    };
  }
  async handleCallback() {
    return;
  }
}

describe('PaymentsService', () => {
  let service: PaymentsService;
  let repo: Repository<PaymentTransaction>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: SerdiPayProvider, useClass: SerdiPayProviderMock },
        {
          provide: getRepositoryToken(PaymentTransaction),
          useValue: {
            create: jest.fn((x) => x),
            save: jest.fn(async (x) => ({ id: 'uuid-1', ...x })),
            update: jest.fn(async () => ({})),
          },
        },
        // Mock Kafka client inside PaymentsService by monkey-patching after instantiation if needed
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    repo = module.get(getRepositoryToken(PaymentTransaction));

    // Silence Kafka emit (created in constructor)
    // @ts-ignore
    service['kafkaClient'] = { emit: () => ({ toPromise: async () => undefined }) } as any;
  });

  it('should initiate SerdiPay mobile and persist pending tx', async () => {
    const res = await service.initiateSerdiPayMobile({
      clientPhone: '243994972450',
      amount: 400,
      currency: 'CDF',
      telecom: 'AM' as any,
      channel: 'merchant',
      clientReference: 'order-1',
    });

    expect(res.status).toBe('pending');
    expect(res.httpStatus).toBe(202);
    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
  });

  it('should update tx and emit on callback success', async () => {
    const emitSpy = jest.fn(() => ({ toPromise: async () => undefined }));
    // @ts-ignore
    service['kafkaClient'] = { emit: emitSpy } as any;

    await service.handleSerdiPayCallback({
      status: 200,
      payment: {
        status: 'success',
        transactionId: 'prov-123',
        sessionId: 'sess-123',
        amount: 400,
        currency: 'CDF',
      },
    } as any);

    expect(emitSpy).toHaveBeenCalled();
  });
});
