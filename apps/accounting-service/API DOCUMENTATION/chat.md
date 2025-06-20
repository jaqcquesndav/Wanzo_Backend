# Chat API Documentation

This document describes the Chat API endpoints for the Wanzo Compta application.

## Base URL

Toutes les requêtes doivent passer par l'API Gateway.

```
http://localhost:8000/accounting
```

## Authentication

All endpoints require authentication with a Bearer token.

**Headers:**
```
Authorization: Bearer <token>
X-Accounting-Client: Wanzo-Accounting-UI/1.0.0
```

## Endpoints

### Chat Endpoint

Handles all interactions with the chat, including sending messages, creating conversations, and retrieving history.

**URL:** `/chat`

**Method:** `POST`

**Authentication Required:** Yes

**Request Body:**

```json
{
  "conversationId": "conv-123", // Optional, for existing conversations
  "message": {
    "content": "Comment calculer l'amortissement linéaire d'un bien de 10000 € sur 5 ans ?",
    "attachment": { // Optional
      "name": "exemple.pdf",
      "type": "application/pdf",
      "content": "base64-encoded-content"
    }
  },
  "modelId": "adha-1", // Optional, for new conversations
  "context": ["fiscal-year-2024", "amortissements"] // Optional, for new conversations
}
```

**Response:** (Streams the bot's response)

```json
{
  "id": "msg-6",
  "sender": "bot",
  "content": "Pour calculer l'amortissement...",
  "timestamp": "2024-06-19T09:47:45Z",
  "conversationId": "conv-123"
}
```

### Get Conversations

Retrieves all chat conversations for the current user.

**URL:** `/chat/conversations`

**Method:** `GET`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "conv-123",
      "title": "Assistance comptabilité SYSCOHADA",
      "timestamp": "2024-06-15T10:30:45Z",
      "isActive": true,
      "model": {
        "id": "adha-1",
        "name": "Adha 1",
        "description": "Modèle de base pour la comptabilité générale",
        "capabilities": ["Comptabilité générale", "Écritures simples", "Rapprochements"],
        "contextLength": 4096
      },
      "context": ["fiscal-year-2024", "SYSCOHADA"]
    },
    {
      "id": "conv-124",
      "title": "Audit financier",
      "timestamp": "2024-06-10T14:20:15Z",
      "isActive": false,
      "model": {
        "id": "adha-fisk",
        "name": "Adha Fisk",
        "description": "Modèle spécialisé pour la fiscalité et l'audit",
        "capabilities": ["Fiscalité", "Audit", "Déclarations fiscales", "Optimisation fiscale"],
        "contextLength": 8192
      },
      "context": ["fiscal-year-2023", "audit"]
    }
  ]
}
```

### Get Conversation History

Retrieves the message history for a specific conversation.

**URL:** `/chat/conversations/:id`

**Method:** `GET`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "conv-123",
    "title": "Assistance comptabilité SYSCOHADA",
    "timestamp": "2024-06-15T10:30:45Z",
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
        "timestamp": "2024-06-15T10:30:45Z"
      },
      {
        "id": "msg-2",
        "sender": "bot",
        "content": "Pour enregistrer une facture d'achat avec TVA dans le système SYSCOHADA, vous devez créer une écriture de journal avec les comptes suivants :\n\n1. Débiter le compte de charge approprié (classe 6)\n2. Débiter le compte 4456 - TVA déductible\n3. Créditer le compte 401 - Fournisseurs\n\nExemple pour une facture de 1000 € HT avec TVA à 20% :\n- Débit 6xxxxx : 1000 €\n- Débit 4456 : 200 €\n- Crédit 401 : 1200 €",
        "timestamp": "2024-06-15T10:31:30Z"
      },
      {
        "id": "msg-3",
        "sender": "user",
        "content": "Merci, et pour une immobilisation ?",
        "timestamp": "2024-06-15T10:32:15Z"
      },
      {
        "id": "msg-4",
        "sender": "bot",
        "content": "Pour une immobilisation, le principe est similaire mais vous utilisez un compte de classe 2 au lieu d'un compte de charge :\n\n1. Débiter le compte d'immobilisation approprié (classe 2)\n2. Débiter le compte 4456 - TVA déductible\n3. Créditer le compte 404 - Fournisseurs d'immobilisations\n\nExemple pour un matériel de 5000 € HT avec TVA à 20% :\n- Débit 215xxx (Matériel) : 5000 €\n- Débit 4456 : 1000 €\n- Crédit 404 : 6000 €",
        "timestamp": "2024-06-15T10:33:00Z",
        "likes": 1
      }
    ]
  }
}
```

