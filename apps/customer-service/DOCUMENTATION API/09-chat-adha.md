# Chat Adha - Assistant IA Intelligent 🤖

## 🎯 Vue d'Ensemble

Le système de chat Adha est un assistant IA intelligent intégré à Wanzo Land, offrant une expérience conversationnelle avancée avec support de contexte, historique des conversations et mode dégradé pour la résilience.

### Base URL
```
https://api.wanzo.cd/chat
```

**Note**: Configuration via `VITE_API_BASE_URL` avec fallback sur `https://api.wanzo.cd`

## 🏗️ Architecture des Données

### Interface Message de Chat

```typescript
interface ChatMessage {
  id: string;                           // Identifiant unique du message
  content: string;                      // Contenu textuel du message
  isBot: boolean;                       // true = message d'Adha, false = utilisateur
  timestamp: Date;                      // Horodatage du message
  status?: 'sending' | 'sent' | 'error'; // État du message
  metadata?: {
    conversationId?: string;            // ID de la conversation
    userId?: string;                    // ID de l'utilisateur
    sessionId?: string;                 // ID de session
  };
}
```

### Interface Conversation Complète

```typescript
interface ChatConversation {
  id: string;                           // Identifiant unique de la conversation
  messages: ChatMessage[];              // Liste des messages
  isActive: boolean;                    // Conversation active ou archivée
  startedAt: Date;                      // Date de début
  lastActivity: Date;                   // Dernière activité
  metadata?: {
    userId?: string;                    // Propriétaire de la conversation
    sessionId?: string;                 // Session associée
    context?: Record<string, any>;      // Contexte métier (entreprise, etc.)
  };
}
```

### État Global du Chat

```typescript
interface ChatState {
  isOpen: boolean;                      // Interface chat ouverte/fermée
  isMinimized: boolean;                 // Chat minimisé
  isTyping: boolean;                    // Indicateur de frappe (Adha)
  isConnected: boolean;                 // Connexion au backend IA
  currentConversation: ChatConversation | null; // Conversation active
  conversations: ChatConversation[];    // Historique des conversations
  unreadCount: number;                  // Messages non lus
  error?: string;                       // Erreur courante
}
```

## 📡 API Endpoints

### Base URL de Santé
```
GET /health
```

**Réponse** :
```typescript
{
  status: 200,
  body: { healthy: true }
}
```

### Envoi de Message
```
POST /chat/message
```

**Headers** :
```typescript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {access_token}',
  'Accept': 'application/json'
}
```

**Payload** :
```typescript
interface SendMessageRequest {
  message: string;                      // Message utilisateur
  conversationHistory: Array<{
    role: 'user' | 'assistant';         // Rôle dans la conversation
    content: string;                    // Contenu du message
    timestamp: string;                  // ISO 8601 timestamp
  }>;
  context: {
    userId?: string;                    // ID utilisateur Auth0
    sessionId?: string;                 // Session browser
    timestamp: string;                  // ISO 8601 timestamp
    platform: 'web';                   // Plateforme (toujours 'web')
    userAgent: string;                  // User-Agent du navigateur
    // Contexte métier optionnel
    companyId?: string;                 // ID entreprise si applicable
    userType?: 'sme' | 'financial_institution'; // Type d'utilisateur
    currentPage?: string;               // Page actuelle pour contexte
  };
}
```

**Réponse** :
```typescript
interface ChatApiResponse {
  success: boolean;
  message?: string;                     // Réponse d'Adha
  conversationId?: string;              // ID de conversation
  timestamp?: string;                   // ISO 8601 timestamp
  error?: string;                       // Message d'erreur si échec
  metadata?: {
    fallback?: boolean;                 // Mode dégradé activé
    reason?: string;                    // Raison du fallback
    confidence?: number;                // Confiance de l'IA (0-1)
    sources?: string[];                 // Sources utilisées par l'IA
  };
}
```

### Récupération d'Historique
```
GET /chat/conversations/{conversationId}
```

**Réponse** :
```typescript
{
  success: boolean;
  data: ChatConversation;
  metadata?: {
    messageCount: number;
    startDate: string;
    lastActivity: string;
  };
}
```

### Sauvegarde de Conversation
```
POST /chat/conversations
```

**Payload** :
```typescript
interface SaveConversationRequest {
  conversation: ChatConversation;
  metadata?: {
    tags?: string[];                    // Tags pour catégorisation
    summary?: string;                   // Résumé de la conversation
    satisfaction?: 1 | 2 | 3 | 4 | 5;  // Note de satisfaction
  };
}
```

### Suppression de Conversation
```
DELETE /chat/conversations/{conversationId}
```

**Réponse** :
```typescript
{
  success: boolean;
  message: "Conversation supprimée avec succès";
}
```

## 🔧 Configuration Avancée

### Configuration du Service

```typescript
interface ChatConfig {
  apiEndpoint: string;                  // '/api/chat'
  timeout: number;                      // 30000ms par défaut
  maxMessages: number;                  // Limite messages par conversation
  autoSave: boolean;                    // Sauvegarde automatique
  persistConversations: boolean;        // Persistance locale
  typingIndicatorDelay: number;         // Délai indicateur de frappe
  connectionTimeout: number;            // Timeout connexion
  retryAttempts: number;                // 3 tentatives par défaut
}
```

### Système de Retry et Fallback

Le service inclut un **système de résilience** :

1. **Retry automatique** : 3 tentatives avec délai progressif
2. **Mode dégradé** : Réponses de fallback quand l'IA est indisponible
3. **Détection de contexte** : Réponses adaptées selon le message utilisateur

