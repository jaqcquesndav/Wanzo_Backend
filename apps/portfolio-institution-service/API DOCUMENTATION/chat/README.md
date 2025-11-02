# Chat API

Ce document décrit les endpoints pour la gestion des conversations et messages dans l'API Wanzo Portfolio Institution.

## Types de données

Les types principaux utilisés dans l'API de chat:

```typescript
interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string;
  likes?: number;
  dislikes?: number;
  attachment?: {
    name: string;
    type: string;
    content: string;
  };
  error?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
  isActive: boolean;
  model: AIModel;
  context: string[];
}

interface AIModel {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  contextLength: number;
}
```

## Endpoints

### Envoyer un message

Envoie un message au système de chat.

#### Requête

```
POST /portfolio/api/v1/chat/messages
```

#### Corps de la requête

```json
{
  "content": "Bonjour, pouvez-vous me donner des informations sur le portefeuille PME?",
  "contextId": "ctx123",
  "metadata": {
    "portfolioId": "port456",
    "portfolioType": "traditional",
    "companyId": "comp789",
    "entityType": "portfolio",
    "entityId": "port456"
  }
}
```

#### Réponse

```json
{
  "id": "msg001",
  "content": "Bonjour, pouvez-vous me donner des informations sur le portefeuille PME?",
  "timestamp": "2025-07-25T12:00:00.000Z",
  "sender": "user",
  "contextId": "ctx123",
  "metadata": {
    "portfolioId": "port456",
    "portfolioType": "traditional"
  },
  "response": {
    "id": "msg002",
    "content": "Bonjour! Je serais ravi de vous aider. Le portefeuille PME contient actuellement 15 entreprises avec un encours total de 2.5M€. Souhaitez-vous des informations plus détaillées?",
    "timestamp": "2025-07-25T12:00:02.000Z",
    "sender": "assistant",
    "attachments": []
  }
}
```

### Récupérer l'historique des messages

Récupère l'historique des messages pour un contexte spécifique.

#### Requête

```
GET /portfolio/api/v1/chat/contexts/{contextId}/messages
```

#### Paramètres de chemin
- `contextId` : Identifiant unique du contexte de chat

#### Paramètres de requête
- `limit` (optionnel) : Nombre maximum de messages à récupérer
- `before` (optionnel) : Récupérer les messages avant cette date/ID
- `after` (optionnel) : Récupérer les messages après cette date/ID

#### Réponse

```json
{
  "messages": [
    {
      "id": "msg001",
      "content": "Bonjour, pouvez-vous me donner des informations sur le portefeuille PME?",
      "timestamp": "2025-07-25T12:00:00.000Z",
      "sender": "user",
      "contextId": "ctx123",
      "metadata": {
        "portfolioId": "port456",
        "portfolioType": "traditional"
      }
    },
    {
      "id": "msg002",
      "content": "Bonjour! Je serais ravi de vous aider. Le portefeuille PME contient actuellement 15 entreprises avec un encours total de 2.5M€. Souhaitez-vous des informations plus détaillées?",
      "timestamp": "2025-07-25T12:00:02.000Z",
      "sender": "assistant",
      "contextId": "ctx123"
    },
    {
      "id": "msg003",
      "content": "Oui, pouvez-vous me donner la répartition par secteur d'activité?",
      "timestamp": "2025-07-25T12:01:30.000Z",
      "sender": "user",
      "contextId": "ctx123"
    }
  ],
  "hasMore": true,
  "nextCursor": "msg004"
}
```

### Créer un nouveau contexte de chat

Crée un nouveau contexte de conversation.

#### Requête

```
POST /portfolio/api/v1/chat/contexts
```

#### Corps de la requête

```json
{
  "title": "Analyse du portefeuille PME",
  "metadata": {
    "portfolioId": "port456",
    "portfolioType": "traditional",
    "companyId": "comp789"
  }
}
```

#### Réponse

```json
{
  "id": "ctx123",
  "title": "Analyse du portefeuille PME",
  "created_at": "2025-07-25T12:00:00.000Z",
  "updated_at": "2025-07-25T12:00:00.000Z",
  "metadata": {
    "portfolioId": "port456",
    "portfolioType": "traditional",
    "companyId": "comp789"
  }
}
```

### Récupérer un contexte de chat

Récupère les détails d'un contexte de chat par son ID.

#### Requête

```
GET /portfolio/api/v1/chat/contexts/{id}
```

#### Paramètres de chemin
- `id` : Identifiant unique du contexte de chat

#### Réponse

