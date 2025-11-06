# Gestion des Institutions Financières 🏦

## 🎯 Vue d'Ensemble

Le module des institutions financières permet la gestion complète des banques, coopératives et microfinances partenaires de la plateforme Wanzo Land. Il offre des fonctionnalités pour créer, modifier, consulter et gérer les profils institutionnels avec leurs agences et équipes dirigeantes.

### Base URL
```
http://localhost:8000/land/api/v1
```

## 🏗️ Structure des Données Modernisée

### Institution Financière Principale

```typescript
interface FinancialInstitution {
  id: string;
  name: string;
  type: FinancialInstitutionType;
  category: FinancialInstitutionCategory;
  
  // Informations réglementaires
  approvalNumber?: string;
  regulatoryStatus: 'active' | 'suspended' | 'pending';
  licenseExpiryDate?: string;
  
  // Identité visuelle
  logo?: string;
  brandColors?: {
    primary: string;
    secondary: string;
  };
  
  // Localisation
  address: InstitutionAddress;
  contacts: InstitutionContacts;
  
  // Organisation
  ceoPhoto?: string;
  establishedYear?: number;
  branches: InstitutionBranch[];
  managementTeam: ManagementExecutive[];
  
  // Métadonnées
  isActive: boolean;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Types d'Institutions

```typescript
enum FinancialInstitutionType {
  BANK = 'bank',                    // Banque commerciale
  MICROFINANCE = 'microfinance',    // Institution de microfinance
  COOPERATIVE = 'cooperative',      // Coopérative d'épargne et crédit
  CREDIT_UNION = 'credit_union',    // Union de crédit
  DEVELOPMENT_BANK = 'development_bank' // Banque de développement
}

enum FinancialInstitutionCategory {
  COMMERCIAL = 'commercial',        // Banque commerciale classique
  DEVELOPMENT = 'development',      // Banque de développement
  INVESTMENT = 'investment',        // Banque d'investissement
  SPECIALIZED = 'specialized',      // Institution spécialisée
  COMMUNITY = 'community'           // Institution communautaire
}
```

### Adresse et Contacts

```typescript
interface InstitutionAddress {
  street: string;
  city: string;
  province: string;
  country: string;
  postalCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface InstitutionContacts {
  email: string;
  phone: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
  emergencyContact?: string;
}
```

### Agence Bancaire

```typescript
interface InstitutionBranch {
  id: string;
  institutionId: string;
  name: string;
  code: string;                     // Code unique de l'agence
  type: 'main' | 'branch' | 'atm' | 'agent';
  
  // Localisation
  address: string;
  city: string;
  province: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  
  // Contacts
  phone?: string;
  email?: string;
  
  // Personnel
  manager?: string;
  managerContact?: string;
  staffCount?: number;
  
  // Services
  services: BranchService[];
  operatingHours: OperatingHours;
  
  // État
  isActive: boolean;
  openingDate?: string;
  closingDate?: string;
  
  // Métadonnées
  createdAt: string;
  updatedAt: string;
}

interface BranchService {
  code: string;
  name: string;
  description?: string;
  isAvailable: boolean;
}

interface OperatingHours {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

interface TimeSlot {
  open: string;    // Format: "HH:mm"
  close: string;   // Format: "HH:mm"
}
```

### Équipe Dirigeante

```typescript
interface ManagementExecutive {
  id: string;
  institutionId: string;
  
  // Informations personnelles
  firstName: string;
  lastName: string;
  fullName: string;
  photo?: string;
  
  // Poste et responsabilités
  position: string;
  department: string;
  level: 'executive' | 'senior' | 'manager';
  reportingTo?: string;         // ID du supérieur hiérarchique
  
  // Informations professionnelles
  bio?: string;
  education?: string[];
  experience?: ExecutiveExperience[];
  specializations?: string[];
  
  // Contacts
  email?: string;
  phone?: string;
  
