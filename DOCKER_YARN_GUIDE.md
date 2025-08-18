# Guide de construction des images Docker avec Yarn

Ce document explique comment construire et utiliser les images Docker mises à jour pour utiliser Yarn au lieu de npm.

## Images Docker mises à jour

Les Dockerfiles suivants ont été mis à jour pour utiliser Yarn :

- `apps/admin-service/Dockerfile`
- `apps/accounting-service/Dockerfile`
- `apps/api-gateway/Dockerfile`
- `apps/customer-service/Dockerfile`
- `apps/portfolio-institution-service/Dockerfile`

## Construction des images

Pour construire toutes les images Docker avec Yarn, exécutez le script de test :

```powershell
.\test-docker-yarn.ps1
```

Ou construisez individuellement chaque image :

```bash
# Construire l'image api-gateway
docker build -t kiota-suit/api-gateway:latest -f ./apps/api-gateway/Dockerfile .
```

## Utilisation avec docker-compose

Pour utiliser les images mises à jour avec docker-compose, assurez-vous que votre fichier `docker-compose.yml` fait référence aux images correctes.

Exemple pour le service api-gateway :

```yaml
api-gateway:
  build:
    context: .
    dockerfile: ./apps/api-gateway/Dockerfile
  ports:
    - "8000:8000"
  # autres configurations...
```

## Conseils pour le déploiement

1. Assurez-vous que le fichier `.yarnrc.yml` est correctement configuré
2. Utilisez le flag `--ignore-engines` lors de l'installation des dépendances si nécessaire
3. Si vous rencontrez des problèmes de mémoire lors de la construction, augmentez les ressources allouées à Docker

## Notes sur les performances

L'utilisation de Yarn au lieu de npm peut améliorer les performances de construction et réduire la taille des images Docker, car Yarn a généralement une meilleure gestion des dépendances et du cache.
