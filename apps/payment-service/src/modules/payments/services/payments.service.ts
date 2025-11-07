import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InitiateSerdiPayDto } from '../dto/initiate-serdipay.dto';
import { SerdiPayProvider } from '../providers/serdipay.provider';
import { SerdiPayCallbackDto } from '../dto/serdipay-callback.dto';
import { PaymentTransaction } from '../entities/payment-transaction.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly serdiPay: SerdiPayProvider,
    @InjectRepository(PaymentTransaction)
    private readonly txRepo: Repository<PaymentTransaction>,
  ) {}

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

    // Log successful payment (can be extended to emit events later)
    if (res.status === 'success') {
      this.logger.log(`Payment successful: ${tx.id} - Amount: ${dto.amount} ${dto.currency}`);
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
        this.logger.log(`Payment callback successful: ${txId} - Amount: ${payload?.payment?.amount || 0} ${payload?.payment?.currency || 'CDF'}`);
      }
    }
  }
}
