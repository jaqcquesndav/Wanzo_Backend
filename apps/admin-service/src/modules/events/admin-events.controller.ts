import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { CustomersService } from '../customers/services/customers.service';
import { FinanceService } from '../finance/services/finance.service';
import { UsersService } from '../users/services/users.service';

/**
 * AdminEventsController - Écoute les événements Kafka entrants
 * Permet à Admin Service de réagir aux demandes d'autres services
 */
@Controller()
export class AdminEventsController {
  private readonly logger = new Logger(AdminEventsController.name);

  constructor(
    private readonly customersService: CustomersService,
    private readonly financeService: FinanceService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Écoute les demandes de validation de client
   */
  @EventPattern('customer.validation.requested')
  async handleCustomerValidationRequest(
    @Payload() data: {
      customerId: string;
      requestedBy: string;
      requestId: string;
      documents?: string[];
    },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Received customer validation request: ${data.customerId}`);
    
    try {
      // Traiter la demande de validation
      const customer = await this.customersService.findOne(data.customerId);
      
      if (customer) {
        // Logique de validation automatique ou notification aux admins
        this.logger.log(`Processing validation for customer ${data.customerId}`);
        
        // TODO: Implémenter logique de validation
        // - Vérifier les documents
        // - Vérifier les informations
        // - Marquer comme validé ou en attente
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process validation request: ${err.message}`);
    }
  }

  /**
   * Écoute les demandes de génération de facture
   */
  @EventPattern('accounting.invoice.generation.requested')
  async handleInvoiceGenerationRequest(
    @Payload() data: {
      customerId: string;
      subscriptionId?: string;
      amount: number;
      currency: string;
      dueDate: string;
      requestedBy: string;
    },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Received invoice generation request for customer ${data.customerId}`);
    
    try {
      // Générer la facture automatiquement
      const invoice = await this.financeService.createInvoice({
        customerId: data.customerId,
        dueDate: data.dueDate,
        currency: data.currency,
        items: [{
          description: `Subscription charge${data.subscriptionId ? ` - ${data.subscriptionId}` : ''}`,
          quantity: 1,
          unitPrice: data.amount,
          subtotal: data.amount,
        }],
      });
      
      this.logger.log(`Invoice ${invoice.id} generated successfully`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to generate invoice: ${err.message}`);
    }
  }

  /**
   * Écoute les alertes de tokens faibles
   */
  @EventPattern('token.low.alert')
  async handleLowTokenAlert(
    @Payload() data: {
      customerId: string;
      currentTokens: number;
      threshold: number;
      subscriptionId?: string;
    },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Low token alert for customer ${data.customerId}: ${data.currentTokens} tokens remaining`);
    
    try {
      // Notifier les admins ou prendre des actions automatiques
      // TODO: Implémenter notifications
      this.logger.warn(`Customer ${data.customerId} has only ${data.currentTokens} tokens remaining`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to handle low token alert: ${err.message}`);
    }
  }

  /**
   * Écoute les échecs de paiement
   */
  @EventPattern('subscription.payment.failed')
  async handlePaymentFailed(
    @Payload() data: {
      subscriptionId: string;
      customerId: string;
      amount: number;
      currency: string;
      failureReason: string;
      attemptNumber: number;
    },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Payment failed for subscription ${data.subscriptionId}`);
    
    try {
      // Gérer l'échec de paiement
      // - Suspendre l'abonnement après X tentatives
      // - Notifier le client et les admins
      // - Créer une alerte dans le système
      
      if (data.attemptNumber >= 3) {
        this.logger.warn(`Subscription ${data.subscriptionId} will be suspended after 3 failed payment attempts`);
        // TODO: Suspendre l'abonnement
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to handle payment failure: ${err.message}`);
    }
  }

  /**
   * Écoute les demandes d'ajustement de tokens
   */
  @EventPattern('token.adjustment.requested')
  async handleTokenAdjustmentRequest(
    @Payload() data: {
      customerId: string;
      amount: number;
      reason: string;
      requestedBy: string;
      subscriptionId?: string;
    },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Token adjustment requested for customer ${data.customerId}: ${data.amount} tokens`);
    
    try {
      // Traiter l'ajustement de tokens
      // TODO: Implémenter logique d'ajustement
      this.logger.log(`Token adjustment processed for customer ${data.customerId}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process token adjustment: ${err.message}`);
    }
  }

  /**
   * Écoute les demandes de modification de plan
   */
  @EventPattern('subscription.plan.change.requested')
  async handlePlanChangeRequest(
    @Payload() data: {
      subscriptionId: string;
      customerId: string;
      currentPlanId: string;
      newPlanId: string;
      requestedBy: string;
      effectiveDate: string;
    },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Plan change requested: subscription ${data.subscriptionId} from ${data.currentPlanId} to ${data.newPlanId}`);
    
    try {
      // Traiter le changement de plan
      await this.financeService.updateSubscription(data.subscriptionId, {
        planId: data.newPlanId,
      });
      
      this.logger.log(`Plan changed successfully for subscription ${data.subscriptionId}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to change plan: ${err.message}`);
    }
  }

  /**
   * Écoute les demandes de renouvellement d'abonnement
   */
  @EventPattern('subscription.renewal.due')
  async handleSubscriptionRenewalDue(
    @Payload() data: {
      subscriptionId: string;
      customerId: string;
      planId: string;
      amount: number;
      currency: string;
      renewalDate: string;
    },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Subscription renewal due: ${data.subscriptionId}`);
    
    try {
      // Générer facture de renouvellement
      const invoice = await this.financeService.createInvoice({
        customerId: data.customerId,
        dueDate: data.renewalDate,
        currency: data.currency,
        items: [{
          description: `Subscription renewal - ${data.subscriptionId}`,
          quantity: 1,
          unitPrice: data.amount,
          subtotal: data.amount,
        }],
      });
      
      this.logger.log(`Renewal invoice ${invoice.id} created for subscription ${data.subscriptionId}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to create renewal invoice: ${err.message}`);
    }
  }

  /**
   * Écoute les notifications d'expiration d'abonnement
   */
  @EventPattern('subscription.expiring.soon')
  async handleSubscriptionExpiringSoon(
    @Payload() data: {
      subscriptionId: string;
      customerId: string;
      expiryDate: string;
      daysRemaining: number;
    },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Subscription ${data.subscriptionId} expiring in ${data.daysRemaining} days`);
    
    try {
      // Notifier les admins et le client
      // TODO: Implémenter notifications
      this.logger.warn(`Subscription ${data.subscriptionId} will expire on ${data.expiryDate}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to handle expiry notification: ${err.message}`);
    }
  }
}
