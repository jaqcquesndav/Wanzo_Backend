# Module Event Processing - Analytics Service

## Vue d'ensemble

Le module **Event Processing** gère la consommation et le traitement des événements financiers en temps réel via Apache Kafka. Il fait partie intégrante du microservice d'analyse des risques financiers de Wanzo.

## Architecture

### Composants Principaux

1. **KafkaConsumerService** - Service de consommation Kafka
2. **EventProcessingController** - API REST pour monitoring
3. **DTOs** - Types TypeScript pour les événements

### Flux de Données

```
Kafka Topics → KafkaConsumerService → Event Routing → Analytics Processing
```

## Topics Kafka Écoutés

Le service consomme les événements des topics suivants :

- `financial.transactions` - Transactions financières des PME
- `financial.risk-events` - Événements d'évaluation de risque
- `financial.fraud-alerts` - Alertes de détection de fraude
- `financial.portfolio-updates` - Mises à jour de portfolios
- `financial.credit-events` - Événements de crédit et prêts
- `financial.sme-events` - Événements généraux des PME

## Types d'Événements

### 1. TRANSACTION
Transactions financières des PME
```json
{
  "id": "evt-001",
  "type": "TRANSACTION",
  "entityId": "sme-12345",
  "timestamp": "2025-08-03T10:30:00Z",
  "data": {
    "transactionId": "txn-67890",
    "amount": 150000,
    "currency": "CDF",
    "transactionType": "PAYMENT"
  },
  "source": "payment-service"
}
```

### 2. RISK_ASSESSMENT
Évaluations de risque
```json
{
  "id": "evt-002",
  "type": "RISK_ASSESSMENT",
  "entityId": "sme-12345",
  "timestamp": "2025-08-03T10:30:00Z",
  "data": {
    "riskScore": 7.2,
    "riskLevel": "HIGH",
    "factors": ["high_debt_ratio", "irregular_payments"]
  },
  "source": "risk-engine"
}
```

### 3. FRAUD_ALERT
Alertes de fraude
```json
{
  "id": "evt-003",
  "type": "FRAUD_ALERT",
  "entityId": "sme-12345",
  "timestamp": "2025-08-03T10:30:00Z",
  "severity": "HIGH",
  "data": {
    "alertType": "SUSPICIOUS_TRANSACTION",
    "description": "Montant inhabituel détecté",
    "evidence": ["amount_anomaly", "time_pattern"]
  },
  "source": "fraud-detection"
}
```

### 4. PORTFOLIO_UPDATE
Mises à jour de portfolio
```json
{
  "id": "evt-004",
  "type": "PORTFOLIO_UPDATE",
  "entityId": "portfolio-456",
  "timestamp": "2025-08-03T10:30:00Z",
  "data": {
    "updateType": "VALUE_CHANGE",
    "changes": {"totalValue": 15000000},
    "newValue": 15000000
  },
  "source": "portfolio-service"
}
```

### 5. CREDIT_EVENT
Événements de crédit
```json
{
  "id": "evt-005",
  "type": "CREDIT_EVENT",
  "entityId": "sme-12345",
  "timestamp": "2025-08-03T10:30:00Z",
  "data": {
    "creditId": "credit-789",
    "eventType": "DISBURSEMENT",
    "amount": 5000000,
    "currency": "CDF"
  },
  "source": "credit-service"
}
```

## Configuration

### Variables d'Environnement

```env
# Configuration Kafka
KAFKA_BROKERS=localhost:9092,localhost:9093
KAFKA_GROUP_ID=analytics-service
KAFKA_CLIENT_ID=analytics-service
KAFKA_HEARTBEAT_INTERVAL=3000
KAFKA_SESSION_TIMEOUT=30000
```

### Configuration dans kafkaConfig

```typescript
export default () => ({
  kafka: {
    brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    groupId: process.env.KAFKA_GROUP_ID || 'analytics-service',
    clientId: process.env.KAFKA_CLIENT_ID || 'analytics-service',
    heartbeatInterval: parseInt(process.env.KAFKA_HEARTBEAT_INTERVAL || '3000'),
    sessionTimeout: parseInt(process.env.KAFKA_SESSION_TIMEOUT || '30000'),
  }
});
```

## API REST

### Endpoints Disponibles

#### GET /api/v1/event-processing/status
Obtient le statut du traitement d'événements
```json
{
  "status": "success",
  "data": {
    "groupId": "analytics-service",
    "status": "connected",
    "topics": ["financial.transactions", "..."],
    "timestamp": "2025-08-03T10:30:00Z"
  }
}
```

#### GET /api/v1/event-processing/health
Vérifie la santé de la connexion Kafka
```json
{
  "status": "success",
  "data": {
    "kafka": "healthy",
    "timestamp": "2025-08-03T10:30:00Z",
    "uptime": 3600
  }
}
```