```json
{
  "id": "ctx123",
  "title": "Analyse du portefeuille PME",
  "created_at": "2025-07-25T12:00:00.000Z",
  "updated_at": "2025-07-25T12:01:30.000Z",
  "metadata": {
    "portfolioId": "port456",
    "portfolioType": "traditional",
    "companyId": "comp789"
  },
  "messageCount": 3,
  "lastMessage": {
    "content": "Oui, pouvez-vous me donner la répartition par secteur d'activité?",
    "timestamp": "2025-07-25T12:01:30.000Z",
    "sender": "user"
  }
}
```

### Récupérer tous les contextes de chat

Récupère tous les contextes de chat de l'utilisateur.

#### Requête

```
GET /portfolio/api/v1/chat/contexts
```

#### Paramètres de requête
- `limit` (optionnel) : Nombre maximum de contextes à récupérer
- `offset` (optionnel) : Nombre de contextes à ignorer
- `search` (optionnel) : Terme de recherche
- `portfolioId` (optionnel) : Filtrer par ID de portefeuille
- `companyId` (optionnel) : Filtrer par ID d'entreprise

#### Réponse

```json
{
  "contexts": [
    {
      "id": "ctx123",
      "title": "Analyse du portefeuille PME",
      "created_at": "2025-07-25T12:00:00.000Z",
      "updated_at": "2025-07-25T12:01:30.000Z",
      "metadata": {
        "portfolioId": "port456",
        "portfolioType": "traditional",
        "companyId": "comp789"
      },
      "messageCount": 3,
      "lastMessage": {
        "content": "Oui, pouvez-vous me donner la répartition par secteur d'activité?",
        "timestamp": "2025-07-25T12:01:30.000Z",
        "sender": "user"
      }
    },
    {
      "id": "ctx124",
      "title": "Analyse des risques",
      "created_at": "2025-07-24T15:30:00.000Z",
      "updated_at": "2025-07-24T15:45:00.000Z",
      "metadata": {
        "portfolioId": "port789",
        "portfolioType": "investment"
      },
      "messageCount": 5,
      "lastMessage": {
        "content": "Merci pour ces informations détaillées.",
        "timestamp": "2025-07-24T15:45:00.000Z",
        "sender": "user"
      }
    }
  ],
  "total": 10,
  "limit": 2,
  "offset": 0
}
```

### Mettre à jour un contexte de chat

Met à jour les détails d'un contexte de chat existant.

#### Requête

```
PUT /portfolio/api/v1/chat/contexts/{id}
```

#### Paramètres de chemin
- `id` : Identifiant unique du contexte de chat

#### Corps de la requête

```json
{
  "title": "Analyse approfondie du portefeuille PME",
  "metadata": {
    "priority": "high"
  }
}
```

#### Réponse

```json
{
  "id": "ctx123",
  "title": "Analyse approfondie du portefeuille PME",
  "updated_at": "2025-07-25T12:10:00.000Z",
  "metadata": {
    "portfolioId": "port456",
    "portfolioType": "traditional",
    "companyId": "comp789",
    "priority": "high"
  }
}
```

### Supprimer un contexte de chat

Supprime un contexte de chat et tous ses messages.

#### Requête

```
DELETE /portfolio/api/v1/chat/contexts/{id}
```

#### Paramètres de chemin
- `id` : Identifiant unique du contexte de chat

#### Réponse

```
204 No Content
```

### Récupérer des suggestions de chat

Récupère des suggestions de questions ou de sujets basés sur le contexte actuel.

#### Requête

```
GET /portfolio/api/v1/chat/suggestions
```

#### Paramètres de requête
- `contextId` (optionnel) : ID du contexte de chat
- `portfolioId` (optionnel) : ID du portefeuille
- `portfolioType` (optionnel) : Type de portefeuille (traditional, investment, leasing)
- `companyId` (optionnel) : ID de l'entreprise
- `currentScreenPath` (optionnel) : Chemin de l'écran actuel

#### Réponse

```json
{
  "suggestions": [
    {
      "id": "sug1",
      "text": "Quelle est la répartition sectorielle du portefeuille?",
      "category": "analyse",
      "relevance": 0.95
    },
    {
      "id": "sug2",
      "text": "Quels sont les principaux risques identifiés?",
      "category": "risque",
      "relevance": 0.85
    },
    {
      "id": "sug3",
      "text": "Pouvez-vous me montrer l'évolution des performances sur les 12 derniers mois?",
      "category": "performance",
      "relevance": 0.80
    }
  ]
}
```

### Générer un rapport de chat

Génère un rapport basé sur les conversations de chat.

