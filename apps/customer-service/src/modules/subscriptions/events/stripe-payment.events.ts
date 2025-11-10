export interface StripePaymentKafkaEvent {
  eventType: 'stripe.payment.request' | 'stripe.subscription.setup' | 'stripe.subscription.cancel';
  requestId: string;
  customerId: string;
  timestamp: string;
}

export interface StripeCardPaymentRequest extends StripePaymentKafkaEvent {
  eventType: 'stripe.payment.request';
  subscriptionPlanId: string;
  amount: number;
  currency: string;
  paymentMethodId?: string; // Fourni par Stripe Elements côté frontend
  
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
    requiresSetupIntent?: boolean; // Pour abonnements récurrents
  };
  
  subscriptionContext?: {
    existingSubscriptionId?: string;
    isRenewal?: boolean;
    setupRecurring?: boolean;
    trialDays?: number;
  };
  
  metadata?: any;
}

export interface StripeSubscriptionSetupRequest extends StripePaymentKafkaEvent {
  eventType: 'stripe.subscription.setup';
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
}

export interface StripeSubscriptionCancelRequest extends StripePaymentKafkaEvent {
  eventType: 'stripe.subscription.cancel';
  subscriptionId: string;
  stripeSubscriptionId: string;
  reason?: string;
  metadata?: any;
}

/**
 * Builder pour créer des événements Kafka standardisés pour Stripe
 */
export class StripeKafkaEventBuilder {
  
  /**
   * Crée un événement de demande de paiement par carte Stripe
   */
  static createCardPaymentRequest(data: {
    customerId: string;
    subscriptionPlanId: string;
    amount: number;
    currency: string;
    paymentMethodId?: string;
    customerInfo: StripeCardPaymentRequest['customerInfo'];
    planInfo: StripeCardPaymentRequest['planInfo'];
    paymentOptions: StripeCardPaymentRequest['paymentOptions'];
    subscriptionContext?: StripeCardPaymentRequest['subscriptionContext'];
    metadata?: any;
  }): StripeCardPaymentRequest {
    return {
      eventType: 'stripe.payment.request',
      requestId: `stripe_req_${Date.now()}_${data.customerId}`,
      customerId: data.customerId,
      subscriptionPlanId: data.subscriptionPlanId,
      amount: data.amount,
      currency: data.currency,
      paymentMethodId: data.paymentMethodId,
      customerInfo: data.customerInfo,
      planInfo: data.planInfo,
      paymentOptions: data.paymentOptions,
      subscriptionContext: data.subscriptionContext,
      metadata: data.metadata,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Crée un événement de configuration d'abonnement récurrent Stripe
   */
  static createSubscriptionSetupRequest(data: {
    customerId: string;
    subscriptionPlanId: string;
    paymentMethodId: string;
    customerInfo: StripeSubscriptionSetupRequest['customerInfo'];
    planInfo: StripeSubscriptionSetupRequest['planInfo'];
    subscriptionOptions: StripeSubscriptionSetupRequest['subscriptionOptions'];
    metadata?: any;
  }): StripeSubscriptionSetupRequest {
    return {
      eventType: 'stripe.subscription.setup',
      requestId: `stripe_setup_${Date.now()}_${data.customerId}`,
      customerId: data.customerId,
      subscriptionPlanId: data.subscriptionPlanId,
      paymentMethodId: data.paymentMethodId,
      customerInfo: data.customerInfo,
      planInfo: data.planInfo,
      subscriptionOptions: data.subscriptionOptions,
      metadata: data.metadata,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Crée un événement d'annulation d'abonnement Stripe
   */
  static createSubscriptionCancelRequest(data: {
    customerId: string;
    subscriptionId: string;
    stripeSubscriptionId: string;
    reason?: string;
    metadata?: any;
  }): StripeSubscriptionCancelRequest {
    return {
      eventType: 'stripe.subscription.cancel',
      requestId: `stripe_cancel_${Date.now()}_${data.customerId}`,
      customerId: data.customerId,
      subscriptionId: data.subscriptionId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      reason: data.reason,
      metadata: data.metadata,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Topics Kafka pour les paiements Stripe
 */
export const STRIPE_KAFKA_TOPICS = {
  // Customer-service vers Payment-service
  PAYMENT_REQUEST: 'payment-service.stripe.payment.request',
  SUBSCRIPTION_SETUP: 'payment-service.stripe.subscription.setup',
  SUBSCRIPTION_CANCEL: 'payment-service.stripe.subscription.cancel',
  WEBHOOK_FORWARD: 'payment-service.stripe.webhook',
  
  // Payment-service vers Customer-service (réponses)
  PAYMENT_INITIATED: 'customer-service.stripe.payment.initiated',
  PAYMENT_COMPLETED: 'customer-service.stripe.payment.completed',
  PAYMENT_FAILED: 'customer-service.stripe.payment.failed',
  PAYMENT_REQUIRES_ACTION: 'customer-service.stripe.payment.requires_action',
  
  SUBSCRIPTION_CREATED: 'customer-service.stripe.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer-service.stripe.subscription.updated',
  SUBSCRIPTION_CANCELLED: 'customer-service.stripe.subscription.cancelled',
  
  // Payment-service vers Admin-service (analytics)
  ANALYTICS_PAYMENT: 'admin-service.stripe.payment.analytics',
  ANALYTICS_SUBSCRIPTION: 'admin-service.stripe.subscription.analytics',
} as const;