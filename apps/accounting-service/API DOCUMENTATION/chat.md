# Chat ADHA API Documentation

Ce document décrit l'API Chat ADHA pour l'application Wanzo Compta. Le système de chat ADHA (Assistant Digital en Haut niveau d'Analyse) permet l'interaction avec l'assistant IA comptable.

**⚠️ IMPORTANT**: Cette documentation décrit l'API cible pour une future implémentation backend. Actuellement, le chat fonctionne avec des données mock et du stockage local via Zustand et localStorage.

## Base URL

```
http://localhost:8000/accounting
```

## Authentication

All endpoints require authentication with a Bearer token.

**Required Headers:**
```
Authorization: Bearer <jwt_token>
X-Accounting-Client: Wanzo-Accounting-UI/1.0.0
Content-Type: application/json
```

## État Actuel vs API Future

### État Actuel (Implémentation Frontend)
- **Stockage**: localStorage + Zustand store
- **IA**: Réponses simulées avec patterns de mots-clés
- **Modèles**: 3 modèles prédéfinis (Adha 1, Adha Fisk, Adha O1)
- **Mode Write**: Hook `useAdhaWriteMode` pour basculer entre modes
- **Conversations**: Gestion locale avec `useChatStore`

### API Future (À Implémenter)
L'API décrite ci-dessous devra être implémentée pour remplacer le système mock actuel.

## Data Structures (Actuelles dans le Code)

### Message

```typescript
interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string; // ISO 8601 format
  likes?: number;
  dislikes?: number;
  isEditing?: boolean;
  attachment?: {
    name: string;
    type: string;
    content: string; // base64
  };
}
```

### Conversation

```typescript
interface Conversation {
  id: string;
  title: string;
  timestamp: string; // ISO 8601 format
  messages: Message[];
  isActive: boolean;
  model: AIModel;
  context: string[];
}
```

### AIModel

```typescript
interface AIModel {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  contextLength: number;
}

// Modèles actuellement définis
const AI_MODELS = [
  {
    id: 'adha-1',
    name: 'Adha 1',
    description: 'Modèle de base pour la comptabilité générale',
    capabilities: ['Comptabilité générale', 'Écritures simples', 'Rapprochements'],
    contextLength: 4096
  },
  {
    id: 'adha-fisk',
    name: 'Adha Fisk',
    description: 'Spécialisé en fiscalité et déclarations',
    capabilities: ['Fiscalité', 'TVA', 'Déclarations fiscales', 'Optimisation fiscale'],
    contextLength: 8192
  },
  {
    id: 'adha-o1',
    name: 'Adha O1',
    description: 'Version avancée pour l\'analyse financière',
    capabilities: ['Analyse financière', 'Ratios', 'Prévisions', 'Tableaux de bord'],
    contextLength: 16384
  }
];
```

## Implémentation Actuelle (Frontend Only)

### Hooks Utilisés
- `useChatStore`: Store Zustand pour gérer l'état global du chat
- `useChat`: Hook simple pour une conversation unique
- `useChatMode`: Gestion du mode floating/fullscreen
- `useAdhaWriteMode`: Basculer entre mode chat normal et mode écriture comptable

### Stockage Local
- **localStorage**: Persistance des conversations (`chat_history`)
- **Zustand persist**: State management avec persistance automatique

### Simulation IA
- **Mots-clés**: Système de détection de patterns dans `mockChatResponses.ts`
- **Réponses**: Templates prédéfinis pour code Python, formules mathématiques, graphiques
- **Délai**: Simulation de 2 secondes pour les réponses

### Mode Écriture ADHA
- **État**: Géré par `useAdhaWriteMode` hook
- **Intégration**: Lié au système d'agent entries pour la génération d'écritures comptables
- **UI**: Indicateur visuel du mode actif dans l'interface

## API Future (À Implémenter Backend)

### Send Message

**URL:** `/chat/message`

**Method:** `POST`

**Request Body:**
```json
{
  "conversationId": "conv-123",
  "message": {
    "content": "Comment calculer l'amortissement linéaire ?",
    "attachment": {
      "name": "facture.pdf",
      "type": "application/pdf",
      "content": "base64-encoded-content"
    }
  },
  "modelId": "adha-1",
  "writeMode": false,
  "context": ["fiscal-year-2024"]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "msg-6",
      "sender": "bot",
      "content": "Pour calculer l'amortissement linéaire...",
      "timestamp": "2024-08-02T10:15:30Z",
      "likes": 0,
      "dislikes": 0
    },
    "conversationId": "conv-123",
    "journalEntry": null
  }
}
```
```

### Get Conversations

**URL:** `/chat/conversations`

**Method:** `GET`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "conv-123",
      "title": "Assistance comptabilité SYSCOHADA",
      "timestamp": "2024-08-02T10:30:45Z",
      "isActive": true,
      "model": {
        "id": "adha-1",
        "name": "Adha 1",
        "description": "Modèle de base pour la comptabilité générale",
        "capabilities": ["Comptabilité générale", "Écritures simples", "Rapprochements"],
        "contextLength": 4096
      },
      "context": ["fiscal-year-2024", "SYSCOHADA"],
      "messages": []
    }
  ]
}
```

### Get Conversation History

**URL:** `/chat/conversations/{id}`

**Method:** `GET`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "conv-123",
    "title": "Assistance comptabilité SYSCOHADA",
    "timestamp": "2024-08-02T10:30:45Z",
    "isActive": true,
    "model": {
      "id": "adha-1",
      "name": "Adha 1",
      "description": "Modèle de base pour la comptabilité générale",
      "capabilities": ["Comptabilité générale", "Écritures simples", "Rapprochements"],
      "contextLength": 4096
    },
    "context": ["fiscal-year-2024", "SYSCOHADA"],
    "messages": [
      {
        "id": "msg-1",
        "sender": "user",
        "content": "Comment enregistrer une facture d'achat avec TVA ?",
        "timestamp": "2024-08-02T10:30:45Z"
      },
      {
        "id": "msg-2",
        "sender": "bot",
        "content": "Pour enregistrer une facture d'achat avec TVA dans le système SYSCOHADA...",
        "timestamp": "2024-08-02T10:31:30Z",
        "likes": 1
      }
    ]
  }
}
```

### Get Available Models

**URL:** `/chat/models`

**Method:** `GET`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "adha-1",
      "name": "Adha 1",
      "description": "Modèle de base pour la comptabilité générale",
      "capabilities": ["Comptabilité générale", "Écritures simples", "Rapprochements"],
      "contextLength": 4096
    },
    {
      "id": "adha-fisk",
      "name": "Adha Fisk",
      "description": "Spécialisé en fiscalité et déclarations",
      "capabilities": ["Fiscalité", "TVA", "Déclarations fiscales", "Optimisation fiscale"],
      "contextLength": 8192
    },
    {
      "id": "adha-o1",
      "name": "Adha O1",
      "description": "Version avancée pour l'analyse financière",
      "capabilities": ["Analyse financière", "Ratios", "Prévisions", "Tableaux de bord"],
      "contextLength": 16384
    }
  ]
}
```

