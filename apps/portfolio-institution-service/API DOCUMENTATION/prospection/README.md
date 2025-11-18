# Documentation API Prospection v2.0

Documentation complète du module de prospection, synchronisée avec l'implémentation réelle du code source (Novembre 2025).

## 🏗️ Architecture

Le module de prospection repose sur une **architecture hybride** de synchronisation des données :

```
┌─────────────────────────┐         ┌──────────────────────────┐         ┌─────────────────────────┐
│  Accounting Service     │  HTTP   │  Portfolio Institution   │  Kafka  │  Customer Service       │
│  (Source Primaire)      │────────►│  CompanyProfile Cache    │◄────────│  (Source Secondaire)    │
│                         │         │                          │         │                         │
│  • Données financières  │         │  • Cache unifié          │         │  • Données légales      │
│  • Métriques            │         │  • 40+ champs            │         │  • Contacts             │
│  • Scores crédit        │         │  • Coordonnées GPS       │         │  • Emplacements         │
└─────────────────────────┘         └──────────────────────────┘         └─────────────────────────┘
                                              │
                                              ▼
                                    ┌──────────────────────┐
                                    │  ProspectionService  │
                                    │  • Filtrage métier   │
                                    │  • Recherche géo     │
                                    │  • Statistiques      │
                                    └──────────────────────┘
```

### Stratégie de Synchronisation

**Source Primaire (HTTP) :** `accounting-service`
- Données financières opérationnelles (20+ métriques)
- Scores de crédit (0-100) et ratings (AAA à E)
- Métriques de performance (CA, profit, EBITDA, cash flow)
- Ratios financiers (endettement, marge, croissance)
- Synchronisation manuelle ou automatique (> 24h = stale)

**Source Secondaire (Kafka) :** `customer-service`
- Enrichissement avec données administratives/légales
- Informations de contact (owner, contactPersons, email, phone)
- Emplacements multiples avec coordonnées géographiques (lat/lng)
- Structure de capital, associés, affiliations (CNSS, INPP)
- Synchronisation temps réel via **6 topics Kafka** :
  1. `admin.customer.company.profile.shared` - Profil complet (70+ champs)
  2. `customer.created` (StandardKafkaTopics.CUSTOMER_CREATED)
  3. `customer.updated` (StandardKafkaTopics.CUSTOMER_UPDATED)
  4. `customer.status.changed` (StandardKafkaTopics.CUSTOMER_STATUS_CHANGED)
  5. `customer.validated` (StandardKafkaTopics.CUSTOMER_VALIDATED)
  6. `customer.deleted` (StandardKafkaTopics.CUSTOMER_DELETED)

**Règles de Réconciliation :**
- En cas de conflit `companyName` → `accounting-service` TOUJOURS prioritaire
- Coordonnées GPS → extraites de `locations[isPrimary].coordinates.{lat, lng}` depuis `customer-service`
- `employeeCount` → `accounting-service` prioritaire, `customer-service` fallback
- Données légales (RCCM, taxId, forme juridique) → exclusif `customer-service`
- Données financières → exclusif `accounting-service`

## 🔗 Base URL

**Développement :** `http://localhost:8000/portfolio/api/v1/companies`  
**Production :** `https://api.wanzo-portfolio.com/portfolio/api/v1/companies`

## 📡 Endpoints

### 1. Liste des prospects avec filtres

Récupère la liste paginée des prospects (companies) avec filtres métier.

#### Requête

```http
GET /companies
```

#### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Paramètres de requête (Query Params)

| Paramètre         | Type    | Requis | Description                                      |
|-------------------|---------|--------|--------------------------------------------------|
| sector            | string  | Non    | Filtre par secteur d'activité                   |
| size              | enum    | Non    | Taille : `small`, `medium`, `large`             |
| status            | enum    | Non    | Statut : `active`, `pending`, `contacted`, `qualified`, `rejected` |
| minCreditScore    | number  | Non    | Score de crédit minimum (0-100, défaut: 50)     |
| maxCreditScore    | number  | Non    | Score de crédit maximum (0-100)                 |
| financialRating   | string  | Non    | Rating financier (AAA, AA, A, BBB, BB, B, C, D, E) |
| searchTerm        | string  | Non    | Recherche par nom ou secteur                    |
| page              | number  | Non    | Numéro de page (défaut: 1)                      |
| limit             | number  | Non    | Éléments par page (défaut: 20, max: 100)       |

