import { Injectable, Logger } from '@nestjs/common';
import { PaymentTransaction } from '../entities/payment-transaction.entity';

/**
 * Service pour émettre des événements Kafka de paiement de subscription
 * Communication inter-services via Kafka (customer-service ↔ payment-service)
 */
@Injectable()
export class SubscriptionPaymentEventsService {
  private readonly logger = new Logger(SubscriptionPaymentEventsService.name);

  constructor() {}

  /**
   * Émet un événement Kafka de paiement de subscription initié
   * Utilisé pour notifier customer-service du début du processus
   */
  async emitSubscriptionPaymentInitiated(transaction: PaymentTransaction): Promise<void> {
    const eventData = {
      eventType: 'subscription.payment.initiated',
      transactionId: transaction.id,
      providerTransactionId: transaction.providerTransactionId,
      customerId: transaction.customerId,
      planId: transaction.planId,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      telecom: transaction.metadata?.telecom,
      timestamp: new Date().toISOString(),
      metadata: {
        paymentType: transaction.paymentType,
        channel: transaction.metadata?.channel,
        clientReference: transaction.metadata?.clientReference
      }
    };

    // TODO: Émettre vers le topic Kafka 'subscription.payment.events'
    this.logger.log(`[KAFKA] Emitting subscription.payment.initiated: ${JSON.stringify(eventData)}`);
    
    // Placeholder pour l'intégration Kafka réelle
    // await this.kafkaProducer.emit('subscription.payment.events', eventData);
  }

  /**
   * Émet un événement Kafka de paiement de subscription réussi
   * Notifie customer-service pour activer l'abonnement
   */
  async emitSubscriptionPaymentSuccess(transaction: PaymentTransaction): Promise<void> {
    const eventData = {
      eventType: 'subscription.payment.success',
      transactionId: transaction.id,
      providerTransactionId: transaction.providerTransactionId,
      customerId: transaction.customerId,
      planId: transaction.planId,
      subscriptionId: transaction.subscriptionId,
      amount: transaction.amount,
      currency: transaction.currency,
      completedAt: transaction.completedAt,
      timestamp: new Date().toISOString(),
      billingPeriod: {
        start: transaction.metadata?.billingCycleStart,
        end: transaction.metadata?.billingCycleEnd
      },
      metadata: {
        paymentType: transaction.paymentType,
        telecom: transaction.metadata?.telecom,
        isRenewal: transaction.metadata?.isRenewal || false
      }
    };

    // TODO: Émettre vers le topic Kafka 'subscription.payment.events'
    this.logger.log(`[KAFKA] Emitting subscription.payment.success: ${JSON.stringify(eventData)}`);
    
    // Placeholder pour l'intégration Kafka réelle
    // await this.kafkaProducer.emit('subscription.payment.events', eventData);
  }

  /**
   * Émet un événement Kafka de paiement de subscription échoué
   * Notifie customer-service de l'échec pour gestion appropriée
   */
  async emitSubscriptionPaymentFailed(transaction: PaymentTransaction, error: string): Promise<void> {
    const eventData = {
      eventType: 'subscription.payment.failed',
      transactionId: transaction.id,
      providerTransactionId: transaction.providerTransactionId,
      customerId: transaction.customerId,
      planId: transaction.planId,
      amount: transaction.amount,
      currency: transaction.currency,
      error: error,
      failedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      metadata: {
        paymentType: transaction.paymentType,
        telecom: transaction.metadata?.telecom,
        retryCount: transaction.metadata?.retryCount || 0
      }
    };

    // TODO: Émettre vers le topic Kafka 'subscription.payment.events'
    this.logger.log(`[KAFKA] Emitting subscription.payment.failed: ${JSON.stringify(eventData)}`);
    
    // Placeholder pour l'intégration Kafka réelle
    // await this.kafkaProducer.emit('subscription.payment.events', eventData);
  }

