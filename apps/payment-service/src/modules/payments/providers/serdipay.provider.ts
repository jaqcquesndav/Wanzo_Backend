import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PaymentProvider, PaymentRequest, PaymentResponse } from './payment-provider.interface';

@Injectable()
export class SerdiPayProvider implements PaymentProvider {
  private readonly logger = new Logger(SerdiPayProvider.name);
  private token: string | null = null;
  private tokenExpiry = 0;

  constructor(private readonly http: HttpService, private readonly config: ConfigService) {}

  private get baseUrl() {
    return this.config.get<string>('SERDIPAY_BASE_URL', 'https://serdipay.com/api/public-api/v1');
  }

  private async getToken(): Promise<string> {
    const now = Date.now();
    if (this.token && now < this.tokenExpiry) {
      return this.token;
    }

    const email = this.config.get<string>('SERDIPAY_EMAIL');
    const password = this.config.get<string>('SERDIPAY_PASSWORD');
    if (!email || !password) {
      throw new Error('SerdiPay credentials missing (SERDIPAY_EMAIL, SERDIPAY_PASSWORD)');
    }

    const url = `${this.baseUrl}/merchant/get-token`;
    const payload = { email, password } as any;

    const resp = await firstValueFrom(this.http.post(url, payload, { headers: { 'Content-Type': 'application/json' } }));
    const token = (resp.data?.access_token || resp.data?.token || '').toString();
    if (!token) throw new Error('SerdiPay token response invalid');

    this.token = token;
    this.tokenExpiry = now + 110 * 1000; // cache ~110s (< 2 min window)
    return token;
  }

  async initiatePayment(req: PaymentRequest): Promise<PaymentResponse> {
    const token = await this.getToken();

    const endpoint = req.channel === 'client' ? 'payment-client' : 'payment-merchant';
    const url = `${this.baseUrl}/merchant/${endpoint}`;

    const api_id = this.config.get<string>('SERDIPAY_API_ID');
    const api_password = this.config.get<string>('SERDIPAY_API_PASSWORD');
    const merchantCode = this.config.get<string>('SERDIPAY_MERCHANT_CODE');
    const merchant_pin = this.config.get<string>('SERDIPAY_MERCHANT_PIN');

    if (!api_id || !api_password || !merchantCode || !merchant_pin) {
      throw new Error('SerdiPay API credentials missing (SERDIPAY_API_ID, SERDIPAY_API_PASSWORD, SERDIPAY_MERCHANT_CODE, SERDIPAY_MERCHANT_PIN)');
    }

    const body = {
      api_id,
      api_password,
      merchantCode,
      merchant_pin,
      clientPhone: req.clientPhone,
      amount: req.amount,
      currency: req.currency,
      telecom: req.telecom,
    } as any;

    if (req.clientReference) {
      body.clientReference = req.clientReference;
    }

    try {
      const resp = await firstValueFrom(
        this.http.post(url, body, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          validateStatus: () => true, // map statuses ourselves
        })
      );

      const statusCode: number = resp.status;
      if (statusCode === 200) {
        return {
          status: 'success',
          httpStatus: 200,
          providerMessage: resp.data?.message,
          providerTransactionId: resp.data?.payment?.transactionId,
          sessionId: resp.data?.payment?.sessionId,
        };
      }

      if (statusCode === 102) {
        return {
          status: 'pending',
          httpStatus: 202,
          providerMessage: 'Transaction in process (callback will be sent)',
          providerTransactionId: resp.data?.payment?.transactionId,
          sessionId: resp.data?.payment?.sessionId,
        };
      }

      // Map common errors
      return {
        status: 'failed',
        httpStatus: this.mapErrorStatus(statusCode),
        providerMessage: resp.data?.message || 'Payment failed',
      };
    } catch (e: any) {
      this.logger.error(`SerdiPay error: ${e?.message || e}`);
      return { status: 'failed', httpStatus: 502, providerMessage: 'Upstream error' };
    }
  }

  async handleCallback(payload: any): Promise<void> {
    const status = payload?.payment?.status || 'unknown';
    const transactionId = payload?.payment?.transactionId;
    const sessionId = payload?.payment?.sessionId;
    this.logger.log(`SerdiPay callback: status=${status} tx=${transactionId} session=${sessionId}`);
    // TODO: persist/update transaction record, publish domain events, etc.
  }

  private mapErrorStatus(code: number): number {
    switch (code) {
      case 400:
        return 400;
      case 401:
        return 401;
      case 402:
        return 402;
      case 403:
        return 403;
      case 409:
        return 409;
      case 429:
        return 429;
      default:
        return 502;
    }
  }
}
