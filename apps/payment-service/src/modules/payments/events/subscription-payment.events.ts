/**
 * Configuration centralisée des topics Kafka pour les paiements d'abonnements
 * Suit les bonnes pratiques d'architecture événementielle
 */

export const SUBSCRIPTION_PAYMENT_TOPICS = {
  // Événements émis par customer-service
  PAYMENT_REQUEST: 'subscription.payment.request',
  
  // Événements émis par payment-service
  PAYMENT_INITIATED: 'subscription.payment.initiated',
  PAYMENT_SUCCESS: 'subscription.payment.success',
  PAYMENT_FAILED: 'subscription.payment.failed',
  PAYMENT_PENDING: 'subscription.payment.pending',
  PAYMENT_STATUS_UPDATE: 'subscription.payment.status_update',
  
  // Événements de gestion des abonnements
  SUBSCRIPTION_ACTIVATED: 'subscription.activated',
  SUBSCRIPTION_RENEWED: 'subscription.renewed',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  SUBSCRIPTION_EXPIRED: 'subscription.expired',
} as const;

export const KAFKA_CONSUMER_GROUPS = {
  PAYMENT_SERVICE: 'payment-service-group',
  CUSTOMER_SERVICE: 'customer-service-group',
  NOTIFICATION_SERVICE: 'notification-service-group',
} as const;

/**
 * Schémas d'événements standardisés
 */
export interface BaseKafkaEvent {
  eventType: string;
  eventId: string;
  timestamp: string;
  version: string;
  source: string;
}

export interface SubscriptionPaymentRequestEvent extends BaseKafkaEvent {
  eventType: typeof SUBSCRIPTION_PAYMENT_TOPICS.PAYMENT_REQUEST;
  requestId: string;
  customerId: string;
  planId: string;
  paymentData: {
    clientPhone: string;
    amount: string;
    currency: string;
    telecom: 'AM' | 'OM' | 'MP' | 'AF';
    channel: 'merchant' | 'client';
    clientReference?: string;
  };
  planDetails: {
    planName: string;
    planType: string;
    tokensIncluded: number;
  };
  subscriptionContext: {
    existingSubscriptionId?: string;
    isRenewal: boolean;
    billingCycleStart: string;
    billingCycleEnd: string;
  };
  customerContext: {
    customerType: string;
    customerName: string;
  };
}

export interface SubscriptionPaymentInitiatedEvent extends BaseKafkaEvent {
  eventType: typeof SUBSCRIPTION_PAYMENT_TOPICS.PAYMENT_INITIATED;
  transactionId: string;
  providerTransactionId?: string;
  customerId: string;
  planId: string;
  amount: string;
  currency: string;
  status: string;
  telecom: string;
  metadata: {
    paymentType: string;
    channel?: string;
    clientReference?: string;
  };
}

export interface SubscriptionPaymentSuccessEvent extends BaseKafkaEvent {
  eventType: typeof SUBSCRIPTION_PAYMENT_TOPICS.PAYMENT_SUCCESS;
  transactionId: string;
  providerTransactionId?: string;
  customerId: string;
  planId: string;
  subscriptionId?: string;
  amount: string;
  currency: string;
  completedAt: string;
  billingPeriod: {
    start: string;
    end: string;
  };
  metadata: {
    paymentType: string;
    telecom: string;
    isRenewal: boolean;
  };
}

export interface SubscriptionPaymentFailedEvent extends BaseKafkaEvent {
  eventType: typeof SUBSCRIPTION_PAYMENT_TOPICS.PAYMENT_FAILED;
  transactionId: string;
  providerTransactionId?: string;
  customerId: string;
  planId: string;
  amount: string;
  currency: string;
  error: string;
  failedAt: string;
  metadata: {
    paymentType: string;
    telecom: string;
    retryCount: number;
  };
}

export interface SubscriptionPaymentPendingEvent extends BaseKafkaEvent {
  eventType: typeof SUBSCRIPTION_PAYMENT_TOPICS.PAYMENT_PENDING;
  transactionId: string;
  providerTransactionId?: string;
  customerId: string;
  planId: string;
  amount: string;
  currency: string;
  status: string;
  instructions?: string;
  metadata: {
    paymentType: string;
    telecom: string;
    sessionId?: string;
  };
}

/**
 * Utilitaire pour créer des événements avec les champs de base
 */
export class KafkaEventBuilder {
  static createBaseEvent(eventType: string, source: string): BaseKafkaEvent {
    return {
      eventType,
      eventId: `${eventType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      version: '1.0',
      source,
    };
  }

  static createPaymentRequestEvent(
    data: Omit<SubscriptionPaymentRequestEvent, keyof BaseKafkaEvent>
  ): SubscriptionPaymentRequestEvent {
    return {
      ...this.createBaseEvent(SUBSCRIPTION_PAYMENT_TOPICS.PAYMENT_REQUEST, 'customer-service'),
      ...data,
    } as SubscriptionPaymentRequestEvent;
  }

  static createPaymentInitiatedEvent(
    data: Omit<SubscriptionPaymentInitiatedEvent, keyof BaseKafkaEvent>
  ): SubscriptionPaymentInitiatedEvent {
    return {
      ...this.createBaseEvent(SUBSCRIPTION_PAYMENT_TOPICS.PAYMENT_INITIATED, 'payment-service'),
      ...data,
    } as SubscriptionPaymentInitiatedEvent;
  }

  static createPaymentSuccessEvent(
    data: Omit<SubscriptionPaymentSuccessEvent, keyof BaseKafkaEvent>
  ): SubscriptionPaymentSuccessEvent {
    return {
      ...this.createBaseEvent(SUBSCRIPTION_PAYMENT_TOPICS.PAYMENT_SUCCESS, 'payment-service'),
      ...data,
    } as SubscriptionPaymentSuccessEvent;
  }

  static createPaymentFailedEvent(
    data: Omit<SubscriptionPaymentFailedEvent, keyof BaseKafkaEvent>
  ): SubscriptionPaymentFailedEvent {
    return {
      ...this.createBaseEvent(SUBSCRIPTION_PAYMENT_TOPICS.PAYMENT_FAILED, 'payment-service'),
      ...data,
    } as SubscriptionPaymentFailedEvent;
  }

  static createPaymentPendingEvent(
    data: Omit<SubscriptionPaymentPendingEvent, keyof BaseKafkaEvent>
  ): SubscriptionPaymentPendingEvent {
    return {
      ...this.createBaseEvent(SUBSCRIPTION_PAYMENT_TOPICS.PAYMENT_PENDING, 'payment-service'),
      ...data,
    } as SubscriptionPaymentPendingEvent;
  }
}