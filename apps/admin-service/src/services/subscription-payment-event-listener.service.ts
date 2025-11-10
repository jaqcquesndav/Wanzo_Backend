import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventPattern, Payload } from '@nestjs/microservices';

interface SubscriptionPaymentEvent {
  eventType: 'subscription_payment_initiated' | 'subscription_payment_completed' | 'subscription_payment_failed';
  timestamp: Date;
  transactionId: string;
  customerId: string;
  organizationId?: string;
  subscriptionPlanId?: string;
  amount: number;
  currency: string;
  paymentMethod: 'mobile_money' | 'card';
  provider: 'serdipay' | 'stripe';
  
  // Informations sur le plan
  planDetails?: {
    id: string;
    name: string;
    type: string;
    tokensIncluded?: number;
  };

  customerInfo?: {
    name: string;
    type: 'sme' | 'financial';
    country?: string;
    industry?: string;
  };

  paymentDetails?: {
    providerTransactionId?: string;
    cardBrand?: string;
    cardLast4?: string;
    telecom?: string;
    clientPhone?: string;
  };

  metadata?: any;
}

interface FinancePaymentReceivedEvent {
  eventType: 'finance.payment.received';
  transactionId: string;
  customerId: string;
  customerName?: string;
  planId?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  paymentMethod: 'mobile_money' | 'card';
  provider: string;
  status: string;
  completedAt?: Date;
  providerTransactionId?: string;
  timestamp: string;
  
  paymentDetails?: {
    telecom?: string;
    clientPhone?: string;
    cardBrand?: string;
    cardLast4?: string;
    cardCountry?: string;
    customerEmail?: string;
  };
  
  metadata?: any;
}

interface PaymentAnalyticsEvent {
  eventType: 'payment.analytics';
  transactionId: string;
  customerId: string;
  
  customerInfo: {
    type: 'sme' | 'financial' | 'unknown';
    name?: string;
    country?: string;
    industry?: string;
    size?: string;
  };
  
  paymentInfo: {
    amount: number;
    currency: string;
    paymentMethod: 'mobile_money' | 'card';
    provider: string;
    completedAt?: Date;
    telecom?: string;
    cardBrand?: string;
    cardCountry?: string;
  };
  
  planInfo?: {
    id?: string;
    name?: string;
    type?: string;
    tokensIncluded?: number;
  };
  
  timestamp: string;
}

/**
 * Service d'écoute des événements de paiement d'abonnement
 * Traite les événements Kafka provenant du payment-service
 * Permet au dashboard admin de suivre les transactions en temps réel
 */
@Injectable()
export class SubscriptionPaymentEventListener {
  private readonly logger = new Logger(SubscriptionPaymentEventListener.name);

  // Statistiques en mémoire pour le dashboard
  private paymentStats = {
    totalTransactions: 0,
    totalRevenue: 0,
    mobileMoneyTransactions: 0,
    cardTransactions: 0,
    failedTransactions: 0,
    byCustomerType: {
      sme: { count: 0, revenue: 0 },
      financial: { count: 0, revenue: 0 }
    },
    byCurrency: {
      USD: { count: 0, revenue: 0 },
      EUR: { count: 0, revenue: 0 },
      CDF: { count: 0, revenue: 0 }
    },
    byPaymentMethod: {
      mobile_money: { count: 0, revenue: 0 },
      card: { count: 0, revenue: 0 }
    },
    recentTransactions: [] as any[]
  };