#### Exemple de requête

```bash
GET /companies?sector=Technologies&minCreditScore=70&page=1&limit=10
```

#### Réponse réussie (200 OK)

```json
{
  "data": [
    {
      "id": "uuid-company-123",
      "name": "TechInnovate SARL",
      "sector": "Technologies",
      "size": "medium",
      "status": "active",
      "financial_metrics": {
        "annual_revenue": 2500000.00,
        "revenue_growth": 12.50,
        "profit_margin": 8.20,
        "cash_flow": 450000.00,
        "debt_ratio": 0.40,
        "working_capital": 650000.00,
        "credit_score": 82,
        "financial_rating": "B+",
        "ebitda": 320000.00
      },
      "contact_info": {
        "email": "contact@techinnovate.cd",
        "phone": "+243 123 456 789",
        "address": "123 Avenue de la Libération, Kinshasa, RDC",
        "website": "https://techinnovate.cd"
      },
      "latitude": -4.3276,
      "longitude": 15.3136,
      "legal_info": {
        "legalForm": "SARL",
        "rccm": "CD/KIN/RCCM/12-A-12345",
        "taxId": "A1234567Z",
        "yearFounded": 2015
      },
      "employeeCount": 85,
      "locations": [
        {
          "id": "loc-uuid-001",
          "address": "123 Avenue de la Libération",
          "city": "Kinshasa",
          "country": "RDC",
          "isPrimary": true,
          "coordinates": {
            "lat": -4.3276,
            "lng": 15.3136
          }
        },
        {
          "id": "loc-uuid-002",
          "address": "456 Boulevard Lumumba",
          "city": "Lubumbashi",
          "country": "RDC",
          "isPrimary": false,
          "coordinates": {
            "lat": -11.6703,
            "lng": 27.4794
          }
        }
      ],
      "owner": {
        "id": "owner-456",
        "name": "Jean Kabila",
        "email": "j.kabila@techinnovate.cd",
        "phone": "+243 999 888 777"
      },
      "contactPersons": [
        {
          "name": "Marie Tshisekedi",
          "role": "Directrice Commerciale",
          "email": "m.tshisekedi@techinnovate.cd",
          "phone": "+243 888 777 666"
        }
      ],
      "profileCompleteness": 85,
      "lastSyncFromAccounting": "2025-11-18T10:30:00.000Z",
      "lastSyncFromCustomer": "2025-11-18T08:15:00.000Z",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2025-11-18T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 145,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

---

### 2. Détails d'un prospect

Récupère les détails complets d'un prospect spécifique avec auto-refresh si données stale.

#### Requête

```http
GET /companies/:id
```

#### Paramètres URL

| Paramètre | Type   | Requis | Description                  |
|-----------|--------|--------|------------------------------|
| id        | string | Oui    | UUID du prospect/company     |

#### Exemple

```bash
GET /companies/uuid-company-123
```

#### Réponse réussie (200 OK)

Même structure que l'objet `data[]` de la liste des prospects.

#### Réponse d'erreur (404 Not Found)

```json
{
  "statusCode": 404,
  "message": "Prospect uuid-company-123 not found",
  "error": "Not Found"
}
```

---

### 3. Statistiques de prospection

Récupère les métriques agrégées de prospection.

#### Requête

```http
GET /companies/stats
```

#### Réponse réussie (200 OK)

```json
{
  "totalProspects": 145,
  "bySector": {
    "Technologies": 35,
    "Commerce": 50,
    "Agriculture": 25,
    "Services": 35
  },
  "bySize": {
    "small": 80,
    "medium": 45,
    "large": 20
  },
  "byFinancialRating": {
    "AAA": 5,
    "AA": 10,
    "A": 20,
    "BBB": 30,
    "BB": 25,
    "B": 35,
    "C": 15,
    "D": 5
  },
  "averageCreditScore": 68.5,
  "dataFreshness": {
    "withFreshAccountingData": 120,
    "withFreshCustomerData": 135
  },
  "lastCalculated": "2025-11-18T12:00:00.000Z"
}
```

---

### 4. Recherche de prospects par proximité géographique

Recherche des prospects dans un rayon géographique donné (utilise la formule de Haversine).

#### Requête

```http
GET /companies/nearby
```

#### Paramètres de requête

| Paramètre  | Type   | Requis | Description                            |
|------------|--------|--------|----------------------------------------|
| latitude   | number | Oui    | Latitude du point de référence (-90 à 90) |
| longitude  | number | Oui    | Longitude du point de référence (-180 à 180) |
| radiusKm   | number | Non    | Rayon de recherche en km (défaut: 50, max: 1000) |

**Note :** Tous les paramètres de filtrage de l'endpoint `/companies` peuvent être combinés.

#### Exemple

```bash
GET /companies/nearby?latitude=-4.3276&longitude=15.3136&radiusKm=25&minCreditScore=70
```

#### Réponse réussie (200 OK)

```json
[
  {
    "id": "uuid-company-456",
    "name": "ProximitéTech SPRL",
    "sector": "Technologies",
    "latitude": -4.3150,
    "longitude": 15.3200,
    "distance": 2.3,
    "financial_metrics": {
      "credit_score": 75,
      "financial_rating": "B"
    },
    "contact_info": {
      "email": "info@proximitetech.cd",
      "phone": "+243 800 700 600"
    }
  }
]
```

**Note :** Les résultats sont triés par distance croissante.

---

### 5. Synchronisation manuelle d'un prospect

Force la synchronisation des données depuis `accounting-service` pour un prospect spécifique.

#### Requête

```http
POST /companies/:id/sync
```

#### Permissions requises

- `admin`
- `portfolio_manager`

#### Paramètres URL

| Paramètre | Type   | Requis | Description              |
|-----------|--------|--------|--------------------------|
| id        | string | Oui    | UUID du prospect/company |

#### Réponse réussie (200 OK)

```json
{
  "message": "Prospect data synchronized successfully from accounting service",
  "prospect": {
    "id": "uuid-company-123",
    "name": "TechInnovate SARL",
    "lastSyncFromAccounting": "2025-11-18T14:30:00.000Z"
  }
}
```

#### Réponses d'erreur

**403 Forbidden** - Permissions insuffisantes
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

**404 Not Found** - Prospect inexistant
```json
{
  "statusCode": 404,
  "message": "Prospect uuid-company-123 not found",
  "error": "Not Found"
}
```

**503 Service Unavailable** - Service accounting indisponible
```json
{
  "statusCode": 503,
  "message": "Accounting service is currently unavailable",
  "error": "Service Unavailable"
}
```

---

### 6. Synchronisation complète (toutes sources)

Synchronise les données depuis **toutes les sources** (accounting + customer services).

#### Requête

```http
POST /companies/:id/sync-complete
```

#### Permissions requises

- `admin`
- `portfolio_manager`

#### Paramètres URL

| Paramètre | Type   | Requis | Description              |
|-----------|--------|--------|--------------------------|
| id        | string | Oui    | UUID du prospect/company |

#### Réponse réussie (200 OK)

```json
{
  "id": "uuid-company-123",
  "name": "TechInnovate SARL",
  "profileCompleteness": 92,
  "lastSyncFromAccounting": "2025-11-18T14:35:00.000Z",
  "lastSyncFromCustomer": "2025-11-18T14:35:30.000Z",
  "syncStatus": {
    "accounting": "success",
    "customer": "success"
  }
}
```

---

## 📊 Modèles de Données

### ProspectDto (Structure Exacte)

**Source :** `src/modules/prospection/dtos/prospection.dto.ts`

```typescript
import { ProspectSize, ProspectStatus } from './prospection.dto';

