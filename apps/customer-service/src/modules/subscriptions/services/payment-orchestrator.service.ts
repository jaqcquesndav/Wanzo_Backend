import { Injectable, Logger } from '@nestjs/common';
import { StripePaymentService } from './stripe-payment.service';
import { SubscriptionMobilePaymentService } from './subscription-payment.service';
import { StripePaymentKafkaProducer } from './stripe-payment-kafka-producer.service';

export interface PaymentRequest {
  customerId: string;
  planId: string;
  amount: number;
  currency: string;
  method: 'stripe' | 'mobile';
  // Stripe specific
  paymentMethodId?: string;
  saveCard?: boolean;
  returnUrl?: string;
  // Mobile specific
  clientPhone?: string;
  telecom?: 'AM' | 'OM' | 'MP' | 'AF';
  channel?: 'merchant' | 'client';
  clientReference?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  paymentIntentId?: string;
  transactionId: string;
  providerTransactionId?: string;
  status: string;
  message: string;
  clientSecret?: string;
  requiresAction?: boolean;
  nextAction?: any;
}

/**
 * Orchestrateur centralisé pour tous les types de paiements
 * Élimine la duplication entre Stripe et Mobile payments
 */
@Injectable()
export class PaymentOrchestratorService {
  private readonly logger = new Logger(PaymentOrchestratorService.name);

  constructor(
    private readonly stripePayment: StripePaymentService,
    private readonly mobilePayment: SubscriptionMobilePaymentService,
    private readonly stripeKafka: StripePaymentKafkaProducer,
  ) {}

  /**
   * Point d'entrée unique pour tous les paiements
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    this.logger.log(`Processing ${request.method} payment for customer ${request.customerId}`);

    try {
      switch (request.method) {
        case 'stripe':
          return await this.processStripePayment(request);
        case 'mobile':
          return await this.processMobilePayment(request);
        default:
          throw new Error(`Unsupported payment method: ${request.method}`);
      }
    } catch (error: any) {
      this.logger.error(`Payment processing failed:`, error);
      return {
        success: false,
        transactionId: `error_${Date.now()}`,
        status: 'failed',
        message: error.message || 'Payment processing error'
      };
    }
  }

  /**
   * Traite les paiements Stripe
   */
  private async processStripePayment(request: PaymentRequest): Promise<PaymentResult> {
    if (!request.paymentMethodId) {
      throw new Error('paymentMethodId required for Stripe payments');
    }

    const stripeRequest = {
      customerId: request.customerId,
      planId: request.planId,
      amount: request.amount,
      currency: request.currency,
      paymentMethodId: request.paymentMethodId,
      saveCard: request.saveCard || false,
      returnUrl: request.returnUrl
    };

    const stripeResult = await this.stripePayment.processCardPayment(stripeRequest);
    
    // Adapter CardPaymentResult vers PaymentResult
    return {
      success: stripeResult.success,
      transactionId: stripeResult.paymentId || stripeResult.paymentIntentId,
      status: stripeResult.status,
      message: stripeResult.message,
      providerTransactionId: stripeResult.paymentIntentId,
      clientSecret: stripeResult.clientSecret,
      requiresAction: stripeResult.requiresAction,
      nextAction: stripeResult.nextAction
    };
  }

  /**
   * Traite les paiements mobile money
   */
  private async processMobilePayment(request: PaymentRequest): Promise<PaymentResult> {
    if (!request.clientPhone || !request.telecom) {
      throw new Error('clientPhone and telecom required for mobile payments');
    }

    // Pour maintenir la compatibilité, on utilise Auth0ID si disponible
    // Sinon on délègue directement par customerId
    const mobileRequest = {
      planId: request.planId,
      clientPhone: request.clientPhone,
      telecom: request.telecom,
      channel: request.channel || 'merchant',
      clientReference: request.clientReference
    };

    const response = await this.mobilePayment.initiateSubscriptionPaymentByCustomerId(
      request.customerId, 
      mobileRequest
    );

    return {
      success: response.status === 'success',
      transactionId: response.transactionId,
      providerTransactionId: response.providerTransactionId,
      status: response.status,
      message: response.message || 'Paiement mobile initié'
    };
  }

  /**
   * Traite les webhooks de manière unifiée
   */
  async handleWebhook(provider: 'stripe' | 'serdipay', signature: string, payload: string): Promise<void> {
    switch (provider) {
      case 'stripe':
        await this.stripePayment.handleWebhook(signature, payload);
        break;
      case 'serdipay':
        // Les webhooks SerdiPay sont gérés par le payment-service
        this.logger.log('SerdiPay webhook delegated to payment-service');
        break;
      default:
        throw new Error(`Unsupported webhook provider: ${provider}`);
    }
  }
}