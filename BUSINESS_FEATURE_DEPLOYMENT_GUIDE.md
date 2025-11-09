# Guide de déploiement du système de contrôle d'accès aux fonctionnalités métier

## 📋 Vue d'ensemble

Ce système transforme complètement l'approche d'abonnement de Wanzo en remplaçant les limites techniques (API calls, stockage) par des restrictions métier pertinentes (écritures comptables, utilisateurs, demandes de financement, etc.).

## 🏗️ Architecture implémentée

### 1. Composants principaux

- **BusinessFeature Enum** : 40+ fonctionnalités monétisables
- **AccessControlService** : Service centralisé de contrôle d'accès
- **Kafka Events** : Communication inter-services en temps réel
- **Décorateurs @FeatureAccess** : Contrôle automatique dans les contrôleurs
- **Entities de tracking** : Suivi précis de l'utilisation

### 2. Services intégrés

- **Customer Service** : Gestionnaire central des abonnements
- **Accounting Service** : Écritures comptables, rapports, IA ADHA
- **Gestion Commerciale** : Clients, factures, ventes
- **Portfolio Institution** : Prospection, évaluations de risque, utilisateurs

## 🚀 Instructions de déploiement

### Étape 1 : Configuration Kafka

```yaml
# docker-compose.yml - Ajouter la configuration Kafka
version: '3.8'
services:
  kafka:
    image: confluentinc/cp-kafka:latest
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    ports:
      - "9092:9092"
```

### Étape 2 : Variables d'environnement

```bash
# .env pour chaque service
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=accounting-service # unique par service
KAFKA_GROUP_ID=accounting-service-feature-access-group

# Base de données Customer Service
CUSTOMER_DB_HOST=localhost
CUSTOMER_DB_PORT=5432
CUSTOMER_DB_NAME=wanzo_customers
CUSTOMER_DB_USER=postgres
CUSTOMER_DB_PASSWORD=password
```

### Étape 3 : Migration base de données

```sql
-- Créer les tables de tracking dans la base Customer Service
CREATE TABLE business_feature_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL,
    feature VARCHAR(100) NOT NULL,
    current_usage INTEGER DEFAULT 0,
    reset_period VARCHAR(50) DEFAULT 'monthly',
    last_reset_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_feature_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL,
    feature VARCHAR(100) NOT NULL,
    limit_value INTEGER NOT NULL,
    limit_type VARCHAR(50) DEFAULT 'monthly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE feature_consumption_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL,
    feature VARCHAR(100) NOT NULL,
    amount INTEGER NOT NULL,
    action_type VARCHAR(100),
    user_id VARCHAR(255),
    consumed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Index pour les performances
CREATE INDEX idx_business_feature_usage_customer_feature ON business_feature_usage(customer_id, feature);
CREATE INDEX idx_customer_feature_limits_customer_feature ON customer_feature_limits(customer_id, feature);
CREATE INDEX idx_feature_consumption_logs_customer_feature ON feature_consumption_logs(customer_id, feature);
CREATE INDEX idx_feature_consumption_logs_consumed_at ON feature_consumption_logs(consumed_at);
```

### Étape 4 : Import des plans d'abonnement

```typescript
// Script d'import des plans dans la base de données
import { subscriptionPlans } from './config/subscription-pricing.config';

async function importSubscriptionPlans() {
  for (const planKey in subscriptionPlans) {
    const plan = subscriptionPlans[planKey];
    
    // Insérer le plan dans la table subscription_plans
    await dbConnection.query(`
      INSERT INTO subscription_plans (key, name, price, currency, customer_types, features)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (key) DO UPDATE SET
        name = $2, price = $3, features = $6
    `, [planKey, plan.name, plan.price, plan.currency, plan.customerTypes, JSON.stringify(plan.features)]);
  }
}
```

### Étape 5 : Configuration des services

#### Customer Service

```typescript
// apps/customer-service/src/app.module.ts
@Module({
  imports: [
    FeatureAccessModule.forRoot({
      kafkaBrokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      kafkaClientId: 'customer-service',
      kafkaGroupId: 'customer-service-group'
    }),
    // ... autres imports
  ]
})
```

#### Services métier (Accounting, Gestion Commerciale, Portfolio)

