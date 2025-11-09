import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

export interface CustomerSubscriptionCreatedEvent {
  subscriptionId: string;
  customerId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
  source: string;
  timestamp: string;
}

/**
 * Consumer pour traiter les événements de souscription en provenance du Customer Service
 * Permet la communication bidirectionnelle Customer Service → Admin Service
 */
@Injectable()
export class CustomerSubscriptionEventsConsumer {
  private readonly logger = new Logger(CustomerSubscriptionEventsConsumer.name);

  @EventPattern('admin-service.subscription.created')
  async handleCustomerSubscriptionCreated(@Payload() message: any) {
    try {
      this.logger.log('Handling customer subscription created event', message.value);
      const event: CustomerSubscriptionCreatedEvent = JSON.parse(message.value);

      // Traiter la notification de nouvelle souscription
      await this.processSubscriptionCreated(event);

      this.logger.log(`Successfully processed subscription ${event.subscriptionId} from customer service`);

    } catch (error) {
      this.logger.error('Error handling customer subscription created event', error);
    }
  }

  private async processSubscriptionCreated(event: CustomerSubscriptionCreatedEvent): Promise<void> {
    // Ici, on peut implémenter la logique métier pour traiter les nouvelles souscriptions
    // Par exemple :
    
    // 1. Mettre à jour les statistiques des plans
    this.logger.log(`Plan ${event.planId} now has a new subscription`);
    
    // 2. Déclencher des workflows automatiques
    if (event.amount > 1000) {
      this.logger.log(`High-value subscription created: ${event.subscriptionId} (${event.amount} ${event.currency})`);
      // Notifier l'équipe commerciale pour les gros comptes
    }
    
    // 3. Mettre à jour les métriques en temps réel
    this.logger.log(`Customer ${event.customerId} subscribed to plan ${event.planId} on ${event.startDate}`);
    
    // 4. Déclencher des actions de bienvenue ou d'onboarding
    if (event.metadata?.isFirstSubscription) {
      this.logger.log(`First subscription for customer ${event.customerId}, triggering welcome workflow`);
    }
    
    // 5. Auditer les changements pour compliance
    this.logger.log(`Subscription event logged for audit: ${event.subscriptionId}`);
  }

  @EventPattern('admin-service.subscription.cancelled')
  async handleCustomerSubscriptionCancelled(@Payload() message: any) {
    try {
      this.logger.log('Handling customer subscription cancelled event', message.value);
      const event = JSON.parse(message.value);

      // Traiter l'annulation
      this.logger.log(`Subscription ${event.subscriptionId} was cancelled by customer ${event.customerId}`);
      
      // Logique métier pour les annulations :
      // - Analyser les raisons d'annulation
      // - Déclencher des enquêtes de satisfaction
      // - Mettre à jour les prévisions de revenus
      // - Notifier les équipes concernées

    } catch (error) {
      this.logger.error('Error handling customer subscription cancelled event', error);
    }
  }

  @EventPattern('admin-service.subscription.renewed')
  async handleCustomerSubscriptionRenewed(@Payload() message: any) {
    try {
      this.logger.log('Handling customer subscription renewed event', message.value);
      const event = JSON.parse(message.value);

      // Traiter le renouvellement
      this.logger.log(`Subscription ${event.subscriptionId} was renewed by customer ${event.customerId}`);
      
      // Logique métier pour les renouvellements :
      // - Mettre à jour les prévisions de revenus
      // - Analyser les taux de rétention
      // - Déclencher des actions de fidélisation

    } catch (error) {
      this.logger.error('Error handling customer subscription renewed event', error);
    }
  }

  @EventPattern('admin-service.subscription.plan_changed')
  async handleCustomerSubscriptionPlanChanged(@Payload() message: any) {
    try {
      this.logger.log('Handling customer subscription plan changed event', message.value);
      const event = JSON.parse(message.value);

      // Traiter le changement de plan
      this.logger.log(`Customer ${event.customerId} changed from plan ${event.oldPlanId} to ${event.newPlanId}`);
      
      // Logique métier pour les changements de plan :
      // - Analyser les tendances d'upgrade/downgrade
      // - Mettre à jour les prévisions de revenus
      // - Déclencher des actions commerciales si nécessaire

    } catch (error) {
      this.logger.error('Error handling customer subscription plan changed event', error);
    }
  }
}