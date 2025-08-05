import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SubscriptionEventTopics } from '@wanzo/shared/events/kafka-config';

/**
 * Consumer désactivé - les souscriptions sont gérées centralement par customer-service
 * Ce fichier est conservé uniquement comme consommateur d'événements passif pour
 * éviter des erreurs lors du lancement du service
 */
@Injectable()
export class SubscriptionEventsConsumer {
  private readonly logger = new Logger('SubscriptionEventsConsumer-Disabled');
  
  constructor() {
    this.logger.warn('Le SubscriptionEventsConsumer est désactivé - toute la gestion des souscriptions est centralisée dans customer-service');
  }

  @MessagePattern(SubscriptionEventTopics.SUBSCRIPTION_CREATED)
  async handleSubscriptionCreated(@Payload() event: any): Promise<void> {
    this.logger.log('Les événements de souscription sont désactivés - souscriptions gérées par customer-service');
    return;
  }

  @MessagePattern(SubscriptionEventTopics.SUBSCRIPTION_EXPIRED)
  async handleSubscriptionExpired(@Payload() event: any): Promise<void> {
    this.logger.log('Les événements de souscription sont désactivés - souscriptions gérées par customer-service');
    return;
  }

  @MessagePattern(SubscriptionEventTopics.SUBSCRIPTION_STATUS_CHANGED)
  async handleSubscriptionStatusChanged(@Payload() event: any): Promise<void> {
    this.logger.log('Les événements de souscription sont désactivés - souscriptions gérées par customer-service');
    return;
  }
}
