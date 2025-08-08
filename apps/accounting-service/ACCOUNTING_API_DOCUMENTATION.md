# Documentation de l'API du microservice Accounting

Cette documentation décrit la structure des URLs et les endpoints disponibles pour communiquer avec le microservice Accounting via l'API Gateway.

## Informations générales

- **Base URL**: `http://localhost:8000/accounting`
- **Version API**: v1
- **Port API Gateway**: 8000
- **Port Microservice Accounting**: 3003 (interne)

## Authentification

Toutes les requêtes nécessitent une authentification via un token JWT.

**Headers requis**:
```
Authorization: Bearer <token_jwt>
Content-Type: application/json
```

## Structure des URLs

Tous les endpoints du microservice sont accessibles via l'API Gateway à l'adresse suivante:
`http://localhost:8000/accounting/<endpoint>`

## Endpoints disponibles

### 1. Comptes (Accounts)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/accounts` | Récupérer tous les comptes avec filtrage |
| GET | `/accounts/:id` | Récupérer un compte par son ID |
| POST | `/accounts` | Créer un nouveau compte |
| PUT | `/accounts/:id` | Mettre à jour un compte |
| DELETE | `/accounts/:id` | Supprimer un compte |

**Paramètres de filtrage pour GET /accounts**:
- `search`: Terme de recherche pour le code ou le nom
- `type`: Type de compte (`asset`, `liability`, `equity`, `revenue`, `expense`, `all`)
- `standard`: Norme comptable (`SYSCOHADA`, `IFRS`, `all`)
- `isAnalytic`: Filtrer par comptes analytiques (boolean)
- `sortBy`: Champ de tri (`code`, `name`, `type`)
- `sortOrder`: Ordre de tri (`asc`, `desc`)
- `page`: Numéro de page pour la pagination
- `pageSize`: Nombre de comptes par page

### 2. Journal des écritures comptables (Journal Entries)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/journal-entries` | Récupérer toutes les écritures avec filtrage |
| GET | `/journal-entries/:id` | Récupérer une écriture par son ID |
| GET | `/journal-entries/account/:accountId` | Récupérer les écritures d'un compte |
| GET | `/journal-entries/account/:accountId/balance` | Récupérer le solde d'un compte |
| POST | `/journal-entries` | Créer une nouvelle écriture |
| PUT | `/journal-entries/:id` | Mettre à jour une écriture |
| PUT | `/journal-entries/:id/status` | Mettre à jour le statut d'une écriture |
| DELETE | `/journal-entries/:id` | Supprimer une écriture |
| PATCH | `/journal-entries/:id/validate` | Valider ou rejeter une écriture générée par l'IA |

**Paramètres de filtrage pour GET /journal-entries**:
- `page`: Numéro de page (défaut: 1)
- `pageSize`: Nombre d'éléments par page (défaut: 20, max: 100)
- `journalType`: Type de journal (`sales`, `purchases`, `bank`, `cash`, `general`)
- `status`: Filtrer par statut (`draft`, `pending`, `approved`, `posted`, `rejected`, `cancelled`)
- `source`: Filtrer par source (`manual`, `agent`)
- `startDate`: Date de début (format: YYYY-MM-DD)
- `endDate`: Date de fin (format: YYYY-MM-DD)
- `search`: Terme de recherche pour la description, référence, etc.

### 3. Exercices fiscaux (Fiscal Years)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/fiscal-years` | Récupérer tous les exercices fiscaux |
| GET | `/fiscal-years/:id` | Récupérer un exercice fiscal par son ID |
| POST | `/fiscal-years` | Créer un nouvel exercice fiscal |
| POST | `/fiscal-years/import` | Importer un exercice fiscal à partir d'un fichier |
| PUT | `/fiscal-years/:id` | Mettre à jour un exercice fiscal |
| PUT | `/fiscal-years/:id/close` | Clôturer un exercice fiscal |

**Paramètres pour GET /fiscal-years**:
- `status`: Filtrer par statut (`open`, `closed`, `audited`)

### 4. Grand Livre (Ledger)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/ledger/accounts/:accountId/balance` | Récupérer le solde d'un compte |
| GET | `/ledger/accounts/:accountId/movements` | Récupérer les mouvements d'un compte |
| GET | `/ledger/trial-balance` | Récupérer la balance générale |
| GET | `/ledger/export` | Exporter le grand livre |
| GET | `/ledger/search` | Recherche dans le grand livre |

