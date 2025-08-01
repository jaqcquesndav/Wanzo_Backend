# Architecture de Communication entre Portfolio Institution et Adha AI

Ce document décrit l'architecture de communication entre le service Portfolio Institution et le service Adha AI, en mettant l'accent sur les différents workflows (chat, comptabilité, analyse de portefeuille) et leur gestion.

## 1. Vue d'ensemble

L'architecture mise en place permet une communication asynchrone entre les services via Apache Kafka. Cette approche offre plusieurs avantages :

- **Découplage des services** : Chaque service peut évoluer indépendamment
- **Tolérance aux pannes** : Les messages sont persistés dans Kafka en cas d'indisponibilité d'un service
- **Scalabilité** : Facilité d'ajout de nouveaux consommateurs pour traiter plus de charge
- **Routage des messages** : Séparation claire des différents types de flux de données

## 2. Flux de communication

### 2.1 Vue générale du flux

```
┌───────────────────┐     Topics Kafka     ┌────────────────┐
│                   │  ----------------->  │                │
│  Portfolio        │  portfolio.chat.*    │                │
│  Institution      │  portfolio.analysis.*│    Adha AI     │
│  Service          │  <-----------------  │    Service     │
│                   │                      │                │
└───────────────────┘                      └────────────────┘
```

### 2.2 Flux des messages de chat

1. L'utilisateur envoie un message via l'interface du Portfolio Institution
2. Le service Portfolio Institution publie le message sur le topic `portfolio.chat.message`
3. Le service Adha AI consomme le message et le route vers le ChatProcessor
4. Le ChatProcessor génère une réponse
5. Adha AI publie la réponse sur le topic `portfolio.chat.response`
6. Le service Portfolio Institution consomme la réponse et la présente à l'utilisateur

### 2.3 Flux des demandes d'analyse de portefeuille

1. L'utilisateur demande une analyse via l'interface du Portfolio Institution
2. Le service Portfolio Institution publie la demande sur le topic `portfolio.analysis.request`
3. Le service Adha AI consomme la demande et la route vers le PortfolioAnalyzer
4. Le PortfolioAnalyzer génère l'analyse demandée
5. Adha AI publie les résultats sur le topic `portfolio.analysis.response`
6. Le service Portfolio Institution consomme les résultats et les présente à l'utilisateur

### 2.4 Flux des opérations commerciales (comptabilité)

1. Le service Gestion Commerciale publie une opération sur le topic `commerce.operation.created`
2. Le service Adha AI consomme l'opération et la route vers l'AccountingProcessor
3. L'AccountingProcessor génère les écritures comptables
4. Adha AI publie les écritures sur le topic `accounting.journal.entry`
5. Le service comptable consomme les écritures et les enregistre

## 3. Structure des messages

### 3.1 Messages de chat

**Demande** (portfolio.chat.message)
```typescript
{
  id: string;              // ID unique du message
  chatId: string;          // ID de la conversation
  userId: string;          // ID de l'utilisateur
  userRole: string;        // Rôle de l'utilisateur
  content: string;         // Contenu du message
  timestamp: string;       // Horodatage ISO
  contextInfo: {
    source: 'portfolio_institution';
    mode: 'chat';
    institutionId?: string;
    portfolioId?: string;
    [key: string]: any;    // Contexte additionnel
  };
}
```

**Réponse** (portfolio.chat.response)
```typescript
{
  requestId: string;       // ID du message original
  chatId: string;          // ID de la conversation
  content: string;         // Contenu de la réponse
  timestamp: string;       // Horodatage ISO
  metadata: {
    processed_by: string;  // Composant qui a traité le message
    context_used: string[]; // Éléments de contexte utilisés
    [key: string]: any;    // Métadonnées additionnelles
  };
}
```

### 3.2 Demandes d'analyse de portefeuille

**Demande** (portfolio.analysis.request)
```typescript
{
  id: string;              // ID unique de la demande
  portfolioId: string;     // ID du portefeuille
  institutionId: string;   // ID de l'institution
  userId: string;          // ID de l'utilisateur
  userRole: string;        // Rôle de l'utilisateur
  timestamp: string;       // Horodatage ISO
  analysisTypes: string[]; // Types d'analyses demandées
  contextInfo: {
    source: 'portfolio_institution';
    mode: 'analysis';
    portfolioType: string; // Type de portefeuille
    [key: string]: any;    // Contexte additionnel
  };
}
```

**Réponse** (portfolio.analysis.response)
```typescript
{
  requestId: string;       // ID de la demande originale
  portfolioId: string;     // ID du portefeuille
  institutionId: string;   // ID de l'institution
  timestamp: string;       // Horodatage ISO
  analyses: {
    [analysisType: string]: {
      indicators?: Record<string, number | string>;
      findings?: string[];
      status?: string;
      error?: string;
    };
  };
  recommendations: string[];
  metadata: {
    processed_by: string;  // Composant qui a traité la demande
    [key: string]: any;    // Métadonnées additionnelles
  };
}
```

## 4. Routage des tâches dans Adha AI

Le service Adha AI utilise un système de routage des tâches qui analyse le contenu des messages pour déterminer leur type et les diriger vers le processeur approprié :

- **TaskRouter** : Point d'entrée central qui examine les messages et détermine leur type
- **ChatProcessor** : Traite les messages de chat et génère des réponses contextuelles
- **PortfolioAnalyzer** : Analyse les portefeuilles et génère des recommandations
- **AccountingProcessor** : Transforme les opérations commerciales en écritures comptables

Le routeur utilise plusieurs critères pour déterminer le type de tâche :
- Source du message (portfolio_institution, gestion_commerciale, etc.)
- Mode spécifié dans le contexte (chat, analysis, accounting)
- Présence de champs spécifiques (portfolio, analysisTypes, etc.)
- Type d'événement (commerce.operation.*)

## 5. Gestion des erreurs et des tentatives

- Les messages qui génèrent des erreurs sont loggés avec leur stack trace
- Le consommateur Kafka est configuré pour tenter de traiter à nouveau les messages en cas d'échec
- Les réponses d'erreur incluent des codes et des descriptions pour aider au diagnostic

## 6. Monitoring et observabilité

Un système de monitoring est mis en place pour suivre :
- Le temps de traitement des différents types de messages
- Le taux de succès/échec des traitements
- L'utilisation des ressources
- Les performances des modèles d'IA

Les statistiques sont exportées régulièrement pour analyse et peuvent être consultées via des tableaux de bord.
