# Documentation de l'API ADHA

## Aperçu

ADHA (Assistant Digital pour Heure d'Affaires) est un assistant virtuel intégré à l'application Wanzo qui permet aux utilisateurs d'interagir par texte ou par voix pour obtenir des informations, des analyses et une assistance concernant leurs activités commerciales. L'assistant utilise l'intelligence artificielle pour fournir des réponses contextuelles basées sur les données de l'entreprise.

## Modèles de Données

### AdhaMessage

Le modèle `AdhaMessage` représente un message unique dans une conversation avec l'assistant ADHA.

```dart
class AdhaMessage {
  String id;                   // Identifiant unique du message
  String content;              // Contenu du message
  DateTime timestamp;          // Horodatage du message
  bool isUserMessage;          // Indique si le message provient de l'utilisateur (true) ou d'ADHA (false)
  AdhaMessageType type;        // Type de message (texte, audio, etc.)
}
```

### AdhaMessageType

Énumération définissant les différents types de messages possibles :

```dart
enum AdhaMessageType {
  text,      // Message texte standard
  audio,     // Message audio
  image,     // Image ou graphique
  action,    // Action suggérée ou effectuée
}
```

### AdhaConversation

Le modèle `AdhaConversation` représente une session de conversation complète avec ADHA.

```dart
class AdhaConversation {
  String id;                      // Identifiant unique de la conversation
  String title;                   // Titre de la conversation
  DateTime createdAt;             // Date de création de la conversation
  DateTime lastUpdatedAt;         // Date de la dernière mise à jour
  List<AdhaMessage> messages;     // Liste des messages dans cette conversation
}
```

### AdhaContextInfo

Le modèle `AdhaContextInfo` fournit des informations contextuelles pour les interactions avec ADHA.

```dart
class AdhaContextInfo {
  AdhaInteractionType interactionType;    // Type d'interaction
  AdhaBaseContext baseContext;           // Contexte de base toujours présent
  AdhaSpecificContext? specificContext;  // Contexte spécifique à l'interaction (optionnel)
}
```

### AdhaInteractionType

Énumération définissant les différents types d'interaction possibles :

```dart
enum AdhaInteractionType {
  genericCardAnalysis,   // Analyse générique des données
  directInitiation,      // Initiation directe d'une conversation
  followUp,              // Suivi d'une conversation précédente
}
```

## Repository et Services

### AdhaRepository

Le `AdhaRepository` est responsable de la gestion des conversations avec ADHA et de la communication avec l'API ADHA.

#### Méthodes principales :

- **init()**
  ```dart
  Future<void> init()
  ```
  Initialise le repository et ouvre la boîte Hive pour les conversations.

- **getConversations()**
  ```dart
  Future<List<AdhaConversation>> getConversations()
  ```
  Récupère toutes les conversations stockées localement.

- **getConversation(String conversationId)**
  ```dart
  Future<AdhaConversation?> getConversation(String conversationId)
  ```
  Récupère une conversation spécifique par son ID.

- **saveConversation(AdhaConversation conversation)**
  ```dart
  Future<void> saveConversation(AdhaConversation conversation)
  ```
  Sauvegarde une conversation dans la base de données locale.

- **deleteConversation(String conversationId)**
  ```dart
  Future<void> deleteConversation(String conversationId)
  ```
  Supprime une conversation par son ID.

- **sendMessage()**
  ```dart
  Future<String> sendMessage({
    required String conversationId,
    required String message,
    AdhaContextInfo? contextInfo,
  })
  ```
  Envoie un message à l'API ADHA et retourne la réponse.

### AdhaApiService

Le `AdhaApiService` gère les appels API liés à ADHA.

#### Méthodes principales :

- **sendMessage()**
  ```dart
  Future<Map<String, dynamic>> sendMessage({
    required String messageText,
    String? conversationId,
    required AdhaContextInfo contextInfo,
  })
  ```
  Envoie un message au serveur ADHA.

- **getConversations()**
  ```dart
  Future<List<Map<String, dynamic>>> getConversations({
    int page = 1,
    int limit = 10,
    String sortBy = 'lastMessageTimestamp',
    String sortOrder = 'desc',
  })
  ```
  Récupère les conversations depuis le serveur.

- **getConversationHistory()**
  ```dart
  Future<List<AdhaMessage>> getConversationHistory(
    String conversationId,
    {int page = 1, int limit = 20}
  )
  ```
  Récupère l'historique des messages pour une conversation spécifique.

### AudioStreamingService

Le `AudioStreamingService` gère l'enregistrement et la lecture audio pour les interactions vocales avec ADHA.

## API Endpoints

### 1. Envoyer un message

**Endpoint**: `POST /api/v1/adha/message`

**Description**: Envoie un message à l'assistant ADHA et obtient une réponse.

**Corps de la requête**:
```json
{
  "text": "Comment mes ventes ont-elles évolué ce mois-ci ?",
  "conversationId": "string",  // Optionnel, null pour une nouvelle conversation
  "timestamp": "2025-08-01T12:00:00.000Z",
  "contextInfo": {
    "interactionType": "direct_initiation",
    "baseContext": {
      "operationJournalSummary": {
        // Résumé des opérations commerciales récentes
      },
      "businessProfile": {
        // Profil de l'entreprise
      }
    },
    "specificContext": {
      // Contexte spécifique selon le type d'interaction
    }
  }
}
```

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "conversationId": "string",
    "messages": [
      {
        "id": "string",
        "content": "Vos ventes ont augmenté de 15% par rapport au mois dernier.",
        "timestamp": "2025-08-01T12:00:05.000Z",
        "isUserMessage": false,
        "type": "text"
      }
    ]
  }
}
```

### 2. Récupérer les conversations

**Endpoint**: `GET /api/v1/adha/conversations`

**Description**: Récupère la liste des conversations avec ADHA.

**Paramètres de requête**:
- `page` (optionnel): Numéro de page (par défaut: 1)
- `limit` (optionnel): Nombre d'éléments par page (par défaut: 10)
- `sortBy` (optionnel): Champ de tri (par défaut: 'lastMessageTimestamp')
- `sortOrder` (optionnel): Ordre de tri ('asc' ou 'desc', par défaut: 'desc')

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "conversations": [
      {
        "id": "string",
        "title": "Analyse des ventes mensuelles",
        "createdAt": "2025-08-01T10:30:00.000Z",
        "lastUpdatedAt": "2025-08-01T12:00:05.000Z",
        "lastMessage": {
          "content": "Vos ventes ont augmenté de 15% par rapport au mois dernier.",
          "timestamp": "2025-08-01T12:00:05.000Z",
          "isUserMessage": false
        }
      }
    ],
    "pagination": {
      "totalItems": 25,
      "totalPages": 3,
      "currentPage": 1,
      "itemsPerPage": 10
    }
  }
}
```

