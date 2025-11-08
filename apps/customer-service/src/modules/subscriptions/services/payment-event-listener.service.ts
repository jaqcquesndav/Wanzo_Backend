import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { SubscriptionPlan } from '../entities/subscription.entity';

/**
 * Service pour écouter les événements Kafka de réponse du payment-service
 * Architecture: customer-service ← Kafka ← payment-service ← REST API ← SerdiPay
 */
@Injectable()
export class PaymentEventListenerService {
  private readonly logger = new Logger(PaymentEventListenerService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
  ) {}

  /**
   * Traite un événement de paiement initié reçu du payment-service
   * TODO: Décorer avec @EventPattern('subscription.payment.initiated')
   */
  async handleSubscriptionPaymentInitiated(eventData: any): Promise<void> {
    this.logger.log(`[KAFKA] Received subscription.payment.initiated: ${eventData.transactionId}`);

    try {
      // Enregistrer ou mettre à jour le statut local si nécessaire
      // Pour l'instant, juste logger l'événement
      this.logger.log(`Payment initiated for customer ${eventData.customerId}, transaction ${eventData.transactionId}`);
      
    } catch (error: any) {
      this.logger.error(`Error handling payment initiated event: ${error.message}`, error.stack);
    }
  }

  /**
   * Traite un événement de paiement réussi reçu du payment-service
   * Crée ou active l'abonnement du client
   * TODO: Décorer avec @EventPattern('subscription.payment.success')
   */
  async handleSubscriptionPaymentSuccess(eventData: any): Promise<void> {
    this.logger.log(`[KAFKA] Received subscription.payment.success: ${eventData.transactionId}`);

    try {
      const customer = await this.customerRepository.findOne({
        where: { id: eventData.customerId }
      });

      if (!customer) {
        this.logger.error(`Customer ${eventData.customerId} not found for successful payment`);
        return;
      }

      const plan = await this.planRepository.findOne({
        where: { id: eventData.planId }
      });

      if (!plan) {
        this.logger.error(`Plan ${eventData.planId} not found for successful payment`);
        return;
      }

      // Créer ou mettre à jour l'abonnement
      let subscription: Subscription;

      if (eventData.subscriptionId) {
        // Renouvellement d'un abonnement existant
        const existingSubscription = await this.subscriptionRepository.findOne({
          where: { id: eventData.subscriptionId }
        });

        if (existingSubscription) {
          subscription = existingSubscription;
          subscription.status = SubscriptionStatus.ACTIVE;
          subscription.startDate = new Date(eventData.billingPeriod.start);
          subscription.endDate = new Date(eventData.billingPeriod.end);
          subscription.lastPaymentDate = new Date(eventData.completedAt);
          subscription.lastPaymentAmount = parseFloat(eventData.amount);
          subscription.paymentReference = eventData.transactionId;
          subscription.updatedAt = new Date();
        } else {
          this.logger.error(`Subscription ${eventData.subscriptionId} not found for renewal`);
          return;
        }
      } else {
        // Nouvel abonnement
        subscription = this.subscriptionRepository.create({
          customerId: customer.id,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          startDate: new Date(eventData.billingPeriod.start),
          endDate: new Date(eventData.billingPeriod.end),
          amount: parseFloat(eventData.amount),
          currency: eventData.currency,
          paymentMethod: 'mobile_money',
          paymentReference: eventData.transactionId,
          autoRenew: false,
          
          // Nouvelle structure de tokens
          tokensIncluded: plan.includedTokens,
          tokensUsed: 0,
          tokensRemaining: plan.includedTokens,
          tokensRolloverAllowed: plan.tokenConfig?.rolloverAllowed || false,
          tokensRolloverLimit: plan.tokenConfig?.rolloverLimit,
          
          // Features et limites du plan
          subscriptionFeatures: plan.features,
          subscriptionLimits: plan.limits,
          tokenRates: plan.tokenConfig?.tokenRates,
          
          // Informations de facturation
          billingContactEmail: customer.email,
          lastPaymentDate: new Date(eventData.completedAt),
          lastPaymentAmount: parseFloat(eventData.amount),
          nextBillingDate: new Date(eventData.billingPeriod.end),
          nextPaymentAmount: parseFloat(eventData.amount),
          
          // Métadonnées
          createdBy: 'payment-service',
          metadata: {
            paymentTransactionId: eventData.transactionId,
            providerTransactionId: eventData.providerTransactionId,
            paymentMethod: 'mobile_money',
            telecom: eventData.metadata?.telecom,
            isRenewal: eventData.metadata?.isRenewal || false,
            source: 'subscription_payment'
          }
        });
      }

      const savedSubscription = await this.subscriptionRepository.save(subscription);
      
      this.logger.log(`Subscription ${savedSubscription.id} ${eventData.subscriptionId ? 'renewed' : 'created'} successfully for customer ${customer.id}`);

    } catch (error: any) {
      this.logger.error(`Error handling payment success event: ${error.message}`, error.stack);
    }
  }

  /**
   * Traite un événement de paiement échoué reçu du payment-service
   * TODO: Décorer avec @EventPattern('subscription.payment.failed')
   */
  async handleSubscriptionPaymentFailed(eventData: any): Promise<void> {
    this.logger.log(`[KAFKA] Received subscription.payment.failed: ${eventData.transactionId}`);

    try {
      // Gérer l'échec du paiement
      this.logger.warn(`Payment failed for customer ${eventData.customerId}: ${eventData.error}`);
      
      // TODO: Notifier le client, mettre en place des retry, etc.
      
    } catch (error: any) {
      this.logger.error(`Error handling payment failed event: ${error.message}`, error.stack);
    }
  }

  /**
   * Traite un événement de paiement en attente reçu du payment-service
   * TODO: Décorer avec @EventPattern('subscription.payment.pending')
   */
  async handleSubscriptionPaymentPending(eventData: any): Promise<void> {
    this.logger.log(`[KAFKA] Received subscription.payment.pending: ${eventData.transactionId}`);

    try {
      // Gérer l'état en attente
      this.logger.log(`Payment pending for customer ${eventData.customerId}, instructions: ${eventData.instructions}`);
      
      // TODO: Notifier le frontend via WebSocket ou autre mécanisme
      
    } catch (error: any) {
      this.logger.error(`Error handling payment pending event: ${error.message}`, error.stack);
    }
  }

  /**
   * Traite un événement de mise à jour de statut reçu du payment-service
   * TODO: Décorer avec @EventPattern('subscription.payment.status_update')
   */
  async handleSubscriptionPaymentStatusUpdate(eventData: any): Promise<void> {
    this.logger.log(`[KAFKA] Received subscription.payment.status_update: ${eventData.transactionId}`);

    try {
      // Mettre à jour le statut local si nécessaire
      this.logger.log(`Payment status updated for transaction ${eventData.transactionId}: ${eventData.oldStatus} → ${eventData.newStatus}`);
      
    } catch (error: any) {
      this.logger.error(`Error handling payment status update event: ${error.message}`, error.stack);
    }
  }
}