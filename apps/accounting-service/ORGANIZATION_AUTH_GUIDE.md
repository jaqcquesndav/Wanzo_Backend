# Guide d'utilisation : Gestion des utilisateurs et organisations

## Règles métier importantes

### 1. Création d'utilisateurs et organisations
- **SEUL le Customer Service** peut créer des utilisateurs primaires et leurs organisations
- **Les autres services** (accounting, portfolio, gestion commerciale) ne peuvent créer que des utilisateurs secondaires déjà associés à des organisations existantes
- **Un utilisateur sans organizationId ne peut accéder à aucun autre service**

### 2. Architecture de sécurité

#### Customer Service (Seul créateur d'organisations)
```typescript
// ✅ Autorisé : Création d'un utilisateur primaire avec son organisation
const newUser = {
  email: "owner@company.com",
  role: "OWNER",
  organizationId: "org-123", // Créé en même temps
}
```

#### Autres Services (Utilisateurs secondaires uniquement)
```typescript
// ✅ Autorisé : Création d'un utilisateur secondaire
const secondaryUser = {
  email: "employee@company.com", 
  role: "EMPLOYEE",
  organizationId: "org-123", // DOIT déjà exister
}

// ❌ INTERDIT : Création d'un utilisateur sans organization
const invalidUser = {
  email: "user@example.com",
  organizationId: null // ACCÈS REFUSÉ
}
```

## Utilisation dans Accounting Service

### 1. Endpoints protégés par organisation

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OrganizationAuthGuard } from './guards/organization-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { CurrentOrganization } from './decorators/current-organization.decorator';

@Controller('protected')
@UseGuards(JwtAuthGuard, OrganizationAuthGuard) // Double protection
export class ProtectedController {
  
  @Get('data')
  async getOrganizationData(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any
  ) {
    // L'utilisateur ET son organisation sont garantis d'exister
    return {
      message: `Données pour ${organization.name}`,
      user: user.email,
      organizationId: organization.id
    };
  }
}
```

### 2. Récupération du profil complet

```typescript
// GET /auth/profile
// Retourne TOUJOURS user + organization ou lève une exception
{
  "user": {
    "id": "user-123",
    "email": "user@company.com",
    "organizationId": "org-456" // Toujours présent
  },
  "organization": {
    "id": "org-456", 
    "name": "Acme Corp",
    "registrationNumber": "RC123456"
    // ... autres champs
  }
}
```

### 3. Gestion des erreurs

```typescript
// Cas d'erreur 1 : Utilisateur sans organizationId
HTTP 401: "Accès refusé : Utilisateur non associé à une organisation. Veuillez compléter votre inscription via le service client."

// Cas d'erreur 2 : Organisation non synchronisée
HTTP 401: "Organisation en cours de synchronisation. Veuillez réessayer dans quelques instants."

// Cas d'erreur 3 : Erreur système
HTTP 401: "Erreur lors de la vérification de l'organisation. Veuillez contacter le support."
```

## Flux de synchronisation automatique

### 1. Première connexion
```
User login → organizationId présent ? 
→ Organisation existe localement ?
→ NON → Kafka sync request → Customer Service
→ Customer Service → Kafka sync response → Accounting Service
→ Organisation créée/mise à jour → Accès accordé
```

### 2. Connexions suivantes
```
User login → organizationId présent ?
→ Organisation existe localement ? 
→ OUI → Accès immédiat accordé
```

## Exemple complet

```typescript
// 1. Middleware automatique de vérification
@Controller('accounting')
@UseGuards(JwtAuthGuard, OrganizationAuthGuard)
export class AccountingController {

  // 2. Tous les endpoints garantissent user + organization
  @Get('dashboard')
  async getDashboard(
    @CurrentUser() user: any,
    @CurrentOrganization() org: any
  ) {
    // org est TOUJOURS défini ici
    return this.dashboardService.getDashboard(org.id);
  }
}
```

Cette architecture garantit que :
- ✅ Seul Customer Service crée des organisations
- ✅ Aucun utilisateur ne peut accéder aux services sans organisation
- ✅ La synchronisation est automatique et transparente
- ✅ Les erreurs sont claires et orientent vers la solution
