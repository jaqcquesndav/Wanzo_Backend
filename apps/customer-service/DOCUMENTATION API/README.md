# Documentation de l'API Customer Service - Wanzo

Cette documentation détaille l'API du microservice Customer Service pour la gestion des clients (PME et institutions financières), des abonnements, des tokens et de la facturation.

## Architecture API actuelle

**Base URL** : `http://customer-service:3000/` (interne) ou via API Gateway  
**Authentification** : JWT avec extraction du client (middleware `CustomerExtractorMiddleware`)  
**Pattern** : NestJS avec TypeORM

## Mise à jour majeure - Août 2025

La documentation a été mise à jour pour refléter la nouvelle architecture modulaire et le système centralisé de tarification:

- Structure des modules clarifiée (SystemUsers, Customers, Subscriptions)
- Système centralisé de configuration des prix dans `subscription-pricing.config.ts`
- Nouveau système de tokens avec contrôle d'accès par fonctionnalité via `@RequireFeature` et `FeatureAccessGuard`
- Interfaces utilisateur recommandées pour la présentation des abonnements et tokens

## Table des matières

1. [Configuration de base](./01-configuration.md)
   - URL de base et API Gateway
   - Headers et authentification
   - Format des réponses standardisé

2. [Authentification](./02-authentification.md)
   - Flux JWT avec extraction du client
   - Gestion des permissions et rôles
   - Sécurité et middleware

3. [Utilisateurs Système](./03-utilisateurs.md)
   - Structure User (employés et admins)
   - Service UserService et types
   - Endpoints de gestion des utilisateurs

4. [Entreprises (PME)](./04-company.md)
   - Structure Customer type SME
   - Gestion des profils entreprise
   - Données test KIOTA TECH

5. [Institutions financières](./05-institutions-financieres.md)
   - Structure Customer type FINANCIAL_INSTITUTION
   - API spécifique aux institutions
   - Fonctionnalités dédiées

6. [Abonnements et plans](./06-abonnements.md)
   - Structure des plans d'abonnement
   - API de pricing et souscription
   - Gestion des fonctionnalités par plan

7. [Système de tokens](./07-tokens.md)
   - Structure du système de tokens
   - API de gestion des tokens
   - Consommation automatique et tracking

8. [Système de tarification](./08-pricing-system.md)
   - Configuration centralisée des prix
   - Services de synchronisation
   - Contrôle d'accès aux fonctionnalités

9. [Guide des interfaces UI](./09-ui-interfaces-guide.md)
   - Présentation des plans d'abonnement
   - Gestion des tokens
   - Composants recommandés

10. [Erreurs et dépannage](./07-erreurs.md)
    - Codes d'erreur standardisés
    - Exceptions et gestion des erreurs
    - Messages d'erreur standardisés

## Résumé des endpoints implémentés

### Utilisateurs Système
- `GET /system-users/me` - Profil utilisateur système
- `PATCH /system-users/me` - Mise à jour profil
- `GET /system-users/{id}` - Récupérer utilisateur par ID
- `POST /admin/system-users` - Créer utilisateur (admin)

### Clients (PME et Institutions)
- `GET /customers/{id}` - Récupérer client
- `POST /customers` - Créer client 
- `PATCH /customers/{id}` - Mettre à jour
- `GET /customers/search` - Rechercher clients

### Pricing et Plans
- `GET /pricing/plans` - Liste des plans d'abonnement
- `GET /pricing/plans/:planId` - Détails d'un plan
- `POST /pricing/calculate` - Calculer prix personnalisé
- `GET /pricing/tokens/packages` - Packages de tokens
- `GET /pricing/features` - Fonctionnalités disponibles

### Abonnements
- `GET /subscriptions/current` - Abonnement actuel
- `POST /subscriptions` - Créer abonnement
- `PATCH /subscriptions/{id}` - Modifier abonnement
- `POST /subscriptions/cancel` - Annuler abonnement

### Tokens
- `GET /tokens/balance/:customerId` - Solde de tokens
- `POST /tokens/purchase` - Acheter tokens
- `GET /tokens/history/:customerId` - Historique transactions
- `POST /tokens/usage` - Enregistrer utilisation

### Administration
- `POST /admin/pricing/sync/plans` - Synchroniser plans
- `POST /admin/pricing/sync/tokens` - Synchroniser packages
- `POST /admin/pricing/sync/all` - Synchroniser toute la config
- `GET /admin/pricing/status` - État de synchronisation

## Caractéristiques techniques

### Architecture modulaire
- Structure en modules clairement définis
- Responsabilités séparées (voir [MODULES_RESPONSIBILITIES.md](../MODULES_RESPONSIBILITIES.md))
- Injection de dépendances NestJS

### Configuration centralisée
- Fichier `subscription-pricing.config.ts` pour tous les plans et prix
- Service `PricingConfigService` pour accès à la configuration
- Synchronisation avec la base de données via `PricingDataSyncService`

### Système de contrôle d'accès
- Décorateur `@RequireFeature()` pour protéger les endpoints
- Guard `FeatureAccessGuard` pour vérifier l'accès
- Middleware `CustomerExtractorMiddleware` pour identifier le client
- Consommation automatique de tokens

### Types TypeScript
- Types et interfaces complets 
- Utilisation d'enums pour les valeurs constantes
- TypeORM avec entités fortement typées

## État de l'implémentation

✅ **Complet** : Système de pricing, Plans d'abonnement, Tokens, Feature Access
✅ **Implémenté** : API publique, API admin, Contrôle d'accès
✅ **Optimisé** : Structure des modules clarifiée (SystemUsers, Customer, etc.)
✅ **Documenté** : Documentation API, Guide d'interfaces utilisateur
🚧 **En cours** : Initialisation des données de prix dans la base
- Champs JSON: camelCase

## Notes importantes

- Toutes les requêtes doivent être effectuées avec le header d'authentification approprié
- Les réponses JSON incluent toujours un champ `success` indiquant le statut de la requête
- Les données sensibles sont toujours envoyées via HTTPS
- La pagination est supportée sur les endpoints qui retournent des listes