  /**
   * Émet un événement Kafka pour une transaction en attente
   * Utilisé pour les paiements qui nécessitent une action utilisateur
   */
  async emitSubscriptionPaymentPending(transaction: PaymentTransaction, instructions?: string): Promise<void> {
    const eventData = {
      eventType: 'subscription.payment.pending',
      transactionId: transaction.id,
      providerTransactionId: transaction.providerTransactionId,
      customerId: transaction.customerId,
      planId: transaction.planId,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      instructions: instructions,
      timestamp: new Date().toISOString(),
      metadata: {
        paymentType: transaction.paymentType,
        telecom: transaction.metadata?.telecom,
        sessionId: transaction.metadata?.sessionId
      }
    };

    // TODO: Émettre vers le topic Kafka 'subscription.payment.events'
    this.logger.log(`[KAFKA] Emitting subscription.payment.pending: ${JSON.stringify(eventData)}`);
    
    // Placeholder pour l'intégration Kafka réelle
    // await this.kafkaProducer.emit('subscription.payment.events', eventData);
  }

  /**
   * Émet un événement Kafka vers admin-service pour alimenter les calculs financiers
   * Utilisé pour synchroniser les données de paiement réussis avec admin-service
   */
  async emitFinancePaymentReceived(transaction: PaymentTransaction): Promise<void> {
    const eventData = {
      eventType: 'finance.payment.received',
      transactionId: transaction.id,
      customerId: transaction.customerId,
      customerName: transaction.metadata?.customerName,
      planId: transaction.planId,
      subscriptionId: transaction.subscriptionId,
      amount: parseFloat(transaction.amount),
      currency: transaction.currency,
      paymentMethod: 'mobile_money',
      status: 'verified',
      completedAt: transaction.completedAt,
      providerTransactionId: transaction.providerTransactionId,
      timestamp: new Date().toISOString(),
      metadata: {
        planName: transaction.metadata?.planName,
        planType: transaction.metadata?.planType,
        tokensIncluded: transaction.metadata?.tokensIncluded,
        isRenewal: transaction.metadata?.isRenewal,
        billingCycle: transaction.metadata?.billingCycleStart && transaction.metadata?.billingCycleEnd ? {
          start: transaction.metadata.billingCycleStart,
          end: transaction.metadata.billingCycleEnd
        } : null,
        customerType: transaction.metadata?.customerType,
        telecom: transaction.metadata?.telecom,
        paymentType: transaction.paymentType
      }
    };

    // TODO: Émettre vers le topic Kafka 'finance.payment.events'
    this.logger.log(`[KAFKA] Emitting finance.payment.received: ${JSON.stringify(eventData)}`);
    
    // Placeholder pour l'intégration Kafka réelle
    // await this.kafkaProducer.emit('finance.payment.events', eventData);
  }

  /**
   * Émet un événement Kafka pour un changement de statut de transaction
   * Utilisé pour les updates de statut depuis les webhooks SerdiPay
   */
  async emitSubscriptionPaymentStatusUpdate(transaction: PaymentTransaction): Promise<void> {
    const eventData = {
      eventType: 'subscription.payment.status_update',
      transactionId: transaction.id,
      providerTransactionId: transaction.providerTransactionId,
      customerId: transaction.customerId,
      planId: transaction.planId,
      oldStatus: transaction.metadata?.previousStatus,
      newStatus: transaction.status,
      updatedAt: transaction.updatedAt,
      timestamp: new Date().toISOString(),
      metadata: {
        paymentType: transaction.paymentType,
        providerResponse: transaction.metadata?.lastProviderResponse
      }
    };

    // TODO: Émettre vers le topic Kafka 'subscription.payment.events'
    this.logger.log(`[KAFKA] Emitting subscription.payment.status_update: ${JSON.stringify(eventData)}`);
    
    // Placeholder pour l'intégration Kafka réelle
    // await this.kafkaProducer.emit('subscription.payment.events', eventData);
  }
}