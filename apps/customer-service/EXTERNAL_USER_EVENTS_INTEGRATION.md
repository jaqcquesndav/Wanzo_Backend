# Customer Service - External User Events Integration

## Overview

Ce document décrit comment le Customer Service gère les événements utilisateur provenant des autres microservices (Accounting Service et Portfolio Institution Service) via Kafka.

## Architecture

```
Accounting Service     Portfolio Service
      |                       |
      | USER_CREATED           | USER_CREATED
      v                       v
              Kafka Topics
                    |
                    v
           Customer Service
         (ExternalUserEventsConsumer)
                    |
                    v
              UserService
       (createFromExternalEvent)
```

## Flow de Création d'Utilisateur

### 1. Services Métier créent des utilisateurs

Les services métier (accounting-service, portfolio-institution-service) créent des utilisateurs localement et émettent des événements `USER_CREATED` vers Kafka.

**Exemple dans accounting-service :**
```typescript
// UserService.create()
const newUser = await this.userRepository.save(userData);

// Emit Kafka event
await this.eventsService.publishUserCreated({
  userId: newUser.auth0Id,
  name: newUser.name,
  email: newUser.email,
  role: 'user',
  userType: EventUserType.SME_USER,
  customerAccountId: customerAccount?.id,
  customerName: customerAccount?.name,
  timestamp: new Date().toISOString(),
});
```

### 2. Customer Service écoute les événements

Le `ExternalUserEventsConsumer` dans customer-service écoute les événements `USER_CREATED` et synchronise automatiquement les utilisateurs.

**Flow de traitement :**

1. **Vérification d'existence** : Vérifie si l'utilisateur existe déjà dans customer-service
2. **Validation du customer** : Vérifie que le customerAccountId correspond à un customer valide
3. **Mapping des rôles** : Mappe les types d'utilisateur vers les rôles customer-service
4. **Création** : Crée l'utilisateur avec `UserService.createFromExternalEvent()`

## Types d'Utilisateurs et Mapping

### EventUserType → Customer Service Role

| EventUserType | Customer Service Role | UserType | isCompanyOwner |
|---------------|----------------------|----------|----------------|
| SME_USER | CUSTOMER_USER | SME | false |
| SME_OWNER | CUSTOMER_ADMIN | SME | true |
| INSTITUTION_USER | CUSTOMER_USER | FINANCIAL_INSTITUTION | false |
| INSTITUTION_ADMIN | CUSTOMER_ADMIN | FINANCIAL_INSTITUTION | true |

## Événements Supportés

### 1. USER_CREATED

Déclenché quand un service métier crée un nouvel utilisateur.

```typescript
interface UserCreatedEvent {
  userId: string;           // Auth0 ID
  email: string;
  name: string;
  role: string;
  userType: EventUserType;
  customerAccountId?: string;
  customerName?: string;
  timestamp: string;
}
```

### 2. USER_STATUS_CHANGED

Met à jour le statut d'un utilisateur existant.

```typescript
interface UserStatusChangedEvent {
  userId: string;
  previousStatus: SharedUserStatus;
  newStatus: SharedUserStatus;
  userType: EventUserType;
  changedBy: string;
  timestamp: string;
}
```

### 3. USER_ROLE_CHANGED

Met à jour le rôle d'un utilisateur existant.

```typescript
interface UserRoleChangedEvent {
  userId: string;
  previousRole: string;
  newRole: string;
  userType: EventUserType;
  changedBy: string;
  timestamp: string;
}
```

## Configuration Kafka

### Consumer Configuration

```typescript
// customer-service/src/main.ts
app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'customer-service-consumer',
      brokers: kafkaBrokers,
    },
    consumer: {
      groupId: 'customer-service-group',
      allowAutoTopicCreation: true,
    },
  },
});
```

### Producer Configuration (dans les services métier)

```typescript
// accounting-service/portfolio-service
{
  name: 'KAFKA_SERVICE',
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'accounting-service', // ou 'portfolio-service'
      brokers: ['localhost:9092'],
    },
  },
}
```

## Gestion d'Erreurs

### Stratégies de Résilience

1. **Utilisateur déjà existant** : Skip silencieusement la création
2. **Customer introuvable** : Log warning et skip
3. **Erreurs de base de données** : Log error avec détails et continue
4. **Timeout Kafka** : Retry automatique via configuration Kafka

### Logging

Chaque événement est logué avec :
- Type d'événement
- User ID concerné
- Succès/échec de l'opération
- Détails d'erreur si applicable

## Tests

Les tests unitaires couvrent :
- Création d'utilisateur depuis événement externe
- Gestion des utilisateurs existants
- Mapping des rôles
- Gestion d'erreurs
- Mise à jour de statut/rôle

Voir : `external-user-events.consumer.spec.ts`

## Monitoring

### Métriques Recommandées

- Nombre d'événements `USER_CREATED` traités
- Nombre d'utilisateurs créés vs skippés
- Temps de traitement des événements
- Taux d'erreur par type d'événement

### Health Checks

- Connectivité Kafka
- Disponibilité base de données
- Performance consumer group

## Déploiement

### Variables d'Environnement

```env
KAFKA_BROKERS=localhost:9092
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=customer_service
```

### Ordre de Démarrage

1. PostgreSQL
2. Kafka + Zookeeper
3. Customer Service (consumer)
4. Services métier (producers)

## Évolutions Futures

### Fonctionnalités Planifiées

1. **Événements USER_DELETED** : Soft delete des utilisateurs
2. **Événements CUSTOMER_CREATED** : Synchronisation des customers
3. **Dead Letter Queue** : Gestion des événements en échec
4. **Event Sourcing** : Historique complet des changements

### Optimisations

1. **Batch Processing** : Traitement par lots pour haute charge
2. **Caching** : Cache Redis pour les lookups customer
3. **Partitioning** : Partition Kafka par customer ID