### Get Available Models

Retrieves all available AI models for chat.

**URL:** `/chat/models`

**Method:** `GET`

**Response:**

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
      "description": "Modèle spécialisé pour la fiscalité et l'audit",
      "capabilities": ["Fiscalité", "Audit", "Déclarations fiscales", "Optimisation fiscale"],
      "contextLength": 8192
    },
    {
      "id": "adha-pro",
      "name": "Adha Pro",
      "description": "Modèle avancé pour toutes les opérations comptables",
      "capabilities": ["Comptabilité avancée", "Fiscalité", "Audit", "Prévisions financières", "Analyses"],
      "contextLength": 16384
    }
  ]
}
```

## Mode d'Écriture ADHA

En plus des fonctionnalités de chat standard, l'API prend en charge un mode spécial "Écriture ADHA" qui permet de transformer les messages et leurs pièces jointes en écritures comptables automatiques.

### Activation du Mode d'Écriture

Lors de l'envoi d'un message au chat, le client peut spécifier si la conversation doit être traitée en mode chat standard ou en mode d'écriture comptable.

**Paramètre supplémentaire dans le corps de la requête :**
```json
{
  "conversationId": "conv-123", 
  "message": {
    "content": "Facture de téléphone Orange pour 120€ dont 20€ de TVA",
    "attachment": {
      "name": "facture-orange.pdf",
      "type": "application/pdf",
      "content": "base64-encoded-content"
    }
  },
  "modelId": "adha-1",
  "context": ["fiscal-year-2024"],
  "writeMode": true // Active le mode d'écriture comptable ADHA
}
```

### Réponse en Mode d'Écriture

Lorsque le mode d'écriture est activé, le bot génère une proposition d'écriture comptable basée sur le message de l'utilisateur et/ou les pièces jointes. La réponse inclut des champs supplémentaires liés à l'écriture comptable proposée.

**Exemple de réponse en mode d'écriture :**
```json
{
  "id": "msg-7",
  "sender": "bot",
  "content": "J'ai analysé votre facture de téléphone et je propose l'écriture comptable suivante :",
  "timestamp": "2024-06-20T15:45:30Z",
  "conversationId": "conv-123",
  "journalEntry": {
    "entryId": "agent-123",
    "date": "2024-06-20",
    "journalCode": "ACH",
    "reference": "FACTURE-ORANGE-06-2024",
    "description": "Facture téléphone Orange",
    "lines": [
      {
        "accountCode": "626100",
        "accountName": "Frais de télécommunication",
        "debit": 100.00,
        "credit": 0
      },
      {
        "accountCode": "445660",
        "accountName": "TVA déductible sur autres biens et services",
        "debit": 20.00,
        "credit": 0
      },
      {
        "accountCode": "401100",
        "accountName": "Fournisseurs - achats de biens ou prestations de services",
        "debit": 0,
        "credit": 120.00
      }
    ],
    "status": "pending",
    "attachmentId": "attach-123"
  }
}
```

### Validation d'une Écriture Proposée

Après avoir reçu une proposition d'écriture, le client peut la valider ou la modifier via l'API des entrées d'agent (`/agent-entries`).

**URL pour la validation :** `/agent-entries/{entryId}/validate`

**Méthode :** `PUT`

**Corps de la requête (optionnel pour les modifications) :**
```json
{
  "lines": [
    {
      "accountCode": "626100",
      "debit": 100.00,
      "credit": 0
    },
    {
      "accountCode": "445660",
      "debit": 20.00,
      "credit": 0
    },
    {
      "accountCode": "401100",
      "debit": 0,
      "credit": 120.00
    }
  ],
  "description": "Facture téléphone Orange - Juin 2024"
}
```

## Data Structures

### Conversation

```typescript
interface Conversation {
  id: string;
  title: string;
  timestamp: string; // ISO 8601 format
  isActive: boolean;
  model: AIModel;
  context: string[];
  messages: Message[];
}
```

### Message

```typescript
interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string; // ISO 8601 format
  attachment?: {
    name: string;
    type: string;
    content: string; // base64
  };
  likes?: number;
  dislikes?: number;
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
```

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
