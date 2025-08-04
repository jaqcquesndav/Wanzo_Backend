# Guide de Déploiement - Système Robuste Adha AI

## Vue d'ensemble

Ce guide détaille le déploiement du système Adha AI Service robuste avec toutes les améliorations implémentées pour assurer la compatibilité, la performance et la fiabilité.

## Prérequis

### Logiciels requis
- Docker & Docker Compose
- Node.js 18+ (pour les services NestJS)
- Python 3.9+ (pour Adha AI Service)
- PostgreSQL 14+
- Kafka 7.3.0+

### Variables d'environnement

#### Configuration Kafka (pour tous les services)
```bash
# Environnement Docker
KAFKA_ENV=docker
KAFKA_BROKER_INTERNAL=kafka:29092
KAFKA_BROKER_EXTERNAL=localhost:9092

# Configuration DLQ
DLQ_ENABLED=true
DLQ_MAX_RETRIES=3
DLQ_RETRY_DELAY_MS=5000

# Configuration Circuit Breaker
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT_MS=60000
```

#### Configuration Base de Données (unifiée)
```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
```

## Déploiement

### 1. Configuration initiale

```bash
# Cloner le repository
git clone <repository-url>
cd Wanzo_Backend

# Installer les dépendances des packages partagés
cd packages/shared
npm install
npm run build

# Installer les dépendances des services NestJS
cd ../../apps/gestion_commerciale_service
npm install

cd ../accounting-service
npm install

cd ../portfolio-institution-service
npm install
```

### 2. Configuration Adha AI Service

```bash
cd apps/Adha-ai-service

# Créer un environnement virtuel Python
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env
cat > .env << EOF
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,adha-ai-service

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Auth0 Configuration
AUTH0_JWKS_URL=https://your-domain.auth0.com/.well-known/jwks.json
AUTH0_AUDIENCE=your-auth0-audience
AUTH0_ISSUER=https://your-domain.auth0.com/
EOF
```

### 3. Démarrage des services

```bash
# Démarrer l'infrastructure
docker-compose up -d postgres kafka zookeeper

# Attendre que les services soient prêts
sleep 30

# Démarrer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f adha-ai-service
```

## Validation du Déploiement

### 1. Health Checks

```bash
# Vérifier la santé d'Adha AI Service
curl http://localhost:8002/health

# Vérifier les métriques Prometheus
curl http://localhost:9470/metrics

# Vérifier Kafka
docker exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092
```

### 2. Tests d'intégration

```bash
# Exécuter les tests d'intégration Kafka
cd apps/Adha-ai-service
python -m pytest tests/test_kafka_integration.py -v

# Tester la connectivité entre services
curl -X POST http://localhost:8002/api/test/business-operation \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-123",
    "type": "SALE",
    "amountCdf": 10000,
    "description": "Test operation",
    "companyId": "test-company"
  }'
```

### 3. Monitoring et Alertes

#### Métriques clés à surveiller
- **Taux d'erreur Kafka**: < 5%
- **Temps de traitement moyen**: < 10 secondes
- **Taille de la queue**: < 100 messages
- **État du circuit breaker**: CLOSED
- **Connexions actives**: Stable

#### Dashboard Grafana
Les métriques sont disponibles sur `http://localhost:3001` avec les dashboards:
- Adha AI Service Overview
- Kafka Message Flow
- Error Rate & Performance
- Circuit Breaker Status

## Configuration de Production

### 1. Sécurité

```bash
# Générer des clés secrètes fortes
openssl rand -hex 32  # Pour Django SECRET_KEY

# Configurer Auth0
# - Créer une application dans Auth0
# - Configurer les domaines autorisés
# - Récupérer les clés JWKS

# SSL/TLS
# - Configurer nginx/traefik avec certificats
# - Activer HTTPS uniquement
```

### 2. Performance

```yaml
# docker-compose.prod.yml
services:
  adha-ai-service:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
    environment:
      - DJANGO_SETTINGS_MODULE=adha_ai_service.settings.production
      - WORKERS=4
      - MAX_REQUESTS=1000
```

### 3. Monitoring avancé

```yaml
# Configuration AlertManager
groups:
- name: adha-ai-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(adha_ai_errors_total[5m]) > 0.05
    for: 2m
    annotations:
      summary: "High error rate in Adha AI Service"
  
  - alert: HighProcessingTime
    expr: histogram_quantile(0.95, adha_ai_kafka_message_processing_seconds) > 10
    for: 5m
    annotations:
      summary: "High processing time detected"
```

## Troubleshooting

### Problèmes fréquents

#### 1. Kafka Connection Issues
```bash
# Vérifier la connectivité Kafka
docker exec kafka kafka-broker-api-versions.sh --bootstrap-server localhost:9092

# Vérifier les topics
docker exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092

# Reset consumer group si nécessaire
docker exec kafka kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group adha-ai-unified-group --reset-offsets --to-earliest --all-topics --execute
```

#### 2. Base de données
```bash
# Vérifier la connexion PostgreSQL
docker exec kiota-postgres psql -U postgres -d adha_ai_db -c "SELECT 1;"

# Migrer la base de données si nécessaire
docker exec kiota-adha-ai-service python manage.py migrate
```

#### 3. Messages en erreur
```bash
# Vérifier la Dead Letter Queue
docker exec kafka kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic dlq.failed.messages --from-beginning

# Retraitement manuel des messages échoués
curl -X POST http://localhost:8002/api/admin/retry-dlq-messages
```

### Logs et Debugging

```bash
# Logs détaillés Adha AI
docker-compose logs -f adha-ai-service

# Logs Kafka
docker-compose logs -f kafka

# Métriques en temps réel
watch -n 1 'curl -s http://localhost:9470/metrics | grep adha_ai'
```

## Maintenance

### Mise à jour

```bash
# Sauvegarde avant mise à jour
docker exec kiota-postgres pg_dump -U postgres adha_ai_db > backup_$(date +%Y%m%d).sql

# Mise à jour du code
git pull origin main

# Rebuild et redémarrage
docker-compose build adha-ai-service
docker-compose up -d adha-ai-service

# Vérification post-mise à jour
./scripts/health-check.sh
```

### Nettoyage

```bash
# Nettoyer les métriques anciennes
curl -X POST http://localhost:8002/api/admin/cleanup-metrics

# Nettoyer les logs Docker
docker system prune -f

# Nettoyer les topics Kafka anciens
docker exec kafka kafka-topics.sh --delete --topic old-topic --bootstrap-server localhost:9092
```

## Support et Contact

- **Documentation**: [Wiki interne]
- **Issues**: [Système de tickets]
- **Contact**: équipe-dev@wanzo.cd

---

**Important**: Ce guide suppose une installation Docker. Pour un déploiement Kubernetes, consultez le guide K8s séparé.
