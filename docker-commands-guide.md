# Guide des commandes Docker pour les microservices Wanzo

Ce document répertorie les commandes essentielles pour gérer les conteneurs et images Docker des microservices du projet Wanzo Backend. Ces commandes vous aideront à arrêter, supprimer, reconstruire et tester les différents services.

## Navigation et préparation

```powershell
# Naviguer vers le répertoire d'un service spécifique
cd apps/portfolio-institution-service

# Vérifier le répertoire actuel
pwd

# Lister les fichiers du répertoire
ls
```

## Commandes de base pour gérer les images Docker

```powershell
# Lister toutes les images Docker
docker images

# Lister les images filtrées par nom
docker images | Select-String -Pattern "portfolio-institution-service"

# Supprimer une image spécifique
docker rmi portfolio-institution-service
```

## Gestion des conteneurs Docker

```powershell
# Lister tous les conteneurs en cours d'exécution
docker ps

# Lister tous les conteneurs (y compris ceux arrêtés)
docker ps -a

# Filtrer les conteneurs par nom
docker ps -a | Select-String -Pattern "portfolio"

# Arrêter un conteneur spécifique
docker stop portfolio-institution-mock

# Supprimer un conteneur spécifique
docker rm portfolio-institution-mock

# Supprimer tous les conteneurs arrêtés
docker container prune
```

## Construction et déploiement des images

```powershell
# Construire une image Docker à partir du Dockerfile dans le répertoire courant
docker build -t portfolio-institution-service .

# Lancer un conteneur à partir d'une image
docker run -d -p 3004:3004 --name portfolio-institution-mock portfolio-institution-service

# Construire avec des options spécifiques (exemple)
docker build --no-cache -t portfolio-institution-service .
```

## Vérification et tests des services

```powershell
# Consulter les logs d'un conteneur
docker logs portfolio-institution-mock

# Tester un endpoint health
curl http://localhost:3004/health

# Tester un endpoint API
curl http://localhost:3004/api/portfolio

# Tester un autre endpoint API
curl http://localhost:3004/api/institutions
```

## Commandes avancées

```powershell
# Exécuter une commande dans un conteneur en cours d'exécution
docker exec -it portfolio-institution-mock sh

# Voir les détails d'un conteneur
docker inspect portfolio-institution-mock

# Voir les statistiques d'utilisation des ressources
docker stats portfolio-institution-mock
```

## Exemple de workflow complet pour un microservice

```powershell
# 1. Naviguer vers le répertoire du service
cd apps/portfolio-institution-service

# 2. Arrêter et supprimer l'ancien conteneur s'il existe
docker stop portfolio-institution-mock
docker rm portfolio-institution-mock

# 3. Reconstruire l'image
docker build -t portfolio-institution-service .

# 4. Lancer le nouveau conteneur
docker run -d -p 3004:3004 --name portfolio-institution-mock portfolio-institution-service

# 5. Vérifier que le conteneur est bien démarré
docker ps | Select-String -Pattern "portfolio"

# 6. Vérifier les logs du conteneur
docker logs portfolio-institution-mock

# 7. Tester les endpoints
curl http://localhost:3004/health
```

## Notes importantes

- Les ports utilisés doivent correspondre à la configuration de chaque service
- Assurez-vous que les ports ne sont pas déjà utilisés par d'autres applications
- Pour les services interdépendants, vérifiez que les services dont ils dépendent sont bien démarrés
- Les fichiers mock-service.js doivent être correctement configurés pour que les services restent actifs

Ce guide a été créé le 7 août 2025 pour le projet Wanzo Backend.
