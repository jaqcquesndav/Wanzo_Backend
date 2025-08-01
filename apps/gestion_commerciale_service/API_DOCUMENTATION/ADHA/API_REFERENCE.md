# API de référence du module ADHA

Cette documentation technique détaille les classes, méthodes et interfaces du module ADHA (Assistant Digital pour Heure d'Affaires).

## AdhaRepository

### Méthodes

#### `init()`

```dart
Future<void> init()
```

Initialise le repository et prépare les bases de données locales.

**Exemple d'utilisation:**
```dart
final adhaRepository = AdhaRepository();
await adhaRepository.init();
```

#### `getConversations()`

```dart
Future<List<AdhaConversation>> getConversations()
```

Récupère toutes les conversations sauvegardées.

**Retourne:** Une liste de conversations.

**Exemple d'utilisation:**
```dart
final conversations = await adhaRepository.getConversations();
print('Nombre de conversations: ${conversations.length}');
```

#### `getConversation(String conversationId)`

```dart
Future<AdhaConversation?> getConversation(String conversationId)
```

Récupère une conversation spécifique par son ID.

**Paramètres:**
- `conversationId`: L'identifiant unique de la conversation

**Retourne:** La conversation correspondante ou `null` si elle n'est pas trouvée.

**Exemple d'utilisation:**
```dart
final conversation = await adhaRepository.getConversation('conversation-123');
if (conversation != null) {
  print('Conversation trouvée avec ${conversation.messages.length} messages');
}
```

#### `saveConversation(AdhaConversation conversation)`

```dart
Future<void> saveConversation(AdhaConversation conversation)
```

Sauvegarde une conversation dans la base de données locale.

**Paramètres:**
- `conversation`: L'objet conversation à sauvegarder

**Exemple d'utilisation:**
```dart
await adhaRepository.saveConversation(conversation);
```

#### `deleteConversation(String conversationId)`

```dart
Future<void> deleteConversation(String conversationId)
```

Supprime une conversation spécifique.

**Paramètres:**
- `conversationId`: L'identifiant unique de la conversation à supprimer

**Exemple d'utilisation:**
```dart
await adhaRepository.deleteConversation('conversation-123');
```

#### `sendMessage()`

```dart
Future<String> sendMessage({
  required String conversationId,
  required String message,
  AdhaContextInfo? contextInfo,
})
```

Envoie un message à l'assistant ADHA.

**Paramètres:**
- `conversationId`: L'identifiant de la conversation (peut être "new" pour une nouvelle conversation)
- `message`: Le contenu du message
- `contextInfo`: Les informations contextuelles pour l'IA (optionnel)

**Retourne:** La réponse de l'assistant

**Exemple d'utilisation:**
```dart
final response = await adhaRepository.sendMessage(
  conversationId: 'conversation-123',
  message: 'Comment vont mes ventes ce mois-ci?',
  contextInfo: AdhaContextInfo(...),
);
```

## AdhaBloc

### Événements

#### `LoadConversations`

Charge toutes les conversations existantes.

```dart
adhaBloc.add(const LoadConversations());
```

#### `LoadConversation`

Charge une conversation spécifique par son ID.

```dart
adhaBloc.add(LoadConversation(conversationId: 'conversation-123'));
```

#### `SendAdhaMessage`

Envoie un message à l'assistant.

```dart
adhaBloc.add(SendAdhaMessage(
  message: 'Quelle est ma meilleure journée de vente?',
  conversationId: 'conversation-123',
  contextInfo: contextInfo,
));
```

#### `DeleteAdhaConversation`

Supprime une conversation existante.

```dart
adhaBloc.add(DeleteAdhaConversation(conversationId: 'conversation-123'));
```

#### `StartRecording`

Démarre l'enregistrement audio pour une entrée vocale.

```dart
adhaBloc.add(const StartRecording());
```

#### `StopRecording`

Arrête l'enregistrement audio et envoie le message vocal à l'assistant.

```dart
adhaBloc.add(const StopRecording());
```

### États

- `AdhaInitial` - État initial du bloc
- `AdhaLoading` - Chargement des données en cours
- `ConversationsLoaded` - Les conversations ont été chargées avec succès
- `ConversationLoaded` - Une conversation spécifique a été chargée
- `MessageSent` - Un message a été envoyé avec succès
- `ResponseReceived` - Une réponse a été reçue de l'assistant
- `RecordingStarted` - L'enregistrement audio a commencé
- `RecordingStopped` - L'enregistrement audio s'est arrêté
- `AdhaError` - Une erreur s'est produite

## AdhaApiService

Service permettant d'interagir avec l'API backend ADHA.

### Méthodes

#### `sendMessage()`

```dart
Future<Map<String, dynamic>> sendMessage({
  required String messageText,
  String? conversationId,
  required AdhaContextInfo contextInfo,
})
```

Envoie un message au serveur ADHA.

#### `getConversations()`

```dart
Future<List<Map<String, dynamic>>> getConversations({
  int page = 1,
  int limit = 10,
  String sortBy = 'lastMessageTimestamp',
  String sortOrder = 'desc',
})
```

Récupère les conversations depuis le serveur.

#### `getConversationHistory()`

```dart
Future<List<AdhaMessage>> getConversationHistory(
  String conversationId,
  {int page = 1, int limit = 20}
)
```

Récupère l'historique des messages pour une conversation spécifique.

## Modèles

### `AdhaMessage`

Représente un message individuel dans une conversation.

```dart
class AdhaMessage {
  final String id;
  final String content;
  final DateTime timestamp;
  final bool isUserMessage;
  final AdhaMessageType type;
  
  // Constructeur et méthodes
}
```

### `AdhaConversation`

Représente une session de conversation complète.

```dart
class AdhaConversation {
  final String id;
  final String title;
  final DateTime createdAt;
  final DateTime lastUpdatedAt;
  final List<AdhaMessage> messages;
  
  // Constructeur et méthodes
}
```

### `AdhaContextInfo`

Fournit des informations contextuelles pour les interactions avec ADHA.

```dart
class AdhaContextInfo {
  final AdhaInteractionType interactionType;
  final AdhaBaseContext baseContext;
  final AdhaSpecificContext? specificContext;
  
  // Constructeur et méthodes
  
  Map<String, dynamic> toJson() {
    // Convertit l'objet en JSON
  }
}
```

## Services Audio

### `AudioStreamingService`

Service gérant l'enregistrement et la lecture audio pour les interactions vocales.

#### `startRecording()`

```dart
Future<void> startRecording()
```

Commence l'enregistrement audio.

#### `stopRecording()`

```dart
Future<String> stopRecording()
```

Arrête l'enregistrement audio et retourne le chemin du fichier audio.

#### `playAudio(String filePath)`

```dart
Future<void> playAudio(String filePath)
```

Lit un fichier audio.

## Widgets UI

### `AdhaScreen`

Écran principal pour l'interaction avec ADHA.

### `AudioChatWidget`

Widget permettant l'interaction vocale avec ADHA.

### `ChatMessageWidget`

Widget affichant un message individuel dans la conversation.

### `ConversationListWidget`

Widget affichant la liste des conversations existantes.

### `VoiceRecognitionWidget`

Widget gérant l'enregistrement et la reconnaissance vocale.
