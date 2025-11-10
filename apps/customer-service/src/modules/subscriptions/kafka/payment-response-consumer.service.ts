import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../../billing/entities/payment.entity';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';

/**
 * Interface pour les événements de résultat de paiement du payment-service
 */
export interface PaymentResultEvent {
  success: boolean;
  paymentIntentId: string;
  paymentId: string;
  status: string;
  clientSecret?: string;
  requiresAction?: boolean;
  nextAction?: any;
  customerId: string;
  amount: number;
  currency: string;
  error?: string;
  timestamp: Date;
  eventId: string;
  source: string;
  version: string;
}

/**
 * Interface pour les événements de SetupIntent du payment-service
 */
export interface SetupIntentResultEvent {
  success: boolean;
  setupIntentId: string;
  clientSecret: string;
  status: string;
  customerId: string;
  error?: string;
  timestamp: Date;
  eventId: string;
  source: string;
  version: string;
}

/**
 * Interface pour les mises à jour de statut de paiement
 */
export interface PaymentStatusUpdateEvent {
  paymentIntentId: string;
  customerId: string;
  status: string;
  amount: number;
  currency: string;
  error?: string;
  timestamp: Date;
  eventId: string;
  source: string;
  version: string;
}

/**
 * Interface pour les mises à jour de paiement d'abonnement
 */
export interface SubscriptionPaymentUpdateEvent {
  subscriptionId: string;
  customerId?: string;
  amount: number;
  currency: string;
  status: string;
  invoiceId: string;
  error?: string;
  timestamp: Date;
  eventId: string;
  source: string;
  version: string;
}

/**
 * Consumer Kafka pour écouter les réponses du payment-service
 * Traite les résultats des paiements Stripe et met à jour les entités locales
 */
