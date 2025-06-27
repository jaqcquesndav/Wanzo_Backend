# Test de déploiement Docker pour Kiota-Suit

Ce document fournit un guide étape par étape pour tester le déploiement Docker de tous les microservices Kiota-Suit.

## 1. Préparation

Assurez-vous que Docker et Docker Compose sont installés et fonctionnels sur votre machine:

```bash
docker --version
docker-compose --version
```

## 2. Exécuter le script d'initialisation

### Sous Windows (PowerShell)

```powershell
.\setup-docker.ps1
```

### Sous Linux/Mac

```bash
chmod +x setup-docker.sh
./setup-docker.sh
```

Pendant l'exécution du script, vous aurez plusieurs options:

- Construire tous les services ou sélectionner un service spécifique
- Ignorer ou non la vérification des types TypeScript

Pour un premier test complet, il est recommandé de construire tous les services sans vérification des types pour aller plus vite.

## 3. Démarrer les conteneurs

Une fois la construction terminée, démarrez tous les services:

```bash
docker-compose up -d
```

Pour démarrer avec les logs visibles (plus facile pour le débogage):

```bash
docker-compose up
```

## 4. Vérifier l'état des conteneurs

Vérifiez que tous les conteneurs sont en cours d'exécution:

```bash
docker-compose ps
```

Tous les services devraient avoir le statut "Up".

## 5. Tester les API

Testez l'API Gateway qui est le point d'entrée principal:

```bash
curl http://localhost:3000/api
```

Cela devrait afficher la documentation Swagger de l'API.

## 6. Vérifier les logs des services

Si un service ne démarre pas correctement, vérifiez ses logs:

```bash
docker-compose logs -f api-gateway
docker-compose logs -f admin-service
docker-compose logs -f accounting-service
# etc.
```

## 7. Tester le monitoring

Accédez à l'interface Prometheus:

```
http://localhost:9090
```

Accédez à l'interface Grafana:

```
http://localhost:3000
```

Login: admin / Password: kiota-secret

## 8. Test de communication entre services

Pour vérifier que les services peuvent communiquer entre eux via Kafka, vous pouvez:

1. Créer un utilisateur via l'API admin-service
2. Vérifier que les événements sont correctement propagés aux autres services

## 9. Arrêter et nettoyer l'environnement

Pour arrêter tous les services:

```bash
docker-compose down
```

Pour arrêter et supprimer les volumes (efface toutes les données):

```bash
docker-compose down -v
```

## Service avec implémentation temporaire

Le service `portfolio-institution-service` utilise actuellement une implémentation temporaire qui contourne les erreurs TypeScript. Cette implémentation:

- Expose les endpoints `/health` et `/metrics` pour maintenir la compatibilité avec la surveillance
- Simule la connexion à la base de données et le démarrage du service
- Répond correctement aux requêtes de santé mais ne fournit pas la fonctionnalité complète

### Tester le service portfolio-institution-service

1. **Reconstruire uniquement ce service**:
   ```bash
   # Sous Linux/Mac
   ./rebuild-institution-service.sh
   
   # Sous Windows (PowerShell)
   .\rebuild-institution-service.ps1
   ```

2. **Démarrer uniquement ce service**:
   ```bash
   docker-compose up -d portfolio-institution-service
   ```

3. **Vérifier que le service répond**:
   ```bash
   curl http://localhost:3005/health
   ```
   
   Le service devrait répondre avec:
   ```json
   {"status":"ok","service":"portfolio-institution-service"}
   ```

4. **Vérifier les métriques**:
   ```bash
   curl http://localhost:3005/metrics
   ```

## Résolution des problèmes courants

### Conflits de dépendances NestJS

Si vous rencontrez des erreurs de conflit de dépendances NestJS comme:

```
npm error Conflicting peer dependency: @nestjs/core@11.1.3
npm error node_modules/@nestjs/core
npm error   peer @nestjs/core@"^11.0.0" from @nestjs/microservices@11.1.3
```

Utilisez les scripts de correction fournis:

```bash
# Sous Linux/Mac
chmod +x fix-dependencies.sh
./fix-dependencies.sh portfolio-sme-service

# Sous Windows
.\fix-dependencies.ps1 portfolio-sme-service
```

Ces scripts:
1. Installent les dépendances avec `--legacy-peer-deps`
2. Installent une version spécifique de `@nestjs/microservices` compatible avec votre projet
3. Installent d'autres dépendances courantes comme `jwks-rsa`, `prom-client` et `kafkajs`

### Le service ne démarre pas

Vérifiez les logs pour identifier l'erreur:

```bash
docker-compose logs -f <service-name>
```

### Problèmes de connectivité

Vérifiez que tous les services sont sur le même réseau:

```bash
docker network inspect kiota-network
```

### Problèmes de base de données

Vérifiez que les bases de données ont été correctement créées:

```bash
docker-compose exec postgres psql -U postgres -c "\l"
```

### Problèmes avec Kafka

Vérifiez que Kafka est accessible:

```bash
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:29092
```

## Validation complète

Pour confirmer que votre déploiement est entièrement fonctionnel, parcourez les étapes suivantes:

1. Créer un utilisateur via l'API d'administration
2. Enregistrer des données comptables via le service de comptabilité
3. Vérifier que les analyses sont générées correctement
4. Tester les fonctionnalités de portefeuille PME et institution
5. Vérifier les métriques dans Prometheus et Grafana

## Prochaines étapes

Une fois que vous avez validé le déploiement Docker en local, vous pouvez:

- Configurer un pipeline CI/CD pour automatiser le déploiement
- Préparer un environnement de production
- Optimiser les images Docker pour la production (taille, sécurité)
- Mettre en place des sauvegardes des volumes persistants
