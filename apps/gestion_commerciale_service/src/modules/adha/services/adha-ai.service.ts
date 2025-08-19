import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EventsService } from '../../events/events.service';
import { AdhaEventTopics, AdhaMessageSentEvent, AdhaResponseReadyEvent, SharedUserRole } from '@wanzobe/shared/events/adha-events';
import { ClientKafka } from '@nestjs/microservices';
import { GESTION_COMMERCIALE_KAFKA_PRODUCER_SERVICE } from '../../events/kafka-producer.module';

@Injectable()
export class AdhaAiService implements OnModuleInit {
  private readonly logger = new Logger(AdhaAiService.name);
  private readonly responseCallbacks = new Map<string, (response: AdhaResponseReadyEvent) => void>();

  constructor(
    private readonly eventsService: EventsService,
    @Inject(GESTION_COMMERCIALE_KAFKA_PRODUCER_SERVICE) private readonly eventsClient: ClientKafka,
  ) {}

  /**
   * Initialise le service et configure les listeners pour les réponses Adha AI
   */
  async onModuleInit() {
    this.logger.log('Initializing Adha AI service with Kafka communication');
    
    // S'abonner au topic des réponses Adha AI
    this.eventsClient.subscribeToResponseOf(AdhaEventTopics.CHAT_RESPONSE_READY);
  }

  /**
   * Gère les réponses de l'assistant Adha AI
   * @param response La réponse reçue
   */
  private handleAdhaResponse(response: AdhaResponseReadyEvent) {
    this.logger.debug(`Received response from Adha AI for message ${response.requestMessageId}`);

    // Vérifier si nous avons un callback en attente pour cette réponse
    const callback = this.responseCallbacks.get(response.requestMessageId);
    if (callback) {
      callback(response);
      this.responseCallbacks.delete(response.requestMessageId);
    } else {
      this.logger.warn(`No callback found for response to message ${response.requestMessageId}`);
    }
  }

  /**
   * Envoie un message à l'assistant Adha AI
   * @param message Le message à envoyer
   * @param conversationId ID de la conversation (optionnel pour nouvelle conversation)
   * @param contextInfo Informations contextuelles pour l'IA
   * @param userId ID de l'utilisateur
   * @param companyId ID de la compagnie
   * @param userRole Rôle de l'utilisateur
   * @returns Une promesse qui se résout avec la réponse
   */
  async sendMessage(
    message: string,
    conversationId: string | undefined,
    contextInfo: any,
    userId: string,
    companyId: string,
    userRole: string
  ): Promise<AdhaResponseReadyEvent> {
    const messageId = uuidv4();

    // Convertir le rôle utilisateur en SharedUserRole
    let sharedUserRole: SharedUserRole;
    switch (userRole.toLowerCase()) {
      case 'owner':
        sharedUserRole = SharedUserRole.OWNER;
        break;
      case 'admin':
        sharedUserRole = SharedUserRole.ADMIN;
        break;
      case 'manager':
        sharedUserRole = SharedUserRole.MANAGER;
        break;
      case 'accountant':
        sharedUserRole = SharedUserRole.ACCOUNTANT;
        break;
      case 'cashier':
        sharedUserRole = SharedUserRole.CASHIER;
        break;
      case 'sales':
        sharedUserRole = SharedUserRole.SALES;
        break;
      case 'inventory_manager':
        sharedUserRole = SharedUserRole.INVENTORY_MANAGER;
        break;
      case 'customer_support':
        sharedUserRole = SharedUserRole.CUSTOMER_SUPPORT;
        break;
      default:
        sharedUserRole = SharedUserRole.STAFF; // Rôle par défaut
    }

    // Créer l'événement à envoyer
    const event: AdhaMessageSentEvent = {
      id: messageId,
      conversationId,
      message,
      timestamp: new Date(),
      userId,
      companyId,
      userRole: sharedUserRole,
      contextInfo: {
        ...contextInfo,
        mode: 'chat', // Mode standard de chat
        source: 'gestion_commerciale',
      },
      metadata: {
        source: 'gestion_commerciale_service',
        timestamp: new Date().toISOString(),
      }
    };

    // Créer une promesse qui sera résolue quand la réponse arrivera
    const responsePromise = new Promise<AdhaResponseReadyEvent>((resolve) => {
      // Enregistrer le callback pour cette requête spécifique
      this.responseCallbacks.set(messageId, resolve);

      // Mettre un timeout pour éviter que la promesse reste en attente indéfiniment
      setTimeout(() => {
        if (this.responseCallbacks.has(messageId)) {
          this.logger.warn(`No response received from Adha AI for message ${messageId} after 30 seconds`);
          this.responseCallbacks.delete(messageId);
          resolve({
            id: uuidv4(),
            requestMessageId: messageId,
            conversationId: conversationId || uuidv4(),
            response: "Je suis désolé, je n'ai pas pu traiter votre demande dans un délai raisonnable. Veuillez réessayer plus tard.",
            timestamp: new Date(),
            userId,
            companyId,
            metadata: {
              error: 'timeout',
              source: 'gestion_commerciale_service'
            }
          });
        }
      }, 30000); // 30 secondes de timeout
    });

    // Envoyer l'événement
    try {
      this.logger.debug(`Sending message to Adha AI: ${message}`);
      this.eventsClient.emit(AdhaEventTopics.CHAT_MESSAGE_SENT, event);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error sending message to Adha AI: ${errorMessage}`, 
        error instanceof Error ? error.stack : undefined);
      throw new Error(`Erreur lors de l'envoi du message à l'assistant Adha: ${errorMessage}`);
    }

    // Attendre la réponse
    return responsePromise;
  }
}
