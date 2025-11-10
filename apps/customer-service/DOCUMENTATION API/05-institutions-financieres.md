# Gestion des Institutions Financières 🏦

## 🎯 Vue d'Ensemble

Le module des institutions financières permet la gestion complète des banques, coopératives et microfinances partenaires de la plateforme Wanzo Land. Il offre des fonctionnalités pour créer, modifier, consulter et gérer les profils institutionnels.

> **⚠️ IMPORTANT - SOURCE DE VÉRITÉ**  
> Cette documentation a été mise à jour pour être **100% conforme à la structure du formulaire d'institution financière**. Le formulaire est la source de vérité - toutes les interfaces, APIs et données doivent correspondre exactement à sa structure.

### Base URL
```
http://localhost:8000/land/api/v1
```

### Changements Majeurs (v2.0)
- ✅ **Structure unifiée** : Tous les champs correspondent au formulaire validé
- ✅ **Types harmonisés** : `BANQUE`, `MICROFINANCE`, `COOPEC`, etc.
- ✅ **Données complètes** : 70+ champs métier spécialisés
- ✅ **Validation Zod** : Schémas de validation alignés
- ✅ **Mocks cohérents** : Données de test conformes

## 🏗️ Structure des Données (Basée sur le Formulaire - Source de Vérité)

### Institution Financière Principale

```typescript
interface FinancialInstitution {
  id: string;
  userId: string; // Lien vers l'utilisateur propriétaire
  
  // Identification institutionnelle (exactement comme dans le formulaire)
  denominationSociale: string;
  sigle: string;
  typeInstitution: string;
  sousCategorie: string;
  dateCreation: string;
  paysOrigine: string;
  statutJuridique: string;
  
  // Informations réglementaires
  autoritéSupervision: string;
  numeroAgrement: string;
  dateAgrement: string;
  validiteAgrement: string;
  numeroRCCM: string;
  numeroNIF: string;
  
  // Activités autorisées
  activitesAutorisees: string[];
  
  // Informations opérationnelles
  siegeSocial: string;
  nombreAgences: number;
  villesProvincesCouvertes: string[];
  presenceInternationale: boolean;
  
  // Capacités financières
  capitalSocialMinimum: string;
  capitalSocialActuel: string;
  fondsPropresMontant: string;
  totalBilan: string;
  chiffreAffairesAnnuel: string;
  devise: 'USD' | 'CDF' | 'EUR';
  
  // Clientèle et marché
  segmentClientelePrincipal: string;
  nombreClientsActifs: number;
  portefeuilleCredit: string;
  depotsCollectes: string;
  
  // Services offerts à Wanzo
  servicesCredit: string[];
  servicesInvestissement: string[];
  servicesGarantie: string[];
  servicesTransactionnels: string[];
  servicesConseil: string[];
  
  // Partenariat Wanzo
  motivationPrincipale: string;
  servicesPrioritaires: string[];
  segmentsClienteleCibles: string[];
  volumeAffairesEnvisage: string;
  
  // Conditions commerciales
  grillesTarifaires: string;
  conditionsPreferentielles: string;
  delaisTraitement: string;
  criteresEligibilite: string;
  
  // Capacité d'engagement
  montantMaximumDossier: string;
  enveloppeGlobale: string;
  secteursActivitePrivilegies: string[];
  zonesGeographiquesPrioritaires: string[];
  
  // Documents
  documentsLegaux: any[];
  documentsFinanciers: any[];
  documentsOperationnels: any[];
  documentsCompliance: any[];
  
  // Métadonnées
  createdAt: string;
  updatedAt: string;
}
```

### Types d'Institutions (Conforme au Formulaire)

