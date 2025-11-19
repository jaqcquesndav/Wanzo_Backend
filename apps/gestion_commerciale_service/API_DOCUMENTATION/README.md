# Documentation API Wanzo

Ce dossier contient la documentation complète de l'API de l'application Wanzo. Chaque sous-dossier correspond à une fonctionnalité spécifique de l'application et contient les détails des endpoints, des structures de données et des exemples d'utilisation.

## Fonctionnalités documentées

1. [Authentification (Auth)](./auth/README.md)
2. [Paramètres (Settings)](./Settings/README.md)
3. [Tableau de Bord (Dashboard)](./Dashboard/README.md)
4. [Opérations](./Operations/README.md)
5. [Ventes (Sales)](./Sales/README.md)
6. [Inventaire (Produits et Stock)](./Inventory/README.md)
7. [Fournisseurs (Suppliers)](./Supplier/README.md)
8. [Dépenses (Expenses)](./Expenses/README.md)
9. [Transactions Financières](./Financial%20Transactions/README.md)
10. [Financement](./Financing/README.md)
11. [Profil Utilisateur](./Profile/README.md)
12. [Documents](./documents/README.md)
13. [Notifications](./notifications/README.md)

## Alignement avec la structure du code source

Cette documentation API suit la structure des features de l'application Flutter:

- Les paramètres de l'application (`Settings`) incluent la gestion des comptes financiers
- Les transactions financières (`Financial Transactions`) correspondent à la feature `transactions`
- Le financement (`Financing`) correspond à la feature `financing` pour les demandes de crédit
- Le tableau de bord (`Dashboard`) correspond à la feature `dashboard` pour les statistiques et résumés
- Les opérations (`Operations`) correspondent à la feature `operations` qui centralise les différentes actions commerciales
- Le profil utilisateur (`Profile`) correspond à la feature `profile` pour la gestion des informations personnelles

## Structure commune des réponses API

Toutes les réponses de l'API suivent la même structure générale:

```json
{
  "success": boolean,      // Indique si la requête a réussi (true) ou échoué (false)
  "message": "string",     // Message décrivant le résultat de la requête
  "statusCode": number,    // Code HTTP correspondant
  "data": any              // Données retournées (peuvent être null, un objet, ou un tableau)
}
```

## Format des dates

Toutes les dates sont au format ISO8601: `YYYY-MM-DDTHH:mm:ss.sssZ`

Exemple: `2023-08-01T12:30:00.000Z`

## Gestion des erreurs

En cas d'erreur, l'API renvoie une réponse avec `success: false` et un message décrivant l'erreur:

```json
{
  "success": false,
  "message": "Description de l'erreur",
  "statusCode": 400,  // Code d'erreur HTTP approprié
  "data": null
}
```

## Base URL

Tous les endpoints sont accessibles via l'API Gateway:
- **Via API Gateway**: `http://localhost:8000/commerce/api/v1`
- **Accès direct (développement)**: `http://localhost:3006/api`

## Authentification

La plupart des endpoints nécessitent une authentification. Vous devez inclure un token JWT dans l'en-tête de vos requêtes:

```
Authorization: Bearer <votre_token_jwt>
```

Pour obtenir un token, utilisez l'endpoint d'authentification (voir la documentation Auth).

## Pagination

Pour les endpoints qui retournent plusieurs éléments, la pagination est disponible via les paramètres suivants:

- `page`: Le numéro de page à retourner (commence à 1)
- `limit`: Le nombre d'éléments par page

Exemple: `GET /commerce/api/v1/expenses?page=2&limit=10`

## Filtres et tri

De nombreux endpoints prennent en charge des paramètres de filtrage et de tri:

- `sortBy`: Le champ sur lequel trier
- `sortOrder`: L'ordre de tri (`asc` ou `desc`)
- Autres filtres spécifiques à chaque endpoint (voir la documentation correspondante)

## Notes pour les développeurs frontend

Cette documentation est destinée à faciliter l'intégration des services backend dans l'application frontend. Si vous rencontrez des incohérences ou si vous avez besoin de clarifications, veuillez contacter l'équipe backend.

Toutes les structures de données et formats de requêtes/réponses sont conçus pour être utilisés directement avec les modèles de données définis dans l'application Flutter.
