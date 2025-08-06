# Documentation du Service Adha AI

## 1. Introduction

Le service Adha-ai-service est un microservice d'intelligence artificielle conçu pour fournir des capacités d'analyse et de traitement intelligent aux autres composants du système Wanzo. Ce document présente une analyse détaillée de son architecture, ses modes de fonctionnement, les flux de données et les interactions avec les autres microservices du système.

## 2. Modes de fonctionnement

Le service Adha AI fonctionne selon trois modes principaux, chacun correspondant à un type de traitement différent :

### 2.1 Mode Analyse de Chat

Ce mode permet aux utilisateurs d'interagir avec le système via une interface conversationnelle. Le service utilise des modèles de langage pour comprendre les requêtes des utilisateurs et y répondre de manière contextuelle.

**Caractéristiques principales :**
- Traitement des requêtes en langage naturel
- Maintien du contexte de la conversation
- Génération de réponses pertinentes basées sur le contexte utilisateur
- Intégration avec les données métier (opérations comptables, portefeuilles, etc.)

### 2.2 Mode Traitement Comptable

Dans ce mode, le service traite les opérations commerciales et les convertit en écritures comptables. Il applique des règles métier pour garantir la conformité des écritures et les envoie au service comptable.

**Caractéristiques principales :**
- Transformation des opérations commerciales en écritures comptables
- Application de règles métier spécifiques selon le type d'opération
- Gestion des statuts de traitement des écritures
- Support de différents types d'opérations (ventes, dépenses, financements, inventaire)

### 2.3 Mode Analyse de Portefeuille

Ce mode permet l'analyse approfondie des portefeuilles des institutions financières. Il applique des algorithmes d'analyse pour évaluer différents aspects des portefeuilles et générer des recommandations.

**Caractéristiques principales :**
- Analyses multidimensionnelles (financière, marché, opérationnelle, risque)
- Support de différents types de portefeuilles (crédit, épargne, investissement, micro-finance)
- Génération de recommandations basées sur les analyses
- Calcul d'indicateurs de performance et de risque

## 3. Flux de données et Traitement

### 3.1 Architecture générale

```
┌─────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│                 │    │                    │    │                    │
│  Microservices  ├───►│ Kafka Message Bus  ├───►│  Unified Consumer  │
│                 │    │                    │    │                    │
└─────────────────┘    └────────────────────┘    └──────────┬─────────┘
                                                           │
                                                           ▼
┌─────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│                 │    │                    │    │                    │
│  Kafka Producer │◄───┤   Service Logic    │◄───┤    Task Router     │
│                 │    │                    │    │                    │
└─────────────────┘    └────────────────────┘    └────────────────────┘
       │                                                  ▲
       │                                                  │
       ▼                                                  │
┌─────────────────┐                             ┌────────────────────┐
│                 │                             │                    │
│  Microservices  │                             │   AI Components    │
│                 │                             │                    │
└─────────────────┘                             └────────────────────┘
```

### 3.2 Flux de traitement des données

1. **Réception des messages**
   - Les messages sont reçus via Kafka depuis différents microservices
   - Le `UnifiedConsumer` écoute plusieurs topics et standardise les messages

2. **Routage des tâches**
   - Le `TaskRouter` analyse les messages et détermine leur type
   - Il dirige chaque message vers le service approprié (chat, comptabilité, analyse)

3. **Traitement par les services spécialisés**
   - Les processeurs spécialisés traitent les messages selon leur domaine
   - L'IA est appliquée selon le contexte (génération de texte, analyse, etc.)

4. **Publication des résultats**
   - Les résultats sont publiés sur Kafka pour les microservices concernés
   - Des mécanismes de robustesse gèrent les erreurs et les retries

### 3.3 Diagramme de flux de données

```
┌────────────────┐  Opérations   ┌─────────────┐
│   Gestion      │───Commerciales─►             │   Écritures   ┌─────────────┐
│  Commerciale   │               │  Adha AI    ├──Comptables───►  Accounting  │
└────────────────┘               │  Service    │               │   Service   │
                                 │             │               └─────────────┘
┌────────────────┐  Demandes     │             │
│   Portfolio    │───d'Analyse───►             │   Résultats   ┌─────────────┐
│  Institution   │               │             ├──d'Analyse────►  Portfolio   │
└────────────────┘               │             │               │  Institution │
                                 │             │               └─────────────┘
                                 │             │
┌────────────────┐  Requêtes     │             │   Réponses    ┌─────────────┐
│  Utilisateurs  │───de Chat─────►             ├──de Chat──────►Utilisateurs  │
└────────────────┘               └─────────────┘               └─────────────┘
```

## 4. Implémentation de l'Intelligence Artificielle

### 4.1 Technologies et Frameworks

Le service Adha AI utilise plusieurs technologies d'IA pour accomplir ses tâches :

- **LLM (Large Language Models)**
  - OpenAI API (GPT-4) pour le traitement du langage naturel
  - SentenceTransformers pour la génération d'embeddings