## Mode d'Écriture ADHA

### État Actuel
Le mode d'écriture ADHA est géré côté frontend par le hook `useAdhaWriteMode` qui bascule entre :
- **Mode Chat Normal**: Conversation standard avec l'assistant
- **Mode Écriture**: Transformation des messages en propositions d'écritures comptables

### Intégration avec Agent Entries
Le mode écriture est lié au système `agentEntries` pour générer automatiquement des écritures comptables à partir des conversations.

### API Future pour Mode Écriture

**Paramètre `writeMode` dans les requêtes de message:**
```json
{
  "conversationId": "conv-123",
  "message": {
    "content": "Facture Orange 120€ TTC (100€ HT + 20€ TVA)",
    "attachment": {
      "name": "facture-orange.pdf",
      "type": "application/pdf",
      "content": "base64-encoded-content"
    }
  },
  "modelId": "adha-1",
  "writeMode": true,
  "context": ["fiscal-year-2024"]
}
```

**Réponse avec écriture proposée:**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "msg-7",
      "sender": "bot",
      "content": "J'ai analysé votre facture et propose cette écriture comptable :",
      "timestamp": "2024-08-02T15:45:30Z"
    },
    "conversationId": "conv-123",
    "journalEntry": {
      "id": "agent-123",
      "date": "2024-08-02",
      "journalType": "purchases",
      "reference": "FACTURE-ORANGE-08-2024",
      "description": "Facture téléphone Orange",
      "status": "draft",
      "source": "agent",
      "agentId": "adha-1",
      "validationStatus": "pending",
      "lines": [
        {
          "accountCode": "626100",
          "accountName": "Frais de télécommunication",
          "debit": 100,
          "credit": 0,
          "description": "Frais téléphone Orange HT"
        },
        {
          "accountCode": "445660",
          "accountName": "TVA déductible",
          "debit": 20,
          "credit": 0,
          "description": "TVA sur frais téléphone"
        },
        {
          "accountCode": "401100",
          "accountName": "Fournisseurs",
          "debit": 0,
          "credit": 120,
          "description": "Orange - Facture téléphone"
        }
      ],
      "totalDebit": 120,
      "totalCredit": 120,
      "totalVat": 20
    }
  }
}
```

## Composants Frontend Existants

### Pages
- `ChatPage`: Page plein écran pour le chat
- Intégrée dans le router avec route `/chat`

### Composants
- `ChatContainer`: Conteneur principal gérant les modes floating/fullscreen
- `ChatWindow`: Fenêtre de chat avec liste des messages
- `ChatMessage`: Composant pour afficher un message individuel
- `ConversationList`: Liste des conversations sauvegardées
- `ModelSelector`: Sélecteur de modèle IA
- `MessageContent`: Rendu du contenu des messages avec support markdown/code
- `EmojiPicker`: Sélecteur d'emojis pour les réactions

### Hooks de Gestion d'État
- `useChatStore`: Store Zustand principal avec persistance
- `useChat`: Hook simple pour une conversation
- `useChatMode`: Gestion des modes d'affichage
- `useAdhaWriteMode`: Activation/désactivation du mode écriture

### Données Mock
- `mockChatResponses.ts`: Système de réponses basé sur mots-clés
- Patterns pour: code Python, formules mathématiques, graphiques, tableaux
- Simulation de délai de réponse (2 secondes)

## Prochaines Étapes

1. **Implémenter l'API Backend**: Remplacer le système mock par une vraie API
2. **Intégration IA**: Connecter un vrai service d'IA (OpenAI, Claude, etc.)
3. **Mode Écriture**: Implémenter la génération automatique d'écritures comptables
4. **Persistance**: Migrer de localStorage vers base de données
5. **Temps Réel**: Ajouter WebSocket pour les interactions temps réel

## Notes d'Implémentation

- La structure des données frontend est prête pour l'API
- Les hooks peuvent facilement être adaptés pour utiliser les vrais endpoints
- Le système de persistance Zustand peut coexister avec l'API
- Les composants UI sont découplés des sources de données

## Error Responses

**Unauthorized (401):**
```json
{
  "success": false,
  "error": "Session expirée"
}
```

**Bad Request (400):**
```json
{
  "success": false,
  "error": "Message content cannot be empty"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "error": "Conversation not found"
}
```

**Other Errors:**
```json
{
  "success": false,
  "error": "Error message description"
}
```
