/**
 * Rôles utilisateur pour les événements Adha
 * Ces rôles doivent correspondre à ceux définis dans les applications
 */
export enum SharedUserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant',
  CASHIER = 'cashier',
  SALES = 'sales',
  INVENTORY_MANAGER = 'inventory_manager',
  STAFF = 'staff',
  CUSTOMER_SUPPORT = 'customer_support',
}

/**
 * Sujets d'événements liés au chat Adha
 */
export enum AdhaEventTopics {
  // Événements du service de gestion commerciale vers Adha AI
  CHAT_MESSAGE_SENT = 'adha.chat.message.sent',
  // Événements d'Adha AI vers le service de gestion commerciale
  CHAT_RESPONSE_READY = 'adha.chat.response.ready',
}

/**
 * Interface pour l'événement d'envoi de message à Adha
 */
export interface AdhaMessageSentEvent {
  id: string; // ID unique du message
  conversationId?: string; // ID de la conversation (optionnel pour les nouvelles conversations)
  message: string; // Texte du message
  timestamp: Date; // Horodatage de l'envoi
  // Contexte utilisateur
  userId: string; // ID de l'utilisateur qui envoie le message
  companyId: string; // ID de l'entreprise de l'utilisateur
  userRole: SharedUserRole; // Rôle de l'utilisateur
  // Informations contextuelles
  contextInfo?: {
    // Informations spécifiques au domaine commercial
    operationType?: string; // Type d'opération commerciale liée (vente, achat, etc.)
    operationId?: string; // ID de l'opération commerciale liée
    clientId?: string; // ID du client concerné
    productId?: string; // ID du produit concerné
    mode?: string; // Mode de chat (standard, comptable, etc.)
    // Autres informations contextuelles
    location?: string;
    [key: string]: any; // Autres informations contextuelles
  };
  metadata?: Record<string, any>; // Métadonnées supplémentaires
}

/**
 * Interface pour l'événement de réponse d'Adha
 */
export interface AdhaResponseReadyEvent {
  id: string; // ID unique de la réponse
  requestMessageId: string; // ID du message de l'utilisateur auquel cette réponse répond
  conversationId: string; // ID de la conversation
  response: string; // Texte de la réponse
  timestamp: Date; // Horodatage de la réponse
  // Contexte utilisateur (repris du message envoyé)
  userId: string; // ID de l'utilisateur destinataire
  companyId: string; // ID de l'entreprise de l'utilisateur
  // Métadonnées de traitement
  processingDetails?: {
    tokensUsed?: number; // Nombre de tokens utilisés pour générer cette réponse
    processingTime?: number; // Temps de traitement en ms
    aiModel?: string; // Modèle utilisé pour la réponse
  };
  // Informations générées par l'IA
  relevantEntries?: Array<any>; // Entrées pertinentes trouvées dans la base de connaissances
  suggestedActions?: Array<{
    type: string; // Type d'action suggérée (création d'écriture comptable, etc.)
    payload: any; // Données pour l'action
  }>;
  metadata?: Record<string, any>; // Métadonnées supplémentaires
}