- **Bases de données vectorielles**
  - ChromaDB pour le stockage et la recherche d'embeddings
  - Support pour Pinecone (alternative)

- **Frameworks d'IA**
  - LangChain pour l'orchestration des chaînes de traitement LLM
  - PyTorch (préinstallé dans l'image Docker) pour les modèles ML

### 4.2 Algorithmes et techniques utilisés

#### 4.2.1 Traitement du langage naturel
- **Modèles de génération de texte** pour les réponses aux questions des utilisateurs
- **Embeddings sémantiques** pour la recherche contextuelle et la similarité
- **Extraction d'entités** pour identifier les éléments importants dans les requêtes

#### 4.2.2 Analyse financière
- **Algorithmes d'analyse de risque** pour évaluer les portefeuilles
- **Calcul d'indicateurs financiers** (ratio de prêts non performants, profitabilité)
- **Génération de recommandations** basées sur des règles métier et le contexte

#### 4.2.3 Transformation comptable
- **Règles de transformation** pour convertir les opérations en écritures comptables
- **Validation métier** pour assurer la conformité des écritures générées

### 4.3 Flux de traitement IA

```
┌─────────────────┐      ┌───────────────────┐      ┌──────────────────┐
│                 │      │                   │      │                  │
│  Prétraitement  ├─────►│  Traitement par   ├─────►│ Post-traitement  │
│  des données    │      │  modèles d'IA     │      │ et formatage     │
│                 │      │                   │      │                  │
└─────────────────┘      └───────────────────┘      └──────────────────┘
```

1. **Prétraitement**
   - Extraction du contexte pertinent
   - Normalisation des données
   - Préparation du prompt ou des données d'entrée

2. **Traitement par les modèles d'IA**
   - Appel aux APIs OpenAI pour la génération de texte
   - Utilisation de SentenceTransformers pour les embeddings
   - Application d'algorithmes d'analyse spécifiques au domaine

3. **Post-traitement**
   - Structuration des résultats
   - Validation et enrichissement
   - Formatage pour la réponse

## 5. Interactions avec les autres microservices

### 5.1 Interaction avec le service Gestion Commerciale

- **Réception des opérations commerciales** via Kafka (topic `commerce.operation.created`)
- **Transformation** des opérations en écritures comptables
- **Envoi** des écritures au service comptable

**Flux de données :**
```
┌─────────────────┐     ┌────────────────────────┐     ┌─────────────────┐
│     Gestion     │     │                        │     │                 │
│    Commerciale  ├────►│   Adha AI - Module     ├────►│   Accounting    │
│                 │     │   Comptable            │     │                 │
└─────────────────┘     └────────────────────────┘     └─────────────────┘
```

### 5.2 Interaction avec le service Accounting

- **Envoi des écritures comptables** générées à partir des opérations commerciales
- **Réception des statuts de traitement** des écritures (réussite ou échec)
- **Gestion des erreurs** et des tentatives de re-traitement

**Flux de données :**
```
┌─────────────────┐     ┌────────────────────────┐     ┌─────────────────┐
│    Adha AI -    │     │     Journal Entry      │     │                 │
│    Module       ├────►│     (écritures)        ├────►│   Accounting    │
│    Comptable    │     │                        │     │                 │
└─────────────────┘     └────────────────────────┘     └─────────────────┘
       ▲                                                       │
       │                                                       │
       │                ┌────────────────────────┐            │
       └────────────────┤     Status Update      │◄───────────┘
                        │                        │
                        └────────────────────────┘
```

### 5.3 Interaction avec le service Portfolio Institution

- **Réception des demandes d'analyse** de portefeuille
- **Application des algorithmes d'analyse** selon le type de portefeuille
- **Envoi des résultats d'analyse** et des recommandations

**Flux de données :**
```
┌─────────────────┐    ┌────────────────────────┐    ┌─────────────────┐
│                 │    │     Portfolio Data      │    │                 │
│    Portfolio    ├───►│                        ├───►│    Adha AI -    │
│   Institution   │    │                        │    │    Analyse      │
│                 │    └────────────────────────┘    │                 │
└─────────────────┘                                  └────────┬────────┘
       ▲                                                      │
       │                                                      │
       │                ┌────────────────────────┐            │
       └────────────────┤     Analysis Results   │◄───────────┘
                        │                        │
                        └────────────────────────┘
```

## 6. Résumé technique

Le service Adha-ai-service est un composant d'intelligence artificielle central dans l'architecture de Wanzo. Il utilise des technologies modernes d'IA comme les LLM et les bases de données vectorielles pour offrir des capacités avancées de traitement du langage naturel, d'analyse financière et de transformation comptable.

L'architecture est conçue pour être robuste, avec une gestion des erreurs complète et des mécanismes de retry. Les communications entre services sont assurées par Kafka, permettant un découplage efficace et une haute disponibilité.

Les trois modes principaux de fonctionnement (chat, comptabilité, analyse de portefeuille) permettent au service de répondre à différents besoins métier tout en centralisant l'expertise en IA.

---

Document généré le 6 août 2025.