```typescript
// Types d'institutions utilisés dans le formulaire
type FinancialInstitutionType = 
  | 'BANQUE'                    // Banque commerciale
  | 'MICROFINANCE'              // Institution de microfinance  
  | 'COOPEC'                    // Coopérative d'épargne et de crédit
  | 'FOND_GARANTIE'             // Fonds de garantie
  | 'ENTREPRISE_FINANCIERE'     // Entreprise financière
  | 'FOND_CAPITAL_INVESTISSEMENT' // Fonds de capital investissement
  | 'FOND_IMPACT'               // Fonds d'impact
  | 'AUTRE';                    // Autre institution spécialisée

// Sous-catégories par type d'institution
const FINANCIAL_INSTITUTION_SUBTYPES = {
  BANQUE: [
    { value: 'deposit_credit_bank', label: 'Banque de dépôt et de crédit' },
    { value: 'business_bank', label: 'Banque d\'affaires' },
    { value: 'investment_bank', label: 'Banque d\'investissement' },
  ],
  MICROFINANCE: [
    { value: 'microfinance_company', label: 'Société de microfinance' },
    { value: 'microfinance_program', label: 'Programme de microfinance' },
    { value: 'credit_union', label: 'Union de crédit' },
  ],
  COOPEC: [
    { value: 'savings_credit_coop', label: 'Coopérative d\'épargne et de crédit' },
    { value: 'rural_coop', label: 'Coopérative rurale' },
    { value: 'urban_coop', label: 'Coopérative urbaine' },
  ],
  // ... autres sous-catégories
};

// Autorités de supervision
const SUPERVISORY_AUTHORITIES = [
  { value: 'bcc', label: 'Banque Centrale du Congo (BCC)' },
  { value: 'arca', label: 'Autorité de Régulation et de Contrôle des Assurances (ARCA)' },
  { value: 'asmf', label: 'Autorité des Services et Marchés Financiers (ASMF)' },
  { value: 'other', label: 'Autre autorité' },
];

// Devises supportées
type Currency = 'USD' | 'CDF' | 'EUR';
```

### Exemples de Données Réelles (Conformes au Formulaire)

#### 1. Banque Commerciale

```json
{
  "id": "inst-001",
  "userId": "user-fi-001",
  "denominationSociale": "Banque Congolaise du Commerce",
  "sigle": "BCC",
  "typeInstitution": "BANQUE",
  "sousCategorie": "deposit_credit_bank",
  "numeroAgrement": "BCC/2010/001",
  "autoritéSupervision": "bcc",
  "siegeSocial": "123 Boulevard du 30 Juin, Kinshasa",
  "nombreAgences": 15,
  "capitalSocialActuel": "25000000",
  "devise": "USD",
  "segmentClientelePrincipal": "sme",
  "nombreClientsActifs": 15000
}
```

#### 2. Institution de Microfinance

```json
{
  "id": "inst-002",
  "userId": "user-fi-002",
  "denominationSociale": "Microfinance du Kasaï",
  "sigle": "MFK",
  "typeInstitution": "MICROFINANCE",
  "sousCategorie": "microfinance_company",
  "numeroAgrement": "MF/2015/045",
  "autoritéSupervision": "bcc",
  "siegeSocial": "456 Avenue Lumumba, Kananga",
  "nombreAgences": 8,
  "capitalSocialActuel": "2500000",
  "devise": "USD",
  "segmentClientelePrincipal": "individuals",
  "nombreClientsActifs": 5000
}
```

#### 3. Coopérative d'Épargne et de Crédit

