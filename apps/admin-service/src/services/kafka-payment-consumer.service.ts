import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, KafkaMessage } from 'kafkajs';

/**
 * Service consommateur Kafka pour les événements de paiement d'abonnement
 * Reçoit les événements du payment-service et les redistribue via EventEmitter
 */
@Injectable()
export class KafkaPaymentConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaPaymentConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected = false;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    // Configuration Kafka
    const brokers = this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(',');
    
    this.kafka = new Kafka({
      clientId: 'admin-service-payment-consumer',
      brokers: brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.consumer = this.kafka.consumer({
      groupId: 'admin-service-payment-analytics',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
  }

  async onModuleInit() {
    await this.connectAndSubscribe();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Connexion au broker Kafka et souscription aux topics
   */
  private async connectAndSubscribe(): Promise<void> {
    try {
      this.logger.log('Connexion au broker Kafka...');
      
      await this.consumer.connect();
      this.isConnected = true;
      
      // Souscription aux topics de paiement d'abonnement
      await this.consumer.subscribe({
        topics: [
          'subscription-payment-events',     // Événements principaux de paiement
          'finance-payment-events',          // Événements financiers
          'payment-analytics-events'         // Événements d'analytics
        ],
        fromBeginning: false, // Seulement les nouveaux messages
      });

      this.logger.log('Souscription aux topics réussie');

      // Démarrage de l\'écoute des messages
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          await this.handleKafkaMessage(topic, partition, message);
        },
      });

      this.logger.log('Consumer Kafka démarré avec succès');

    } catch (error) {
      this.logger.error('Erreur lors de la connexion Kafka:', error);
      this.isConnected = false;
      
      // Retry après 5 secondes
      setTimeout(() => {
        this.connectAndSubscribe();
      }, 5000);
    }
  }

  /**
   * Traitement des messages Kafka reçus
   */
  private async handleKafkaMessage(
    topic: string,
    partition: number,
    message: KafkaMessage
  ): Promise<void> {
    try {
      if (!message.value) {
        this.logger.warn(`Message vide reçu du topic ${topic}`);
        return;
      }

      const messageData = JSON.parse(message.value.toString());
      
      this.logger.debug(`Message reçu du topic ${topic}:`, {
        partition,
        offset: message.offset,
        key: message.key?.toString(),
        eventType: messageData.eventType
      });

      // Redistribution via EventEmitter selon le topic
      switch (topic) {
        case 'subscription-payment-events':
          await this.handleSubscriptionPaymentEvent(messageData);
          break;
          
        case 'finance-payment-events':
          await this.handleFinancePaymentEvent(messageData);
          break;
          
        case 'payment-analytics-events':
          await this.handlePaymentAnalyticsEvent(messageData);
          break;
          
        default:
          this.logger.warn(`Topic non géré: ${topic}`);
      }

    } catch (error) {
      this.logger.error(`Erreur lors du traitement du message du topic ${topic}:`, error);
    }
  }

  /**
   * Traitement des événements de paiement d'abonnement
   */
  private async handleSubscriptionPaymentEvent(eventData: any): Promise<void> {
    try {
      const { eventType } = eventData;

      switch (eventType) {
        case 'subscription_payment_initiated':
          this.eventEmitter.emit('subscription.payment.initiated', eventData);
          break;
          
        case 'subscription_payment_completed':
          this.eventEmitter.emit('subscription.payment.completed', eventData);
          break;
          
        case 'subscription_payment_failed':
          this.eventEmitter.emit('subscription.payment.failed', eventData);
          break;
          
        default:
          this.logger.debug(`Type d'événement de paiement non géré: ${eventType}`);
      }

    } catch (error) {
      this.logger.error('Erreur lors du traitement de l\'événement subscription payment:', error);
    }
  }

  /**
   * Traitement des événements financiers
   */
  private async handleFinancePaymentEvent(eventData: any): Promise<void> {
    try {
      const { eventType } = eventData;

      switch (eventType) {
        case 'finance.payment.received':
          this.eventEmitter.emit('finance.payment.received', eventData);
          break;
          
        case 'finance.revenue.updated':
          this.eventEmitter.emit('finance.revenue.updated', eventData);
          break;
          
        default:
          this.logger.debug(`Type d'événement financier non géré: ${eventType}`);
      }

    } catch (error) {
      this.logger.error('Erreur lors du traitement de l\'événement finance payment:', error);
    }
  }

  /**
   * Traitement des événements d'analytics
   */
  private async handlePaymentAnalyticsEvent(eventData: any): Promise<void> {
    try {
      const { eventType } = eventData;

      switch (eventType) {
        case 'payment.analytics':
          this.eventEmitter.emit('payment.analytics', eventData);
          break;
          
        case 'customer.segmentation.updated':
          this.eventEmitter.emit('customer.segmentation.updated', eventData);
          break;
          
        default:
          this.logger.debug(`Type d'événement analytics non géré: ${eventType}`);
      }

    } catch (error) {
      this.logger.error('Erreur lors du traitement de l\'événement analytics:', error);
    }
  }

  /**
   * Déconnexion du consumer Kafka
   */
  private async disconnect(): Promise<void> {
    try {
      if (this.isConnected && this.consumer) {
        this.logger.log('Déconnexion du consumer Kafka...');
        await this.consumer.disconnect();
        this.isConnected = false;
        this.logger.log('Consumer Kafka déconnecté');
      }
    } catch (error) {
      this.logger.error('Erreur lors de la déconnexion Kafka:', error);
    }
  }

  /**
   * Vérification de l'état de connexion
   */
  isKafkaConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Reconnexion manuelle si nécessaire
   */
  async reconnect(): Promise<void> {
    if (this.isConnected) {
      await this.disconnect();
    }
    await this.connectAndSubscribe();
  }
}