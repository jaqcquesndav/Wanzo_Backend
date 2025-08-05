import { Injectable } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TokenEventTopics, TokenTransactionEvent } from '@wanzo/shared/events/kafka-config';
import { Logger } from '@nestjs/common';

// Définition locale pour remplacer la référence à l'entité supprimée
enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended'
}

@Controller()
@Injectable()
export class TokenEventsConsumer {
  private readonly logger = new Logger(TokenEventsConsumer.name);

  constructor() {
    this.logger.warn('TokenEventsConsumer est désactivé - les références aux souscriptions ont été supprimées');
  }

  @MessagePattern(TokenEventTopics.TOKEN_PURCHASE)
  async handleTokenPurchase(@Payload() event: TokenTransactionEvent): Promise<void> {
    this.logger.log(`Received token purchase event: ${JSON.stringify(event)} - DÉSACTIVÉ`);
    
    // Méthode désactivée car les jetons Adha sont maintenant gérés dans le service Adha-ai-service
    // La fonction est maintenue pour recevoir les événements sans erreur, mais ne fait rien
    try {
      if (event.entityType !== 'pme') {
        this.logger.log(`Ignoring non-PME token event for entity type: ${event.entityType}`);
        return;
      }

      this.logger.log(`Traitement des jetons Adha désactivé dans ce service. L'événement d'achat de ${event.amount} jetons pour l'utilisateur ${event.userId} a été ignoré.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error handling token purchase';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error handling token purchase: ${errorMessage}`, errorStack);
    }
  }

  @MessagePattern(TokenEventTopics.TOKEN_USAGE)
  async handleTokenUsage(@Payload() event: TokenTransactionEvent): Promise<void> {
    this.logger.log(`Received token usage event: ${JSON.stringify(event)} - DÉSACTIVÉ`);
    
    // Méthode désactivée car les jetons Adha sont maintenant gérés dans le service Adha-ai-service
    // La fonction est maintenue pour recevoir les événements sans erreur, mais ne fait rien
    try {
      if (event.entityType !== 'pme') {
        this.logger.log(`Ignoring non-PME token event for entity type: ${event.entityType}`);
        return;
      }
      
      this.logger.log(`Traitement des jetons Adha désactivé dans ce service. L'événement d'utilisation de ${event.amount} jetons pour l'utilisateur ${event.userId} a été ignoré.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error handling token usage';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error handling token usage: ${errorMessage}`, errorStack);
    }
  }
}
