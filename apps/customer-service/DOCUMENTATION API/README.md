# Documentation de l'API Wanzo

Cette documentation détaille l'API utilisée par l'application Wanzo pour la gestion des profils d'entreprise (PME) et des institutions financières.

## Architecture API actuelle

**Base URL** : `http://localhost:8000/land/api/v1` (développement)
**Authentification** : Bearer token automatique via Auth0
**Pattern** : UI > Types > Hooks > Services

## Table des matières

1. [Configuration de base](./01-configuration.md)
   - URL de base et API Gateway
   - Headers automatiques (Bearer token)
   - Format des réponses standardisé

2. [Authentification](./02-authentification.md)
   - Flux Auth0 avec PKCE
   - Gestion hybride (Auth0 + Backend)
   - Stockage sécurisé et fallback

3. [Utilisateurs](./03-utilisateurs.md)
   - Structure User basée sur `src/types/user.ts`
   - Service UserService avec timeout et fallback
   - Endpoints `/users/me`

4. [Entreprises (PME)](./04-entreprises.md)
   - Structure Company basée sur code source
   - Service CompanyService (localStorage actuel)
   - Données test KIOTA TECH

5. [Institutions financières](./05-institutions-financieres.md)
   - Structure FinancialInstitution
   - CRUD complet + upload logo
   - Endpoints `/financial-institutions/*`

6. [Abonnements et paiements](./06-abonnements.md)
   - Plans, souscriptions, tokens
   - Service SubscriptionApiService
   - Endpoints `/subscriptions/*`, `/tokens/*`, `/payments/*`

7. [Erreurs et dépannage](./07-erreurs.md)
   - Gestion ApiServiceError
   - Stratégies de récupération et timeouts
   - Messages d'erreur standardisés

## Résumé des endpoints implémentés

### Utilisateurs
- `GET /users/me` - Profil utilisateur (avec fallback Auth0)
- `PATCH /users/me` - Mise à jour profil

### Institutions financières
- `GET /financial-institutions/{id}` - Récupérer institution
- `POST /financial-institutions` - Créer institution  
- `PATCH /financial-institutions/{id}` - Mettre à jour
- `DELETE /financial-institutions/{id}` - Supprimer
- `POST /financial-institutions/logo/upload` - Upload logo

### Abonnements et paiements
- `GET /subscription/plans` - Liste des plans
- `POST /subscriptions` - Créer abonnement
- `GET /subscriptions/current` - Abonnement actuel
- `POST /subscriptions/cancel` - Annuler abonnement
- `POST /subscriptions/change-plan` - Changer de plan

### Tokens
- `GET /tokens/balance` - Solde de tokens
- `POST /tokens/purchase` - Acheter tokens
- `GET /tokens/transactions` - Historique transactions

### Paiements
- `GET /payments` - Historique paiements
- `GET /payments/{id}/receipt` - Télécharger reçu (PDF)
- `POST /payments/manual-proof` - Upload preuve paiement

### IA (Services additionnels)
- `POST /ai/chat` - Chat avec IA
- `POST /ai/transcribe` - Transcription audio

## Caractéristiques techniques

### Authentification automatique
- Bearer token sur toutes les requêtes
- Gestion centralisée via `getToken()`
- Headers automatiques dans `ApiService`

### Gestion des erreurs
- Timeout 10s sur requêtes critiques
- Fallback Auth0 si backend indisponible
- Format d'erreur standardisé `ApiServiceError`

### Types TypeScript
- Interfaces complètes dans `src/types/api.ts`
- Validation avec schémas Zod
- Types conformes au code source

## État de l'implémentation

✅ **Complet** : Authentification, Types, Gestion d'erreurs
✅ **Implémenté** : Users, Financial Institutions, Subscriptions, Payments, Tokens
🚧 **En cours** : Companies (localStorage → API backend)
🚧 **À implémenter** : Endpoints manquants selon besoins métier
- Paramètres URL: camelCase
- Champs JSON: camelCase

## Notes importantes

- Toutes les requêtes doivent être effectuées avec le header d'authentification approprié
- Les réponses JSON incluent toujours un champ `success` indiquant le statut de la requête
- Les données sensibles sont toujours envoyées via HTTPS
- La pagination est supportée sur les endpoints qui retournent des listes
