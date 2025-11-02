# Documentation de l'API Prospection

Cette documentation détaille les formats de requêtes et réponses attendus pour le module de prospection. Elle sert de guide d'implémentation pour le backend afin d'assurer la compatibilité avec le frontend existant.

## Routes et endpoints

### Opportunités de prospection

#### Récupération de toutes les opportunités

```
GET /prospection/opportunities
```

#### Paramètres de requête optionnels

| Paramètre   | Type   | Description                   |
|-------------|--------|-------------------------------|
| status      | string | Filtre par statut (lead, qualified, proposal, etc.) |
| sector      | string | Filtre par secteur d'activité |
| region      | string | Filtre par région géographique |
| searchTerm  | string | Recherche par nom ou description |

## API Entreprises

### Récupération de la liste des entreprises

#### Requête

```
GET /companies
```

#### Paramètres de requête optionnels

| Paramètre   | Type   | Description                   |
|-------------|--------|-------------------------------|
| sector      | string | Filtre par secteur d'activité |
| size        | string | Taille de l'entreprise (small, medium, large) |
| status      | string | Statut de l'entreprise (active, pending, etc.) |
| searchTerm  | string | Recherche par nom ou secteur |

#### Format de réponse attendu

```json
{
  "data": [
    {
      "id": "comp-123456",
      "name": "TechInnovate Sénégal",
      "sector": "Technologies",
      "size": "medium",
      "annual_revenue": 2500000,
      "employee_count": 85,
      "website_url": "https://techinnovate.sn",
      "pitch_deck_url": "https://api.wanzo.com/storage/companies/techinnovate-pitch.pdf",
      "status": "active",
      "financial_metrics": {
        "revenue_growth": 12.5,
        "profit_margin": 8.2,
        "cash_flow": 450000,
        "debt_ratio": 0.4,
        "working_capital": 650000,
        "credit_score": 82,
        "financial_rating": "B+"
      },
      "esg_metrics": {
        "carbon_footprint": 45,
        "environmental_rating": "B",
        "social_rating": "A-",
        "governance_rating": "B+",
        "gender_ratio": {
          "male": 60,
          "female": 40
        }
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-06-20T14:45:30Z"
    }
    // Autres entreprises...
  ],
  "meta": {
    "total": 24,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### Récupération des détails d'une entreprise

#### Requête

```
GET /companies/{id}
```

#### Format de réponse attendu

```json
{
  "id": "comp-123456",
  "name": "TechInnovate Sénégal",
  "sector": "Technologies",
  "size": "medium",
  "annual_revenue": 2500000,
  "employee_count": 85,
  "website_url": "https://techinnovate.sn",
  "pitch_deck_url": "https://api.wanzo.com/storage/companies/techinnovate-pitch.pdf",
  "status": "active",
  "financial_metrics": {
    "revenue_growth": 12.5,
    "profit_margin": 8.2,
    "cash_flow": 450000,
    "debt_ratio": 0.4,
    "working_capital": 650000,
    "credit_score": 82,
    "financial_rating": "B+"
  },
  "esg_metrics": {
    "carbon_footprint": 45,
    "environmental_rating": "B",
    "social_rating": "A-",
    "governance_rating": "B+",
    "gender_ratio": {
      "male": 60,
      "female": 40
    }
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-06-20T14:45:30Z"
}
```

### Création d'une entreprise

#### Requête

```
POST /companies
```

#### Corps de la requête

```json
{
  "name": "NewTech Solutions",
  "sector": "Technologies",
  "size": "small",
  "annual_revenue": 1200000,
  "employee_count": 25,
  "website_url": "https://newtech.example.com",
  "status": "active",
  "financial_metrics": {
    "revenue_growth": 18.5,
    "profit_margin": 7.2,
    "cash_flow": 250000,
    "debt_ratio": 0.3,
    "working_capital": 300000,
    "credit_score": 75,
    "financial_rating": "B"
  },
  "esg_metrics": {
    "carbon_footprint": 30,
    "environmental_rating": "B",
    "social_rating": "B",
    "governance_rating": "C",
    "gender_ratio": {
      "male": 60,
      "female": 40
    }
  }
}
```

#### Format de réponse attendu

Retourne l'objet entreprise créé avec l'ID généré et les timestamps.

## API Prospection

### Initiation d'un contact

#### Requête

```
POST /prospection/contact
```

#### Corps de la requête

```json
{
  "companyId": "comp-123456",
  "contactType": "email",
  "notes": "Premier contact pour présentation de nos services de financement"
}
```

#### Format de réponse attendu

```json
{
  "success": true,
  "company": {
    "id": "comp-123456",
    "name": "TechInnovate Sénégal",
    "status": "contacted",
    "lastContact": "2025-07-27T14:30:00Z"
  }
}
```

### Planification d'une réunion

#### Requête

```
POST /prospection/meetings
```

#### Corps de la requête

```json
{
  "companyId": "comp-123456",
  "type": "virtual",
  "date": "2025-08-15",
  "time": "14:30",
  "location": "Google Meet",
  "notes": "Présentation détaillée de notre offre de financement"
}
```

#### Format de réponse attendu

```json
{
  "success": true,
  "meeting": {
    "id": "meeting-789",
    "companyId": "comp-123456",
    "companyName": "TechInnovate Sénégal",
    "type": "virtual",
    "date": "2025-08-15",
    "time": "14:30",
    "location": "Google Meet",
    "notes": "Présentation détaillée de notre offre de financement",
    "createdAt": "2025-07-27T14:35:00Z"
  }
}
```

## Modèles de données

### Company

```typescript
interface Company {
  id: string;
  name: string;
  sector: string;
  size: 'small' | 'medium' | 'large';
  annual_revenue: number;
  employee_count: number;
  website_url?: string;
  pitch_deck_url?: string;
  status: 'active' | 'pending' | 'rejected' | 'funded' | 'contacted';
  lastContact?: string;
  financial_metrics: {
    revenue_growth: number;
    profit_margin: number;
    cash_flow: number;
    debt_ratio: number;
    working_capital: number;
    credit_score: number;
    financial_rating: string;
    ebitda?: number;
  };
  esg_metrics: {
    carbon_footprint: number;
    environmental_rating: string;
    social_rating: string;
    governance_rating: string;
    gender_ratio?: {
      male: number;
      female: number;
    };
  };
  created_at: string;
  updated_at: string;
}
```

### Meeting

```typescript
interface Meeting {
  id: string;
  company_id: string;
  portfolio_manager_id: string;
  meeting_date: string;
  meeting_type: 'physical' | 'virtual';
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}
```

### MeetingData (pour les requêtes)

```typescript
interface MeetingData {
  companyId: string;
  type: "physical" | "virtual";
  date: string;
  time: string;
  location?: string;
  notes?: string;
}
```

### SecurityOpportunity

```typescript
interface SecurityOpportunity {
  type: 'bond' | 'share';
  details: {
    totalAmount: number;
    unitPrice: number;
    quantity: number;
    maturityDate?: string; // Pour les obligations
    interestRate?: number; // Pour les obligations
    dividendYield?: number; // Pour les actions
    minimumInvestment: number;
    status: 'upcoming' | 'active' | 'closed';
  }
}
```

## Implémentation frontend existante

Le frontend utilise actuellement les sources de données suivantes par ordre de priorité:

1. API (si disponible) via `companyApi.getAllCompanies()`
2. Données du localStorage via `useCompaniesData`
3. Données mockées via `mockCompanies` et `mockCompanyDetails`

La structure du hook `useProspection` montre comment les données sont gérées côté client:

```typescript
// Extrait de useProspection
const loadCompanies = useCallback(async (baseCompanies: Company[] | unknown[]) => {
  try {
    setLoading(true);
    let allCompanies = [...baseCompanies] as Company[];
    
    try {
      // Tenter de charger des données supplémentaires depuis l'API si disponible
      const apiData = await companyApi.getAllCompanies();
      // Combine les données d'API avec les données de base, en évitant les doublons par ID
      const apiIds = new Set(apiData.map((company: Company) => company.id));
      const uniqueBaseCompanies = allCompanies.filter(company => !apiIds.has(company.id));
      allCompanies = [...apiData, ...uniqueBaseCompanies];
    } catch {
      console.warn('Impossible de charger les données depuis l\'API, utilisation des données de base');
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

## Codes d'erreur

| Code | Description |
|------|-------------|
| 400  | Requête invalide - Données manquantes ou incorrectes |
| 401  | Non autorisé - Authentification requise |
| 403  | Accès interdit - Droits insuffisants |
| 404  | Ressource non trouvée |
| 500  | Erreur serveur interne |

## Notes d'implémentation

1. Les endpoints de l'API doivent renvoyer des réponses en JSON conformes aux schémas décrits ci-dessus.
2. Tous les champs marqués avec `?` dans les interfaces TypeScript sont optionnels dans les réponses JSON.
3. Les dates doivent être formatées en ISO 8601 (YYYY-MM-DDTHH:MM:SSZ).
4. L'implémentation backend doit respecter la pagination décrite dans le format de réponse.
5. Pour les requêtes impliquant des filtres ou de la recherche, si ces paramètres ne sont pas fournis, tous les résultats doivent être retournés (sous réserve de pagination).
