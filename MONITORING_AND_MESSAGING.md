# Monitoring et Messaging - Wanzo Backend

Ce document explique comment utiliser et configurer le monitoring Prometheus et la messagerie Kafka dans le système Wanzo Backend.

## Table des matières

1. [Monitoring avec Prometheus](#monitoring-avec-prometheus)
   - [Architecture](#architecture-de-monitoring)
   - [Configuration](#configuration-prometheus)
   - [Métriques disponibles](#métriques-disponibles)
   - [Visualisation avec Grafana](#visualisation-avec-grafana)
   - [Alertes](#alertes)
   
2. [Messagerie avec Kafka](#messagerie-avec-kafka)
   - [Architecture](#architecture-de-messagerie)
   - [Configuration](#configuration-kafka)
   - [Types d'événements](#types-dévénements)
   - [Mode mock](#mode-mock)
   - [Débogage](#débogage)

3. [Tests](#tests)
   - [Tests unitaires](#tests-unitaires)
   - [Tests d'intégration](#tests-dintégration)
   - [Exécution des tests](#exécution-des-tests)

---

## Monitoring avec Prometheus

### Architecture de monitoring

Chaque microservice du système Wanzo expose ses métriques via un endpoint `/metrics` accessible sur un port dédié défini dans le fichier `.env` de chaque service (variable `PROMETHEUS_PORT`).

L'architecture de monitoring se compose des éléments suivants :

- **PrometheusService** : Service qui définit et expose les métriques
- **PrometheusController** : Contrôleur qui expose l'endpoint `/metrics`
- **PrometheusMiddleware** : Middleware qui mesure la durée des requêtes HTTP
- **DatabaseMetricsInterceptor** : Intercepteur qui mesure la durée des requêtes à la base de données
- **MonitoringModule** : Module qui regroupe tous les composants de monitoring

### Configuration Prometheus

Pour activer le monitoring dans un service, assurez-vous que :

1. La variable `PROMETHEUS_PORT` est définie dans le fichier `.env` du service
2. Le module `MonitoringModule` est importé dans le module principal `AppModule`
3. Le middleware `PrometheusMiddleware` est appliqué aux routes

Exemple de configuration dans `.env` :

```properties
# Monitoring
PROMETHEUS_PORT=9464  # Chaque service doit avoir un port unique
```

### Métriques disponibles

Chaque service expose des métriques standard et des métriques spécifiques à son domaine :

#### Métriques standard (tous les services)

- `http_requests_total` : Nombre total de requêtes HTTP
- `http_request_duration_seconds` : Durée des requêtes HTTP
- `active_users` : Nombre d'utilisateurs actifs
- `database_query_duration_seconds` : Durée des requêtes à la base de données

#### Métriques spécifiques (exemples)

- **Admin Service**
  - `user_management_operations_total`
  - `configuration_changes_total`
  
- **Accounting Service**
  - `journal_entries_created_total`
  - `transaction_value`
  - `account_balance`
  
- **Auth Service**
  - `login_attempts_total`
  - `token_generation_total`
  - `auth_failures_total`
  
- **App Mobile Service**
  - `app_sessions_total`
  - `push_notifications_sent_total`
  - `sync_operations_total`

### Visualisation avec Grafana

Pour visualiser les métriques, nous utilisons Grafana connecté à Prometheus. Pour démarrer l'environnement de monitoring :

```bash
cd monitoring
docker-compose up -d
```

Accédez à Grafana à l'adresse http://localhost:3000 (identifiants par défaut : admin/wanzo-secret).

### Alertes

Des alertes peuvent être configurées dans Prometheus pour surveiller des conditions critiques. Voir le fichier `prometheus.yml` pour les règles d'alerte.

---

## Messagerie avec Kafka

### Architecture de messagerie

La communication asynchrone entre les microservices se fait via Kafka. Chaque service peut produire et consommer des messages à travers des topics dédiés.

L'architecture de messagerie se compose des éléments suivants :

- **EventsModule** : Module qui gère l'infrastructure de messagerie
- **EventsService** : Service qui permet de publier des événements
- **MockEventsService** : Version simulée du service pour le développement sans Kafka

### Configuration Kafka

Pour configurer Kafka dans un service, modifiez les variables suivantes dans le fichier `.env` :

```properties
# Kafka Configuration
USE_KAFKA=false  # Mettre à true pour activer Kafka
KAFKA_CLIENT_ID=admin-service-client  # Unique par service
KAFKA_BROKERS=localhost:9092
KAFKA_CONSUMER_GROUP_ID=admin-service-consumer-group  # Unique par service
```

L'activation de Kafka peut être contrôlée via la variable `USE_KAFKA`. Lorsque cette variable est définie à `false`, le service utilise un mock qui simule le comportement de Kafka sans réellement envoyer de messages.

### Types d'événements

Les principaux types d'événements échangés entre les services sont :

- **UserEvents** : Événements liés aux utilisateurs (création, modification, suppression)
- **AuthEvents** : Événements liés à l'authentification (connexion, déconnexion)
- **SubscriptionEvents** : Événements liés aux abonnements
- **TransactionEvents** : Événements liés aux transactions financières
- **SystemEvents** : Événements système (démarrage, arrêt, maintenance)

### Mode mock

Le mode mock permet de développer et tester sans avoir besoin d'un serveur Kafka. Lorsque `USE_KAFKA=false`, le système utilise `MockEventsService` qui :

1. Simule la publication d'événements
2. Enregistre les événements dans les logs
3. Ne nécessite pas de configuration Kafka réelle

Ce mode est particulièrement utile pour :
- Le développement local
- Les tests automatisés
- Les démonstrations

### Débogage

Pour déboguer les problèmes de messagerie :

1. Vérifiez les logs du service pour voir les événements publiés/consommés
2. Utilisez les outils Kafka comme `kafka-console-consumer` pour vérifier les messages
3. Vérifiez les métriques Prometheus spécifiques à Kafka

---

## Tests

### Tests unitaires

Les tests unitaires couvrent les fonctionnalités individuelles de chaque service. Pour les composants liés au monitoring et à la messagerie, des tests spécifiques ont été implémentés :

- Tests pour `PrometheusService`
- Tests pour `PrometheusMiddleware`
- Tests pour `DatabaseMetricsInterceptor`
- Tests pour `MockEventsService`
- Tests pour les modules Kafka et Events

### Tests d'intégration

Les tests d'intégration vérifient les interactions entre les différents composants d'un service et entre les services. Ils incluent :

- Tests des endpoints exposant les métriques
- Tests de la communication entre services via Kafka
- Tests des fonctionnalités de monitoring en conditions réelles

### Exécution des tests

Pour exécuter tous les tests du projet :

```powershell
./run-all-tests.ps1
```

Pour exécuter les tests d'un service spécifique :

```bash
cd apps/<service-name>
npm test
```

Pour les tests d'intégration spécifiques :

```bash
cd apps/<service-name>
npm run test:e2e
```