  // Métadonnées
  joinDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExecutiveExperience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
}
```

## 🔗 Endpoints API Modernisés

### Authentification
Tous les endpoints nécessitent un token Auth0 Bearer :
```http
Authorization: Bearer <access_token>
```

### 1. Consulter une Institution Financière

```http
GET /financial-institutions/{institutionId}
```

**Réponse** :
```json
{
  "data": {
    "id": "fin_bcc_001",
    "name": "Banque Congolaise du Commerce",
    "type": "bank",
    "category": "commercial",
    "approvalNumber": "BCC/2015/123",
    "regulatoryStatus": "active",
    "licenseExpiryDate": "2030-12-31",
    "logo": "https://cdn.wanzo.land/institutions/logos/bcc.png",
    "brandColors": {
      "primary": "#1E40AF",
      "secondary": "#3B82F6"
    },
    "address": {
      "street": "789, Boulevard du 30 Juin",
      "city": "Kinshasa",
      "province": "Kinshasa",
      "country": "République Démocratique du Congo",
      "postalCode": "7852",
      "coordinates": {
        "latitude": -4.3276,
        "longitude": 15.3136
      }
    },
    "contacts": {
      "email": "info@bcc-bank.cd",
      "phone": "+243 850 123 456",
      "website": "https://www.bcc-bank.cd",
      "socialMedia": {
        "facebook": "https://facebook.com/bcc-bank",
        "linkedin": "https://linkedin.com/company/bcc-bank"
      },
      "emergencyContact": "+243 850 999 888"
    },
    "ceoPhoto": "https://cdn.wanzo.land/institutions/executives/ceo_bcc.jpg",
    "establishedYear": 2015,
    "branches": [
      {
        "id": "branch_bcc_gombe",
        "institutionId": "fin_bcc_001",
        "name": "Agence Gombe",
        "code": "BCC-GB-001",
        "type": "main",
        "address": "789, Boulevard du 30 Juin, Gombe",
        "city": "Kinshasa",
        "province": "Kinshasa",
        "coordinates": {
          "latitude": -4.3276,
          "longitude": 15.3136
        },
        "phone": "+243 854 321 987",
        "email": "gombe@bcc-bank.cd",
        "manager": "Alice Nzinga",
        "managerContact": "+243 854 321 988",
        "staffCount": 25,
        "services": [
          {
            "code": "retail_banking",
            "name": "Banque de détail",
            "description": "Comptes courants et d'épargne",
            "isAvailable": true
          },
          {
            "code": "corporate_banking",
            "name": "Banque d'entreprise",
            "description": "Services aux entreprises",
            "isAvailable": true
          },
          {
            "code": "loans",
            "name": "Crédit et financement",
            "description": "Prêts personnels et professionnels",
            "isAvailable": true
          }
        ],
        "operatingHours": {
          "monday": [{"open": "08:00", "close": "16:00"}],
          "tuesday": [{"open": "08:00", "close": "16:00"}],
          "wednesday": [{"open": "08:00", "close": "16:00"}],
          "thursday": [{"open": "08:00", "close": "16:00"}],
          "friday": [{"open": "08:00", "close": "16:00"}],
          "saturday": [{"open": "08:00", "close": "12:00"}],
          "sunday": []
        },
        "isActive": true,
        "openingDate": "2015-03-12",
        "createdAt": "2015-03-12T00:00:00Z",
        "updatedAt": "2025-11-05T10:30:00Z"
      }
    ],
    "managementTeam": [
      {
        "id": "exec_marie_kabongo",
        "institutionId": "fin_bcc_001",
        "firstName": "Marie",
        "lastName": "Kabongo",
        "fullName": "Marie Kabongo",
        "position": "Directrice Générale Adjointe",
        "department": "Direction Générale",
        "level": "executive",
        "photo": "https://cdn.wanzo.land/institutions/executives/marie_kabongo.jpg",
        "bio": "Plus de 15 ans d'expérience dans le secteur financier congolais",
        "education": [
          "MBA Finance - Université de Kinshasa",
          "Master en Économie - UNIKIN"
        ],
        "experience": [
          {
            "company": "Rawbank",
            "position": "Directrice Régionale",
            "startDate": "2018-01-15",
            "endDate": "2022-12-31",
            "description": "Supervision de 8 agences dans la région de Kinshasa"
          }
        ],
        "specializations": [
          "Banque commerciale",
          "Gestion des risques",
          "Développement régional"
        ],
        "email": "marie.kabongo@bcc-bank.cd",
        "phone": "+243 854 321 999",
        "joinDate": "2023-01-01",
        "isActive": true,
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2025-11-05T10:30:00Z"
      }
    ],
    "isActive": true,
    "isVisible": true,
    "createdAt": "2015-03-12T00:00:00Z",
    "updatedAt": "2025-11-05T10:30:00Z"
  }
}
```

### 2. Créer une Institution Financière

```http
POST /financial-institutions
Content-Type: application/json
```

**Corps de la requête** :
```json
{
  "name": "Banque de Développement du Kasaï",
  "type": "development_bank",
  "category": "development",
  "approvalNumber": "BDK/2025/001",
  "regulatoryStatus": "active",
  "licenseExpiryDate": "2035-12-31",
  "address": {
    "street": "Avenue Mobutu 456",
    "city": "Kananga", 
    "province": "Kasaï-Central",
    "country": "République Démocratique du Congo",
    "postalCode": "1234"
  },
  "contacts": {
    "email": "info@bdk-kasai.cd",
    "phone": "+243 851 234 567",
    "website": "https://www.bdk-kasai.cd"
  },
  "establishedYear": 2025,
  "brandColors": {
    "primary": "#059669",
    "secondary": "#10B981"
  }
}
```
```

## Endpoints API

### Récupérer une institution financière

```
GET /financial-institutions/{institutionId}
```

**Implémentation** : `getFinancialInstitution(institutionId)`

#### Réponse

```json
{
  "id": "fin-123",
  "name": "Banque Congolaise du Commerce",
  "type": "bank",
  "category": "commercial", 
  "approvalNumber": "BCC/2015/123",
  "logo": "https://cdn.example.com/logos/bcc.png",
  "address": {
    "street": "789, Boulevard du 30 Juin",
    "city": "Kinshasa",
    "province": "Kinshasa",
    "country": "République Démocratique du Congo"
  },
  "contacts": {
    "email": "info@bcc-bank.cd",
    "phone": "+243 850 123 456",
    "website": "https://www.bcc-bank.cd"
  },
  "ceoPhoto": "https://cdn.example.com/photos/ceo.jpg",
  "branches": [
    {
      "id": "branch-123",
      "name": "Agence Gombe",
      "address": "789, Boulevard du 30 Juin, Gombe",
      "phone": "+243 854 321 987",
      "manager": "Alice Nzinga"
    }
  ],
  "managementTeam": [
    {
      "id": "mgmt-123",
      "name": "Marie Kabongo",
      "position": "Directrice Générale Adjointe",
      "photo": "https://cdn.example.com/photos/marie.jpg",
      "bio": "15 ans d'expérience dans la finance"
    }
  ],
  "createdAt": "2015-03-12T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Créer une institution financière

```
POST /financial-institutions
```

**Implémentation** : `createFinancialInstitution(institutionData)`

#### Corps de la requête

```json
{
  "name": "Nouvelle Banque",
  "type": "bank",
  "category": "commercial",
  "approvalNumber": "NBK/2024/001",
  "address": {
    "street": "123 Avenue Commerce",
    "city": "Kinshasa", 
    "province": "Kinshasa",
    "country": "RDC"
  },
  "contacts": {
    "email": "info@nouvellebanque.cd",
    "phone": "+243 890 123 456",
    "website": "https://www.nouvellebanque.cd"
  }
}
```

### Mettre à jour une institution financière  

```
PATCH /financial-institutions/{institutionId}
```

**Implémentation** : `updateFinancialInstitution(institutionId, updates)`

#### Corps de la requête

```json
{
  "name": "Nouveau Nom de la Banque",
  "contacts": {
    "phone": "+243 890 999 888"
  }
}
```

### Supprimer une institution financière

```
DELETE /financial-institutions/{institutionId}
```

**Implémentation** : `deleteFinancialInstitution(institutionId)`

### Upload du logo

```
POST /financial-institutions/logo/upload
```

**Implémentation** : `uploadInstitutionLogo(institutionId, logoFile)`

#### Corps de la requête (multipart/form-data)

```
file: [File - Image du logo]
institutionId: "fin-123"
```

#### Réponse

```json
{
  "url": "https://cdn.example.com/logos/fin-123-logo.png"
}
```
        "title": "Directrice Financière",
        "department": "Finance",
        "email": "m.kabongo@bcc-bank.cd",
        "phone": "+243 850 123 461"
      },
      {
        "id": "usr_fghij67890",
        "name": "Jean Luc Mabele",
        "gender": "male",
        "title": "Directeur des Opérations",
        "department": "Opérations",
        "email": "jl.mabele@bcc-bank.cd",
        "phone": "+243 850 123 462"
      }
    ],
    "boardMembers": [
      {
        "name": "Emmanuel Tshisekedi",
        "position": "Président du Conseil",
        "organization": "Groupe Financier International"
      },
      {
        "name": "Sophie Ilunga",
        "position": "Membre",
        "organization": "Association des Banques Congolaises"
      }
    ]
  },
  "services": {
    "personalBanking": [
      "Comptes courants et d'épargne",
      "Prêts personnels",
      "Cartes de crédit et de débit",
      "Banque mobile"
    ],
    "businessBanking": [
      "Comptes entreprises",
      "Financement commercial",
      "Prêts aux entreprises",
      "Services de change"
    ],
    "specializedServices": [
      "Financement de projets",
      "Services de conseil aux entreprises",
      "Gestion de patrimoine"
    ]
  },
  "financialInfo": {
    "assets": 1200000000,
    "capital": 250000000,
    "currency": "USD",
    "yearFounded": 2015,
    "regulatoryCompliance": {
      "bcc": true,
      "fatca": true,
      "aml": true
    }
  },
  "creditRating": {
    "agency": "Moody's",
    "rating": "Ba1",
    "outlook": "stable",
    "lastUpdated": "2023-06-20"
  },
  "digitalPresence": {
    "hasMobileBanking": true,
    "hasInternetBanking": true,
    "appLinks": {
      "android": "https://play.google.com/store/apps/details?id=cd.bcc.mobilebanking",
      "ios": "https://apps.apple.com/cd/app/bcc-mobile/id1234567890"
    }
  },
  "subscription": {
    "plan": {
      "name": "Entreprise"
    },
    "status": "active",
    "currentPeriodEnd": "2025-12-31"
  },
  "createdAt": "2023-10-15T14:30:00Z",
  "updatedAt": "2023-11-20T09:45:00Z",
  "createdBy": "usr_12345abcde"
}
```

## Endpoints API

### Créer une institution financière

```
POST /land/api/v1/financial-institutions
```

#### Corps de la requête

```json
{
  "name": "Banque Congolaise du Commerce",
  "type": "bank",
  "category": "commercial",
  "licenseNumber": "BCC/2015/123",
  "establishedDate": "2015-03-12",
  "address": {
    "headquarters": {
      "street": "789, Boulevard du 30 Juin",
      "commune": "Gombe",
      "city": "Kinshasa",
      "province": "Kinshasa",
      "country": "République Démocratique du Congo"
    }
  },
  "contacts": {
    "general": {
      "email": "info@bcc-bank.cd",
      "phone": "+243 850 123 456"
    }
  },
  "leadership": {
    "ceo": {
      "name": "Pierre Mukendi",
      "gender": "male",
      "title": "Directeur Général",
      "email": "p.mukendi@bcc-bank.cd"
    }
  }
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "fin-123",
    "name": "Banque Congolaise du Commerce",
    "type": "bank",
    "category": "commercial",
    "licenseNumber": "BCC/2015/123",
    "establishedDate": "2015-03-12",
    "address": {
      "headquarters": {
        "street": "789, Boulevard du 30 Juin",
        "commune": "Gombe",
        "city": "Kinshasa",
        "province": "Kinshasa",
        "country": "République Démocratique du Congo"
      }
    },
    "contacts": {
      "general": {
        "email": "info@bcc-bank.cd",
        "phone": "+243 850 123 456"
      }
    },
    "leadership": {
      "ceo": {
        "id": "usr_12345abcde",
        "name": "Pierre Mukendi",
        "gender": "male",
        "title": "Directeur Général",
        "email": "p.mukendi@bcc-bank.cd"
      }
    },
    "createdAt": "2023-10-15T14:30:00Z",
    "updatedAt": "2023-10-15T14:30:00Z"
  }
}
```

### Récupérer une institution financière

```
GET /land/api/v1/financial-institutions/{institutionId}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "fin-123",
    "name": "Banque Congolaise du Commerce",
    // ... autres champs de l'institution
  }
}
```

### Mettre à jour une institution financière

```
PATCH /land/api/v1/financial-institutions/{institutionId}
```

#### Corps de la requête

```json
{
  "description": "Établissement financier de premier plan offrant des services bancaires aux entreprises et aux particuliers en RDC.",
  "website": "https://www.bcc-bank.cd",
  "facebookPage": "https://facebook.com/bccbank",
  "linkedinPage": "https://linkedin.com/company/bcc-bank",
  "leadership": {
    "executiveTeam": [
      {
        "name": "Marie Kabongo",
        "gender": "female",
        "title": "Directrice Financière",
        "department": "Finance",
        "email": "m.kabongo@bcc-bank.cd",
        "phone": "+243 850 123 461"
      }
    ]
  },
  "services": {
    "personalBanking": [
      "Comptes courants et d'épargne",
      "Prêts personnels"
    ]
  }
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "fin-123",
    "name": "Banque Congolaise du Commerce",
    "description": "Établissement financier de premier plan offrant des services bancaires aux entreprises et aux particuliers en RDC.",
    "website": "https://www.bcc-bank.cd",
    "facebookPage": "https://facebook.com/bccbank",
    "linkedinPage": "https://linkedin.com/company/bcc-bank",
    "leadership": {
      "ceo": {
        "id": "usr_12345abcde",
        "name": "Pierre Mukendi",
        "gender": "male",
        "title": "Directeur Général",
        "email": "p.mukendi@bcc-bank.cd"
      },
      "executiveTeam": [
        {
          "id": "usr_abcde12345",
          "name": "Marie Kabongo",
          "gender": "female",
          "title": "Directrice Financière",
          "department": "Finance",
          "email": "m.kabongo@bcc-bank.cd",
          "phone": "+243 850 123 461"
        }
      ]
    },
    "services": {
      "personalBanking": [
        "Comptes courants et d'épargne",
        "Prêts personnels"
      ]
    },
    // ... autres champs de l'institution
    "updatedAt": "2023-11-20T09:45:00Z"
  }
}
```

### Télécharger un logo d'institution

```
POST /land/api/v1/financial-institutions/{institutionId}/logo
Content-Type: multipart/form-data
```

#### Corps de la requête

```
logo: [FILE]
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "logo": "https://cdn.example.com/logos/bcc.png",
    "message": "Logo téléchargé avec succès"
  }
}
```

### Télécharger une photo du CEO

```
POST /land/api/v1/financial-institutions/{institutionId}/ceo/photo
Content-Type: multipart/form-data
```

#### Corps de la requête

```
photo: [FILE]
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "photo": "https://cdn.example.com/photos/pierre-mukendi.jpg",
    "message": "Photo téléchargée avec succès"
  }
}
```

### Ajouter une agence

```
POST /land/api/v1/financial-institutions/{institutionId}/branches
```

#### Corps de la requête

```json
{
  "name": "Agence Limete",
  "address": {
    "street": "456, Avenue des Poids Lourds",
    "commune": "Limete",
    "city": "Kinshasa",
    "province": "Kinshasa",
    "country": "République Démocratique du Congo"
  },
  "coordinates": {
    "lat": -4.342,
    "lng": 15.353
  },
  "manager": "Robert Kimbembe",
  "phone": "+243 854 321 988",
  "email": "limete@bcc-bank.cd",
  "openingHours": "Lun-Ven: 8h-16h"
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "branch-456",
    "name": "Agence Limete",
    "address": {
      "street": "456, Avenue des Poids Lourds",
      "commune": "Limete",
      "city": "Kinshasa",
      "province": "Kinshasa",
      "country": "République Démocratique du Congo"
    },
    "coordinates": {
      "lat": -4.342,
      "lng": 15.353
    },
    "manager": "Robert Kimbembe",
    "phone": "+243 854 321 988",
    "email": "limete@bcc-bank.cd",
    "openingHours": "Lun-Ven: 8h-16h"
  }
}
```

### Supprimer une agence

```
DELETE /land/api/v1/financial-institutions/{institutionId}/branches/{branchId}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "message": "Agence supprimée avec succès"
  }
}
```

### Ajouter un membre de l'équipe de direction

```
POST /land/api/v1/financial-institutions/{institutionId}/leadership/executives
```

#### Corps de la requête

```json
{
  "name": "Jean Luc Mabele",
  "gender": "male",
  "title": "Directeur des Opérations",
  "department": "Opérations",
  "email": "jl.mabele@bcc-bank.cd",
  "phone": "+243 850 123 462"
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "usr_fghij67890",
    "name": "Jean Luc Mabele",
    "gender": "male",
    "title": "Directeur des Opérations",
    "department": "Opérations",
    "email": "jl.mabele@bcc-bank.cd",
    "phone": "+243 850 123 462"
  }
}
```

### Supprimer un membre de l'équipe de direction

```
DELETE /land/api/v1/financial-institutions/{institutionId}/leadership/executives/{executiveId}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "message": "Membre de l'équipe de direction supprimé avec succès"
  }
}
```

### Lister les institutions financières (pour les admins)

```
GET /land/api/v1/financial-institutions?page=1&limit=10
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": [
    {
      "id": "fin-123",
      "name": "Banque Congolaise du Commerce",
      "type": "bank",
      "category": "commercial",
      "createdAt": "2023-10-15T14:30:00Z"
    },
    // ... autres institutions
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

---

*Documentation mise à jour le 5 novembre 2025 pour refléter l'architecture moderne avec gestion complète des institutions financières, structures de données étendues et endpoints API conformes à la base URL standardisée.*