  /**
   * Écoute les événements de paiement d'abonnement complétés
   * Utilisé pour mettre à jour les statistiques financières
   */
  @OnEvent('finance.payment.received')
  async handleFinancePaymentReceived(event: FinancePaymentReceivedEvent): Promise<void> {
    this.logger.log(`Traitement paiement d'abonnement reçu: ${event.transactionId}`);

    try {
      // Mise à jour des statistiques globales
      this.paymentStats.totalTransactions++;
      this.paymentStats.totalRevenue += event.amount;

      // Statistiques par méthode de paiement
      if (event.paymentMethod === 'mobile_money') {
        this.paymentStats.mobileMoneyTransactions++;
        this.paymentStats.byPaymentMethod.mobile_money.count++;
        this.paymentStats.byPaymentMethod.mobile_money.revenue += event.amount;
      } else if (event.paymentMethod === 'card') {
        this.paymentStats.cardTransactions++;
        this.paymentStats.byPaymentMethod.card.count++;
        this.paymentStats.byPaymentMethod.card.revenue += event.amount;
      }

      // Statistiques par devise
      const currency = event.currency.toUpperCase();
      if (this.paymentStats.byCurrency[currency]) {
        this.paymentStats.byCurrency[currency].count++;
        this.paymentStats.byCurrency[currency].revenue += event.amount;
      }

      // Ajout aux transactions récentes
      this.paymentStats.recentTransactions.unshift({
        transactionId: event.transactionId,
        customerId: event.customerId,
        customerName: event.customerName,
        amount: event.amount,
        currency: event.currency,
        paymentMethod: event.paymentMethod,
        provider: event.provider,
        completedAt: event.completedAt,
        planId: event.planId,
        paymentDetails: event.paymentDetails
      });

      // Garder seulement les 100 dernières transactions
      if (this.paymentStats.recentTransactions.length > 100) {
        this.paymentStats.recentTransactions = this.paymentStats.recentTransactions.slice(0, 100);
      }

      this.logger.log(`Statistiques mises à jour - Total: ${this.paymentStats.totalTransactions} transactions, Revenue: ${this.paymentStats.totalRevenue}`);

    } catch (error) {
      this.logger.error(`Erreur lors du traitement de l'événement finance.payment.received:`, error);
    }
  }



  /**
   * Écoute les événements de paiement d'abonnement échoués
   * Utilisé pour tracking des échecs et alertes
   */
  @OnEvent('subscription.payment.failed')
  async handleSubscriptionPaymentFailed(event: SubscriptionPaymentEvent): Promise<void> {
    this.logger.warn(`Paiement d'abonnement échoué: ${event.transactionId} - Customer: ${event.customerId}`);

    try {
      // Mise à jour des statistiques d'échecs
      this.paymentStats.failedTransactions++;

      // TODO: Implémenter alertes pour échecs de paiement
      // - Notification aux équipes support
      // - Mise à jour du dashboard avec alertes

      this.logger.log(`Échecs de paiement: ${this.paymentStats.failedTransactions} total`);

    } catch (error) {
      this.logger.error(`Erreur lors du traitement de l'événement subscription.payment.failed:`, error);
    }
  }

