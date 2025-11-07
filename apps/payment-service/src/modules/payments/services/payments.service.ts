import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka, ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { InitiateSerdiPayDto } from '../dto/initiate-serdipay.dto';
import { SerdiPayProvider } from '../providers/serdipay.provider';
import { SerdiPayCallbackDto } from '../dto/serdipay-callback.dto';
import { PaymentTransaction } from '../entities/payment-transaction.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private kafkaClient: ClientProxy;

  constructor(
    private readonly serdiPay: SerdiPayProvider,
    @InjectRepository(PaymentTransaction)
    private readonly txRepo: Repository<PaymentTransaction>,
  ) {
    this.kafkaClient = ClientProxyFactory.create({
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: process.env.KAFKA_CLIENT_ID || 'payment-service',
          brokers: (process.env.KAFKA_BROKERS || 'kafka:29092').split(','),
        },
        consumer: { groupId: process.env.KAFKA_GROUP_ID || 'payment-service-group' },
      },
    });
  }

  async initiateSerdiPayMobile(dto: InitiateSerdiPayDto) {
    const res = await this.serdiPay.initiatePayment({
      amount: dto.amount,
      currency: dto.currency,
      clientPhone: dto.clientPhone,
      telecom: dto.telecom,
      channel: dto.channel ?? 'merchant',
      clientReference: dto.clientReference,
    });

    // Persist
    const tx = this.txRepo.create({
      amount: String(dto.amount),
      currency: dto.currency,
      clientPhone: dto.clientPhone,
      telecom: dto.telecom,
      clientReference: dto.clientReference,
      status: res.status,
      provider: 'SerdiPay',
      providerTransactionId: res.providerTransactionId,
      sessionId: res.sessionId,
      meta: { request: dto },
    });
    await this.txRepo.save(tx);

    // Publish domain event stub when success
    if (res.status === 'success') {
      try {
        await this.kafkaClient.emit('finance.payment.received', {
          paymentId: tx.id,
          invoiceId: null,
          customerId: null,
          amount: Number(dto.amount),
          currency: dto.currency,
          paymentDate: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        }).toPromise();
      } catch (e: any) {
        this.logger.warn(`Kafka emit failed: ${e?.message || e}`);
      }
    }

    return {
      status: res.status,
      httpStatus: res.httpStatus,
      message: res.providerMessage,
      transactionId: res.providerTransactionId,
      sessionId: res.sessionId,
      provider: 'SerdiPay',
    };
  }

  async handleSerdiPayCallback(payload: SerdiPayCallbackDto) {
    await this.serdiPay.handleCallback(payload);
    // Update if we can match
    const txId = payload?.payment?.transactionId;
    if (txId) {
      const status = (payload?.payment?.status || '').toLowerCase();
      const normalized = ['success', 'pending', 'failed'].includes(status) ? (status as any) : 'failed';
      await this.txRepo.update(
        { providerTransactionId: txId },
        { status: normalized as any, meta: payload as any },
      );

      if (normalized === 'success') {
        try {
          await this.kafkaClient.emit('finance.payment.received', {
            paymentId: txId,
            invoiceId: null,
            customerId: null,
            amount: Number(payload?.payment?.amount || 0),
            currency: payload?.payment?.currency || 'CDF',
            paymentDate: new Date().toISOString(),
            timestamp: new Date().toISOString(),
          }).toPromise();
        } catch (e: any) {
          this.logger.warn(`Kafka emit failed (callback): ${e?.message || e}`);
        }
      }
    }
  }
}