```typescript
// apps/[service]/src/app.module.ts
@Module({
  imports: [
    FeatureAccessModule.forRoot({
      kafkaBrokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      kafkaClientId: '[service-name]',
      kafkaGroupId: '[service-name]-feature-access-group'
    }),
    // ... autres imports
  ]
})
```

### Étape 6 : Tâches CRON pour réinitialisation

```typescript
// apps/customer-service/src/tasks/reset-counters.task.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccessControlService } from '../services/access-control.service';

@Injectable()
export class ResetCountersTask {
  private readonly logger = new Logger(ResetCountersTask.name);

  constructor(private accessControlService: AccessControlService) {}

  // Réinitialisation quotidienne à minuit
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailyCounters() {
    this.logger.log('Réinitialisation des compteurs quotidiens...');
    await this.accessControlService.resetAllCounters('daily');
  }

  // Réinitialisation mensuelle le 1er de chaque mois
  @Cron('0 0 1 * *')
  async resetMonthlyCounters() {
    this.logger.log('Réinitialisation des compteurs mensuels...');
    await this.accessControlService.resetAllCounters('monthly');
  }
}
```

## 🧪 Tests et validation

### Exécution des tests automatisés

```powershell
# Exécuter le script de test complet
.\scripts\test-feature-access-system.ps1
```

### Tests manuels recommandés

1. **Test de création de client avec plan PME Starter**
2. **Test de consommation progressive des crédits**
3. **Test de dépassement des limites**
4. **Test de génération d'alertes**
5. **Test de changement d'abonnement**

## 📊 Monitoring et surveillance

### Métriques Kafka à surveiller

- `business-feature.access-request` : Nombre de demandes d'accès
- `business-feature.consumption` : Nombre de consommations
- `business-feature.limits-alert` : Alertes de dépassement

### Alertes recommandées

```typescript
// Configuration des alertes
const alertThresholds = {
  usage_warning: 0.8,    // 80% de la limite
  usage_critical: 0.95,  // 95% de la limite
  access_denied_rate: 0.1 // 10% de refus d'accès
};
```

## 🔧 Maintenance

### Nettoyage des logs de consommation

```sql
-- Supprimer les logs de consommation > 6 mois
DELETE FROM feature_consumption_logs 
WHERE consumed_at < NOW() - INTERVAL '6 months';
```

### Archivage des données

```typescript
// Script d'archivage mensuel
async function archiveOldConsumptionLogs() {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 6);
  
  // Déplacer vers table d'archive
  await dbConnection.query(`
    INSERT INTO feature_consumption_logs_archive 
    SELECT * FROM feature_consumption_logs 
    WHERE consumed_at < $1
  `, [cutoffDate]);
  
  // Supprimer les anciens logs
  await dbConnection.query(`
    DELETE FROM feature_consumption_logs 
    WHERE consumed_at < $1
  `, [cutoffDate]);
}
```

## 🚨 Troubleshooting

### Problèmes courants

1. **Kafka inaccessible** : Vérifier la configuration réseau
2. **Compteurs incorrects** : Réinitialiser manuellement via API
3. **Performance lente** : Optimiser les index de base de données
4. **Limites incorrectes** : Vérifier la synchronisation des plans

### Commands de diagnostic

```bash
# Vérifier l'état des topics Kafka
kafka-topics --bootstrap-server localhost:9092 --list

# Vérifier les messages dans les topics
kafka-console-consumer --bootstrap-server localhost:9092 --topic business-feature.access-request --from-beginning

# Vérifier la base de données
psql -h localhost -U postgres -d wanzo_customers -c "SELECT customer_id, feature, current_usage, limit_value FROM business_feature_usage JOIN customer_feature_limits USING (customer_id, feature);"
```

## 🎯 Prochaines étapes recommandées

1. **Dashboard admin** : Interface pour gérer les plans et limites
2. **API publique** : Permettre aux clients de voir leur utilisation
3. **Webhooks** : Notifications externes lors d'alertes
4. **Analytics avancés** : Rapports d'utilisation et tendances
5. **Tests de charge** : Validation des performances en production

## 📞 Support

En cas de problème, vérifier :
1. Les logs des services métier
2. Les métriques Kafka
3. L'état de la base de données Customer Service
4. La synchronisation des compteurs

Le système est maintenant prêt pour la production avec une monétisation complète des fonctionnalités métier de Wanzo ! 🚀