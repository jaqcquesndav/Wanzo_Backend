export interface PaymentRequest {
  amount: number;
  currency: string;
  clientPhone: string;
  telecom: string; // AM | OM | MP | AF
  channel: 'merchant' | 'client';
  clientReference?: string;
}

export interface PaymentResponse {
  status: 'pending' | 'success' | 'failed';
  httpStatus: number;
  providerMessage?: string;
  providerTransactionId?: string;
  sessionId?: string;
}

export interface PaymentProvider {
  initiatePayment(req: PaymentRequest): Promise<PaymentResponse>;
  handleCallback(payload: any): Promise<void>;
}