#### Requête

```
POST /portfolio/api/v1/chat/reports
```

#### Corps de la requête

```json
{
  "contextId": "ctx123",
  "title": "Rapport d'analyse du portefeuille PME",
  "format": "pdf",
  "includeMetadata": true
}
```

#### Réponse

```json
{
  "id": "rep123",
  "title": "Rapport d'analyse du portefeuille PME",
  "format": "pdf",
  "url": "https://api.wanzo.com/reports/rep123.pdf",
  "generated_at": "2025-07-25T12:15:00.000Z",
  "size": 245678
}
```

### Récupérer des réponses prédéfinies

Récupère des réponses prédéfinies pour le chat, optionnellement filtrées par catégorie.

#### Requête

```
GET /portfolio/api/v1/chat/predefined-responses
```

#### Paramètres de requête
- `category` (optionnel) : Catégorie de réponses (ex: risque, performance, analyse)

#### Réponse

```json
{
  "responses": [
    {
      "id": "resp1",
      "title": "Analyse des ratios financiers",
      "content": "Voici une analyse détaillée des ratios financiers de l'entreprise...",
      "category": "analyse",
      "tags": ["ratios", "financier", "analyse"]
    },
    {
      "id": "resp2",
      "title": "Explication du scoring de risque",
      "content": "Le scoring de risque est calculé en fonction des paramètres suivants...",
      "category": "risque",
      "tags": ["scoring", "risque", "méthodologie"]
    }
  ],
  "categories": ["analyse", "risque", "performance", "crédit", "leasing", "investissement"]
}
```

### Évaluer un message

Enregistre une évaluation pour une réponse de chat.

#### Requête

```
POST /portfolio/api/v1/chat/messages/{messageId}/rating
```

#### Paramètres de chemin
- `messageId` : Identifiant unique du message

#### Corps de la requête

```json
{
  "score": 4,
  "feedback": "Réponse très utile mais pourrait être plus détaillée"
}
```

#### Réponse

```json
{
  "id": "rat123",
  "messageId": "msg002",
  "score": 4,
  "feedback": "Réponse très utile mais pourrait être plus détaillée",
  "timestamp": "2025-07-25T12:20:00.000Z"
}
```

### Ajouter une pièce jointe à un message

Ajoute une pièce jointe à un message.

#### Requête

```
POST /portfolio/api/v1/chat/messages/{messageId}/attachments
```

#### Paramètres de chemin
- `messageId` : Identifiant unique du message

#### Corps de la requête
FormData contenant le fichier à télécharger.

#### Réponse

```json
{
  "id": "att123",
  "messageId": "msg001",
  "type": "application/pdf",
  "url": "https://api.wanzo.com/attachments/att123.pdf",
  "name": "rapport_analyse.pdf",
  "size": 123456,
  "uploaded_at": "2025-07-25T12:25:00.000Z"
}
```

## Implémentation technique

Les endpoints ci-dessus sont implémentés dans le module `chat.api.ts` qui fournit les fonctions suivantes:

- `sendMessage(message)`: Envoie un message au système de chat
- `getMessageHistory(contextId, params)`: Récupère l'historique des messages pour un contexte
- `createContext(data)`: Crée un nouveau contexte de chat
- `getContextById(id)`: Récupère un contexte de chat par son ID
- `getAllContexts(params)`: Récupère tous les contextes de chat
- `updateContext(id, updates)`: Met à jour un contexte de chat
- `deleteContext(id)`: Supprime un contexte de chat
- `getChatSuggestions(contextId, data)`: Récupère des suggestions de chat
- `generateChatReport(params)`: Génère un rapport basé sur les conversations
- `getPredefinedResponses(category)`: Récupère des réponses prédéfinies
- `rateMessage(messageId, rating)`: Évalue un message
- `addAttachment(messageId, file)`: Ajoute une pièce jointe à un message

Les modèles d'IA disponibles sont définis dans le module `chat.ts` et incluent:

1. Adha Crédit - Spécialisé en gestion de crédits et analyse de risques
2. Adha Prospection - Analyse des opportunités de marché et ciblage client
3. Adha Leasing - Expert en contrats de leasing et gestion d'équipements
4. Adha Invest - Spécialisé en capital-investissement et valorisation
5. Adha Analytics - Analyse approfondie des données financières et prévisions

## Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide ou paramètres manquants |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 404  | Ressource non trouvée |
| 422  | Entité non traitable - Validation échouée |
| 429  | Trop de requêtes - Limite de taux dépassée |
| 500  | Erreur serveur interne |
