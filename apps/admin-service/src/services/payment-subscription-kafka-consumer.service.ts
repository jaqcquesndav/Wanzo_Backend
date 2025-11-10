import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

/**
 * Service consommateur Kafka pour écouter les événements de paiement d'abonnement
 * Connecte les événements Kafka aux event listeners locaux
 */
@Injectable()
export class PaymentSubscriptionKafkaConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentSubscriptionKafkaConsumer.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    // Configuration Kafka
    const brokers = this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(',');
    
    this.kafka = new Kafka({
      clientId: this.configService.get<string>('KAFKA_CLIENT_ID_PAYMENT_CONSUMER', 'admin-payment-consumer'),
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.consumer = this.kafka.consumer({
      groupId: this.configService.get<string>('KAFKA_GROUP_ID_PAYMENT', 'admin-payment-analytics-group'),
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
  }

  async onModuleInit() {
    try {
      this.logger.log('Initialisation du consommateur Kafka pour les événements de paiement...');
      
      await this.consumer.connect();
      this.logger.log('Connexion Kafka établie avec succès');

      // Abonnement aux topics de paiement d'abonnement
      const subscriptionTopics = [
        'subscription-payments',        // Topic principal pour les paiements d'abonnement
        'payment-analytics',            // Topic pour les analytics
        'subscription-events',          // Topic pour les événements de souscription
        'payment-transactions',         // Topic pour toutes les transactions
      ];

      for (const topic of subscriptionTopics) {
        try {
          await this.consumer.subscribe({ 
            topic, 
            fromBeginning: false  // Seulement les nouveaux messages
          });
          this.logger.log(`Abonnement au topic ${topic} réussi`);
        } catch (error) {
          this.logger.warn(`Impossible de s'abonner au topic ${topic}:`, error instanceof Error ? error.message : String(error));
        }
      }

      // Démarrage de l'écoute des messages
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.logger.log('Consommateur Kafka démarré - En écoute des événements de paiement');

    } catch (error) {
      this.logger.error('Erreur lors de l\'initialisation du consommateur Kafka:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      this.logger.log('Arrêt du consommateur Kafka...');
      await this.consumer.disconnect();
      this.logger.log('Consommateur Kafka arrêté');
    } catch (error) {
      this.logger.error('Erreur lors de l\'arrêt du consommateur Kafka:', error);
    }
  }

  /**
   * Traite les messages Kafka reçus et les transforme en événements locaux
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    
    try {
      if (!message.value) {
        this.logger.warn(`Message vide reçu du topic ${topic}`);
        return;
      }

      const messageValue = message.value.toString();
      const parsedMessage = JSON.parse(messageValue);

      this.logger.debug(`Message reçu du topic ${topic} (partition ${partition}):`, {
        eventType: parsedMessage.eventType,
        transactionId: parsedMessage.transactionId || parsedMessage.id,
        customerId: parsedMessage.customerId,
      });

      // Router les messages selon le topic et le type d'événement
      await this.routeMessage(topic, parsedMessage, message.headers);

    } catch (error) {
      this.logger.error(`Erreur lors du traitement du message du topic ${topic}:`, error);
      
      // Log du message brut pour debugging
      if (message.value) {
        this.logger.debug('Message brut:', message.value.toString().substring(0, 500));
      }
    }
  }

  /**
   * Route les messages vers les bons event handlers locaux
   */
  private async routeMessage(topic: string, message: any, headers?: any): Promise<void> {
    try {
      switch (topic) {
        case 'subscription-payments':
          await this.handleSubscriptionPaymentEvent(message);
          break;
        
        case 'payment-analytics':
          await this.handlePaymentAnalyticsEvent(message);
          break;
        
        case 'subscription-events':
          await this.handleSubscriptionEvent(message);
          break;
        
        case 'payment-transactions':
          await this.handlePaymentTransactionEvent(message);
          break;
        
        default:
          this.logger.warn(`Topic non géré: ${topic}`);
      }

    } catch (error) {
      this.logger.error(`Erreur lors du routage du message du topic ${topic}:`, error);
    }
  }

  /**
   * Traite les événements de paiement d'abonnement
   */
  private async handleSubscriptionPaymentEvent(message: any): Promise<void> {
    const eventType = message.eventType || message.event_type;
    
    // Normaliser les données pour les event listeners locaux
    const normalizedEvent = {
      eventType,
      transactionId: message.transactionId || message.transaction_id || message.id,
      customerId: message.customerId || message.customer_id,
      customerName: message.customerName || message.customer_name,
      planId: message.planId || message.plan_id || message.subscriptionPlanId,
      subscriptionId: message.subscriptionId || message.subscription_id,
      amount: parseFloat(message.amount || 0),
      currency: message.currency || 'USD',
      paymentMethod: message.paymentMethod || message.payment_method || 'unknown',
      provider: message.provider || 'unknown',
      status: message.status || 'unknown',
      completedAt: message.completedAt || message.completed_at || message.timestamp,
      providerTransactionId: message.providerTransactionId || message.provider_transaction_id,
      timestamp: message.timestamp || new Date().toISOString(),
      paymentDetails: message.paymentDetails || message.payment_details || {},
      metadata: message.metadata || {},
    };

    // Émettre l'événement selon le type
    if (eventType === 'subscription_payment_completed' || eventType === 'payment_completed') {
      this.eventEmitter.emit('finance.payment.received', normalizedEvent);
    } else if (eventType === 'subscription_payment_failed' || eventType === 'payment_failed') {
      this.eventEmitter.emit('subscription.payment.failed', normalizedEvent);
    }

    this.logger.debug(`Événement de paiement d'abonnement traité: ${eventType}`);
  }

  /**
   * Traite les événements d'analytics de paiement
   */
  private async handlePaymentAnalyticsEvent(message: any): Promise<void> {
    const normalizedEvent = {
      eventType: 'payment.analytics',
      transactionId: message.transactionId || message.transaction_id || message.id,
      customerId: message.customerId || message.customer_id,
      
      customerInfo: {
        type: message.customerInfo?.type || message.customer_info?.type || message.customerType || 'unknown',
        name: message.customerInfo?.name || message.customer_info?.name || message.customerName,
        country: message.customerInfo?.country || message.customer_info?.country || message.country,
        industry: message.customerInfo?.industry || message.customer_info?.industry || message.industry,
        size: message.customerInfo?.size || message.customer_info?.size || message.companySize,
      },
      
      paymentInfo: {
        amount: parseFloat(message.paymentInfo?.amount || message.payment_info?.amount || message.amount || 0),
        currency: message.paymentInfo?.currency || message.payment_info?.currency || message.currency || 'USD',
        paymentMethod: message.paymentInfo?.paymentMethod || message.payment_info?.payment_method || message.paymentMethod || 'unknown',
        provider: message.paymentInfo?.provider || message.payment_info?.provider || message.provider || 'unknown',
        completedAt: message.paymentInfo?.completedAt || message.payment_info?.completed_at || message.completedAt,
        telecom: message.paymentInfo?.telecom || message.payment_info?.telecom || message.telecom,
        cardBrand: message.paymentInfo?.cardBrand || message.payment_info?.card_brand || message.cardBrand,
        cardCountry: message.paymentInfo?.cardCountry || message.payment_info?.card_country || message.cardCountry,
      },
      
      planInfo: message.planInfo || message.plan_info || {
        id: message.planId || message.plan_id,
        name: message.planName || message.plan_name,
        type: message.planType || message.plan_type,
        tokensIncluded: message.tokensIncluded || message.tokens_included,
      },
      
      timestamp: message.timestamp || new Date().toISOString(),
    };

    this.eventEmitter.emit('payment.analytics', normalizedEvent);
    this.logger.debug('Événement d\'analytics de paiement traité');
  }

  /**
   * Traite les événements de souscription généraux
   */
  private async handleSubscriptionEvent(message: any): Promise<void> {
    // Pour les événements de souscription qui ne sont pas directement des paiements
    // mais qui peuvent affecter les analytics
    this.logger.debug(`Événement de souscription reçu: ${message.eventType || message.event_type}`);
  }

  /**
   * Traite les événements de transaction de paiement généraux
   */
  private async handlePaymentTransactionEvent(message: any): Promise<void> {
    // Pour les transactions de paiement générales qui peuvent inclure
    // les paiements d'abonnement
    const eventType = message.eventType || message.event_type;
    
    if (eventType && eventType.includes('subscription')) {
      // Rediriger vers le handler de paiement d'abonnement
      await this.handleSubscriptionPaymentEvent(message);
    }
    
    this.logger.debug(`Événement de transaction de paiement traité: ${eventType}`);
  }

  /**
   * Méthode de santé pour vérifier l'état de la connexion Kafka
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Simple vérification que le consumer est connecté
      // Note: Il n'y a pas de méthode directe pour vérifier l'état
      // mais nous pouvons considérer qu'il est sain s'il a été initialisé
      return this.consumer !== undefined;
    } catch (error) {
      this.logger.error('Vérification de santé Kafka échouée:', error);
      return false;
    }
  }
}