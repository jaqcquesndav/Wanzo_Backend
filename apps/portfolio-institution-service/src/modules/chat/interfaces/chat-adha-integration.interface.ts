/**
 * Méthodes d'intégration avec Adha AI pour le service de chat
 */
import { Chat } from '../entities/chat.entity';
import { ChatMessage } from '../entities/chat-message.entity';

export interface ChatServiceAdhaIntegration {
  /**
   * Envoie un message utilisateur à Adha AI via Kafka
   */
  sendMessageToAdhaAI(chat: Chat, message: ChatMessage, userId: string): Promise<void>;
  
  /**
   * Configure les consommateurs pour recevoir les réponses d'Adha AI
   */
  setupAdhaAIConsumers(): void;
}
