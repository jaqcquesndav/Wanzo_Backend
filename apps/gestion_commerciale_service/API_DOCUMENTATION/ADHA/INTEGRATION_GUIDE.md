# Guide d'intégration du module ADHA

## Qu'est-ce qu'ADHA ?

ADHA (Assistant Digital pour Heure d'Affaires) est l'assistant intelligent intégré à l'application Wanzo. Il utilise des technologies d'intelligence artificielle pour aider les utilisateurs à analyser leurs données commerciales, à obtenir des insights et à améliorer leur prise de décision.

## Capacités principales

1. **Analyse de données commerciales** - ADHA peut analyser les données de ventes, d'inventaire et financières pour fournir des insights.
2. **Interaction conversationnelle** - Les utilisateurs peuvent poser des questions en langage naturel.
3. **Support multi-modal** - ADHA prend en charge les interactions par texte et par voix.
4. **Contextualisation** - L'assistant comprend le contexte de l'entreprise et adapte ses réponses en conséquence.

## Architecture

Le module ADHA est construit selon l'architecture Bloc (Business Logic Component) et comprend :

```
lib/features/adha/
├── bloc/                  # Gestion d'état avec le pattern BLoC
│   ├── adha_bloc.dart
│   ├── adha_event.dart
│   └── adha_state.dart
├── models/                # Modèles de données
│   ├── adha_adapters.dart
│   ├── adha_context_info.dart
│   └── adha_message.dart
├── repositories/          # Couche d'accès aux données
│   └── adha_repository.dart
├── screens/               # Interface utilisateur
│   ├── adha_screen.dart
│   ├── audio_chat_widget.dart
│   ├── chat_message_widget.dart
│   ├── conversation_list_widget.dart
│   └── voice_recognition_widget.dart
└── services/              # Services externes
    ├── adha_api_service.dart
    ├── audio_service_interface.dart
    └── audio_streaming_service.dart
```

## Comment intégrer ADHA dans une nouvelle page

Pour intégrer l'assistant ADHA dans une nouvelle page ou fonctionnalité de l'application, suivez les étapes ci-dessous :

### 1. Accéder à l'écran ADHA complet

```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => const AdhaScreen(),
  ),
);
```

### 2. Intégrer le widget de chat ADHA dans une page existante

```dart
import 'package:wanzo/features/adha/screens/audio_chat_widget.dart';

// Dans votre widget build :
AudioChatWidget(
  onMessageSent: (String message) {
    // Gérer l'envoi du message si nécessaire
  },
  onResponseReceived: (String response) {
    // Gérer la réception de la réponse si nécessaire
  },
  contextInfo: AdhaContextInfo(
    interactionType: AdhaInteractionType.genericCardAnalysis,
    baseContext: AdhaBaseContext(
      operationJournalSummary: {...},  // Résumé des opérations
      businessProfile: {...},          // Profil de l'entreprise
    ),
    specificContext: {...},            // Contexte spécifique (optionnel)
  ),
),
```

### 3. Accéder à ADHA depuis un bouton flottant

```dart
FloatingActionButton(
  onPressed: () {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AdhaScreen(),
      ),
    );
  },
  child: const Icon(Icons.assistant),
  tooltip: 'Consulter ADHA',
),
```

## Comment fournir un contexte à ADHA

La qualité des réponses d'ADHA dépend du contexte que vous lui fournissez. Voici comment structurer ce contexte :

### Contexte de base (toujours requis)

```dart
final baseContext = AdhaBaseContext(
  operationJournalSummary: {
    'totalSales': 125000.0,
    'totalPurchases': 85000.0,
    'profit': 40000.0,
    'inventory': {
      'totalValue': 75000.0,
      'itemCount': 125,
    },
    'period': {
      'start': '2025-07-01',
      'end': '2025-07-31',
    },
  },
  businessProfile: {
    'name': 'Ma Boutique',
    'sector': 'Retail',
    'size': 'small',
    'foundedYear': 2023,
  },
);
```

### Contexte spécifique (selon le type d'interaction)

```dart
// Pour une analyse de vente
final specificContext = AdhaGenericCardContext(
  cardType: 'sales_summary',
  cardData: {
    'totalSales': 125000.0,
    'previousPeriodSales': 105000.0,
    'topProducts': [
      {'name': 'Produit A', 'quantity': 50, 'revenue': 25000.0},
      {'name': 'Produit B', 'quantity': 30, 'revenue': 15000.0},
    ],
    'salesByDay': [
      {'date': '2025-07-01', 'amount': 4200.0},
      {'date': '2025-07-02', 'amount': 3800.0},
      // ...
    ],
  },
);
```

## Bonnes pratiques

1. **Contexte précis** - Fournissez toujours un contexte aussi précis que possible à ADHA.
2. **Interactions naturelles** - Encouragez les utilisateurs à poser des questions en langage naturel.
3. **Informez les utilisateurs** - Expliquez aux utilisateurs les capacités et limites d'ADHA.
4. **Vie privée** - Informez les utilisateurs sur le traitement des données vocales et textuelles.

## Scénarios d'utilisation courants

- **Analyse de tendances** - "Comment ont évolué mes ventes ce mois-ci ?"
- **Conseils commerciaux** - "Comment puis-je améliorer ma rotation des stocks ?"
- **Prévisions** - "Quel sera mon chiffre d'affaires prévu pour le mois prochain ?"
- **Identification des anomalies** - "Y a-t-il des transactions inhabituelles dans mes opérations ?"

## Limites actuelles

- ADHA ne peut pas effectuer directement des opérations comme créer des ventes ou modifier l'inventaire.
- Les interactions vocales peuvent être limitées dans les environnements bruyants.
- ADHA fonctionne mieux avec des données historiques suffisantes (au moins 1 mois d'activité).
