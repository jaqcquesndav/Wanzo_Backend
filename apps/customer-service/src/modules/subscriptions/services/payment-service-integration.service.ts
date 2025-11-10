import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface PaymentServiceCardRequest {
  customerId: string;
  subscriptionPlanId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  customerInfo: {
    name: string;
    email: string;
    type: 'sme' | 'financial';
    country?: string;
    industry?: string;
  };
  planInfo: {
    name: string;
    type: string;
    tokensIncluded?: number;
  };
  metadata?: any;
}

export interface PaymentServiceResponse {
  success: boolean;
  transactionId: string;
  paymentIntentId: string;
  status: 'pending' | 'requires_action' | 'requires_confirmation' | 'succeeded' | 'failed';
  clientSecret?: string;
  nextAction?: any;
  message: string;
}

export interface PaymentStatusResponse {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  paymentMethod: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  providerTransactionId?: string;
  paymentDetails?: any;
}

/**
 * Service de communication avec le payment-service pour l'exécution des paiements Stripe
 * Gère la délégation des transactions de paiement par carte
 */
@Injectable()
export class PaymentServiceIntegration {
  private readonly logger = new Logger(PaymentServiceIntegration.name);
  private readonly paymentServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.paymentServiceUrl = this.configService.get<string>('PAYMENT_SERVICE_URL', 'http://localhost:3003');
  }

  /**
   * Initier un paiement par carte via le payment-service
   */
  async initiateCardPayment(request: PaymentServiceCardRequest): Promise<PaymentServiceResponse> {
    try {
      this.logger.log(`Initiation paiement carte via payment-service`, {
        customerId: request.customerId,
        amount: request.amount,
        currency: request.currency
      });

      const endpoint = `${this.paymentServiceUrl}/api/payments/card/initiate`;
      
      const response = await firstValueFrom(
        this.httpService.post(endpoint, {
          customerId: request.customerId,
          subscriptionPlanId: request.subscriptionPlanId,
          amount: request.amount,
          currency: request.currency,
          paymentMethodId: request.paymentMethodId,
          customerInfo: request.customerInfo,
          planInfo: request.planInfo,
          metadata: {
            ...request.metadata,
            source: 'customer-service',
            timestamp: new Date().toISOString()
          }
        }, {
          timeout: 30000, // 30 secondes timeout
          headers: {
            'Content-Type': 'application/json',
            'x-service-name': 'customer-service',
            'x-correlation-id': this.generateCorrelationId()
          }
        })
      );

      const result = response.data;

      this.logger.log(`Paiement carte initié avec succès`, {
        transactionId: result.transactionId,
        paymentIntentId: result.paymentIntentId,
        status: result.status
      });

      return result;

    } catch (error: any) {
      this.logger.error(`Erreur lors de l'initiation du paiement carte:`, {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        request: {
          customerId: request.customerId,
          amount: request.amount,
          currency: request.currency
        }
      });

      // Transformer l'erreur HTTP en erreur métier
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Données de paiement invalides');
      } else if (error.response?.status === 404) {
        throw new Error('Service de paiement non disponible');
      } else if (error.response?.status >= 500) {
        throw new Error('Erreur interne du service de paiement');
      }

      throw new Error(`Erreur communication payment-service: ${error.message}`);
    }
  }

  /**
   * Confirmer un paiement par carte via le payment-service
   */
  async confirmCardPayment(transactionId: string, paymentIntentId: string): Promise<PaymentServiceResponse> {
    try {
      this.logger.log(`Confirmation paiement carte via payment-service`, {
        transactionId,
        paymentIntentId
      });

      const endpoint = `${this.paymentServiceUrl}/api/payments/card/confirm`;
      
      const response = await firstValueFrom(
        this.httpService.post(endpoint, {
          transactionId,
          paymentIntentId
        }, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'x-service-name': 'customer-service',
            'x-correlation-id': this.generateCorrelationId()
          }
        })
      );

      const result = response.data;

      this.logger.log(`Paiement carte confirmé`, {
        transactionId: result.transactionId,
        status: result.status
      });

      return result;

    } catch (error: any) {
      this.logger.error(`Erreur lors de la confirmation du paiement:`, {
        error: error.message,
        transactionId,
        paymentIntentId
      });

      throw new Error(`Erreur confirmation paiement: ${error.message}`);
    }
  }

  /**
   * Vérifier le statut d'un paiement via le payment-service
   */
  async checkPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    try {
      this.logger.log(`Vérification statut paiement via payment-service`, { transactionId });

      const endpoint = `${this.paymentServiceUrl}/api/payments/status/${transactionId}`;
      
      const response = await firstValueFrom(
        this.httpService.get(endpoint, {
          timeout: 15000,
          headers: {
            'x-service-name': 'customer-service',
            'x-correlation-id': this.generateCorrelationId()
          }
        })
      );

      const result = response.data;

      this.logger.log(`Statut paiement récupéré`, {
        transactionId: result.transactionId,
        status: result.status
      });

      return result;

    } catch (error: any) {
      this.logger.error(`Erreur lors de la vérification du statut:`, {
        error: error.message,
        transactionId
      });

      if (error.response?.status === 404) {
        throw new Error('Transaction non trouvée');
      }

      throw new Error(`Erreur vérification statut: ${error.message}`);
    }
  }

  /**
   * Récupérer l'historique des paiements d'un client
   */
  async getCustomerPaymentHistory(customerId: string, limit: number = 50): Promise<PaymentStatusResponse[]> {
    try {
      this.logger.log(`Récupération historique paiements client`, { customerId, limit });

      const endpoint = `${this.paymentServiceUrl}/api/payments/customer/${customerId}/history`;
      
      const response = await firstValueFrom(
        this.httpService.get(endpoint, {
          params: { limit },
          timeout: 15000,
          headers: {
            'x-service-name': 'customer-service',
            'x-correlation-id': this.generateCorrelationId()
          }
        })
      );

      const result = response.data;

      this.logger.log(`Historique paiements récupéré`, {
        customerId,
        count: result.length
      });

      return result;

    } catch (error: any) {
      this.logger.error(`Erreur lors de la récupération de l'historique:`, {
        error: error.message,
        customerId
      });

      if (error.response?.status === 404) {
        return []; // Pas d'historique trouvé
      }

      throw new Error(`Erreur récupération historique: ${error.message}`);
    }
  }

  /**
   * Notifier le payment-service d'un webhook Stripe reçu
   */
  async forwardStripeWebhook(signature: string, payload: string): Promise<void> {
    try {
      this.logger.log(`Transfert webhook Stripe vers payment-service`);

      const endpoint = `${this.paymentServiceUrl}/api/payments/stripe/webhook`;
      
      await firstValueFrom(
        this.httpService.post(endpoint, payload, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': signature,
            'x-service-name': 'customer-service',
            'x-correlation-id': this.generateCorrelationId()
          }
        })
      );

      this.logger.log(`Webhook Stripe transféré avec succès`);

    } catch (error: any) {
      this.logger.error(`Erreur lors du transfert du webhook:`, {
        error: error.message
      });

      throw new Error(`Erreur transfert webhook: ${error.message}`);
    }
  }

  /**
   * Vérifier la santé du payment-service
   */
  async checkPaymentServiceHealth(): Promise<boolean> {
    try {
      const endpoint = `${this.paymentServiceUrl}/health`;
      
      const response = await firstValueFrom(
        this.httpService.get(endpoint, {
          timeout: 5000
        })
      );

      return response.status === 200;

    } catch (error) {
      this.logger.warn(`Payment-service non disponible:`, error);
      return false;
    }
  }

  /**
   * Utilitaires privés
   */
  private generateCorrelationId(): string {
    return `cs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}