**Exemples de réponses fallback** :
```typescript
// Réponse générale
"Je suis temporairement indisponible. Veuillez réessayer dans quelques instants."

// Contexte "aide"
"Je ne peux pas vous aider actuellement car je suis hors ligne. Essayez de recharger la page."

// Contexte "merci"
"De rien ! Bien que je sois temporairement indisponible, votre message a été enregistré."
```

## 🎨 Actions de l'Interface

### Types d'Actions Disponibles

```typescript
type ChatAction = 
  | { type: 'TOGGLE_CHAT' }             // Ouvre/ferme le chat
  | { type: 'MINIMIZE_CHAT' }           // Minimise l'interface
  | { type: 'OPEN_CHAT' }               // Ouvre explicitement
  | { type: 'CLOSE_CHAT' }              // Ferme explicitement
  | { type: 'START_TYPING' }            // Adha commence à taper
  | { type: 'STOP_TYPING' }             // Adha arrête de taper
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }           // Nouveau message
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessage> } } // Mise à jour
  | { type: 'SET_CONVERSATION'; payload: ChatConversation } // Change conversation
  | { type: 'RESET_CONVERSATION' }      // Réinitialise la conversation
  | { type: 'SET_ERROR'; payload: string }                 // Définit une erreur
  | { type: 'CLEAR_ERROR' }             // Efface l'erreur
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean };    // Statut connexion
```

## 🔐 Authentification et Sécurité

### Headers d'Authentification

Le service recherche les tokens dans cet ordre :
1. `localStorage.getItem('wanzo_auth_token')`
2. `localStorage.getItem('auth0_token')`

```typescript
// Headers automatiquement ajoutés
{
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}
```

### Gestion des Erreurs

```typescript
interface ChatError {
  type: 'network' | 'timeout' | 'auth' | 'server' | 'validation';
  message: string;
  code?: string;
  retryable: boolean;
  timestamp: Date;
}
```

**Erreurs retriables** :
- Erreurs réseau temporaires
- Timeouts de connexion
- Erreurs serveur 5xx

**Erreurs non-retriables** :
- Erreurs d'authentification (401)
- Erreurs de validation (400)
- Ressources non trouvées (404)

## 📊 Analytics et Événements

### Événements Trackés

```typescript
interface ChatEvent {
  type: 'message_sent' | 'message_received' | 'conversation_started' | 
        'conversation_reset' | 'error_occurred' | 'fallback_activated';
  timestamp: Date;
  data: {
    conversationId?: string;
    messageId?: string;
    userId?: string;
    sessionId?: string;
    errorType?: string;
    responseTime?: number;              // Temps de réponse en ms
    messageLength?: number;             // Longueur du message
    contextProvided?: boolean;          // Contexte métier fourni
  };
}
```

## 🎯 Exemples d'Usage

### Envoi d'un Message Simple

```typescript
const response = await chatApiService.sendMessage({
  content: "Bonjour Adha, peux-tu m'aider avec ma comptabilité ?",
  userId: "auth0|user123",
  sessionId: "session_456",
  context: {
    userType: 'sme',
    companyId: 'company_789',
    currentPage: '/dashboard'
  }
});
```

### Gestion d'une Conversation avec Historique

```typescript
const response = await chatApiService.sendMessage({
  content: "Continue notre discussion sur les finances",
  conversationHistory: [
    {
      role: 'user',
      content: 'Bonjour Adha',
      timestamp: '2025-11-06T10:00:00.000Z'
    },
    {
      role: 'assistant', 
      content: 'Bonjour ! Comment puis-je vous aider ?',
      timestamp: '2025-11-06T10:00:05.000Z'
    }
  ],
  context: { userType: 'sme' }
});
```

## 🚀 Intégration Frontend

### Hook Principal

```typescript
interface UseChatReturn {
  // État
  state: ChatState;
  
  // Actions principales
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  minimizeChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  resetConversation: () => void;
  
  // Utilitaires
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}
```

### Composant Chat Principal

Le chat est implémenté via `AdhaChat.tsx` avec :
- Interface responsive et moderne
- Indicateurs de frappe en temps réel
- Sauvegarde automatique des conversations
- Gestion d'état optimisée avec useReducer
- Support du mode plein écran

## 📋 Codes d'Erreur Spécifiques

| Code | Description | Action Recommandée |
|------|-------------|-------------------|
| `CHAT_001` | Service IA indisponible | Mode dégradé activé |
| `CHAT_002` | Token d'authentification expiré | Renouvellement automatique |
| `CHAT_003` | Limite de messages atteinte | Attendre la réinitialisation |
| `CHAT_004` | Conversation non trouvée | Créer nouvelle conversation |
| `CHAT_005` | Message trop long | Diviser le message |
| `CHAT_006` | Contexte invalide | Vérifier les données contextuelles |

## 💡 Bonnes Pratiques

### Performance
- Limiter l'historique à 50 messages maximum
- Utiliser la pagination pour les longues conversations
- Implémenter le debouncing pour les indicateurs de frappe

### UX/UI
- Afficher les indicateurs de statut de connexion
- Fournir des réponses de fallback contextuelles
- Sauvegarder l'état du chat dans localStorage

### Sécurité
- Valider tous les inputs utilisateur
- Nettoyer le contenu avant affichage
- Ne jamais stocker de tokens en plain text

---

**Version** : 2.0  
**Dernière mise à jour** : 6 novembre 2025  
**Statut** : ✅ Production Ready avec mode dégradé