export enum ProspectSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export enum ProspectStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  REJECTED = 'rejected'
}

interface ProspectDto {
  // Identifiants
  id: string;                                // @IsUUID() - UUID du prospect
  name: string;                              // @IsString() - Nom de la company
  sector: string;                            // @IsString() - Secteur d'activité
  size: string;                              // @IsEnum(ProspectSize) - 'small' | 'medium' | 'large'
  status: string;                            // @IsEnum(ProspectStatus) - Statut prospection
  
  // Métriques financières (SOURCE: accounting-service via CompanyProfile)
  financial_metrics: ProspectFinancialMetricsDto;  // @ValidateNested() @Type(() => ProspectFinancialMetricsDto)
  
  // Informations de contact (SOURCE: customer-service via Kafka)
  contact_info: ProspectContactInfoDto;      // @ValidateNested() @Type(() => ProspectContactInfoDto)
  
  // Géolocalisation (SOURCE: customer-service, extrait de locations[isPrimary])
  latitude?: number;                         // @IsOptional() @IsNumber() - Latitude GPS (-90 à 90)
  longitude?: number;                        // @IsOptional() @IsNumber() - Longitude GPS (-180 à 180)
  
  // Informations légales (SOURCE: customer-service)
  legal_info?: ProspectLegalInfoDto;         // @IsOptional() @ValidateNested() @Type(() => ProspectLegalInfoDto)
  