### 5. Agent IA (Agent Entries)

| Méthode | URL | Description |
|---------|-----|-------------|
| PUT | `/agent-entries/:entryId/validate` | Valider ou modifier une écriture suggérée par l'IA |

### 6. Audit

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/audit/request-token` | Demander un token pour un auditeur |
| POST | `/audit/validate-token` | Valider un token d'audit |

### 7. Rapports (Reports)

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/reports/generate` | Générer un rapport financier |
| POST | `/reports/export` | Exporter un rapport au format spécifié |

### 8. Tableau de bord (Dashboard)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/dashboard` | Récupérer toutes les données du tableau de bord |
| GET | `/dashboard/quick-stats` | Récupérer les statistiques rapides |
| GET | `/dashboard/financial-ratios` | Récupérer les ratios financiers |
| GET | `/dashboard/recent-transactions` | Récupérer les transactions récentes |
| GET | `/dashboard/revenue-chart` | Récupérer les données du graphique des revenus |
| GET | `/dashboard/expenses-chart` | Récupérer les données du graphique des dépenses |

**Paramètres pour les endpoints du dashboard**:
- `period`: Période de temps (`day`, `week`, `month`, `quarter`, `year`)
- `fiscalYearId`: ID de l'exercice fiscal (défaut: exercice fiscal courant)

### 9. Déclarations fiscales (Declarations)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/declarations` | Récupérer toutes les déclarations fiscales |
| GET | `/declarations/:id` | Récupérer une déclaration par son ID |
| POST | `/declarations` | Créer une nouvelle déclaration |
| PATCH | `/declarations/:id` | Mettre à jour une déclaration |
| PATCH | `/declarations/:id/status` | Mettre à jour le statut d'une déclaration |

### 10. Utilisateurs (Users)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/users` | Récupérer tous les utilisateurs |
| GET | `/users/:id` | Récupérer un utilisateur par son ID |
| POST | `/users` | Créer un nouvel utilisateur |
| POST | `/users/invite` | Inviter un utilisateur |
| PUT | `/users/:id` | Mettre à jour un utilisateur |
| DELETE | `/users/:id` | Supprimer un utilisateur |

### 11. Paramètres (Settings)

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/settings` | Récupérer tous les paramètres |
| PUT | `/settings/:category` | Mettre à jour les paramètres d'une catégorie |

**Catégories disponibles**:
- `general`: Paramètres généraux
- `accounting`: Paramètres comptables
- `security`: Paramètres de sécurité
- `notifications`: Paramètres de notifications
- `integrations`: Paramètres d'intégrations
- `exchange-rates`: Taux de change
- `data-sharing`: Partage de données
- `data-sources`: Sources de données
- `bank-integration`: Intégration bancaire

### 12. Notifications

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/notifications` | Récupérer toutes les notifications de l'utilisateur |
| GET | `/notifications/:id` | Récupérer une notification par son ID |
| POST | `/notifications` | Créer une nouvelle notification |
| PATCH | `/notifications/:id/read` | Marquer une notification comme lue |
| DELETE | `/notifications/:id` | Supprimer une notification |

## Format des réponses

Toutes les réponses de l'API suivent le format standard suivant:

### Réponse de succès

```json
{
  "success": true,
  "data": {
    // Les données spécifiques à l'endpoint
  }
}
```

### Réponse d'erreur

```json
{
  "success": false,
  "error": "Message d'erreur spécifique"
}
```

### Pagination

Les endpoints qui retournent des listes utilisent ce format de pagination:

```json
{
  "success": true,
  "data": {
    "data": [...], // Liste des éléments
    "total": 100,  // Nombre total d'éléments
    "page": 1,     // Page courante
    "pageSize": 20, // Éléments par page
    "totalPages": 5 // Nombre total de pages
  }
}
```

## Exemples d'utilisation

### Récupérer les écritures comptables

```javascript
const fetchJournalEntries = async () => {
  try {
    const response = await fetch('http://localhost:8000/accounting/journal-entries?page=1&pageSize=20&journalType=sales', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des écritures:', error);
    throw error;
  }
};
```

### Créer une nouvelle écriture comptable

```javascript
const createJournalEntry = async (journalData) => {
  try {
    const response = await fetch('http://localhost:8000/accounting/journal-entries', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(journalData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Erreur lors de la création de l\'écriture:', error);
    throw error;
  }
};
```
