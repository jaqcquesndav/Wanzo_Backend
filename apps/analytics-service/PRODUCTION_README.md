# 🚀 Wanzo Analytics Service - Production Deployment Guide

## 📋 Overview

Le service Analytics de Wanzo est maintenant prêt pour la production avec une intégration Kafka complète, une architecture microservices robuste et des fonctionnalités d'analyse de risque en temps réel.

## 🏗️ Architecture

### Services Intégrés
- **Customer Service** (Port 3001) - Gestion des clients et utilisateurs
- **Portfolio Service** (Port 3002) - Gestion des portfolios et contrats
- **Commerce Service** (Port 3006) - Opérations commerciales
- **Accounting Service** (Port 3007) - Données comptables
- **Analytics Service** (Port 3004) - Analyse de risque et fraude

### Base de Données
- **PostgreSQL** - Données relationnelles principale
- **Neo4j** - Analyse de graphe et relations
- **TimescaleDB** - Métriques temporelles et monitoring

### Événements Kafka
- `commerce.operation.created` - Opérations commerciales
- `user.created` / `user.updated` - Événements utilisateur
- `portfolio.funding-request.status-changed` - Changements de statut portfolio
- `portfolio.contract.created` - Création de contrats
- `token.purchase.created` - Achats de tokens

## 🔧 Configuration Production

### Variables d'Environnement Requises

```bash
# Base de données
ANALYTICS_DB_PASSWORD=<strong_password>
NEO4J_PASSWORD=<strong_password>
TIMESCALEDB_PASSWORD=<strong_password>

# Kafka
KAFKA_PASSWORD=<strong_password>

# Sécurité
JWT_SECRET=<strong_jwt_secret>
SENTRY_DSN=<sentry_dsn>
```

### Fichiers de Configuration
- `.env.production` - Configuration principale
- `docker-compose.production.yml` - Orchestration des services
- `scripts/init-analytics-db.sql` - Initialisation PostgreSQL
- `scripts/init-timescale.sql` - Initialisation TimescaleDB

## 🚀 Déploiement

### 1. Prérequis
```bash
# Docker et Docker Compose
docker --version
docker-compose --version

# Variables d'environnement
export ANALYTICS_DB_PASSWORD="your_secure_password"
export NEO4J_PASSWORD="your_secure_password"
export TIMESCALEDB_PASSWORD="your_secure_password"
export KAFKA_PASSWORD="your_secure_password"
export JWT_SECRET="your_jwt_secret"
export SENTRY_DSN="your_sentry_dsn"
```

### 2. Déploiement Automatique
```bash
# Rendre les scripts exécutables
chmod +x apps/analytics-service/scripts/*.sh

# Déployer en production
./apps/analytics-service/scripts/deploy-production.sh
```

### 3. Déploiement Manuel
```bash
# Build de l'image
docker-compose -f apps/analytics-service/docker-compose.production.yml build

# Démarrage des services
docker-compose -f apps/analytics-service/docker-compose.production.yml up -d
```

## 🏥 Monitoring et Maintenance

### Scripts de Monitoring
```bash
# Statut général
./apps/analytics-service/scripts/monitor-production.sh status

# Logs en temps réel
./apps/analytics-service/scripts/monitor-production.sh logs

# Vérification santé détaillée
./apps/analytics-service/scripts/monitor-production.sh health

# Métriques de performance
./apps/analytics-service/scripts/monitor-production.sh metrics

# Status Kafka
./apps/analytics-service/scripts/monitor-production.sh kafka

# Backup des bases de données
./apps/analytics-service/scripts/monitor-production.sh backup

# Redémarrage du service
./apps/analytics-service/scripts/monitor-production.sh restart

# Nettoyage
./apps/analytics-service/scripts/monitor-production.sh cleanup
```

### Endpoints de Monitoring

