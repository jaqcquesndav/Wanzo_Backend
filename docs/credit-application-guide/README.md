# Guide d'Intégration pour l'Application de Gestion des Demandes de Crédit

## Introduction

Ce dossier contient la documentation nécessaire pour l'intégration de l'application de gestion des demandes de crédit avec le microservice **portfolio-institution-service** dans l'écosystème Wanzo. Cette documentation couvre les formats de données, les API REST, l'architecture événementielle Kafka, et le cycle de vie complet des demandes de crédit.

## Architecture du Système

L'écosystème Wanzo utilise une architecture microservices avec communication via **Apache Kafka** pour les événements inter-services et **API REST** pour les interactions client-serveur.

### Services Impliqués
- **Portfolio-Institution-Service** : Gestion des portefeuilles et demandes de crédit
- **Adha-AI-Service** : Analyse intelligente des demandes via Kafka
- **Customer-Service** : Gestion centralisée des utilisateurs
- **API Gateway** : Point d'entrée unifié (Port 8000)

## Contenu du Dossier

1. **[Formats de Données](./data-formats.md)** - Structures de données pour les demandes de crédit et contrats

2. **[Cycle de Vie du Contrat](./contract-lifecycle.md)** - Étapes complètes du processus de crédit

3. **[Points d'API](./api-endpoints.md)** - Endpoints REST pour l'intégration client

## URLs d'Accès

### Environnement de Production
```
Base URL: https://api.wanzo.com
Portfolio Service: https://api.wanzo.com/portfolio_inst/
```

### Environnement de Développement  
```
Base URL: http://localhost:8000 (via API Gateway)
Portfolio Service: http://localhost:8000/portfolio_inst/
Service Direct: http://localhost:3005/ (pour développement uniquement)
```

## Authentification

Toutes les requêtes nécessitent un token JWT Auth0 valide :
```
Authorization: Bearer <jwt_token>
```

## Démarrage Rapide

1. **Obtenir un token Auth0** avec les scopes appropriés
2. **Consulter les [API Endpoints](./api-endpoints.md)** pour les opérations de base
3. **Vérifier les [Formats de Données](./data-formats.md)** pour les structures requises
4. **Suivre le [Cycle de Vie](./contract-lifecycle.md)** pour comprendre le processus

## Intégration avec Adha-AI

Les demandes de crédit peuvent bénéficier d'une analyse automatique via le service Adha-AI :
- Évaluation automatique des risques
- Scoring de crédit intelligent  
- Recommandations personnalisées
- Communication via Kafka (transparent pour les clients REST)

## Support Technique

Pour toute question ou problème d'intégration :
- **Email** : support@wanzo.com
- **Documentation Technique** : [Architecture Kafka](../VERIFICATION_KAFKA_ARCHITECTURE.md)
- **Slack** : #support-integration (équipe interne)