```json
{
  "id": "inst-003",
  "userId": "user-fi-003",
  "denominationSociale": "COOPEC Solidarité",
  "sigle": "COOSOL",
  "typeInstitution": "COOPEC",
  "sousCategorie": "savings_credit_coop",
  "numeroAgrement": "COOPEC/2018/012",
  "autoritéSupervision": "bcc",
  "siegeSocial": "789 Rue de la Paix, Bukavu",
  "nombreAgences": 5,
  "capitalSocialActuel": "800000",
  "devise": "USD",
  "segmentClientelePrincipal": "individuals",
  "nombreClientsActifs": 1200
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

#### Corps de la requête (Structure conforme au formulaire)

```json
{
  "userId": "user-fi-001",
  
  // Identification institutionnelle
  "denominationSociale": "Banque Congolaise du Commerce",
  "sigle": "BCC",
  "typeInstitution": "BANQUE",
  "sousCategorie": "deposit_credit_bank",
  "dateCreation": "2010-03-15",
  "paysOrigine": "RDC",
  "statutJuridique": "sa",
  
  // Informations réglementaires
  "autoritéSupervision": "bcc",
  "numeroAgrement": "BCC/2010/001",
  "dateAgrement": "2010-02-28",
  "validiteAgrement": "2030-02-28",
  "numeroRCCM": "CD/RCCM/23/B/001",
  "numeroNIF": "A1234567890",
  
  // Activités autorisées
  "activitesAutorisees": ["deposit_collection", "credit_granting", "payment_services"],
  
  // Informations opérationnelles
  "siegeSocial": "123 Boulevard du 30 Juin, Kinshasa",
  "nombreAgences": 15,
  "villesProvincesCouvertes": ["Kinshasa", "Lubumbashi", "Bukavu"],
  "presenceInternationale": false,
  
  // Capacités financières
  "capitalSocialMinimum": "10000000",
  "capitalSocialActuel": "25000000",
  "fondsPropresMontant": "50000000",
  "totalBilan": "200000000",
  "chiffreAffairesAnnuel": "15000000",
  "devise": "USD",
  
  // Clientèle et marché
  "segmentClientelePrincipal": "sme",
  "nombreClientsActifs": 15000,
  "portefeuilleCredit": "80000000",
  "depotsCollectes": "150000000",
  
  // Services offerts à Wanzo
  "servicesCredit": ["sme_credit", "startup_credit"],
  "servicesInvestissement": ["venture_capital"],
  "servicesGarantie": ["bank_guarantees"],
  "servicesTransactionnels": ["bank_accounts", "transfers"],
  "servicesConseil": ["financial_management"],
  
  // Partenariat Wanzo
  "motivationPrincipale": "new_clients",
  "servicesPrioritaires": ["sme_credit"],
  "segmentsClienteleCibles": ["sme", "individuals"],
  "volumeAffairesEnvisage": "5000000",
  
  // Conditions commerciales
  "grillesTarifaires": "Taux préférentiels pour partenaires Wanzo: 8-12%",
  "conditionsPreferentielles": "Réduction de 1% sur les taux standards",
  "delaisTraitement": "5",
  "criteresEligibilite": "CA minimum 50k USD, 2 ans d'activité",
  
  // Capacité d'engagement
  "montantMaximumDossier": "500000",
  "enveloppeGlobale": "10000000",
  "secteursActivitePrivilegies": ["commerce", "services"],
  "zonesGeographiquesPrioritaires": ["Kinshasa", "Lubumbashi"],
  
  // Documents (peuvent être uploadés séparément)
  "documentsLegaux": [],
  "documentsFinanciers": [],
  "documentsOperationnels": [],
  "documentsCompliance": []
}
```

#### Exemple de réponse (Structure conforme au formulaire)

```json
{
  "success": true,
  "data": {
    "id": "inst-001",
    "userId": "user-fi-001",
    
    // Identification institutionnelle
    "denominationSociale": "Banque Congolaise du Commerce",
    "sigle": "BCC",
    "typeInstitution": "BANQUE",
    "sousCategorie": "deposit_credit_bank",
    "dateCreation": "2010-03-15",
    "paysOrigine": "RDC",
    "statutJuridique": "sa",
    
    // Informations réglementaires
    "autoritéSupervision": "bcc",
    "numeroAgrement": "BCC/2010/001",
    "dateAgrement": "2010-02-28",
    "validiteAgrement": "2030-02-28",
    "numeroRCCM": "CD/RCCM/23/B/001",
    "numeroNIF": "A1234567890",
    
    // Informations opérationnelles
    "siegeSocial": "123 Boulevard du 30 Juin, Kinshasa",
    "nombreAgences": 15,
    "villesProvincesCouvertes": ["Kinshasa", "Lubumbashi", "Bukavu"],
    "presenceInternationale": false,
    
    // Capacités financières
    "capitalSocialMinimum": "10000000",
    "capitalSocialActuel": "25000000",
    "devise": "USD",
    
    // Partenariat Wanzo
    "motivationPrincipale": "new_clients",
    "servicesPrioritaires": ["sme_credit", "venture_capital"],
    
    // Métadonnées
    "createdAt": "2010-03-15T00:00:00Z",
    "updatedAt": "2024-11-09T10:30:00Z"
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

### Ajouter un membre du conseil d'administration

```
POST /land/api/v1/financial-institutions/{institutionId}/leadership/board
```

#### Corps de la requête

```json
{
  "name": "Emmanuel Tshisekedi", 
  "position": "Président du Conseil",
  "organization": "Groupe Financier International"
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "brd_67890abcde",
    "name": "Emmanuel Tshisekedi", 
    "position": "Président du Conseil",
    "organization": "Groupe Financier International"
  }
}
```

### Supprimer un membre du conseil d'administration

```
DELETE /land/api/v1/financial-institutions/{institutionId}/leadership/board/{boardMemberId}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "message": "Membre du conseil d'administration supprimé avec succès"
  }
}
```

### Valider une institution financière (Admin uniquement)

```
PATCH /land/api/v1/financial-institutions/{institutionId}/validate
```

#### Corps de la requête

```json
{
  "validatedBy": "admin-user-123"
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "message": "Institution financière validée avec succès"
  }
}
```

### Suspendre une institution financière (Admin uniquement)

```
PATCH /land/api/v1/financial-institutions/{institutionId}/suspend
```

#### Corps de la requête

```json
{
  "suspendedBy": "admin-user-123",
  "reason": "Non-conformité réglementaire"
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "message": "Institution financière suspendue avec succès"
  }
}
```

### Rejeter une institution financière (Admin uniquement)

```
PATCH /land/api/v1/financial-institutions/{institutionId}/reject
```

#### Corps de la requête

```json
{
  "rejectedBy": "admin-user-123",
  "reason": "Dossier incomplet"
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "message": "Institution financière rejetée avec succès"
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

## 🔄 Workflows Kafka - Communication Inter-Services

Le module des institutions financières publique des événements Kafka pour synchroniser les données avec les autres services de l'écosystème Wanzo.

### Événements publiés

#### 1. Création d'institution (`institution.created`)

```typescript
await this.customerEventsProducer.emitInstitutionCreated({
  customer: savedCustomer,
  institution: {
    customerId: savedFinancialData.id,
    institutionType: savedFinancialData.type
  }
});
```

**Structure de l'événement** :
```json
{
  "eventType": "institution.created",
  "eventId": "uuid-event-123",
  "timestamp": "2025-01-15T10:30:00Z",
  "source": "customer-service",
  "version": "1.0",
  "data": {
    "customer": {
      "id": "cust-inst-123",
      "name": "Banque Congolaise du Commerce",
      "type": "FINANCIAL",
      "status": "PENDING",
      "email": "info@bcc-bank.cd",
      "phone": "+243 850 123 456"
    },
    "institution": {
      "customerId": "fin-data-456",
      "institutionType": "BANQUE"
    }
  }
}
```

#### 2. Mise à jour d'institution (`institution.updated`)

```typescript
await this.customerEventsProducer.emitInstitutionUpdated({
  customer: savedCustomer,
  institution: {
    customerId: customer.financialData?.id,
    institutionType: customer.financialData?.type
  }
});
```

#### 3. Partage de profil complet (`institution.profile.shared`)

```typescript
await this.customerEventsProducer.emitInstitutionProfileShare({
  customer: savedCustomer,
  financialData: savedFinancialData,
  regulatoryData: {
    complianceStatus: 'pending',
    lastAuditDate: null,
    reportingRequirements: [],
    riskAssessment: 'not_assessed'
  },
  performanceMetrics: {
    totalCustomers: 0,
    totalAssets: 0,
    monthlyGrowth: 0,
    complianceScore: 0
  }
});
```

**Structure de l'événement** :
```json
{
  "eventType": "institution.profile.shared",
  "eventId": "uuid-event-456",
  "timestamp": "2025-01-15T10:35:00Z",
  "source": "customer-service",
  "version": "1.0",
  "data": {
    "customer": {
      "id": "cust-inst-123",
      "name": "Banque Congolaise du Commerce",
      "type": "FINANCIAL",
      "status": "ACTIVE"
    },
    "financialData": {
      "type": "BANQUE",
      "category": "COMMERCIAL",
      "licenseNumber": "BCC/2010/001",
      "leadership": {...},
      "services": {...},
      "financialInfo": {...}
    },
    "regulatoryData": {
      "complianceStatus": "active",
      "lastAuditDate": "2024-12-01T00:00:00Z",
      "reportingRequirements": [...],
      "riskAssessment": "low_risk"
    },
    "performanceMetrics": {
      "totalCustomers": 15000,
      "totalAssets": 200000000,
      "monthlyGrowth": 3.5,
      "complianceScore": 95
    }
  }
}
```

#### 4. Mise à jour de profil (`customer.profile.updated`)

```typescript
await this.customerEventsProducer.emitCustomerProfileUpdated({
  customerId: savedCustomer.id,
  customerType: 'FINANCIAL_INSTITUTION',
  updatedFields: ['institution_created', 'basic_profile'],
  updateContext: {
    updatedBy: auth0Id,
    updateSource: 'form_submission',
    formType: 'institution_creation'
  }
});
```

### Services consommateurs

Ces événements sont consommés par :

1. **admin-service** : Gestion administrative des institutions
2. **portfolio-institution-service** : Suivi des portefeuilles institutionnels
3. **analytics-service** : Analyses et métriques financières
4. **accounting-service** : Intégration comptable et facturation

---

*Documentation mise à jour le 5 novembre 2025 pour refléter l'architecture moderne avec gestion complète des institutions financières, structures de données étendues, workflows Kafka complets et endpoints API conformes à la base URL standardisée.*
