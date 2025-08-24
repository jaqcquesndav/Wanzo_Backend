# Wanzo Accounting - Documentation Endpoints Exacts

Cette documentation contient UNIQUEMENT les endpoints basés sur l'analyse exacte du code source.

## Configuration API

### Base URL
- **Production**: `https://api.wanzo-land.com/accounting/api/v1`
- **Développement**: `http://localhost:8000/accounting/api/v1`

### Authentification Auth0 PKCE
```typescript
{
  domain: 'wanzo-land.us.auth0.com',
  clientId: 'RXTxVgIKY8HjQ6MHs3c80a2kbIWgRPxg',
  redirectUri: `${window.location.origin}/auth/callback`,
  cacheLocation: 'localstorage',
  useRefreshTokens: true,
  useRefreshTokensFallback: true
}
```

### Headers Standards
```typescript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {access_token}',
  'Accept': 'application/json',
  'X-Accounting-Client': 'Wanzo-Accounting-UI/1.0.0'
}
```

## Endpoints du Code Source

### 1. Authentification (`/auth`) - auth.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/auth/verify` | Vérifie la validité du token |
| `POST` | `/auth/logout` | Déconnexion utilisateur |
| `POST` | `/auth/sso` | Connexion SSO avec KS Auth |

### 2. Comptes (`/accounts`) - accounts.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/accounts` | Liste tous les comptes avec pagination |
| `GET` | `/accounts/{id}` | Récupère un compte spécifique |
| `POST` | `/accounts` | Crée un nouveau compte |
| `PUT` | `/accounts/{id}` | Met à jour un compte |
| `DELETE` | `/accounts/{id}` | Supprime un compte |
| `POST` | `/accounts/batch` | Création en lot de comptes |
| `GET` | `/accounts/search` | Recherche de comptes |

### 3. Écritures Comptables (`/journal-entries`) - journalEntries.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/journal-entries` | Liste des écritures avec pagination |
| `GET` | `/journal-entries/{id}` | Récupère une écriture spécifique |
| `POST` | `/journal-entries` | Crée une nouvelle écriture |
| `PUT` | `/journal-entries/{id}` | Met à jour une écriture |
| `DELETE` | `/journal-entries/{id}` | Supprime une écriture |

### 4. Grand Livre (`/ledger`) - ledger.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/ledger/accounts/{id}/balance` | Solde d'un compte |
| `GET` | `/ledger/accounts/{id}/movements` | Mouvements d'un compte |
| `GET` | `/ledger/accounts/{id}` | Grand livre d'un compte (alternatif) |
| `GET` | `/ledger/trial-balance` | Balance de vérification |
| `GET` | `/ledger/export-balance` | Export de balance (Blob) |
| `GET` | `/ledger/export` | Export général du grand livre (Blob) |
| `GET` | `/ledger/search` | Recherche globale dans le grand livre |

### 5. Déclarations (`/declarations`) - declarations.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/declarations` | Liste des déclarations avec filtres |
| `GET` | `/declarations/{id}` | Récupère une déclaration |
| `POST` | `/declarations` | Crée une déclaration |
| `PUT` | `/declarations/{id}` | Met à jour une déclaration |
| `DELETE` | `/declarations/{id}` | Supprime une déclaration |
| `POST` | `/declarations/{id}/submit` | Soumet une déclaration |
| `POST` | `/declarations/{id}/validate` | Valide une déclaration |
| `POST` | `/declarations/{id}/reject` | Rejette une déclaration |
| `POST` | `/declarations/{id}/justification` | Upload justificatif (FormData) |
| `POST` | `/declarations/{id}/declaration-form` | Upload formulaire (FormData) |
| `GET` | `/declarations/{id}/attachments` | Liste des pièces jointes |
| `DELETE` | `/declarations/{id}/attachments/{attachmentId}` | Supprime une pièce jointe |
| `GET` | `/declarations/stats` | Statistiques des déclarations |
| `GET` | `/declarations/export` | Export des déclarations (Blob) |

### 6. Exercices Comptables (`/fiscal-years`) - fiscalYears.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/fiscal-years` | Liste des exercices comptables |
| `GET` | `/fiscal-years/{id}` | Récupère un exercice |
| `POST` | `/fiscal-years` | Crée un exercice |
| `POST` | `/fiscal-years/{id}/close` | Clôture un exercice |
| `POST` | `/fiscal-years/{id}/reopen` | Réouvre un exercice |
| `POST` | `/fiscal-years/{id}/audit` | Audit d'un exercice |
| `POST` | `/fiscal-years/import` | Import d'exercices (FormData) |

### 7. Rapports (`/reports`) - reports.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/reports/balance-sheet` | Bilan comptable |
| `GET` | `/reports/income-statement` | Compte de résultat |
| `GET` | `/reports/cash-flow` | Tableau de flux de trésorerie |
| `GET` | `/reports/equity-changes` | Tableau des variations des capitaux |
| `GET` | `/reports/notes` | Notes aux états financiers |
| `POST` | `/reports/generate` | Génération de rapport personnalisé |
| `GET` | `/reports/export` | Export de rapport (Blob) |
| `GET` | `/reports/templates` | Templates de rapports disponibles |

### 8. Tableau de Bord (`/dashboard`) - dashboard.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/dashboard` | Données complètes du tableau de bord |
| `GET` | `/dashboard/quick-stats` | Statistiques rapides (KPI) |
| `GET` | `/dashboard/financial-ratios` | Ratios financiers |
| `GET` | `/dashboard/key-performance-indicators` | Indicateurs de performance |
| `GET` | `/dashboard/revenue` | Données de revenus pour graphiques |
| `GET` | `/dashboard/expenses` | Données de dépenses pour graphiques |
| `GET` | `/dashboard/transactions` | Transactions récentes |
| `GET` | `/dashboard/alerts` | Alertes système |