#### GET /api/v1/event-processing/metrics
Obtient les métriques de performance
```json
{
  "status": "success",
  "data": {
    "eventsProcessed": {
      "total": 45821,
      "lastHour": 1247,
      "lastMinute": 23
    },
    "eventTypes": {
      "TRANSACTION": 28745,
      "RISK_ASSESSMENT": 8932,
      "FRAUD_ALERT": 1247
    },
    "performance": {
      "avgProcessingTime": "45ms",
      "successRate": 99.7,
      "errorRate": 0.3
    }
  }
}
```

#### GET /api/v1/event-processing/topics
Liste les topics Kafka écoutés
```json
{
  "status": "success",
  "data": {
    "topics": [
      "financial.transactions",
      "financial.risk-events",
      "financial.fraud-alerts",
      "financial.portfolio-updates",
      "financial.credit-events",
      "financial.sme-events"
    ],
    "totalTopics": 6
  }
}
```

#### GET /api/v1/event-processing/events/summary
Résumé des événements récents
```json
{
  "status": "success",
  "data": {
    "recentEvents": [
      {
        "id": "evt-001",
        "type": "FRAUD_ALERT",
        "entityId": "sme-12345",
        "severity": "HIGH",
        "processed": true
      }
    ],
    "alertsToday": {
      "fraud": 8,
      "highRisk": 15,
      "critical": 2
    }
  }
}
```

## Traitement des Événements

### Routage par Type

Chaque type d'événement est routé vers un handler spécialisé :

1. **handleTransactionEvent()** - Analyse des transactions
2. **handleRiskAssessmentEvent()** - Stockage des évaluations
3. **handleFraudAlertEvent()** - Gestion des alertes de fraude
4. **handlePortfolioUpdateEvent()** - Recalcul des métriques
5. **handleCreditEvent()** - Mise à jour historique crédit

### Analyses Effectuées

#### Transactions
- Détection de patterns anormaux
- Analyse de fréquence des transactions
- Vérification des seuils réglementaires
- Mise à jour métriques de risque temps réel

#### Évaluations de Risque
- Stockage des scores de risque
- Déclenchement d'alertes pour risques élevés
- Historisation des évaluations
- Calcul de tendances de risque

#### Alertes de Fraude
- Stockage des alertes
- Notification aux systèmes de surveillance
- Classification par sévérité
- Suivi des résolutions

#### Portfolios
- Recalcul des métriques en temps réel
- Analyse de concentration de risque
- Mise à jour des limites d'exposition
- Détection de dérive de valeur

#### Crédits
- Mise à jour historique de crédit
- Recalcul scores de risque crédit
- Suivi des événements de défaut
- Analyse des patterns de remboursement

## Monitoring et Observabilité

### Logs
Le service utilise le système de logging NestJS avec différents niveaux :
- **INFO** : Événements traités avec succès
- **WARN** : Alertes de fraude et risques élevés
- **ERROR** : Erreurs de traitement ou de connexion
- **DEBUG** : Détails des analyses et mises à jour

### Métriques
- Nombre d'événements traités par type
- Temps de traitement moyen
- Taux de succès/erreur
- Latence du consumer Kafka
- Uptime de la connexion

### Health Checks
- Test de connexion Kafka
- Vérification des topics
- État du consumer group
- Détection de lag

## Intégration avec les Autres Modules

### FinancialDataConfigService
Utilise les données centralisées pour :
- Validation des devises
- Vérification des seuils de risque
- Conversion de montants
- Recherche d'entités

### GraphModule
Alimente le graphe Neo4j avec :
- Relations entre entités
- Événements de risque
- Patterns de fraude
- Connexions de transactions

### TimeseriesModule
Stocke les séries temporelles pour :
- Historique des événements
- Métriques de performance
- Tendances de risque
- Analyses prédictives

## Déploiement et Scaling

### Scaling Horizontal
- Multiple instances du service
- Consumer groups Kafka distribués
- Load balancing automatique
- Gestion des partitions

### Résilience
- Reconnexion automatique Kafka
- Retry logic pour messages en erreur
- Circuit breaker pour services externes
- Monitoring de santé continu

### Performance
- Traitement asynchrone des événements
- Batch processing pour optimisation
- Cache en mémoire pour données fréquentes
- Compression des messages Kafka

## Exemples d'Usage

### Test de Connexion
```bash
curl "http://localhost:3000/api/v1/event-processing/health"
```

### Monitoring des Métriques
```bash
curl "http://localhost:3000/api/v1/event-processing/metrics"
```

### Vérification du Statut
```bash
curl "http://localhost:3000/api/v1/event-processing/status"
```

## Dépannage

### Erreurs Communes

1. **Connexion Kafka échouée**
   - Vérifier la configuration des brokers
   - S'assurer que Kafka est démarré
   - Contrôler les permissions réseau

2. **Consumer lag élevé**
   - Augmenter le nombre d'instances
   - Optimiser le traitement des messages
   - Vérifier les performances de la base de données

3. **Messages en erreur**
   - Vérifier le format des messages
   - Contrôler les logs pour les détails
   - Valider la configuration des topics

### Debug
Activer les logs de debug en modifiant le niveau de log :
```typescript
this.logger.setLogLevels(['log', 'error', 'warn', 'debug']);
```
