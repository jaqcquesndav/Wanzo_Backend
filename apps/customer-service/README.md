# Customer Service

Ce microservice centralise la gestion des clients (PME et Institutions), utilisateurs, abonnements et jetons (tokens) d'IA.

## Fonctionnalités

- Gestion centralisée des profils clients (PME et Institutions financières)
- Gestion des utilisateurs par client
- Gestion des abonnements et plans tarifaires
- Gestion des tokens IA et leur consommation
- Facturation et paiements

## Architecture

Le Customer Service utilise une architecture hexagonale avec les modules suivants:

- Customers: Gestion des PME et Institutions
- Users: Gestion des utilisateurs et leurs rôles
- Subscriptions: Gestion des abonnements et plans
- Tokens: Gestion des tokens d'IA et leur consommation
- Billing: Gestion de la facturation

## Communication

Ce service communique avec les autres microservices via Kafka:
- Publie des événements sur les clients, utilisateurs, abonnements
- Reçoit les événements d'utilisation des tokens depuis le service IA
- Reçoit les événements d'audit depuis d'autres services

## API

Le service expose une API RESTful accessible via l'API Gateway pour:
- La gestion des clients
- La gestion des utilisateurs
- La gestion des abonnements
- Le suivi de la consommation des tokens

## Déploiement

Pour déployer le service:

```bash
# Construire l'image Docker
docker-compose build customer-service

# Démarrer le service avec toute l'infrastructure
docker-compose up -d
```

## Tests

Pour tester le service:

```bash
# Tester le service de façon isolée
npm run test

# Tester l'intégration
npm run test:e2e
```

## Migration des Données

Si vous avez besoin de migrer des données depuis les anciens services:

1. Assurez-vous que le customer-service est démarré
2. Exécutez le script de migration:

```bash
npm run migrate:customers
```

## Monitoring

Le service expose des métriques Prometheus sur `/metrics` pour le monitoring de:
- L'utilisation des tokens
- L'activité des utilisateurs
- Les performances du service

## Développement

Pour développer et contribuer au service:

1. Cloner le repository
2. Installer les dépendances:
```bash
cd apps/customer-service
npm install
```

3. Démarrer le service en mode développement:
```bash
npm run start:dev
```

## Structure du Code

```
src/
├── modules/
│   ├── customers/                 # Gestion des clients
│   │   ├── controllers/           # API endpoints
│   │   ├── entities/              # Entités TypeORM
│   │   └── services/              # Logique métier
│   ├── users/                     # Gestion des utilisateurs
│   │   ├── controllers/
│   │   ├── entities/
│   │   └── services/
│   ├── subscriptions/             # Gestion des abonnements
│   │   ├── controllers/
│   │   ├── entities/
│   │   └── services/
│   ├── tokens/                    # Gestion des tokens
│   │   ├── controllers/
│   │   ├── entities/
│   │   └── services/
│   ├── billing/                   # Facturation
│   │   ├── controllers/
│   │   ├── entities/
│   │   └── services/
│   └── kafka/                     # Intégration Kafka
│       ├── consumers/             # Consommateurs d'événements
│       └── producers/             # Producteurs d'événements
├── monitoring/                    # Monitoring Prometheus
├── app.module.ts                  # Module principal
└── main.ts                        # Point d'entrée
```