### 9. Chat IA (`/chat`) - chat.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/chat/messages` | Envoi d'un message au chat IA |
| `GET` | `/chat/conversations` | Liste des conversations |
| `GET` | `/chat/conversations/{id}` | Récupère une conversation |
| `DELETE` | `/chat/conversations/{id}` | Supprime une conversation |
| `POST` | `/chat/messages/{id}/rate` | Évaluation d'un message |
| `GET` | `/chat/models` | Modèles d'IA disponibles |

### 10. Utilisateurs (`/users`) - users.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/users` | Liste des utilisateurs avec pagination |
| `GET` | `/users/{id}` | Récupère un utilisateur |
| `POST` | `/users` | Crée un utilisateur |
| `PUT` | `/users/{id}` | Met à jour un utilisateur |
| `DELETE` | `/users/{id}` | Supprime un utilisateur |
| `POST` | `/users/invite` | Invite un utilisateur |
| `POST` | `/users/{id}/avatar` | Upload avatar (FormData) |
| `GET` | `/users/roles` | Rôles disponibles |
| `GET` | `/users/departments` | Départements disponibles |

### 11. Notifications (`/notifications`) - notifications.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/notifications` | Liste des notifications |
| `GET` | `/notifications/{id}` | Récupère une notification |
| `POST` | `/notifications` | Crée une notification |
| `PUT` | `/notifications/{id}` | Met à jour une notification |
| `DELETE` | `/notifications/{id}` | Supprime une notification |
| `POST` | `/notifications/{id}/read` | Marque comme lue |
| `POST` | `/notifications/mark-all-read` | Marque tout comme lu |
| `POST` | `/notifications/bulk-action` | Actions en lot |
| `GET` | `/notifications/preferences` | Préférences utilisateur |
| `PUT` | `/notifications/preferences` | Met à jour les préférences |

### 12. Paramètres (`/settings`) - settings.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/settings` | Tous les paramètres |
| `GET` | `/settings/{category}` | Paramètres d'une catégorie |
| `PUT` | `/settings/{category}` | Met à jour une catégorie |
| `POST` | `/settings/reset` | Réinitialise tous les paramètres |
| `POST` | `/settings/{category}/reset` | Réinitialise une catégorie |
| `POST` | `/settings/import` | Importe des paramètres |
| `GET` | `/settings/export` | Exporte les paramètres |
| `POST` | `/settings/validate` | Valide des paramètres |
| `GET` | `/settings/data-sharing` | Paramètres de partage de données |
| `PUT` | `/settings/data-sharing` | Met à jour le partage de données |
| `GET` | `/settings/data-sources` | Sources de données |
| `PUT` | `/settings/data-sources` | Met à jour les sources |
| `GET` | `/settings/integrations/status` | Statut des intégrations |

### 13. Écritures Agent (`/agent-entries`) - agentEntries.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/agent-entries` | Écritures proposées par l'agent IA |
| `GET` | `/agent-entries/{id}` | Récupère une écriture proposée |
| `PUT` | `/agent-entries/{id}/validate` | Valide une écriture |
| `PUT` | `/agent-entries/{id}/reject` | Rejette une écriture |
| `POST` | `/agent-entries/validate-batch` | Validation en lot |
| `PUT` | `/agent-entries/{id}` | Modifie avant validation |
| `DELETE` | `/agent-entries/{id}` | Supprime une proposition |

### 14. Audit (`/audit`) - audit.ts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/audit/request-token` | Demande un token d'audit |
| `POST` | `/audit/validate-token` | Valide un token d'audit |
| `POST` | `/audit/fiscal-year/{id}` | Audit d'un exercice comptable |
| `GET` | `/audit/history/{fiscalYearId}` | Historique d'audit |
| `GET` | `/audit/list` | Liste de tous les audits |

## Format de Réponse Standard

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

## Paramètres de Requête Communs

### Pagination
- `page` - Numéro de page (défaut: 1)
- `pageSize` - Éléments par page (défaut: 20)

### Filtres Temporels
- `startDate` - Date de début (ISO 8601)
- `endDate` - Date de fin (ISO 8601)
- `date` - Date spécifique (ISO 8601)
- `period` - Période (`day`, `week`, `month`, `quarter`, `year`)

### Filtres Financiers
- `fiscalYearId` - ID de l'exercice comptable
- `currency` - Code devise (ISO 4217)
- `comparative` - Données comparatives (boolean)

## Notes Importantes

- **Authentification**: Tous les endpoints requièrent un Bearer token Auth0
- **Headers**: Header personnalisé `X-Accounting-Client` requis
- **Upload**: Endpoints de fichiers utilisent `multipart/form-data`
- **Export**: Endpoints d'export retournent des `Blob` (PDF/Excel)
- **Types**: Voir `src/types/` pour les définitions TypeScript complètes
- **Services**: 
  - Configuration base dans `ApiService.ts`
  - Endpoints organisés par domaine fonctionnel
  - Support hors ligne avec IndexedDB

## Codes d'Erreur HTTP

- `200` - Succès
- `201` - Créé avec succès
- `204` - Succès sans contenu
- `400` - Requête incorrecte
- `401` - Non autorisé (token invalide/expiré)
- `403` - Accès interdit
- `404` - Ressource non trouvée
- `422` - Erreurs de validation
- `500` - Erreur interne du serveur
