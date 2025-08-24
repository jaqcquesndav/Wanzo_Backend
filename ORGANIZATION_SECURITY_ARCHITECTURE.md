# Guide Complet : Gestion des Utilisateurs et Organisations/Entreprises/Institutions

## Architecture de Sécurité Globale

### Règles Métier Fondamentales

1. **SEUL le Customer Service** peut créer des utilisateurs primaires et leurs organisations/entreprises/institutions
2. **Les autres services** ne peuvent créer que des utilisateurs secondaires déjà associés à des organisations existantes
3. **Un utilisateur sans organizationId/companyId/institutionId ne peut accéder à AUCUN service**
4. **Terminologie unifiée** :
   - `company` = `organization` = `sme` = `customer` (PME/Entreprises)
   - `institution` = `customer` (Institutions financières)

### Services Implémentés

#### 1. Accounting Service
- **Entité principale** : `Organization` (PME/Entreprises)
- **Champ utilisateur** : `organizationId`
- **Endpoint profil** : `GET /auth/profile`
- **Guard** : `OrganizationAuthGuard`
- **Décorateur** : `@CurrentOrganization`

#### 2. Gestion Commerciale Service  
- **Entité principale** : `Company` (PME/Entreprises)
- **Champ utilisateur** : `companyId`
- **Endpoint profil** : `GET /auth/profile`
- **Guard** : `CompanyAuthGuard`
- **Décorateur** : `@CurrentCompany`

#### 3. Portfolio Institution Service
- **Entité principale** : `Institution` (Institutions financières)
- **Champ utilisateur** : `institutionId`
- **Endpoint profil** : `GET /auth/profile`
- **Guard** : `InstitutionAuthGuard`
- **Décorateur** : `@CurrentInstitution`

## Flux de Sécurité Unifié

### 1. Première connexion utilisateur
```
User login → [service]Id présent ?
→ NON → ACCÈS REFUSÉ ("Veuillez compléter votre inscription via le service client")
→ OUI → Entité existe localement ?
  → NON → Kafka sync request → Customer Service
         → Customer Service response → Service local
         → Entité créée/mise à jour → ACCÈS ACCORDÉ
  → OUI → ACCÈS ACCORDÉ immédiatement
```

### 2. Structure de réponse standardisée
```json
{
  "user": {
    "id": "user-123",
    "email": "user@company.com",
    "[service]Id": "entity-456" // organizationId/companyId/institutionId
  },
  "[entity]": { // organization/company/institution
    "id": "entity-456",
    "name": "Acme Corp",
    "registrationNumber": "RC123456",
    // ... autres champs spécifiques
  }
}
```

### 3. Gestion d'erreurs standardisée
```typescript
// Cas 1 : Utilisateur sans [service]Id
HTTP 401: "Accès refusé : Utilisateur non associé à une [entité]. Veuillez compléter votre inscription via le service client."

// Cas 2 : Entité non synchronisée
HTTP 401: "[Entité] en cours de synchronisation. Veuillez réessayer dans quelques instants."

// Cas 3 : Erreur système
HTTP 401: "Erreur lors de la vérification de l'[entité]. Veuillez contacter le support."
```

## Implémentation par Service

### Pattern de Code Unifié

#### 1. Service d'Authentification
```typescript
// Méthode standardisée dans chaque service
async getUserProfileWithOrganization(userId: string): Promise<any> {
  const user = await this.userRepository.findOne({ where: { id: userId } });
  
  if (!user) {
    throw new NotFoundException(`Utilisateur avec ID ${userId} non trouvé`);
  }

  // VALIDATION CRITIQUE : Vérifier [service]Id
  if (!user.[service]Id) {
    throw new UnauthorizedException(
      'Accès refusé : Utilisateur non associé à une [entité]. ' +
      'Veuillez compléter votre inscription via le service client.'
    );
  }

  let [entity] = null;
  
  try {
    [entity] = await this.[entityService].findById(user.[service]Id);
    
    if (![entity]) {
      // Déclencher synchronisation Kafka
      await this.request[Entity]SyncFromCustomerService(user.[service]Id);
      throw new UnauthorizedException('[Entité] en cours de synchronisation...');
    }
    
    return { user: {...}, [entity]: {...} };
  } catch (error) {
    // Gestion d'erreurs...
  }
}
```

#### 2. Guard de Sécurité
```typescript
@Injectable()
export class [Entity]AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user.[service]Id) {
      throw new UnauthorizedException('Accès refusé : Utilisateur non associé...');
    }

    const profileData = await this.authService.getUserProfileWithOrganization(user.id);
    
    if (!profileData.[entity]) {
      throw new UnauthorizedException('[Entité] non trouvée...');
    }

    request.[entity] = profileData.[entity];
    return true;
  }
}
```

#### 3. Utilisation dans les Contrôleurs
```typescript
@Controller('[endpoint]')
@UseGuards(JwtAuthGuard, [Entity]AuthGuard)
export class [Controller] {
  
  @Get('dashboard')
  async getDashboard(
    @CurrentUser() user: any,
    @Current[Entity]() [entity]: any
  ) {
    // user ET [entity] sont GARANTIS d'exister
    return this.[service].getDashboard([entity].id);
  }
}
```

## Synchronisation Kafka

### Événements Standardisés
```typescript
// Demande de synchronisation (émis par les services)
OrganizationSyncRequestEvent {
  organizationId: string,
  requestId: string,
  requestedBy: '[service_name]',
  timestamp: string
}

// Réponse de synchronisation (émis par customer-service)
OrganizationSyncResponseEvent {
  organizationId: string,
  requestId: string,
  found: boolean,
  organizationData?: { /* données complètes */ },
  timestamp: string
}
```

### Topics Kafka
- `organization.sync.request` → Customer Service
- `organization.sync.response` → Services demandeurs
- `organization.created` → Broadcast
- `organization.updated` → Broadcast

## Migration et Déploiement

### 1. Services Prêts
- ✅ **Accounting Service** - `Organization` entities
- ✅ **Gestion Commerciale Service** - `Company` entities  
- ✅ **Portfolio Institution Service** - `Institution` entities

### 2. À implémenter
- 🔲 **Customer Service** - Logic de réponse aux sync requests
- 🔲 **Admin Service** - Si applicable
- 🔲 **API Gateway** - Propagation des headers d'auth

### 3. Tests de Validation
```bash
# Test 1 : Utilisateur sans organizationId
curl -H "Authorization: Bearer [token_sans_org]" /accounting/auth/profile
# Expected: 401 "Accès refusé : Utilisateur non associé..."

# Test 2 : Utilisateur avec organizationId valide
curl -H "Authorization: Bearer [token_avec_org]" /accounting/auth/profile
# Expected: 200 { user: {...}, organization: {...} }

# Test 3 : Synchronisation automatique
curl -H "Authorization: Bearer [token_org_inexistante]" /accounting/auth/profile
# Expected: 401 "Organisation en cours de synchronisation..." + Kafka event émis
```

Cette architecture garantit une sécurité uniforme et une expérience utilisateur cohérente à travers tous les services de la plateforme Wanzo.
