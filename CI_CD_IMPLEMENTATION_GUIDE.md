# Guide d'implémentation CI/CD avec Yarn

Ce document fournit des instructions pour configurer les pipelines CI/CD pour le projet Wanzobe utilisant Yarn comme gestionnaire de paquets.

## Fichiers de configuration CI/CD fournis

Nous avons préparé des exemples de configuration pour les plateformes CI/CD les plus populaires :

1. **GitHub Actions** : `.github/workflows/main.yml`
2. **Jenkins** : `Jenkinsfile`
3. **GitLab CI** : `.gitlab-ci.yml`
4. **Azure DevOps** : `azure-pipelines.yml`

## Choix de la plateforme CI/CD

Choisissez la plateforme qui correspond le mieux à votre infrastructure existante. Si vous n'avez pas encore de plateforme CI/CD, GitHub Actions est généralement la plus facile à configurer.

## Configuration requise pour toutes les plateformes

Quelle que soit la plateforme choisie, les éléments suivants doivent être configurés :

### 1. Secrets/Variables d'environnement

- `DOCKER_HUB_USERNAME` et `DOCKER_HUB_TOKEN` : Informations d'identification pour Docker Hub
- Autres secrets spécifiques au projet (clés API, informations d'accès à la base de données, etc.)

### 2. Mise en cache des dépendances Yarn

Toutes les configurations fournies incluent des mécanismes de mise en cache pour accélérer l'installation des dépendances. Cette fonctionnalité réduit considérablement le temps de construction.

### 3. Configuration des branches

Les configurations sont réglées pour s'exécuter sur les branches `main` et `develop`. Ajustez selon votre stratégie de branches.

## Instructions spécifiques à chaque plateforme

### GitHub Actions

1. Assurez-vous que le répertoire `.github/workflows` existe dans votre dépôt
2. Ajoutez les secrets nécessaires dans les paramètres du dépôt GitHub
3. Personnalisez les étapes de construction Docker pour vos services spécifiques

### Jenkins

1. Installez le plugin "Pipeline" sur votre serveur Jenkins
2. Créez un nouveau pipeline pointant vers votre dépôt Git
3. Configurez les informations d'identification nécessaires dans Jenkins
4. Assurez-vous que Docker est disponible pour Jenkins

### GitLab CI

1. Configurez les variables CI/CD dans les paramètres du projet GitLab
2. Assurez-vous que les runners GitLab ont accès à Docker
3. Personnalisez les jobs pour vos services spécifiques

### Azure DevOps

1. Créez une connexion de service pour Docker Hub dans les paramètres du projet
2. Nommez cette connexion 'DockerHubConnection' (ou mettez à jour le fichier de configuration)
3. Créez un pipeline en pointant vers le fichier `azure-pipelines.yml`

## Personnalisation pour les services Wanzobe

Les configurations fournies incluent des exemples pour les services `accounting-service` et `admin-service`. Pour ajouter d'autres services :

1. Localisez les sections de construction Docker dans les fichiers de configuration
2. Dupliquez les blocs existants pour chaque service supplémentaire
3. Mettez à jour les noms des services et les chemins des Dockerfiles

## Tests et validation

Après la configuration initiale :

1. Soumettez un petit changement pour déclencher le pipeline
2. Vérifiez que toutes les étapes s'exécutent correctement
3. Vérifiez que les images Docker sont construites et poussées correctement
4. Ajustez la configuration selon les besoins

## Intégration avec le déploiement

Pour compléter le cycle CI/CD, envisagez d'ajouter des étapes de déploiement automatique :

1. Déploiement sur un environnement de développement après un push sur `develop`
2. Déploiement sur un environnement de production après un push sur `main`
3. Utilisation de Kubernetes, Docker Swarm ou d'autres outils d'orchestration

## Résolution des problèmes courants

### Erreurs liées à Yarn

Si vous rencontrez des erreurs liées à Yarn dans vos pipelines :

```
yarn install --frozen-lockfile
```

Cette commande garantit que les dépendances installées correspondent exactement à celles du fichier `yarn.lock`.

### Problèmes de permissions Docker

Assurez-vous que les utilisateurs CI ont les autorisations nécessaires pour construire et pousser des images Docker.

### Échecs de cache

Si les caches ne fonctionnent pas correctement, essayez de les invalider manuellement dans les paramètres de votre plateforme CI/CD.
