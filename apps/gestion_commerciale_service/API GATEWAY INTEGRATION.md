# Intégration du Service de Gestion Commerciale avec l'API Gateway

Ce document décrit l'intégration du microservice de gestion commerciale avec l'API Gateway Wanzo.

## Points d'accès via l'API Gateway

Le service de gestion commerciale est accessible via l'API Gateway à l'adresse suivante :
```
https://api.wanzo.com/commerce/...
```

Tous les endpoints du service sont préfixés par `/commerce`.

### Exemples d'utilisation

#### Opérations Commerciales

| Endpoint | Méthode | Description | URL via API Gateway |
|----------|---------|-------------|---------------------|
| Lister les opérations | GET | Récupère la liste des opérations commerciales | `https://api.wanzo.com/commerce/api/v1/operations` |
| Créer une opération | POST | Crée une nouvelle opération commerciale | `https://api.wanzo.com/commerce/api/v1/operations` |
| Détails d'une opération | GET | Récupère les détails d'une opération spécifique | `https://api.wanzo.com/commerce/api/v1/operations/{id}` |
| Modifier une opération | PATCH | Met à jour une opération existante | `https://api.wanzo.com/commerce/api/v1/operations/{id}` |
| Supprimer une opération | DELETE | Supprime une opération | `https://api.wanzo.com/commerce/api/v1/operations/{id}` |
| Résumé des opérations | GET | Obtient un résumé des opérations par période | `https://api.wanzo.com/commerce/api/v1/operations/summary/{period}` |
| Exporter les opérations | POST | Exporte les opérations en PDF ou Excel | `https://api.wanzo.com/commerce/api/v1/operations/export` |
| Timeline des opérations | GET | Obtient une timeline des dernières opérations | `https://api.wanzo.com/commerce/api/v1/operations/timeline` |

## Authentification

Toutes les requêtes doivent inclure un token JWT valide dans l'en-tête d'autorisation :

```
Authorization: Bearer <token>
```

## Métriques et Monitoring

Les métriques Prometheus pour ce service sont disponibles à l'adresse :
```
https://api.wanzo.com/commerce/metrics
```

## Documentation API

La documentation Swagger détaillée du service est accessible à :
```
https://api.wanzo.com/commerce/api/docs
```

## Communication par Événements

Le service communique avec d'autres services via Kafka pour les événements suivants :

### Événements Produits
- Événements publiés : opération d'achat, opération de vente
- Événements consommés : mise à jour de stock, modification de prix

### Événements Utilisateurs
- Événements consommés : utilisateur créé, rôle utilisateur modifié, statut utilisateur modifié

## Limitations et Considérations

- Le rate limiting est appliqué à 100 requêtes par minute par utilisateur
- Le timeout des requêtes est fixé à 30 secondes
- Les opérations d'exportation volumineuses sont traitées de façon asynchrone
