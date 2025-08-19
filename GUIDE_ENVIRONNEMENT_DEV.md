# Guide d'Utilisation de l'Environnement de Développement Wanzobe

Ce guide explique comment configurer et utiliser l'environnement de développement pour le projet Wanzobe.

## Prérequis

- Docker et Docker Compose installés
- Git
- Yarn (pour le développement local)

## Structure du Projet

Le projet est organisé comme un monorepo Yarn Workspaces avec plusieurs microservices:

- **api-gateway**: Point d'entrée unique pour toutes les API
- **admin-service**: Gestion des utilisateurs et des permissions
- **accounting-service**: Service de comptabilité
- **analytics-service**: Service d'analyse de données
- **portfolio-institution-service**: Gestion des portefeuilles institutionnels
- **gestion_commerciale_service**: Gestion commerciale
- **customer-service**: Gestion des clients

## Modes de Déploiement

L'environnement supporte deux modes:

- **dev**: Pour le développement avec hot-reloading
- **prod**: Pour tester en mode production

## Démarrage Rapide

### Windows (PowerShell)

```powershell
# Démarrer en mode développement (par défaut)
.\start-environment.ps1

# Démarrer en mode production
.\start-environment.ps1 prod

# Reconstruire les images avant de démarrer
.\start-environment.ps1 -BuildImages

# Afficher l'aide
.\start-environment.ps1 -Help
```

### Linux/macOS (Bash)

```bash
# Rendre le script exécutable
chmod +x start-environment.sh

# Démarrer en mode développement (par défaut)
./start-environment.sh

# Démarrer en mode production
./start-environment.sh prod

# Reconstruire les images avant de démarrer
./start-environment.sh --build

# Afficher l'aide
./start-environment.sh --help
```

## Utilisation de l'Environnement de Développement

En mode développement:

1. Les services sont exécutés avec `yarn start:dev`
2. Les dossiers `src` des services et du package partagé sont montés dans les conteneurs
3. Les modifications du code sont détectées automatiquement et rechargées à la volée

### Commandes Utiles

```bash
# Voir les logs d'un service spécifique
docker-compose --profile dev logs -f gestion-commerciale-service-dev

# Arrêter l'environnement
docker-compose --profile dev down

# Redémarrer un service spécifique
docker-compose --profile dev restart gestion-commerciale-service-dev
```

## Services d'Infrastructure

Les services d'infrastructure fonctionnent quel que soit le profil sélectionné:

- **Kafka/Zookeeper**: Messagerie asynchrone (ports 9092, 29092)
- **PostgreSQL**: Base de données (port 5432)
- **Prometheus**: Monitoring (port 9090)
- **Grafana**: Visualisation (port 4000)

## Optimisation Docker

Les images Docker utilisent une construction multi-étapes pour réduire la taille des images:
- Étape `builder`: Contient tous les outils de développement
- Étape `production`: Contient uniquement les dépendances de production

## Résolution des Problèmes Courants

### Erreur de résolution de modules TypeScript

Si vous rencontrez des erreurs de résolution de modules avec `@wanzobe/shared`, vérifiez:

1. Que le champ `exports` est correctement configuré dans le fichier `package.json` du package
2. Que les chemins dans `tsconfig.json` sont correctement configurés
3. Que les liens symboliques dans les conteneurs sont correctement établis

### Conteneurs qui ne démarrent pas

Vérifiez les logs avec:

```bash
docker-compose logs -f [nom-du-service]
```

### Hot-Reloading ne fonctionne pas

Assurez-vous que:

1. Vous utilisez le profil `dev`
2. Les volumes sont correctement montés
3. Les watchers sont configurés dans les services