@Injectable()
export class PaymentResponseConsumerService {
  private readonly logger = new Logger(PaymentResponseConsumerService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {
    this.logger.log('PaymentResponseConsumerService initialized');
  }

  /**
   * Traite les résultats de paiement par carte du payment-service
   */
  @EventPattern('payment.card.result')
  async handlePaymentResult(@Payload() data: PaymentResultEvent): Promise<void> {
    this.logger.log(`Processing payment result for customer ${data.customerId}`, {
      paymentIntentId: data.paymentIntentId,
      status: data.status,
      success: data.success
    });

    try {
      // Mettre à jour notre enregistrement de paiement local
      if (data.paymentId) {
        const existingPayment = await this.paymentRepository.findOne({ where: { id: data.paymentId } });
        if (existingPayment) {
          existingPayment.stripePaymentIntentId = data.paymentIntentId;
          existingPayment.status = this.mapPaymentStatus(data.status);
          existingPayment.metadata = {
            ...(existingPayment.metadata || {}),
            clientSecret: data.clientSecret,
            requiresAction: data.requiresAction,
            nextAction: data.nextAction,
            updatedFromPaymentService: true,
            lastUpdated: new Date().toISOString()
          };
          await this.paymentRepository.save(existingPayment);
        }
      } else {
        // Créer un nouvel enregistrement si nécessaire
        const existingPayment = await this.paymentRepository.findOne({
          where: { stripePaymentIntentId: data.paymentIntentId }
        });

        if (!existingPayment) {
          const newPayment = this.paymentRepository.create({
            customerId: data.customerId,
            amount: data.amount,
            currency: data.currency,
            paymentMethod: 'CREDIT_CARD' as any,
            status: this.mapPaymentStatus(data.status),
            stripePaymentIntentId: data.paymentIntentId,
            metadata: {
              source: 'payment-service-response',
              clientSecret: data.clientSecret,
              requiresAction: data.requiresAction,
              nextAction: data.nextAction
            }
          });
          await this.paymentRepository.save(newPayment);
        }
      }

      this.logger.log(`Payment result processed successfully for customer ${data.customerId}`, {
        paymentIntentId: data.paymentIntentId,
        status: data.status
      });

    } catch (error: any) {
      this.logger.error('Error processing payment result', {
        customerId: data.customerId,
        paymentIntentId: data.paymentIntentId,
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Traite les résultats de SetupIntent du payment-service
   */
  @EventPattern('payment.setup.result')
  async handleSetupIntentResult(@Payload() data: SetupIntentResultEvent): Promise<void> {
    this.logger.log(`Processing SetupIntent result for customer ${data.customerId}`, {
      setupIntentId: data.setupIntentId,
      status: data.status,
      success: data.success
    });

    try {
      // Mettre à jour les abonnements en attente pour ce client
      const pendingSubscriptions = await this.subscriptionRepository.find({
        where: { customerId: data.customerId, status: SubscriptionStatus.PENDING }
      });
      
      for (const subscription of pendingSubscriptions) {
        subscription.metadata = {
          ...(subscription.metadata || {}),
          setupIntentId: data.setupIntentId,
          clientSecret: data.clientSecret,
          setupStatus: data.status,
          setupCompleted: data.success,
          lastUpdated: new Date().toISOString()
        };
        await this.subscriptionRepository.save(subscription);
      }

      this.logger.log(`SetupIntent result processed for customer ${data.customerId}`, {
        setupIntentId: data.setupIntentId,
        status: data.status
      });

    } catch (error: any) {
      this.logger.error('Error processing SetupIntent result', {
        customerId: data.customerId,
        setupIntentId: data.setupIntentId,
        error: error.message
      });
    }
  }

  /**
   * Traite les mises à jour de statut de paiement
   */
  @EventPattern('payment.status.updated')
  async handlePaymentStatusUpdate(@Payload() data: PaymentStatusUpdateEvent): Promise<void> {
    this.logger.log(`Processing payment status update for customer ${data.customerId}`, {
      paymentIntentId: data.paymentIntentId,
      status: data.status
    });

    try {
      // Mettre à jour le statut du paiement
      const existingPayment = await this.paymentRepository.findOne({ 
        where: { stripePaymentIntentId: data.paymentIntentId } 
      });
      
      if (existingPayment) {
        existingPayment.status = this.mapPaymentStatus(data.status);
        existingPayment.metadata = {
          ...(existingPayment.metadata || {}),
          lastStatusUpdate: new Date().toISOString(),
          error: data.error
        };
        await this.paymentRepository.save(existingPayment);
      }

      this.logger.log(`Payment status updated for payment ${data.paymentIntentId}`, {
        status: data.status
      });

    } catch (error: any) {
      this.logger.error('Error processing payment status update', {
        paymentIntentId: data.paymentIntentId,
        error: error.message
      });
    }
  }

  /**
   * Traite les mises à jour de paiement d'abonnement
   */
  @EventPattern('subscription.payment.updated')
  async handleSubscriptionPaymentUpdate(@Payload() data: SubscriptionPaymentUpdateEvent): Promise<void> {
    this.logger.log(`Processing subscription payment update for subscription ${data.subscriptionId}`, {
      status: data.status,
      amount: data.amount,
      invoiceId: data.invoiceId
    });

    try {
      if (data.status === 'succeeded') {
        // Paiement réussi - mettre à jour l'abonnement
        const subscription = await this.subscriptionRepository.findOne({ 
          where: { id: data.subscriptionId } 
        });
        
        if (subscription) {
          subscription.status = SubscriptionStatus.ACTIVE;
          subscription.lastPaymentDate = new Date();
          subscription.lastPaymentAmount = data.amount;
          subscription.metadata = {
            ...(subscription.metadata || {}),
            lastInvoiceId: data.invoiceId,
            lastPaymentStatus: 'succeeded',
            lastUpdated: new Date().toISOString()
          };
          await this.subscriptionRepository.save(subscription);
        }
      } else if (data.status === 'failed') {
        // Paiement échoué - marquer comme en souffrance
        const subscription = await this.subscriptionRepository.findOne({ 
          where: { id: data.subscriptionId } 
        });
        
        if (subscription) {
          subscription.status = SubscriptionStatus.PAST_DUE;
          subscription.metadata = {
            ...(subscription.metadata || {}),
            lastInvoiceId: data.invoiceId,
            lastPaymentStatus: 'failed',
            paymentError: data.error,
            lastUpdated: new Date().toISOString()
          };
          await this.subscriptionRepository.save(subscription);
        }
      }

      this.logger.log(`Subscription payment update processed for ${data.subscriptionId}`, {
        status: data.status
      });

    } catch (error: any) {
      this.logger.error('Error processing subscription payment update', {
        subscriptionId: data.subscriptionId,
        error: error.message
      });
    }
  }

  /**
   * Traite les mises à jour de statut d'abonnement
   */
  @EventPattern('subscription.status.updated')
  async handleSubscriptionStatusUpdate(@Payload() data: any): Promise<void> {
    this.logger.log(`Processing subscription status update for subscription ${data.subscriptionId}`, {
      stripeStatus: data.stripeStatus,
      eventType: data.eventType
    });

    try {
      const subscriptionStatus = this.mapStripeStatusToSubscriptionStatus(data.stripeStatus);
      
      const updateData: any = {
        status: subscriptionStatus,
        metadata: {
          stripeStatus: data.stripeStatus,
          lastWebhookEvent: data.eventType,
          lastUpdated: new Date().toISOString()
        }
      };

      if (data.currentPeriodEnd) {
        updateData.nextBillingDate = data.currentPeriodEnd;
      }

      if (data.eventType === 'customer.subscription.deleted') {
        updateData.canceledAt = new Date();
        updateData.autoRenew = false;
      }

      await this.subscriptionRepository.update(data.subscriptionId, updateData);

      this.logger.log(`Subscription status updated for ${data.subscriptionId}`, {
        newStatus: subscriptionStatus,
        stripeStatus: data.stripeStatus
      });

    } catch (error: any) {
      this.logger.error('Error processing subscription status update', {
        subscriptionId: data.subscriptionId,
        error: error.message
      });
    }
  }

  /**
   * Mappe les statuts de paiement du payment-service vers nos statuts internes
   */
  private mapPaymentStatus(status: string): PaymentStatus {
    switch (status) {
      case 'succeeded':
        return PaymentStatus.COMPLETED;
      case 'failed':
      case 'canceled':
        return PaymentStatus.FAILED;
      case 'requires_action':
      case 'requires_confirmation':
      case 'processing':
      case 'pending':
        return PaymentStatus.PENDING;
      default:
        return PaymentStatus.PENDING;
    }
  }

  /**
   * Mappe les statuts Stripe vers nos statuts d'abonnement
   */
  private mapStripeStatusToSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'canceled':
      case 'cancelled':
        return SubscriptionStatus.CANCELED;
      case 'unpaid':
        return SubscriptionStatus.PAST_DUE;
      case 'incomplete':
      case 'incomplete_expired':
        return SubscriptionStatus.PENDING;
      default:
        return SubscriptionStatus.INACTIVE;
    }
  }
}