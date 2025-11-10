import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { 
  StripeCardPaymentRequest, 
  StripeSubscriptionSetupRequest, 
  StripeSubscriptionCancelRequest,
  StripeKafkaEventBuilder,
  STRIPE_KAFKA_TOPICS
} from '../events/stripe-payment.events';

/**
 * Service Producer Kafka pour les paiements Stripe
 * Gère la communication Customer-service → Payment-service via Kafka
 */
@Injectable()
export class StripePaymentKafkaProducer {
  private readonly logger = new Logger(StripePaymentKafkaProducer.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  /**
   * Émet une demande de paiement par carte Stripe vers le payment-service
   */
  async emitCardPaymentRequest(data: {
    customerId: string;
    subscriptionPlanId: string;
    amount: number;
    currency: string;
    paymentMethodId?: string;
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
    paymentOptions: {
      savePaymentMethod?: boolean;
      returnUrl?: string;
      requiresSetupIntent?: boolean;
    };
    subscriptionContext?: {
      existingSubscriptionId?: string;
      isRenewal?: boolean;
      setupRecurring?: boolean;
      trialDays?: number;
    };
    metadata?: any;
  }): Promise<{ requestId: string }> {
    try {
      this.logger.log(`Émission demande paiement Stripe pour client ${data.customerId}`, {
        planId: data.subscriptionPlanId,
        amount: data.amount,
        currency: data.currency
      });

      const event = StripeKafkaEventBuilder.createCardPaymentRequest(data);

      await this.kafkaClient.emit(STRIPE_KAFKA_TOPICS.PAYMENT_REQUEST, {
        key: data.customerId, // Partitioning par client
        value: event,
        headers: {
          'event-type': 'stripe.payment.request',
          'source-service': 'customer-service',
          'target-service': 'payment-service',
          'correlation-id': event.requestId,
          'timestamp': event.timestamp,
        }
      });

      this.logger.log(`Demande de paiement Stripe émise: ${event.requestId}`, {
        topic: STRIPE_KAFKA_TOPICS.PAYMENT_REQUEST,
        customerId: data.customerId,
        amount: data.amount
      });

      return { requestId: event.requestId };

    } catch (error: any) {
      this.logger.error(`Erreur émission demande paiement Stripe:`, {
        error: error.message,
        customerId: data.customerId,
        planId: data.subscriptionPlanId
      });
      throw error;
    }
  }

  /**
   * Émet une demande de configuration d'abonnement récurrent Stripe
   */
  async emitSubscriptionSetupRequest(data: {
    customerId: string;
    subscriptionPlanId: string;
    paymentMethodId: string;
    customerInfo: {
      name: string;
      email: string;
      type: 'sme' | 'financial';
    };
    planInfo: {
      name: string;
      type: string;
      priceUSD: number;
      billingCycle: 'monthly' | 'quarterly' | 'annual';
      tokensIncluded?: number;
    };
    subscriptionOptions: {
      trialDays?: number;
      setupFutureUsage?: boolean;
    };
    metadata?: any;
  }): Promise<{ requestId: string }> {
    try {
      this.logger.log(`Émission setup abonnement Stripe pour client ${data.customerId}`, {
        planId: data.subscriptionPlanId,
        paymentMethodId: data.paymentMethodId,
        trialDays: data.subscriptionOptions.trialDays
      });

      const event = StripeKafkaEventBuilder.createSubscriptionSetupRequest(data);

      await this.kafkaClient.emit(STRIPE_KAFKA_TOPICS.SUBSCRIPTION_SETUP, {
        key: data.customerId,
        value: event,
        headers: {
          'event-type': 'stripe.subscription.setup',
          'source-service': 'customer-service',
          'target-service': 'payment-service',
          'correlation-id': event.requestId,
          'timestamp': event.timestamp,
        }
      });

      this.logger.log(`Setup abonnement Stripe émis: ${event.requestId}`, {
        topic: STRIPE_KAFKA_TOPICS.SUBSCRIPTION_SETUP,
        customerId: data.customerId
      });

      return { requestId: event.requestId };

    } catch (error: any) {
      this.logger.error(`Erreur émission setup abonnement Stripe:`, {
        error: error.message,
        customerId: data.customerId,
        planId: data.subscriptionPlanId
      });
      throw error;
    }
  }

  /**
   * Émet une demande d'annulation d'abonnement Stripe
   */
  async emitSubscriptionCancelRequest(data: {
    customerId: string;
    subscriptionId: string;
    stripeSubscriptionId: string;
    reason?: string;
    metadata?: any;
  }): Promise<{ requestId: string }> {
    try {
      this.logger.log(`Émission annulation abonnement Stripe pour client ${data.customerId}`, {
        subscriptionId: data.subscriptionId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        reason: data.reason
      });

      const event = StripeKafkaEventBuilder.createSubscriptionCancelRequest(data);

      await this.kafkaClient.emit(STRIPE_KAFKA_TOPICS.SUBSCRIPTION_CANCEL, {
        key: data.customerId,
        value: event,
        headers: {
          'event-type': 'stripe.subscription.cancel',
          'source-service': 'customer-service',
          'target-service': 'payment-service',
          'correlation-id': event.requestId,
          'timestamp': event.timestamp,
        }
      });

      this.logger.log(`Annulation abonnement Stripe émise: ${event.requestId}`, {
        topic: STRIPE_KAFKA_TOPICS.SUBSCRIPTION_CANCEL,
        customerId: data.customerId
      });

      return { requestId: event.requestId };

    } catch (error: any) {
      this.logger.error(`Erreur émission annulation abonnement Stripe:`, {
        error: error.message,
        customerId: data.customerId,
        subscriptionId: data.subscriptionId
      });
      throw error;
    }
  }

  /**
   * Transfère un webhook Stripe vers le payment-service
   */
  async forwardStripeWebhook(data: {
    signature: string;
    payload: string;
    headers: Record<string, string>;
    metadata?: any;
  }): Promise<void> {
    try {
      this.logger.log('Transfert webhook Stripe vers payment-service');

      const event = {
        eventType: 'stripe.webhook.forward',
        requestId: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        signature: data.signature,
        payload: data.payload,
        headers: data.headers,
        metadata: data.metadata,
        timestamp: new Date().toISOString(),
      };

      await this.kafkaClient.emit(STRIPE_KAFKA_TOPICS.WEBHOOK_FORWARD, {
        value: event,
        headers: {
          'event-type': 'stripe.webhook.forward',
          'source-service': 'customer-service',
          'target-service': 'payment-service',
          'correlation-id': event.requestId,
          'timestamp': event.timestamp,
          'stripe-signature': data.signature,
        }
      });

      this.logger.log(`Webhook Stripe transféré: ${event.requestId}`);

    } catch (error: any) {
      this.logger.error(`Erreur transfert webhook Stripe:`, error);
      throw error;
    }
  }

  /**
   * Émet un événement de notification admin pour les paiements Stripe
   */
  async emitPaymentNotificationForAdmin(data: {
    customerId: string;
    transactionId: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: 'card';
    customerInfo: {
      name: string;
      type: 'sme' | 'financial';
      email: string;
    };
    planInfo?: {
      id: string;
      name: string;
      type: string;
    };
    metadata?: any;
  }): Promise<void> {
    try {
      this.logger.log(`Émission notification admin paiement Stripe: ${data.transactionId}`);

      const notificationEvent = {
        eventType: 'payment.notification.admin',
        transactionId: data.transactionId,
        customerId: data.customerId,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        paymentMethod: data.paymentMethod,
        provider: 'stripe',
        customerInfo: data.customerInfo,
        planInfo: data.planInfo,
        metadata: data.metadata,
        timestamp: new Date().toISOString(),
      };

      await this.kafkaClient.emit('admin-service.payment.notification', {
        key: data.customerId,
        value: notificationEvent,
        headers: {
          'event-type': 'payment.notification.admin',
          'source-service': 'customer-service',
          'target-service': 'admin-service',
          'timestamp': notificationEvent.timestamp,
        }
      });

      this.logger.log('Notification admin paiement émise');

    } catch (error: any) {
      this.logger.error('Erreur émission notification admin:', error);
      // Ne pas faire échouer le processus principal pour une notification
    }
  }

  /**
   * Vérifie l'état de santé de la connexion Kafka
   */
  async checkKafkaHealth(): Promise<boolean> {
    try {
      // Test simple d'émission vers un topic de test
      await this.kafkaClient.emit('health-check', {
        service: 'customer-service-stripe-producer',
        timestamp: new Date().toISOString(),
      });
      
      return true;
    } catch (error) {
      this.logger.error('Kafka health check failed:', error);
      return false;
    }
  }
}