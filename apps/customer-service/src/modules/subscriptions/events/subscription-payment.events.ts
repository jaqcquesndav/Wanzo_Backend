/**
 * Configuration centralisée des topics Kafka pour les paiements d'abonnements (customer-service)
 * Symétrique au fichier payment-service pour cohérence
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
 * Utilitaire pour créer des événements avec les champs de base
 */
export class KafkaEventBuilder {
  static createBaseEvent(eventType: string, source: string) {
    return {
      eventType,
      eventId: `${eventType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      version: '1.0',
      source,
    };
  }

  static createPaymentRequestEvent(data: any) {
    return {
      ...this.createBaseEvent(SUBSCRIPTION_PAYMENT_TOPICS.PAYMENT_REQUEST, 'customer-service'),
      ...data,
    };
  }
}