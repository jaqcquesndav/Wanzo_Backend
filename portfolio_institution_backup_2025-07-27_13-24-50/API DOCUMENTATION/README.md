# DOCUMENTATION API WANZO PORTFOLIO INSTITUTION

Cette documentation est destinée aux développeurs backend qui utilisent NestJS avec une architecture API Gateway pour intégrer ou maintenir l'application Wanzo Portfolio Institution.

## Structure de la documentation

La documentation des APIs est organisée selon la structure modulaire de l'application.

### Portefeuilles

La plateforme prend en charge un type de portefeuille:

1. **Portefeuille Traditionnel** (`/api-docs/portefeuilles/traditionnel/`)
   - Demandes de financement
   - Contrats de crédit
   - Virements
   - Remboursements
   - Garanties
   - Produits financiers
   - Paramètres

### Autres modules

En plus des portefeuilles, la documentation couvre également les autres modules du système:

- **Chat** (`/api-docs/chat/`)
- **Centrale de Risque** (`/api-docs/centrale-risque/`)
- **Dashboard** (`/api-docs/dashboard/`)
- **Institution** (`/api-docs/institution/`)
- **Paiements** (`/api-docs/paiements/`)
- **Prospection** (`/api-docs/prospection/`)
- **Paramètres** (`/api-docs/parametres/`)
- **Utilisateurs** (`/api-docs/utilisateurs/`)
- **Virements** (`/api-docs/virements/`)

## Utilisation

1. Commencez par cette page README.md qui donne un aperçu global de l'API.
2. Consultez ensuite la configuration de base pour comprendre l'URL de base, les headers et le format des réponses.
3. Familiarisez-vous avec le flux d'authentification qui est crucial pour toutes les requêtes.
4. Explorez les différentes ressources (utilisateurs, portefeuilles, etc.) selon vos besoins.
5. Reportez-vous aux sections d'erreurs spécifiques en cas de problème.

## Conventions

- **IMPORTANT** : Toutes les routes API commencent par `/portfolio_inst/` (ne pas inclure `api/v1/`)
- Toutes les requêtes protégées doivent inclure un token d'authentification JWT dans l'en-tête `Authorization`
- Toutes les réponses suivent un format JSON standardisé :
  ```json
  {
    "success": true,
    "data": {
      // Données spécifiques à l'endpoint
    }
  }
  ```
- Les erreurs suivent également un format standardisé :
  ```json
  {
    "success": false,
    "error": {
      "code": "ERROR_CODE",
      "message": "Description de l'erreur",
      "details": {
        // Détails supplémentaires optionnels
      }
    }
  }
  ```
- Les réponses paginées incluent des métadonnées de pagination
- Les codes HTTP standards sont utilisés (200, 201, 400, 401, 403, 404, 500, etc.)

## Environnements

- Développement : http://localhost:8000/portfolio_inst
- Production : https://api.wanzo-portfolio.com/portfolio_inst

## Structure des fichiers

1. README.md - Vue d'ensemble de l'API
2. 01-configuration.md - Configuration de base (URLs, headers, etc.)
3. 02-authentification.md - Flux d'authentification et gestion des tokens
4. 03-utilisateurs.md - Gestion des utilisateurs et rôles
5. portefeuilles/
   - 01-portefeuilles-traditionnels.md - Gestion des portefeuilles traditionnels
   - 02-portefeuilles-investissement.md - Gestion des portefeuilles d'investissement
   - 03-portefeuilles-leasing.md - Gestion des portefeuilles de leasing

## Mise à jour de la documentation

Cette documentation doit être mise à jour chaque fois que l'API est modifiée. Suivez le processus de revue de code pour valider les modifications de la documentation.

## Format standard des réponses

### Réponse réussie

```json
{
  "success": true,
  "data": {
    // Données spécifiques à chaque endpoint
  }
}
```

### Réponse d'erreur

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description de l'erreur",
    "details": {
      // Détails supplémentaires éventuels
    }
  }
}
```

### Réponse paginée

```json
{
  "success": true,
  "data": {
    "items": [
      // Tableau d'éléments
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

## Sécurité et bonnes pratiques

1. **Toujours utiliser HTTPS** en production
2. **Ne pas exposer les tokens de rafraîchissement** dans des stockages non sécurisés
3. **Valider toutes les entrées utilisateur** côté client et côté serveur
4. **Mettre en place un système de limitation de débit** pour éviter les attaques par force brute
5. **Gérer correctement les erreurs** pour ne pas exposer d'informations sensibles

## Contact

Pour toute question concernant cette documentation ou l'API, contactez:
- Email: dev@wanzo-portfolio.com
