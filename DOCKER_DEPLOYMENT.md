# Déploiement Docker de Kiota-Suit

Ce guide explique comment déployer l'ensemble des microservices Kiota-Suit en utilisant Docker et Docker Compose.

## Prérequis

- Docker et Docker Compose installés sur votre machine
- Git pour cloner le dépôt

## Architecture des conteneurs

L'architecture Docker de Kiota-Suit comprend les éléments suivants :

- **Microservices** :
  - `api-gateway` : Point d'entrée unique (port 3000)
  - `admin-service` : Gestion des utilisateurs et administration (port 3001)
  - `analytics-service` : Analyses et statistiques (port 3002)
  - `accounting-service` : Comptabilité et finances (port 3003)
  - `portfolio-sme-service` : Gestion des portefeuilles PME (port 3004)
  - `portfolio-institution-service` : Gestion des portefeuilles institutions (port 3005)
  - `app-mobile-service` : Service pour l'application mobile (port 3006)
  - `customer-service` : Service de gestion des clients (port 3011)

- **Infrastructure** :
  - `postgres` : Base de données PostgreSQL partagée (port 5432)
  - `zookeeper` : Coordination pour Kafka (port 2181)
  - `kafka` : Messagerie pour la communication entre services (port 9092)
  - `prometheus` : Collecte de métriques (port 9090)
  - `grafana` : Visualisation des métriques (port 3000, accessible via le port interne du cluster)

## Déploiement rapide

1. **Démarrage des services de manière contrôlée** :

   ```powershell
   # Utilisation du script de démarrage sécurisé
   .\start-services-safely.ps1
   ```

   > **Note**: Ce script démarre les services dans un ordre spécifique pour éviter les problèmes de dépendances et de disponibilité des ressources.

2. **Vérification des services** :
   ```bash
   docker-compose ps
   ```

3. **Visualisation des logs** :
   ```bash
   # Tous les services
   docker-compose logs -f
   
   # Un service spécifique
   docker-compose logs -f accounting-service
   ```

## Configuration détaillée

### Variables d'environnement

Chaque service possède son propre fichier `.env` contenant les variables d'environnement nécessaires. Le script d'initialisation les crée automatiquement à partir des fichiers `.env.example`.

### Volumes persistants

Les données suivantes sont persistantes grâce à des volumes Docker :

- `postgres-data` : Données PostgreSQL
- `*-logs` : Logs de chaque service
- `prometheus-data` : Métriques Prometheus
- `grafana-storage` : Configuration et dashboards Grafana

### Réseau

Tous les services sont connectés au réseau `kiota-network` qui leur permet de communiquer entre eux.

## Accès aux services

- **API Gateway** : http://localhost:3000
- **Documentation API** : http://localhost:3000/api
- **Prometheus** : http://localhost:9090
- **Grafana** : http://localhost:3000 (login: admin / password: kiota-secret)

## Opérations courantes

### Redémarrer un service
```bash
docker-compose restart accounting-service
```

### Mettre à jour un service après des modifications de code
```bash
docker-compose build accounting-service
docker-compose up -d accounting-service
```

### Arrêter tous les services
```bash
docker-compose down
```

### Arrêter tous les services et supprimer les volumes
```bash
docker-compose down -v
```

## Monitoring et observabilité

Vous pouvez accéder au tableau de bord Grafana pour visualiser les métriques des différents services. Prometheus collecte automatiquement les métriques exposées par chaque service sur leur endpoint `/metrics`.

## Dépannage

### Vérifier les logs d'un service qui ne démarre pas
```bash
docker-compose logs accounting-service
```

### Accéder à un shell dans un conteneur
```bash
docker-compose exec accounting-service /bin/sh
```

### Vérifier la connectivité entre services
```bash
docker-compose exec accounting-service ping api-gateway
```

### Redémarrer tous les services
```bash
docker-compose restart
```

### Erreurs TypeScript