### 3. Récupérer l'historique d'une conversation

**Endpoint**: `GET /api/v1/adha/conversations/{conversationId}/messages`

**Description**: Récupère tous les messages d'une conversation spécifique.

**Paramètres de requête**:
- `page` (optionnel): Numéro de page (par défaut: 1)
- `limit` (optionnel): Nombre de messages par page (par défaut: 20)

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "conversationId": "string",
    "messages": [
      {
        "id": "string",
        "content": "Comment mes ventes ont-elles évolué ce mois-ci ?",
        "timestamp": "2025-08-01T12:00:00.000Z",
        "isUserMessage": true,
        "type": "text"
      },
      {
        "id": "string",
        "content": "Vos ventes ont augmenté de 15% par rapport au mois dernier.",
        "timestamp": "2025-08-01T12:00:05.000Z",
        "isUserMessage": false,
        "type": "text"
      }
    ],
    "pagination": {
      "totalItems": 10,
      "totalPages": 1,
      "currentPage": 1,
      "itemsPerPage": 20
    }
  }
}
```

### 4. Envoyer un message audio

**Endpoint**: `POST /api/v1/adha/message/audio`

**Description**: Envoie un message audio à l'assistant ADHA.

**Corps de la requête (multipart/form-data)**:
- `audio`: Fichier audio (format WAV ou MP3)
- `conversationId` (optionnel): ID de la conversation
- `contextInfo`: Informations contextuelles (JSON stringify)

**Réponse réussie (200)**:
```json
{
  "status": "success",
  "data": {
    "conversationId": "string",
    "transcription": "Comment mes ventes ont-elles évolué ce mois-ci ?",
    "messages": [
      {
        "id": "string",
        "content": "Vos ventes ont augmenté de 15% par rapport au mois dernier.",
        "timestamp": "2025-08-01T12:00:05.000Z",
        "isUserMessage": false,
        "type": "text"
      }
    ]
  }
}
```

## Intégration avec d'autres modules

ADHA s'intègre avec plusieurs autres modules de l'application :

1. **Sales**: Pour analyser les données de vente et fournir des insights
2. **Inventory**: Pour donner des informations sur les niveaux de stock
3. **Financial Transactions**: Pour analyser les flux financiers
4. **Dashboard**: Pour fournir des résumés et analyses des KPIs

## Exemple d'utilisation

### Initialisation et envoi d'un message

```dart
// Initialiser le repository
final adhaRepository = AdhaRepository();
await adhaRepository.init();

// Créer les informations contextuelles
final contextInfo = AdhaContextInfo(
  interactionType: AdhaInteractionType.directInitiation,
  baseContext: AdhaBaseContext(
    operationJournalSummary: {
      'totalSales': 125000.0,
      'averageDailySales': 4166.67,
      'topSellingProducts': ['Produit A', 'Produit B', 'Produit C'],
    },
    businessProfile: {
      'name': 'Ma Boutique',
      'sector': 'Retail',
      'foundedYear': 2023,
    },
  ),
);

// Envoyer un message et recevoir une réponse
final responseMessage = await adhaRepository.sendMessage(
  conversationId: 'new', // Ou un ID existant
  message: 'Quelle est ma meilleure journée de ventes ce mois-ci ?',
  contextInfo: contextInfo,
);

print('Réponse d\'ADHA: $responseMessage');
```

### Utilisation du Bloc

```dart
// Créer une instance du Bloc
final adhaBloc = AdhaBloc(adhaRepository: adhaRepository);

// Charger toutes les conversations
adhaBloc.add(const LoadConversations());

// Envoyer un message
adhaBloc.add(SendAdhaMessage(
  message: 'Comment améliorer mes ventes ?',
  contextInfo: contextInfo,
));
```