  /**
   * Récupère les statistiques de paiement pour le dashboard admin
   */
  getPaymentStatistics() {
    return {
      ...this.paymentStats,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Récupère les transactions récentes pour le dashboard
   */
  getRecentTransactions(limit: number = 50) {
    return this.paymentStats.recentTransactions.slice(0, limit);
  }

  /**
   * Récupère les métriques de conversion par type de paiement
   */
  getPaymentMethodMetrics() {
    const total = this.paymentStats.totalTransactions;
    
    return {
      mobile_money: {
        ...this.paymentStats.byPaymentMethod.mobile_money,
        percentage: total > 0 ? (this.paymentStats.mobileMoneyTransactions / total) * 100 : 0
      },
      card: {
        ...this.paymentStats.byPaymentMethod.card,
        percentage: total > 0 ? (this.paymentStats.cardTransactions / total) * 100 : 0
      },
      failureRate: total > 0 ? (this.paymentStats.failedTransactions / total) * 100 : 0
    };
  }

  /**
   * Consumer Kafka pour les événements d'analytics du payment-service
   */
  @EventPattern('payment.analytics')
  async handlePaymentAnalytics(@Payload() data: any): Promise<void> {
    this.logger.log(`Received payment analytics event: ${data.eventType}`, {
      customerId: data.customerId,
      amount: data.amount,
      status: data.status
    });

    try {
      // Traiter l'événement d'analytics
      const event: FinancePaymentReceivedEvent = {
        eventType: 'finance.payment.received',
        transactionId: data.eventId || `payment_${Date.now()}`,
        customerId: data.customerId,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        provider: 'stripe',
        status: data.status,
        timestamp: data.timestamp,
        metadata: data.metadata
      };

      // Utiliser la logique existante
      await this.handleFinancePaymentReceived(event);

    } catch (error: any) {
      this.logger.error('Error processing payment analytics event', {
        eventType: data.eventType,
        customerId: data.customerId,
        error: error.message
      });
    }
  }

  /**
   * Consumer Kafka pour les résultats de paiement par carte
   */
  @EventPattern('payment.card.result')
  async handleCardPaymentResult(@Payload() data: any): Promise<void> {
    this.logger.log(`Received card payment result for customer ${data.customerId}`, {
      paymentIntentId: data.paymentIntentId,
      status: data.status,
      success: data.success
    });

    try {
      const event: SubscriptionPaymentEvent = {
        eventType: data.success ? 'subscription_payment_completed' : 'subscription_payment_failed',
        timestamp: new Date(data.timestamp),
        transactionId: data.paymentIntentId,
        customerId: data.customerId,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: 'card',
        provider: 'stripe'
      };

      // Utiliser la logique existante selon le type d'événement
      if (data.success) {
        // Convertir en événement de paiement reçu pour les analytics
        const financeEvent: FinancePaymentReceivedEvent = {
          eventType: 'finance.payment.received',
          transactionId: data.paymentIntentId,
          customerId: data.customerId,
          amount: data.amount,
          currency: data.currency,
          paymentMethod: 'card',
          provider: 'stripe',
          status: 'completed',
          timestamp: data.timestamp,
          metadata: data
        };
        await this.handleFinancePaymentReceived(financeEvent);
      } else {
        await this.handleSubscriptionPaymentFailed(event);
      }

    } catch (error: any) {
      this.logger.error('Error processing card payment result', {
        paymentIntentId: data.paymentIntentId,
        customerId: data.customerId,
        error: error.message
      });
    }
  }

  /**
   * Consumer Kafka pour les mises à jour de statut de paiement
   */
  @EventPattern('payment.status.updated')
  async handlePaymentStatusUpdate(@Payload() data: any): Promise<void> {
    this.logger.log(`Received payment status update for payment ${data.paymentIntentId}`, {
      status: data.status,
      customerId: data.customerId
    });

    try {
      const eventType = data.status === 'succeeded' ? 'subscription_payment_completed' : 'subscription_payment_failed';
      
      const event: SubscriptionPaymentEvent = {
        eventType,
        timestamp: new Date(data.timestamp),
        transactionId: data.paymentIntentId,
        customerId: data.customerId,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: 'card',
        provider: 'stripe'
      };

      if (eventType === 'subscription_payment_completed') {
        // Convertir en événement de paiement reçu pour les analytics
        const financeEvent: FinancePaymentReceivedEvent = {
          eventType: 'finance.payment.received',
          transactionId: data.paymentIntentId,
          customerId: data.customerId,
          amount: data.amount,
          currency: data.currency,
          paymentMethod: 'card',
          provider: 'stripe',
          status: 'completed',
          timestamp: data.timestamp,
          metadata: data
        };
        await this.handleFinancePaymentReceived(financeEvent);
      } else {
        await this.handleSubscriptionPaymentFailed(event);
      }

    } catch (error: any) {
      this.logger.error('Error processing payment status update', {
        paymentIntentId: data.paymentIntentId,
        error: error.message
      });
    }
  }

  /**
   * Consumer Kafka pour les événements de webhook traités
   */
  @EventPattern('webhook.processed')
  async handleWebhookProcessed(@Payload() data: any): Promise<void> {
    this.logger.log(`Webhook processed: ${data.webhookType}`, {
      stripeEventId: data.stripeEventId,
      processed: data.processed
    });

    // Cet événement peut être utilisé pour des analytics ou monitoring supplémentaires
    // mais n'affecte pas directement les statistiques de paiement
  }
}