  // Ressources humaines
  employeeCount?: number;                    // @IsOptional() @IsNumber() - Nombre d'employés
  
  // Emplacements multiples
  locations?: Array<{                        // @IsOptional() @IsArray() - Liste des emplacements
    id: string;
    address: string;
    city: string;
    country: string;
    isPrimary: boolean;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;
  
  // Propriétaire principal
  owner?: {                                  // @IsOptional() @IsObject()
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  
  // Personnes de contact
  contactPersons?: Array<{                   // @IsOptional() @IsArray()
    name: string;
    role: string;
    email: string;
    phone: string;
  }>;
  
  // Métadonnées
  profileCompleteness: number;               // @IsNumber() @Min(0) @Max(100) - Complétude (0-100%)
  lastSyncFromAccounting?: string;           // @IsOptional() @IsString() - Date ISO 8601
  lastSyncFromCustomer?: string;             // @IsOptional() @IsString() - Date ISO 8601
  createdAt: string;                         // @IsString() - Date ISO 8601
  updatedAt: string;                         // @IsString() - Date ISO 8601
}

// --- Sous-DTOs ---

interface ProspectFinancialMetricsDto {
  annual_revenue: number;                    // @IsNumber() - CA annuel (CDF)
  revenue_growth: number;                    // @IsNumber() - Croissance YoY (%)
  profit_margin: number;                     // @IsNumber() - Marge bénéficiaire (%)
  cash_flow: number;                         // @IsNumber() - Flux de trésorerie (CDF)
  debt_ratio: number;                        // @IsNumber() - Ratio d'endettement (0.0-1.0)
  working_capital: number;                   // @IsNumber() - Fonds de roulement (CDF)
  credit_score: number;                      // @IsNumber() @Min(0) @Max(100) - Score (0-100)
  financial_rating: string;                  // @IsString() - Rating (AAA, AA, A, BBB, BB, B, C, D, E)
  ebitda?: number;                           // @IsOptional() @IsNumber() - EBITDA (CDF)
}

interface ProspectContactInfoDto {
  email?: string;                            // @IsOptional() @IsEmail() - Email de contact
  phone?: string;                            // @IsOptional() @IsString() - Téléphone
  address?: string;                          // @IsOptional() @IsString() - Adresse physique
  website?: string;                          // @IsOptional() @IsUrl() - Site web
}

interface ProspectLegalInfoDto {
  legalForm?: string;                        // @IsOptional() @IsString() - Forme juridique (SARL, SA, SAS, etc.)
  rccm?: string;                             // @IsOptional() @IsString() - Numéro RCCM
  taxId?: string;                            // @IsOptional() @IsString() - Numéro fiscal
  yearFounded?: number;                      // @IsOptional() @IsNumber() - Année de création
}
```

---

### ProspectionFiltersDto (Structure Exacte)

**Source :** `src/modules/prospection/dtos/prospection.dto.ts`

```typescript
import { ProspectSize, ProspectStatus } from './prospection.dto';

class ProspectionFiltersDto {
  sector?: string;                           // @IsOptional() @IsString() - Filtre par secteur
  size?: ProspectSize;                       // @IsOptional() @IsEnum(ProspectSize) - 'small' | 'medium' | 'large'
  status?: ProspectStatus;                   // @IsOptional() @IsEnum(ProspectStatus) - Statut prospection
  minCreditScore?: number;                   // @IsOptional() @IsNumber() @Min(0) @Max(100) - Score minimum
  maxCreditScore?: number;                   // @IsOptional() @IsNumber() @Min(0) @Max(100) - Score maximum
  financialRating?: string;                  // @IsOptional() @IsString() - Rating financier
  searchTerm?: string;                       // @IsOptional() @IsString() - Recherche par nom ou secteur
  page?: number;                             // @IsOptional() @IsNumber() @Min(1) - Page (défaut: 1)
  limit?: number;                            // @IsOptional() @IsNumber() @Min(1) @Max(100) - Limite (défaut: 20)
}
```

---

### GeolocationDto (Structure Exacte)

**Source :** `src/modules/prospection/dtos/prospection.dto.ts`

```typescript
class GeolocationDto {
  latitude: number;                          // @IsNumber() @Min(-90) @Max(90) - Latitude GPS
  longitude: number;                         // @IsNumber() @Min(-180) @Max(180) - Longitude GPS
  radiusKm?: number;                         // @IsOptional() @IsNumber() @Min(0.1) @Max(1000) - Rayon en km
}
```

---

### NearbyProspectsSearchDto (Structure Exacte)

**Source :** `src/modules/prospection/dtos/prospection.dto.ts`

```typescript
class NearbyProspectsSearchDto extends GeolocationDto {
  filters?: ProspectionFiltersDto;           // @IsOptional() @ValidateNested() @Type(() => ProspectionFiltersDto)
}
```

---

### ProspectionStatsDto (Structure Exacte)

**Source :** `src/modules/prospection/dtos/prospection.dto.ts`

```typescript
class ProspectionStatsDto {
  totalProspects: number;                    // @IsNumber() - Nombre total de prospects
  bySector: Record<string, number>;          // @IsObject() - Distribution par secteur
  bySize: Record<string, number>;            // @IsObject() - Distribution par taille
  byFinancialRating: Record<string, number>; // @IsObject() - Distribution par rating
  averageCreditScore: number;                // @IsNumber() - Score moyen calculé
  dataFreshness: {                           // @IsObject() - Métriques de fraîcheur
    withFreshAccountingData: number;         // Nombre avec données accounting < 24h
    withFreshCustomerData: number;           // Nombre avec données customer < 7 jours
  };
  lastCalculated: string;                    // @IsString() - Date ISO 8601 du calcul
}
```

---

### ProspectListResponseDto (Structure Exacte)

**Source :** `src/modules/prospection/dtos/prospection.dto.ts`

```typescript
class ProspectListResponseDto {
  data: ProspectDto[];                       // @IsArray() @ValidateNested({ each: true }) @Type(() => ProspectDto)
  meta: {                                    // @IsObject() - Métadonnées pagination
    total: number;                           // Nombre total de résultats
    page: number;                            // Page actuelle
    limit: number;                           // Limite par page
    totalPages: number;                      // Nombre total de pages
  };
}
```

---

## 🔄 Topics Kafka Consommés

Le module `CompanyEventsConsumer` écoute **6 topics Kafka** depuis `customer-service` :

| Topic                                    | Événement                     | Description                                  |
|------------------------------------------|-------------------------------|----------------------------------------------|
| `admin.customer.company.profile.shared`  | @EventPattern                 | Profil complet partagé (70+ champs incluant owner, associates, locations, affiliations) |
| `customer.created`                       | StandardKafkaTopics.CUSTOMER_CREATED | Nouvelle company créée - déclenche sync initiale |
| `customer.updated`                       | StandardKafkaTopics.CUSTOMER_UPDATED | Company mise à jour - enrichit le profil |
| `customer.status.changed`                | StandardKafkaTopics.CUSTOMER_STATUS_CHANGED | Changement de statut (active, suspended, deleted) |
| `customer.validated`                     | StandardKafkaTopics.CUSTOMER_VALIDATED | Company validée - déclenche sync complète |
| `customer.deleted`                       | StandardKafkaTopics.CUSTOMER_DELETED | Company supprimée - marque comme deleted (garde historique) |

### Structure de l'événement `admin.customer.company.profile.shared`

```typescript
interface CustomerCompanyProfileEvent {
  customerId: string;              // UUID du customer (= companyId)
  customerType: string;            // 'COMPANY' ou 'sme'
  name: string;                    // Nom de la company
  email?: string;                  // Email principal
  phone?: string;                  // Téléphone principal
  logo?: string;                   // URL du logo
  address?: string;                // Adresse complète
  status?: string;                 // Statut dans customer-service
  
  companyProfile?: {
    legalForm?: string;            // Forme juridique (SARL, SA, SAS, etc.)
    industry?: string;             // Industrie/secteur détaillé
    size?: string;                 // Taille (small, medium, large)
    rccm?: string;                 // Numéro RCCM
    taxId?: string;                // Numéro fiscal
    natId?: string;                // Numéro d'identification nationale
    activities?: string[];         // Liste des activités
    
    capital?: {
      amount: number;
      currency: string;
    };
    
    owner?: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
    
    associates?: Array<{
      id: string;
      name: string;
      shares: number;              // Pourcentage de parts
      role: string;                // Rôle dans l'entreprise
    }>;
    
    locations?: Array<{
      id: string;
      address: string;
      city: string;
      country: string;
      isPrimary: boolean;
      coordinates?: {
        lat: number;               // Latitude GPS
        lng: number;               // Longitude GPS
      };
    }>;
    
    contactPersons?: Array<{
      name: string;
      role: string;
      email: string;
      phone: string;
    }>;
    
    affiliations?: {
      cnss?: string;               // Numéro CNSS
      inpp?: string;               // Numéro INPP
      [key: string]: any;          // Autres affiliations
    };
    
    socialMedia?: {
      facebook?: string;
      linkedin?: string;
      twitter?: string;
      [key: string]: any;
    };
    
    yearFounded?: number;          // Année de création
    employeeCount?: number;        // Nombre d'employés (fallback)
    financials?: any;              // Données financières (non utilisées)
  };
  
  profileCompleteness?: number;    // Pourcentage de complétude (0-100)
  lastProfileUpdate?: string;      // Date ISO 8601 dernière maj
}
```

---

## ⚠️ Gestion des Erreurs

### Codes d'erreur

| Code | Erreur                | Description                                      |
|------|-----------------------|--------------------------------------------------|
| 400  | Bad Request           | Données invalides ou manquantes                 |
| 401  | Unauthorized          | Token JWT manquant ou invalide                  |
| 403  | Forbidden             | Permissions insuffisantes                       |
| 404  | Not Found             | Prospect inexistant                             |
| 500  | Internal Server Error | Erreur serveur interne                          |
| 503  | Service Unavailable   | Service externe (accounting/customer) indisponible |

### Format d'erreur standard

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "minCreditScore",
      "error": "must be between 0 and 100"
    }
  ]
}
```

---

## 🧪 Tests et Validation

### Exemples avec cURL

```bash
# 1. Lister les prospects avec filtres
curl -X GET "http://localhost:8000/portfolio/api/v1/companies?sector=Technologies&minCreditScore=70" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Détails d'un prospect
curl -X GET "http://localhost:8000/portfolio/api/v1/companies/uuid-company-123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Statistiques
curl -X GET "http://localhost:8000/portfolio/api/v1/companies/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. Recherche géographique
curl -X GET "http://localhost:8000/portfolio/api/v1/companies/nearby?latitude=-4.3276&longitude=15.3136&radiusKm=25" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 5. Synchronisation manuelle
curl -X POST "http://localhost:8000/portfolio/api/v1/companies/uuid-company-123/sync" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📝 Notes d'Implémentation

### Cache CompanyProfile

- **Entité unifiée :** 40+ champs consolidés depuis accounting + customer
- **Auto-refresh :** Données stale après 24h (accounting) ou 7 jours (customer)
- **Indicateurs de fraîcheur :** `isAccountingDataFresh`, `isCustomerDataFresh`
- **Calcul de complétude :** Pourcentage automatique basé sur 14 champs clés

### Mapping Granulaire des Champs (CompanyProfile → ProspectDto)

**Transformation dans `ProspectionService.toProspectDto()`**

| Champ ProspectDto           | Source CompanyProfile        | Origine Donnée          | Type            |
|-----------------------------|------------------------------|-------------------------|-----------------|
| `id`                        | `profile.id`                 | UUID                    | string          |
| `name`                      | `profile.companyName`        | accounting-service      | string          |
| `sector`                    | `profile.sector`             | accounting-service      | string          |
| `size`                      | `profile.companySize`        | accounting-service      | enum            |
| `status`                    | `'active'` (hardcoded)       | prospection-logic       | enum            |
| **financial_metrics:**      |                              |                         |                 |
| `annual_revenue`            | `profile.annualRevenue`      | accounting-service      | decimal(20,2)   |
| `revenue_growth`            | `profile.revenueGrowth`      | accounting-service      | decimal(6,2)    |
| `profit_margin`             | `profile.profitMargin`       | accounting-service      | decimal(6,2)    |
| `cash_flow`                 | `profile.cashFlow`           | accounting-service      | decimal(20,2)   |
| `debt_ratio`                | `profile.debtRatio`          | accounting-service      | decimal(5,4)    |
| `working_capital`           | `profile.workingCapital`     | accounting-service      | decimal(20,2)   |
| `credit_score`              | `profile.creditScore`        | accounting-service      | int (0-100)     |
| `financial_rating`          | `profile.financialRating`    | accounting-service      | string          |
| `ebitda`                    | `profile.ebitda`             | accounting-service      | decimal(20,2)?  |
| **contact_info:**           |                              |                         |                 |
| `email`                     | `profile.email`              | customer-service        | string?         |
| `phone`                     | `profile.phone`              | customer-service        | string?         |
| `address`                   | `profile.address`            | customer-service        | text?           |
| `website`                   | `profile.websiteUrl`         | accounting-service      | string?         |
| `latitude`                  | `profile.latitude`           | customer-service (GPS)  | decimal(10,6)?  |
| `longitude`                 | `profile.longitude`          | customer-service (GPS)  | decimal(10,6)?  |
| **legal_info:**             |                              |                         |                 |
| `legalForm`                 | `profile.legalForm`          | customer-service        | string?         |
| `rccm`                      | `profile.rccm`               | customer-service        | string?         |
| `taxId`                     | `profile.taxId`              | customer-service        | string?         |
| `yearFounded`               | `profile.yearFounded`        | customer-service        | int?            |
| `employeeCount`             | `profile.employeeCount`      | accounting-service      | int             |
| `locations`                 | `profile.locations`          | customer-service (JSONB)| Array?          |
| `owner`                     | `profile.owner`              | customer-service (JSONB)| Object?         |
| `contactPersons`            | `profile.contactPersons`     | customer-service (JSONB)| Array?          |
| `profileCompleteness`       | `profile.profileCompleteness`| calculated              | int (0-100)     |
| `lastSyncFromAccounting`    | `profile.lastSyncFromAccounting` | metadata            | timestamp?      |
| `lastSyncFromCustomer`      | `profile.lastSyncFromCustomer`   | metadata            | timestamp?      |
| `createdAt`                 | `profile.createdAt`          | metadata                | timestamp       |
| `updatedAt`                 | `profile.updatedAt`          | metadata                | timestamp       |

### Coordonnées Géographiques

- **Source :** `customer-service` via topic `admin.customer.company.profile.shared`
- **Extraction :** Depuis `event.companyProfile.locations[isPrimary].coordinates.{lat, lng}`
- **Stockage :** Dénormalisé dans `CompanyProfile.latitude` (decimal 10,6) et `CompanyProfile.longitude` (decimal 10,6)
- **Calcul distance :** Formule de Haversine dans `ProspectionService.calculateDistance()`
  ```typescript
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance en km
  ```

### Synchronisation Hybride

**1. Accounting-Service (HTTP - Source Primaire)**
- **Méthode :** `CompanySyncService.syncFromAccounting(companyId, force)`
- **Endpoint :** `GET /accounting-service/companies/:id`
- **Données :** 20+ métriques financières (totalRevenue, annualRevenue, netProfit, totalAssets, totalLiabilities, cashFlow, debtRatio, workingCapital, creditScore, financialRating, revenueGrowth, profitMargin, ebitda, employeeCount, companySize, websiteUrl)
- **Fréquence :** Automatique si > 24h (stale), ou manuelle via API
- **Type :** Synchronisation active (pull)
- **Priorité :** TOUJOURS prioritaire en cas de conflit de nom

**2. Customer-Service (Kafka - Source Secondaire)**
- **Méthode :** `CompanyEventsConsumer` avec 6 event handlers
- **Topics :**
  1. `admin.customer.company.profile.shared` → enrichissement complet (70+ champs)
  2. `customer.created` → création initiale + trigger sync accounting
  3. `customer.updated` → mise à jour partielle
  4. `customer.status.changed` → changement de statut
  5. `customer.validated` → trigger sync complète
  6. `customer.deleted` → marquage deleted (garde historique)
- **Données :** Légales (legalForm, rccm, taxId, natId, yearFounded), contacts (owner, associates, contactPersons), emplacements (locations avec GPS), affiliations (CNSS, INPP), capital, socialMedia
- **Fréquence :** Temps réel (push events)
- **Type :** Synchronisation passive (événementiel)
- **Priorité :** Enrichissement uniquement, ne modifie JAMAIS les données financières

### Implémentation Frontend

Le frontend utilise les sources de données suivantes par ordre de priorité:

1. **API Backend** (prioritaire) via `companyApi.getAllCompanies()`
2. **localStorage** via `useCompaniesData` (cache local)
3. **Données mockées** via `mockCompanies` (fallback développement)

```typescript
// Extrait de useProspection
const loadCompanies = useCallback(async (baseCompanies: Company[] | unknown[]) => {
  try {
    setLoading(true);
    let allCompanies = [...baseCompanies] as Company[];
    
    try {
      // Tenter de charger depuis l'API
      const apiData = await companyApi.getAllCompanies();
      const apiIds = new Set(apiData.map((company: Company) => company.id));
      const uniqueBaseCompanies = allCompanies.filter(company => !apiIds.has(company.id));
      allCompanies = [...apiData, ...uniqueBaseCompanies];
    } catch {
      console.warn('API unavailable, using base data');
    }
    
    setCompanies(allCompanies);
  } catch {
    showNotification('Erreur lors du chargement des entreprises', 'error');
    setCompanies(baseCompanies as Company[]);
  } finally {
    setLoading(false);
  }
}, [showNotification]);
```

---

## 🔗 Voir Aussi

- [Architecture Technique CompanyProfile](./ARCHITECTURE_COMPANY_PROFILE.md) - Documentation détaillée de l'architecture
- [Documentation Integration API](../integration/README.md) - Intégration inter-services
- [Documentation API Principale](../README.md) - Vue d'ensemble de l'API

---

*Documentation mise à jour le 18 novembre 2025*  
*Synchronisée avec le code source portfolio-institution-service*  
*Version : 2.0*