```bash
# Santé du service
curl http://localhost:3004/health

# Santé des intégrations
curl http://localhost:3004/integration/health

# Statut Kafka
curl http://localhost:3004/integration/kafka

# Statut des microservices
curl http://localhost:3004/integration/services

# Métriques Prometheus
curl http://localhost:9090/metrics
```

## 📊 Fonctionnalités Intégrées

### 1. Intégration Kafka Temps Réel
- ✅ Consommation d'événements de tous les microservices
- ✅ Traitement automatique des données business
- ✅ Analyse de risque en temps réel
- ✅ Détection de fraude

### 2. Analyse de Risque
- ✅ Calcul de risque SME avec données réelles
- ✅ Analyse géographique par province/ville
- ✅ Historique des performances de crédit
- ✅ Métriques de concentration de risque

### 3. Cache Intelligent
- ✅ Cache L1/L2 en mémoire
- ✅ Invalidation automatique via événements Kafka
- ✅ Optimisation des performances sans Redis

### 4. Détection de Fraude
- ✅ Analyse de patterns transactionnels
- ✅ Détection d'anomalies en temps réel
- ✅ Alertes automatiques

### 5. Architecture Sécurisée
- ✅ Image Docker distroless
- ✅ Utilisateur non-root
- ✅ Health checks automatiques
- ✅ Logs structurés
- ✅ Monitoring Prometheus

## 🔒 Sécurité

### Mesures Implémentées
- Image de base sécurisée (distroless)
- Utilisateur non-privilégié
- Conteneurs en lecture seule
- Pas de nouveaux privilèges
- Connexions chiffrées aux bases de données
- Authentification Kafka SASL/SCRAM

### Scan de Sécurité
```bash
# Avec Trivy (si installé)
trivy image wanzo-analytics-service-prod
```

## 📈 Performance

### Optimisations
- Cache intelligent multiniveau
- Connexions persistantes aux microservices
- Retry automatique avec backoff
- Compression des données
- Index optimisés sur les bases de données
- Hypertables TimescaleDB pour les métriques

### Métriques Surveillées
- Temps de réponse des API
- Utilisation mémoire/CPU
- Latence Kafka
- Connexions base de données
- Taux d'erreur
- Throughput des événements

## 🔧 Dépannage

### Problèmes Courants

#### Service ne démarre pas
```bash
# Vérifier les logs
docker-compose -f apps/analytics-service/docker-compose.production.yml logs analytics-service

# Vérifier les variables d'environnement
docker-compose -f apps/analytics-service/docker-compose.production.yml config
```

#### Problème de connexion Kafka
```bash
# Vérifier Kafka
docker-compose -f apps/analytics-service/docker-compose.production.yml exec kafka-1 kafka-topics --bootstrap-server=localhost:9092 --list

# Vérifier les consumers
curl http://localhost:3004/integration/kafka
```

#### Problème base de données
```bash
# PostgreSQL
docker-compose -f apps/analytics-service/docker-compose.production.yml exec postgres-analytics pg_isready -U analytics_user

# Neo4j
docker-compose -f apps/analytics-service/docker-compose.production.yml exec neo4j cypher-shell -u neo4j -p $NEO4J_PASSWORD "RETURN 1"
```

## 📞 Support

### Logs
```bash
# Logs applicatifs
docker-compose -f apps/analytics-service/docker-compose.production.yml logs -f analytics-service

# Logs système
tail -f /var/log/analytics-service/app.log
```

### Métriques
- **Prometheus**: http://localhost:9090
- **Neo4j Browser**: http://localhost:7474

### Contacts
- Équipe DevOps: devops@wanzo.cd
- Équipe Analytics: analytics@wanzo.cd

---

## ✅ Checklist de Déploiement

- [ ] Variables d'environnement configurées
- [ ] Scripts de déploiement testés
- [ ] Monitoring configuré
- [ ] Backups automatiques
- [ ] Alertes configurées
- [ ] Documentation mise à jour
- [ ] Tests de charge effectués
- [ ] Plan de rollback préparé

**🎉 Le service Analytics est maintenant prêt pour la production !**