Si vous rencontrez des erreurs TypeScript lors de la compilation, comme:
```
src/modules/events/consumers/user-events.consumer.ts:3:10 - error TS2724: 'UserCreatedEventData' has no exported member named 'UserCreatedEventData'.
src/modules/events/events.service.ts:53:44 - error TS2339: Property 'SUBSCRIPTION_CHANGED' does not exist on type 'typeof UserEventTopics'.
```

Solutions possibles:

1. **Mettre à jour toutes les dépendances NestJS ensemble**:
   - Si vous décidez de mettre à jour les bibliothèques NestJS, assurez-vous de toutes les mettre à jour en même temps
   - Exemple: `npm install @nestjs/core@latest @nestjs/common@latest @nestjs/microservices@latest`

2. **Utiliser --legacy-peer-deps lors de l'installation des dépendances**:
   ```bash
   npm install --legacy-peer-deps
   ```

### Erreur de dépendances manquantes

Si vous rencontrez des erreurs lors de la compilation TypeScript comme celles-ci:
```
error TS2307: Cannot find module 'jwks-rsa' or its corresponding type declarations.
error TS2307: Cannot find module 'prom-client' or its corresponding type declarations.
```

Solutions:

1. **Installer les dépendances manquantes manuellement**:
   ```bash
   cd apps/analytics-service
   npm install --save jwks-rsa prom-client
   ```

2. **Vérifier le package.json** du service pour s'assurer que toutes les dépendances sont correctement listées.

### Résoudre les problèmes de chemin des fichiers JavaScript

Les Dockerfiles sont configurés pour rechercher automatiquement le fichier JavaScript principal (`main.js`) dans plusieurs emplacements possibles:
- `apps/<service>/dist/src/main.js`
- `apps/<service>/dist/main.js`
- `apps/<service>/dist/apps/<service>/src/main.js`

Si votre fichier se trouve à un autre emplacement, vous devrez ajuster le `CMD` dans le Dockerfile correspondant.

## Tests et validation

Pour exécuter tous les tests des microservices:

```powershell
.\run-all-tests.ps1
```

Ce script exécute les tests unitaires et d'intégration pour tous les services et affiche un rapport des résultats.

## Environnement de développement local

Si vous préférez développer sans Docker, vous pouvez utiliser le script suivant pour configurer un environnement de développement local:

```powershell
.\setup-local-dev.ps1
```

Ce script:
- Vérifie la présence de Node.js et npm
- Crée les fichiers de configuration nécessaires
- Configure un script pour exécuter les services individuellement
- Installe les dépendances nécessaires

1. **Dépendances manquantes** : 
   - Le module `@nestjs/axios` a été ajouté via le script de correction
   - Des problèmes de typage avec les réponses HTTP ont été corrigés

2. **Script de correction** :
   ```powershell
   # Sous Windows
   .\fix-analytics-service.ps1
   ```

   Ce script :
   - Installe les dépendances manquantes comme `@nestjs/axios`
   - Corrige les problèmes de typage dans `auth.service.ts`
   - Configure le service pour faciliter la construction Docker

3. **Implémentation future** :
   - Cette solution est temporaire jusqu'à ce que les erreurs TypeScript soient correctement corrigées
   - Consultez le fichier `MICROSERVICES_DOCKER_WORKAROUNDS.md` pour plus de détails

4. **Restriction d'accès** :
   - Seuls les utilisateurs du service `portfolio-institution-service` auront accès à ce service d'analyse
   - Cette restriction doit être implémentée au niveau de l'autorisation dans l'API Gateway

La combinaison de ce script avec les autres fixations permet d'avoir tous les microservices opérationnels dans Docker.

## Notes de sécurité

Pour un environnement de production, assurez-vous de :

1. Changer les mots de passe par défaut dans les fichiers d'environnement
2. Activer TLS/SSL pour les communications
3. Limiter l'exposition des ports aux seuls ports nécessaires
4. Utiliser des secrets Docker pour les informations sensibles

## Support

Pour toute question ou problème, veuillez contacter l'équipe de développement ou ouvrir une issue sur le dépôt GitHub.
