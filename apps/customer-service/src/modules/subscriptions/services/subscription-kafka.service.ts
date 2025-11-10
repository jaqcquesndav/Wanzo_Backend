import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { StripePaymentKafkaProducer } from './stripe-payment-kafka-producer.service';

export interface KafkaEvent {
  eventType: string;
  customerId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PaymentKafkaEvent extends KafkaEvent {
  amount: number;
  currency: string;
  method: 'stripe' | 'mobile';
  transactionId?: string;
  paymentIntentId?: string;
}

export interface SubscriptionKafkaEvent extends KafkaEvent {
  subscriptionId: string;
  planId: string;
  status: string;
}

/**
 * Service Kafka unifié pour tous les événements du module subscription
 * Remplace: StripePaymentKafkaProducer + SubscriptionPaymentKafkaPublisher
 */
@Injectable()
export class SubscriptionKafkaService {
  private readonly logger = new Logger(SubscriptionKafkaService.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly stripeProducer: StripePaymentKafkaProducer, // Délégation pour Stripe
  ) {}

  /**
   * Émet un événement de paiement (unifié Stripe + Mobile)
   */
  async emitPaymentEvent(event: PaymentKafkaEvent): Promise<void> {
    try {
      if (event.method === 'stripe') {
        // Déléguer à StripePaymentKafkaProducer pour les événements spécifiques
        await this.delegateStripeEvent(event);
      } else {
        // Traiter les paiements mobile directement
        const topic = this.getPaymentTopic(event.eventType);
        
        await this.kafkaClient.emit(topic, {
          pattern: topic,
          data: {
            customerId: event.customerId,
            amount: event.amount,
            currency: event.currency,
            method: event.method,
            transactionId: event.transactionId,
            timestamp: event.timestamp.toISOString(),
            metadata: event.metadata
          }
        });
      }

      this.logger.log(`Payment event emitted: ${event.eventType} for ${event.customerId}`);
    } catch (error: any) {
      this.logger.error(`Failed to emit payment event: ${event.eventType}`, error);
      throw error;
    }
  }

  /**
   * Émet un événement d'abonnement
   */
  async emitSubscriptionEvent(event: SubscriptionKafkaEvent): Promise<void> {
    try {
      const topic = this.getSubscriptionTopic(event.eventType);
      
      await this.kafkaClient.emit(topic, {
        pattern: topic,
        data: {
          subscriptionId: event.subscriptionId,
          customerId: event.customerId,
          planId: event.planId,
          status: event.status,
          timestamp: event.timestamp.toISOString(),
          metadata: event.metadata
        }
      });

      this.logger.log(`Subscription event emitted: ${event.eventType} for ${event.customerId}`);
    } catch (error: any) {
      this.logger.error(`Failed to emit subscription event: ${event.eventType}`, error);
      throw error;
    }
  }

  /**
   * Délègue les événements Stripe au producteur spécialisé
   */
  private async delegateStripeEvent(event: PaymentKafkaEvent): Promise<void> {
    switch (event.eventType) {
      case 'stripe.payment.request':
        // Construire la requête Stripe appropriée
        await this.stripeProducer.emitCardPaymentRequest({
          customerId: event.customerId,
          subscriptionPlanId: event.metadata?.subscriptionPlanId || 'default',
          amount: event.amount,
          currency: event.currency,
          paymentMethodId: event.metadata?.paymentMethodId,
          customerInfo: {
            name: event.metadata?.customerName || 'Unknown',
            email: event.metadata?.customerEmail || 'unknown@example.com',
            type: event.metadata?.customerType || 'sme',
            country: event.metadata?.country,
            industry: event.metadata?.industry
          },
          planInfo: {
            name: event.metadata?.planName || 'Default Plan',
            type: event.metadata?.planType || 'subscription',
            tokensIncluded: event.metadata?.tokensIncluded
          },
          paymentOptions: {
            savePaymentMethod: event.metadata?.savePaymentMethod || false,
            returnUrl: event.metadata?.returnUrl,
            requiresSetupIntent: event.metadata?.requiresSetupIntent || false
          },
          subscriptionContext: event.metadata?.subscriptionContext,
          metadata: event.metadata
        });
        break;
      
      case 'stripe.subscription.setup':
        await this.stripeProducer.emitSubscriptionSetupRequest({
          customerId: event.customerId,
          subscriptionPlanId: event.metadata?.subscriptionPlanId || 'default',
          paymentMethodId: event.metadata?.paymentMethodId || '',
          customerInfo: {
            name: event.metadata?.customerName || 'Unknown',
            email: event.metadata?.customerEmail || 'unknown@example.com',
            type: event.metadata?.customerType || 'sme'
          },
          planInfo: {
            name: event.metadata?.planName || 'Default Plan',
            type: event.metadata?.planType || 'subscription',
            priceUSD: event.metadata?.priceUSD || 0,
            billingCycle: event.metadata?.billingCycle || 'monthly',
            tokensIncluded: event.metadata?.tokensIncluded
          },
          subscriptionOptions: {
            trialDays: event.metadata?.trialDays,
            setupFutureUsage: event.metadata?.setupFutureUsage || false
          },
          metadata: event.metadata
        });
        break;
      
      default:
        this.logger.warn(`Unhandled Stripe event type: ${event.eventType}`);
    }
  }

  /**
   * Détermine le topic Kafka selon le type d'événement de paiement
   */
  private getPaymentTopic(eventType: string): string {
    const topicMap: Record<string, string> = {
      'payment.initiated': 'payment-service.payment.initiated',
      'payment.completed': 'customer-service.payment.completed',
      'payment.failed': 'customer-service.payment.failed',
      'mobile.payment.request': 'payment-service.mobile.payment.request',
    };

    return topicMap[eventType] || 'payment-service.general.event';
  }

  /**
   * Détermine le topic Kafka selon le type d'événement d'abonnement
   */
  private getSubscriptionTopic(eventType: string): string {
    const topicMap: Record<string, string> = {
      'subscription.created': 'admin-service.subscription.created',
      'subscription.updated': 'admin-service.subscription.updated',
      'subscription.cancelled': 'admin-service.subscription.cancelled',
      'subscription.renewed': 'admin-service.subscription.renewed',
    };

    return topicMap[eventType] || 'admin-service.subscription.general';
  }
}