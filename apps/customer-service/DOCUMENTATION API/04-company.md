# Gestion des Entreprises (PME) - Version 2.1

## Vue d'ensemble

Le module de gestion des entreprises a été complètement refondu pour supporter un **Formulaire d'Identification Entreprise Étendu** avec des données détaillées de patrimoine, performance et spécificités sectorielles.

### 🆕 Nouveautés Version 2.1

#### Secteurs d'Activité Améliorés
- **Secteur principal** : Sélection obligatoire du secteur d'activité principal
- **Secteurs secondaires** : Sélection multiple de secteurs d'activité secondaires via tags
- **Secteurs personnalisés** : Possibilité d'ajouter des secteurs non prévus dans les constantes

#### Gestion Patrimoniale Professionnelle
- **Actifs immobilisés** : Suivi détaillé avec date d'acquisition, prix d'achat, valeur actuelle
- **Actifs circulants** : Gestion spécialisée des stocks avec paramètres professionnels
- **Traçabilité financière** : Distinction claire entre prix d'achat et valeur actuelle
- **États détaillés** : 6 niveaux d'état (Neuf, Excellent, Bon, Moyen, Mauvais, Détérioré)

#### 🎯 Accompagnement Entrepreneurial (Nouveau)
- **Statut d'incubation/accélération** : Indicateur optionnel si l'entreprise bénéficie d'un accompagnement
- **Type d'accompagnement** : Distinction entre incubation et accélération
- **Identification de l'incubateur** : Nom de l'incubateur ou accélérateur partenaire
- **Certification d'affiliation** : Upload du certificat ou attestation d'affiliation (PDF)

## Architecture Moderne

### Base URL
```
http://localhost:8000/land/api/v1/companies
```

**ℹ️ Architecture** : L'API Gateway route les requêtes `/land/api/v1/companies/*` vers le Customer Service en retirant le préfixe `/land/api/v1`. Le contrôleur CompanyController utilise `/companies` comme base interne.

### Structure des Données Étendues

#### Interface Company Principale
```typescript
interface Company {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  legalForm?: LegalFormOHADA;
  industry?: string;
  size?: string;
  website?: string;
  facebookPage?: string;

  // Identifiants légaux et fiscaux
  rccm?: string;
  taxId?: string;
  natId?: string;

  // Adresse et localisation
  address?: Address;
  locations?: Location[];

  // Informations de contact
  contacts?: {
    email?: string;
    phone?: string;
    altPhone?: string;
  };

  // Propriétaire et associés
  owner?: Owner;
  associates?: Associate[];

  // Activités commerciales - MIS À JOUR (v2.1)
  activities?: {
    primary?: string; // Secteur d'activité principal
    secondary?: string[]; // Secteurs secondaires + secteurs personnalisés combinés
  };
  // NOUVEAU: Secteurs personnalisés (v2.1)
  secteursPersnnalises?: string[]; // Secteurs ajoutés par l'entreprise non prévus dans les constantes

  // Capital et finances  
  capitalSocial?: string;
  deviseCapital?: 'USD' | 'CDF' | 'EUR';

  // **NOUVEAU**: Formulaire d'identification étendu
  extendedIdentification?: EnterpriseIdentificationForm;

  // Métadonnées
  createdAt?: Date;
  updatedAt?: Date;
  status?: 'active' | 'inactive' | 'pending' | 'suspended';
}
```

### 🆕 Formulaire d'Identification Entreprise Étendu

#### Structure Principale
```typescript
interface EnterpriseIdentificationForm {
  generalInfo: GeneralInfo;
  legalInfo: LegalInfo;
  patrimonyAndMeans: PatrimonyAndMeans; // MIS À JOUR v2.1
  specificities: Specificities;
  performance: Performance;
}
```

#### 🆕 Interfaces v2.1 - Secteurs d'Activité

```typescript
interface ActivitiesExtended {
  // Secteur d'activité principal (obligatoire)
  secteurActivitePrincipal: string;
  
  // Secteurs d'activité secondaires (sélection multiple)
  secteursActiviteSecondaires: string[];
  
  // Secteurs personnalisés (ajoutés par l'entreprise)
  secteursPersonalises: string[];
  
  // Compatibilité descendante
  activities?: {
    primary?: string;
    secondary?: string[]; // Combine secondaires + personnalisés
  };
}
```

#### 🆕 Interfaces v2.1 - Actifs Détaillés

```typescript
// Interface pour les actifs immobilisés
interface AssetData {
  id: string;
  designation: string;
  type: 'immobilier' | 'vehicule' | 'equipement' | 'autre';
  description?: string;
  
  // Valeurs financières détaillées
  prixAchat?: number; // Prix d'achat original
  valeurActuelle?: number; // Valeur actuelle estimée
  devise?: 'USD' | 'CDF' | 'EUR';
  
  // Informations temporelles
  dateAcquisition?: string; // Date d'acquisition
  
  // État et localisation
  etatActuel?: 'neuf' | 'excellent' | 'bon' | 'moyen' | 'mauvais' | 'deteriore';
  localisation?: string;
  
  // Informations techniques
  numeroSerie?: string;
  marque?: string;
  modele?: string;
  quantite?: number;
  unite?: string;
  
  // Statut de propriété
  proprietaire?: 'propre' | 'location' | 'leasing' | 'emprunt';
  
  // Observations
  observations?: string;
}

// Interface spécialisée pour les stocks (actifs circulants)
interface StockData {
  id: string;
  designation: string;
  categorie: 'matiere_premiere' | 'produit_semi_fini' | 'produit_fini' | 'fourniture' | 'emballage' | 'autre';
  description?: string;
  
  // Quantités et unités
  quantiteStock: number;
  unite: string;
  seuilMinimum?: number;
  seuilMaximum?: number;
  
  // Valeurs financières (actifs circulants)
  coutUnitaire: number;
  valeurTotaleStock: number; // Calculé automatiquement
  devise: 'USD' | 'CDF' | 'EUR';
  
  // Informations temporelles et rotation
  dateDernierInventaire?: string;
  dureeRotationMoyenne?: number; // En jours
  datePeremption?: string;
  
  // Localisation et stockage
  emplacement?: string;
  conditionsStockage?: string;
  
  // Suivi et gestion
  fournisseurPrincipal?: string;
  numeroLot?: string;
  codeArticle?: string;
  
  // État et observations
  etatStock: 'excellent' | 'bon' | 'moyen' | 'deteriore' | 'perime';
  observations?: string;
}
```

#### 1. Informations Générales
```typescript
interface GeneralInfo {
  raisonSociale: string;
  sigle?: string;
  formeJuridiqueOHADA: LegalFormOHADA;
  typeEntreprise: CompanyType;
  secteurActivitePrincipal: TraditionalSector | StartupSector;
  secteursActiviteSecondaires?: string[];
  secteursPersonalises?: string[];
  descriptionActivites?: string;
  produitsServices?: string[];
  dateCreation?: string;
  dateDebutActivites?: string;
  tailleEntreprise?: CompanySize;
  numeroRCCM?: string;
  numeroIdentificationNationale?: string;
  numeroImpotFiscal?: string;
  
  // Siège social
  headquarters: {
    address: string;
    city: string;
    commune?: string;
    province: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  // Contact principal
  mainContact: {
    name: string;
    position: string;
    email: string;
    phone: string;
    alternativePhone?: string;
  };

  // Présence digitale
  digitalPresence?: {
    website?: string;
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    twitter?: string;
  };
  
  // 🆕 Incubation et Accélération (v2.1) - OPTIONNEL
  enIncubation?: boolean;
  typeAccompagnement?: 'incubation' | 'acceleration';
  nomIncubateurAccelerateur?: string;
  certificatAffiliation?: Array<{
    url: string;
    name: string;
  }>;
}
```

#### 2. Informations Légales et Fiscales
```typescript
interface LegalInfo {
  // Identifiants officiels
  rccm?: string;
  taxNumber?: string;
  nationalId?: string;
  employerNumber?: string;
  socialSecurityNumber?: string;
  
  // Licences et autorisations
  businessLicense?: {
    number: string;
    issuedBy: string;
    issuedDate: Date;
    expiryDate?: Date;
  };
  
  operatingLicenses?: Array<{
    type: string;
    number: string;
    issuedBy: string;
    issuedDate: Date;
    expiryDate?: Date;
  }>;

  // Conformité réglementaire
  taxCompliance: {
    isUpToDate: boolean;
    lastFilingDate?: Date;
    nextFilingDue?: Date;
  };

  // Situation juridique
  legalStatus: {
    hasLegalIssues: boolean;
    issues?: string[];
    hasGovernmentContracts: boolean;
    contractTypes?: string[];
  };
}
```

#### 3. Patrimoine et Moyens
```typescript
interface PatrimonyAndMeans {
  // Capital et actionnariat
  shareCapital: {
    authorizedCapital: number;
    paidUpCapital: number;
    currency: 'USD' | 'CDF' | 'EUR';
    
    shareholders: Array<{
      name: string;
      type: 'individual' | 'corporate';
      sharePercentage: number;
      paidAmount: number;
    }>;
  };

  // Actifs immobiliers
  realEstate?: Array<{
    type: 'office' | 'warehouse' | 'factory' | 'store' | 'land';
    address: string;
    surface: number; // m²
    value: number;
    currency: string;
    isOwned: boolean;
    monthlyRent?: number;
  }>;

  // Équipements et machines - MIS À JOUR (v2.1)
  equipment?: Array<{
    id: string;
    designation: string; // Nom de l'actif
    type: 'immobilier' | 'vehicule' | 'equipement' | 'autre';
    description?: string;
    
    // Valeurs financières détaillées (v2.1)
    prixAchat?: number; // Prix d'achat original
    valeurActuelle?: number; // Valeur actuelle estimée
    devise?: 'USD' | 'CDF' | 'EUR';
    
    // Informations temporelles
    dateAcquisition?: string; // Date d'acquisition
    
    // État et localisation
    etatActuel?: 'neuf' | 'excellent' | 'bon' | 'moyen' | 'mauvais' | 'deteriore';
    localisation?: string;
    
    // Informations techniques
    marque?: string;
    modele?: string;
    quantite?: number;
    unite?: string;
    
    // Statut de propriété
    proprietaire?: 'propre' | 'location' | 'leasing' | 'emprunt';
    
    // Observations
    observations?: string;
  }>;

  // Véhicules
  vehicles?: Array<{
    id: string;
    designation: string;
    type: 'vehicule';
    marque?: string;
    modele?: string;
    annee?: number;
    prixAchat?: number;
    valeurActuelle?: number;
    devise?: 'USD' | 'CDF' | 'EUR';
    dateAcquisition?: string;
    etatActuel?: 'neuf' | 'excellent' | 'bon' | 'moyen' | 'mauvais' | 'deteriore';
    proprietaire?: 'propre' | 'location' | 'leasing' | 'emprunt';
  }>;

  // NOUVEAU: Stocks et Inventaires - Actifs Circulants (v2.1)
  stocks?: Array<{
    id: string;
    designation: string;
    categorie: 'matiere_premiere' | 'produit_semi_fini' | 'produit_fini' | 'fourniture' | 'emballage' | 'autre';
    description?: string;
    
    // Quantités et unités
    quantiteStock: number;
    unite: string; // kg, litres, pièces, m², etc.
    seuilMinimum?: number; // Seuil d'alerte
    seuilMaximum?: number; // Capacité maximale
    
    // Valeurs financières (actifs circulants)
    coutUnitaire: number; // Coût unitaire d'acquisition
    valeurTotaleStock: number; // Quantité × Coût unitaire
    devise: 'USD' | 'CDF' | 'EUR';
    
    // Informations temporelles et rotation
    dateDernierInventaire?: string;
    dureeRotationMoyenne?: number; // En jours
    datePeremption?: string; // Pour les produits périssables
    
    // Localisation et stockage
    emplacement?: string; // Entrepôt, magasin, etc.
    conditionsStockage?: string; // Température, humidité, etc.
    
    // Suivi et gestion
    fournisseurPrincipal?: string;
    numeroLot?: string;
    codeArticle?: string;
    
    // État et observations
    etatStock: 'excellent' | 'bon' | 'moyen' | 'deteriore' | 'perime';
    observations?: string;
  }>;

  // Ressources humaines
  humanResources: {
    totalEmployees: number;
    permanentEmployees: number;
    temporaryEmployees: number;
    consultants: number;
    
    keyPersonnel: Array<{
      name: string;
      position: string;
      experience: number; // années
      education: string;
      isShareholder: boolean;
    }>;
  };
}
```

#### 4. Spécificités (Startup vs Traditionnelle)
```typescript
interface Specificities {
  // Spécificités Startup
  startup?: {
    stage: 'idea' | 'prototype' | 'mvp' | 'early_revenue' | 'growth' | 'expansion';
    fundraising: {
      hasRaised: boolean;
      totalRaised?: number;
      currency?: string;
      investors?: Array<{
        name: string;
        type: 'angel' | 'vc' | 'accelerator' | 'family_office' | 'other';
        amount: number;
        date: Date;
      }>;
    };
    
    innovation: {
      intellectualProperty?: Array<{
        type: 'patent' | 'trademark' | 'copyright' | 'trade_secret';
        title: string;
        registrationNumber?: string;
        status: 'pending' | 'registered' | 'expired';
      }>;
      
      technologyStack?: string[];
      researchPartnership?: Array<{
        institution: string;
        type: 'university' | 'research_center' | 'corporate_lab';
        projectTitle: string;
      }>;
    };
  };

  // Spécificités Entreprise Traditionnelle
  traditional?: {
    operatingHistory: {
      yearsInBusiness: number;
      majorMilestones: Array<{
        year: number;
        milestone: string;
        impact: string;
      }>;
    };
    
    marketPosition: {
      marketShare?: number;
      competitorAnalysis?: string;
      competitiveAdvantages: string[];
    };
    
    supplierNetwork: Array<{
      name: string;
      relationship: 'exclusive' | 'preferred' | 'regular';
      yearsOfRelationship: number;
      isLocal: boolean;
    }>;
    
    customerBase: {
      totalCustomers: number;
      repeatCustomerRate: number; // %
      averageCustomerValue: number;
      customerTypes: ('b2b' | 'b2c' | 'government')[];
    };
  };
}
```

#### 5. Performance et Métriques
```typescript
interface Performance {
  // Performance financière
  financial: {
    // Revenus
    revenue: Array<{
      year: number;
      amount: number;
      currency: string;
      isProjected: boolean;
    }>;
    
    // Profitabilité
    profitability: Array<{
      year: number;
      grossProfit: number;
      netProfit: number;
      currency: string;
      margins: {
        gross: number; // %
        net: number; // %
      };
    }>;
    
    // Flux de trésorerie
    cashFlow: {
      monthly: Array<{
        month: string;
        inflow: number;
        outflow: number;
        netFlow: number;
      }>;
    };
    
    // Besoins de financement
    financingNeeds?: {
      amount: number;
      currency: string;
      purpose: string[];
      timeframe: string;
      hasAppliedBefore: boolean;
      previousApplications?: Array<{
        institution: string;
        amount: number;
        result: 'approved' | 'rejected' | 'pending';
        date: Date;
      }>;
    };
  };

  // Performance opérationnelle
  operational: {
    productivity: {
      outputPerEmployee?: number;
      revenuePerEmployee?: number;
      utilizationRate?: number; // %
    };
    
    quality: {
      defectRate?: number;
      customerSatisfaction?: number; // score 1-10
      returnRate?: number; // %
    };
    
    efficiency: {
      orderFulfillmentTime?: number; // jours
      inventoryTurnover?: number;
      costPerUnit?: number;
    };
  };

  // Performance marché
  market: {
    growth: {
      customerGrowthRate: number; // % annuel
      marketExpansion: string[];
      newProductsLaunched: number;
    };
    
    digital: {
      onlinePresence: {
        website: boolean;
        ecommerce: boolean;
        socialMedia: string[];
      };
      digitalSales?: number; // % du total
    };
  };
}
```
  // Emplacements avec coordonnées
  locations?: Array<{
    id: string;
    name: string;
    type: 'headquarters' | 'branch' | 'store' | 'warehouse' | 'factory' | 'other';
    address?: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  }>;
  // Contacts
  contacts?: {
    email?: string;
    phone?: string;
    altPhone?: string;
  };
  // Propriétaire
  owner?: {
    id: string;
    name: string;
    gender?: 'male' | 'female';
    email?: string;
    phone?: string;
    hasOtherJob?: boolean;
    cv?: string; // URL du CV sur Cloudinary
    linkedin?: string;
    facebook?: string;
  };
  associates?: Array<{
    id?: string;
    name: string;
    gender?: 'male' | 'female';
    role?: string;
    shares?: number;
    email?: string;
    phone?: string;
  }>;
  // Activités
  activities?: {
    primary?: string;
    secondary?: string[];
  };
  // Capital
  capital?: {
    isApplicable?: boolean;
    amount?: number;
    currency?: 'USD' | 'CDF' | 'EUR';
  };
  // Données financières
  financials?: {
    revenue?: number;
    netIncome?: number;
    totalAssets?: number;
    equity?: number;
  };
  // Affiliations
  affiliations?: {
    cnss?: string;
    inpp?: string;
    onem?: string;
    intraCoop?: string;
    interCoop?: string;
    partners?: string[];
  };
  // Abonnement
  subscription?: {
    plan?: {
      name: string;
    };
    status: 'active' | 'inactive' | 'pending' | 'expired';
    currentPeriodEnd?: string;
  };
}
```

## Implémentation actuelle

**Service** : `CompanyService` (src/services/company.ts)
- **Stockage** : localStorage (`company_${id}`)
- **Données de test** : Entreprise KIOTA TECH pré-configurée
- **Persistance** : Modifications sauvegardées automatiquement

### Exemple de données (KIOTA TECH)

```json
{
  "id": "comp-123",
  "name": "KIOTA TECH",
  "logo": "https://i.imgur.com/JfaStwU.png",
  "description": "Leader en solutions numériques innovantes en RDC, spécialisé dans le développement logiciel, le conseil technologique et la formation IT pour accélérer la transformation digitale des entreprises.",
  "legalForm": "SARL",
  "industry": "Technologie", 
  "size": "11-50 employés",
  "website": "https://www.kiota.tech",
  "rccm": "CD/KIN/RCCM/22-B-01234",
  "taxId": "A1234567B",
  "natId": "01-2345-C67890D",
  "address": {
    "street": "123, Avenue de la Libération, Croisement Boulevard du 30 Juin",
    "commune": "Gombe",
    "city": "Kinshasa",
    "province": "Kinshasa",
    "country": "République Démocratique du Congo"
  },
  "contacts": {
    "email": "contact@kiota.tech",
    "phone": "+243 810 987 654",
    "altPhone": "+243 990 123 456"
  },
  "owner": {
    "id": "user-123",
    "name": "Jean Mutombo",
    "email": "j.mutombo@kiota.tech",
    "phone": "+243 820 123 456"
  },
  "associates": [
    {
      "id": "user-456",
      "name": "Marie Lukusa",
      "role": "Directrice financière",
      "shares": 25,
      "email": "m.lukusa@kiota.tech",
      "phone": "+243 821 234 567"
    },
    {
      "id": "user-789", 
      "name": "Patrick Kabongo",
      "role": "Directeur technique",
      "shares": 15,
      "email": "p.kabongo@kiota.tech",
      "phone": "+243 822 345 678"
    }
  ],
  "activities": {
    "primary": "Développement de logiciels et solutions numériques sur mesure",
    "secondary": [
      "Conseil en transformation digitale",
      "Formation professionnelle en IT", 
      "Vente et intégration de matériel informatique",
      "Solutions FinTech personnalisées"
    ]
  },
  "secteursPersnnalises": [
    "Solutions FinTech personnalisées"
  ],
  "capitalSocial": "50000",
  "deviseCapital": "USD",
  "financials": {
    "revenue": 1200000,
    "netIncome": 150000,
    "totalAssets": 750000,
    "equity": 400000
  },
  "affiliations": {
    "cnss": "1234567-A",
    "inpp": "INPP/KIN/12345",
    "onem": "ONEM/KIN/67890",
    "intraCoop": "Groupe Innov-RDC",
    "interCoop": "Chambre de Commerce Franco-Congolaise",
    "partners": ["Microsoft Partner Network", "Google Cloud Partner"]
  },
  "subscription": {
    "plan": { "name": "Entreprise" },
    "status": "active",
    "currentPeriodEnd": "2025-12-31"
  }
}
```

## Méthodes disponibles

### Récupérer les données d'entreprise

**Méthode** : `CompanyService.getCompany(id?: string)`
- Récupère depuis localStorage
- Initialise avec les données KIOTA TECH si aucune donnée

### Mettre à jour les données

**Méthode** : `CompanyService.updateCompany(updates: Partial<Company>)`
- Met à jour partiellement les données
- Sauvegarde automatique dans localStorage

### Uploader un logo

**Méthode** : `CompanyService.uploadLogo(file: File)`
- Simulation d'upload
- Retourne URL temporaire via createObjectURL

### Uploader le CV du propriétaire

**Méthode** : `CompanyService.uploadOwnerCV(file: File)`
- Simulation d'upload du CV
- Met à jour owner.cv avec l'URL

**Note** : Le service actuel utilise localStorage pour la persistance. Pour une API backend réelle, ces méthodes devraient être adaptées pour utiliser les endpoints HTTP correspondants.
    "netIncome": 150000,
    "totalAssets": 750000,
    "equity": 400000
  },
  "affiliations": {
    "cnss": "1234567-A",
    "inpp": "INPP/KIN/12345",
    "onem": "ONEM/KIN/67890",
    "intraCoop": "Groupe Innov-RDC",
    "interCoop": "Chambre de Commerce Franco-Congolaise",
    "partners": ["Microsoft Partner Network", "Google Cloud Partner"]
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

### Créer une entreprise

```
POST /land/api/v1/companies
```

#### Corps de la requête

```json
{
  "name": "KIOTA TECH",
  "legalForm": "SARL",
  "industry": "Technologie",
  "size": "11-50 employés",
  "address": {
    "street": "123, Avenue de la Libération",
    "commune": "Gombe",
    "city": "Kinshasa",
    "province": "Kinshasa",
    "country": "République Démocratique du Congo"
  },
  "contacts": {
    "email": "contact@kiota.tech",
    "phone": "+243 810 987 654"
  },
  "owner": {
    "name": "Jean Mutombo",
    "email": "j.mutombo@kiota.tech",
    "phone": "+243 820 123 456"
  }
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "comp-123",
    "name": "KIOTA TECH",
    "legalForm": "SARL",
    "industry": "Technologie",
    "size": "11-50 employés",
    "address": {
      "street": "123, Avenue de la Libération",
      "commune": "Gombe",
      "city": "Kinshasa",
      "province": "Kinshasa",
      "country": "République Démocratique du Congo"
    },
    "contacts": {
      "email": "contact@kiota.tech",
      "phone": "+243 810 987 654"
    },
    "owner": {
      "id": "usr_12345abcde",
      "name": "Jean Mutombo",
      "email": "j.mutombo@kiota.tech",
      "phone": "+243 820 123 456"
    },
    "createdAt": "2023-10-15T14:30:00Z",
    "updatedAt": "2023-10-15T14:30:00Z"
  }
}
```

### Récupérer une entreprise

```
GET /land/api/v1/companies/{companyId}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "comp-123",
    "name": "KIOTA TECH",
    // ... autres champs de l'entreprise
  }
}
```

### Mettre à jour une entreprise

```
PATCH /land/api/v1/companies/{companyId}
```

#### Corps de la requête

```json
{
  "description": "Leader en solutions numériques innovantes en RDC, spécialisé dans le développement logiciel.",
  "website": "https://www.kiota.tech",
  "facebookPage": "https://facebook.com/kiotatech",
  "rccm": "CD/KIN/RCCM/22-B-01234",
  "taxId": "A1234567B",
  "associates": [
    {
      "name": "Marie Lukusa",
      "gender": "female",
      "role": "Directrice financière",
      "shares": 25,
      "email": "m.lukusa@kiota.tech",
      "phone": "+243 821 234 567"
    }
  ]
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "comp-123",
    "name": "KIOTA TECH",
    "description": "Leader en solutions numériques innovantes en RDC, spécialisé dans le développement logiciel.",
    "website": "https://www.kiota.tech",
    "facebookPage": "https://facebook.com/kiotatech",
    "rccm": "CD/KIN/RCCM/22-B-01234",
    "taxId": "A1234567B",
    "associates": [
      {
        "id": "usr_abcde12345",
        "name": "Marie Lukusa",
        "gender": "female",
        "role": "Directrice financière",
        "shares": 25,
        "email": "m.lukusa@kiota.tech",
        "phone": "+243 821 234 567"
      }
    ],
    // ... autres champs de l'entreprise
    "updatedAt": "2023-11-20T09:45:00Z"
  }
}
```

### Télécharger un logo d'entreprise

```
POST /land/api/v1/companies/{companyId}/logo
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
    "logo": "https://cdn.example.com/logos/kiota-tech.png",
    "message": "Logo téléchargé avec succès"
  }
}
```

### Télécharger un CV de dirigeant

```
POST /land/api/v1/companies/{companyId}/owner/cv
Content-Type: multipart/form-data
```

#### Corps de la requête

```
cv: [FILE]
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "cv": "https://cdn.example.com/cvs/jean-mutombo.pdf",
    "message": "CV téléchargé avec succès"
  }
}
```

### Ajouter un emplacement

```
POST /land/api/v1/companies/{companyId}/locations
```

#### Corps de la requête

```json
{
  "name": "Centre de formation",
  "type": "branch",
  "address": "45, Avenue des Écoles, Limete, Kinshasa",
  "coordinates": {
    "lat": -4.337,
    "lng": 15.351
  }
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "loc-456",
    "name": "Centre de formation",
    "type": "branch",
    "address": "45, Avenue des Écoles, Limete, Kinshasa",
    "coordinates": {
      "lat": -4.337,
      "lng": 15.351
    }
  }
}
```

### Supprimer un emplacement

```
DELETE /land/api/v1/companies/{companyId}/locations/{locationId}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "message": "Emplacement supprimé avec succès"
  }
}
```

### Ajouter un associé

```
POST /land/api/v1/companies/{companyId}/associates
```

#### Corps de la requête

```json
{
  "name": "Patrick Kabongo",
  "gender": "male",
  "role": "Directeur technique",
  "shares": 15,
  "email": "p.kabongo@kiota.tech",
  "phone": "+243 822 345 678"
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "id": "usr_fghij67890",
    "name": "Patrick Kabongo",
    "gender": "male",
    "role": "Directeur technique",
    "shares": 15,
    "email": "p.kabongo@kiota.tech",
    "phone": "+243 822 345 678"
  }
}
```

### Supprimer un associé

```
DELETE /land/api/v1/companies/{companyId}/associates/{associateId}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "message": "Associé supprimé avec succès"
  }
}
```

### Lister les entreprises (pour les admins)

```
GET /land/api/v1/companies?page=1&limit=10
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": [
    {
      "id": "comp-123",
      "name": "KIOTA TECH",
      "industry": "Technologie",
      "size": "11-50 employés",
      "createdAt": "2023-10-15T14:30:00Z"
    },
    // ... autres entreprises
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
    };
  };
}
```

## 🔗 Endpoints API

### Base URL
```
http://localhost:8000/land/api/v1/companies
```

### Authentification
Tous les endpoints nécessitent un token Auth0 Bearer dans le header :
```http
Authorization: Bearer <access_token>
```

### 1. Créer une Entreprise
```http
POST /companies
Content-Type: application/json
```

**Exemple de requête** :
```json
{
  "name": "KIOTA TECH SARL",
  "description": "Startup technologique spécialisée dans les solutions FinTech",
  "legalForm": "SARL",
  "industry": "Technology",
  "website": "https://kiota-tech.com",
  "contacts": {
    "email": "contact@kiota-tech.com",
    "phone": "+243999123456"
  },
  "address": {
    "street": "Avenue Roi Baudouin 123",
    "city": "Kinshasa",
    "commune": "Gombe",
    "province": "Kinshasa",
    "country": "RDC"
  },
  "extendedIdentification": {
    "generalInfo": {
      "raisonSociale": "KIOTA TECH SARL",
      "sigle": "KIOTA TECH",
      "formeJuridiqueOHADA": "SARL",
      "typeEntreprise": "startup",
      "secteurActivitePrincipal": "fintech",
      "secteursActiviteSecondaires": ["agritech", "edtech"],
      "descriptionActivites": "Développement de solutions FinTech pour l'Afrique...",
      "produitsServices": ["Paiements mobiles", "Microfinance digitale"],
      "dateCreation": "2023-01-15",
      "dateDebutActivites": "2023-02-01",
      "numeroRCCM": "CD/KIN/RCCM/22-B-01234",
      "numeroIdentificationNationale": "01-2345-C67890D",
      "numeroImpotFiscal": "A1234567B",
      "tailleEntreprise": "11-50",
      "headquarters": {
        "address": "Avenue Roi Baudouin 123",
        "city": "Kinshasa",
        "commune": "Gombe",
        "province": "Kinshasa",
        "country": "RDC"
      },
      "mainContact": {
        "name": "Jacques Ndav",
        "position": "CEO",
        "email": "jacques@kiota-tech.com",
        "phone": "+243999123456"
      },
      "enIncubation": true,
      "typeAccompagnement": "acceleration",
      "nomIncubateurAccelerateur": "CTIC Dakar",
      "certificatAffiliation": [
        {
          "url": "https://files.kiota-tech.com/ctic-dakar-certificate.pdf",
          "name": "Certificat CTIC Dakar"
        }
      ]
    },
    "specificities": {
      "startup": {
        "stage": "growth",
        "fundraising": {
          "hasRaised": true,
          "totalRaised": 50000,
          "currency": "USD"
        }
      }
    }
  }
}
```

**Réponse** :
```json
{
  "data": {
    "id": "comp_123456",
    "name": "KIOTA TECH SARL",
    "status": "active",
    "createdAt": "2025-11-05T10:00:00Z",
    "extendedIdentification": {
      "generalInfo": { /* ... */ },
      "legalInfo": { /* ... */ },
      "patrimonyAndMeans": { /* ... */ },
      "specificities": { /* ... */ },
      "performance": { /* ... */ }
    }
  },
  "meta": {
    "timestamp": "2025-11-05T10:00:00Z"
  }
}
```

### 2. Récupérer une Entreprise
```http
GET /companies/{id}
```

**Réponse** :
```json
{
  "data": {
    "id": "comp_123456",
    "name": "KIOTA TECH SARL",
    "logo": "https://res.cloudinary.com/wanzo/logo.jpg",
    "description": "Startup technologique spécialisée dans les solutions FinTech",
    "legalForm": "SARL",
    "industry": "Technology",
    "size": "startup",
    "website": "https://kiota-tech.com",
    "rccm": "CD/KIN/RCCM/23-B-123",
    "taxId": "123456789",
    "status": "active",
    "extendedIdentification": {
      "generalInfo": {
        "companyName": "KIOTA TECH SARL",
        "tradeName": "KIOTA",
        "legalForm": "SARL",
        "companyType": "startup",
        "sector": "fintech",
        "foundingDate": "2023-01-15T00:00:00Z",
        "headquarters": {
          "address": "Avenue Roi Baudouin 123",
          "city": "Kinshasa",
          "commune": "Gombe",
          "province": "Kinshasa",
          "country": "RDC",
          "coordinates": {
            "lat": -4.3317,
            "lng": 15.3139
          }
        },
        "mainContact": {
          "name": "Jacques Ndav",
          "position": "CEO",
          "email": "jacques@kiota-tech.com",
          "phone": "+243999123456"
        },
        "digitalPresence": {
          "website": "https://kiota-tech.com",
          "linkedin": "https://linkedin.com/company/kiota-tech"
        }
      },
      "legalInfo": {
        "rccm": "CD/KIN/RCCM/23-B-123",
        "taxNumber": "123456789",
        "nationalId": "NAT123456",
        "taxCompliance": {
          "isUpToDate": true,
          "lastFilingDate": "2025-10-01T00:00:00Z",
          "nextFilingDue": "2025-12-31T00:00:00Z"
        },
        "legalStatus": {
          "hasLegalIssues": false,
          "hasGovernmentContracts": false
        }
      },
      "patrimonyAndMeans": {
        "shareCapital": {
          "authorizedCapital": 50000,
          "paidUpCapital": 50000,
          "currency": "USD",
          "shareholders": [
            {
              "name": "Jacques Ndav",
              "type": "individual",
              "sharePercentage": 60,
              "paidAmount": 30000
            }
          ]
        },
        "humanResources": {
          "totalEmployees": 8,
          "permanentEmployees": 6,
          "temporaryEmployees": 2,
          "consultants": 0,
          "keyPersonnel": [
            {
              "name": "Jacques Ndav",
              "position": "CEO",
              "experience": 8,
              "education": "Master en Informatique",
              "isShareholder": true
            }
          ]
        }
      },
      "specificities": {
        "startup": {
          "stage": "growth",
          "fundraising": {
            "hasRaised": true,
            "totalRaised": 50000,
            "currency": "USD",
            "investors": [
              {
                "name": "Angel Investor ABC",
                "type": "angel",
                "amount": 30000,
                "date": "2024-06-01T00:00:00Z"
              }
            ]
          },
          "innovation": {
            "intellectualProperty": [
              {
                "type": "trademark",
                "title": "KIOTA",
                "registrationNumber": "TM2024-001",
                "status": "registered"
              }
            ],
            "technologyStack": ["React", "Node.js", "PostgreSQL", "AWS"]
          }
        }
      },
      "performance": {
        "financial": {
          "revenue": [
            {
              "year": 2024,
              "amount": 120000,
              "currency": "USD",
              "isProjected": false
            },
            {
              "year": 2025,
              "amount": 200000,
              "currency": "USD",
              "isProjected": true
            }
          ],
          "profitability": [
            {
              "year": 2024,
              "grossProfit": 80000,
              "netProfit": 25000,
              "currency": "USD",
              "margins": {
                "gross": 66.7,
                "net": 20.8
              }
            }
          ],
          "financingNeeds": {
            "amount": 100000,
            "currency": "USD",
            "purpose": ["expansion", "technology"],
            "timeframe": "12 months",
            "hasAppliedBefore": false
          }
        },
        "operational": {
          "productivity": {
            "revenuePerEmployee": 15000,
            "utilizationRate": 85
          },
          "quality": {
            "customerSatisfaction": 8.5
          }
        },
        "market": {
          "growth": {
            "customerGrowthRate": 40,
            "marketExpansion": ["RDC", "Congo", "Cameroun"],
            "newProductsLaunched": 2
          },
          "digital": {
            "onlinePresence": {
              "website": true,
              "ecommerce": true,
              "socialMedia": ["linkedin", "facebook"]
            },
            "digitalSales": 80
          }
        }
      }
    },
    "createdAt": "2023-01-15T00:00:00Z",
    "updatedAt": "2025-11-05T10:00:00Z"
  }
}
```

### 3. Mettre à Jour une Entreprise
```http
PUT /companies/{id}
Content-Type: application/json
```

**Exemple de mise à jour partielle** :
```json
{
  "description": "Description mise à jour",
  "extendedIdentification": {
    "performance": {
      "financial": {
        "revenue": [
          {
            "year": 2025,
            "amount": 250000,
            "currency": "USD",
            "isProjected": true
          }
        ]
      }
    }
  }
}
```

### 4. Lister les Entreprises
```http
GET /companies?page=1&limit=10&search=KIOTA&sector=fintech
```

**Paramètres de requête** :
- `page` : Numéro de page (défaut: 1)
- `limit` : Éléments par page (défaut: 10, max: 100)
- `search` : Recherche par nom
- `sector` : Filtrer par secteur
- `companyType` : Filtrer par type (startup/traditional)
- `status` : Filtrer par statut
- `sort` : Tri (name:asc, createdAt:desc, etc.)

**Réponse** :
```json
{
  "data": [
    {
      "id": "comp_123456",
      "name": "KIOTA TECH SARL",
      "description": "Startup technologique...",
      "industry": "Technology",
      "sector": "fintech",
      "companyType": "startup",
      "status": "active",
      "createdAt": "2023-01-15T00:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### 5. Supprimer une Entreprise
```http
DELETE /companies/{id}
```

**Réponse** :
```json
{
  "data": {
    "id": "comp_123456",
    "deleted": true
  },
  "meta": {
    "timestamp": "2025-11-05T10:00:00Z"
  }
}
```

### 🏭 Endpoints Patrimoine v2.1 (Nouveaux)

#### Récupérer le Patrimoine Complet

```http
GET /land/api/v1/companies/{id}/patrimoine
```

**Description** : Récupère le patrimoine complet d'une entreprise (actifs et stocks).

**Réponse** :
```json
{
  "data": {
    "assets": [
      {
        "id": "asset-001",
        "designation": "Bureau principal",
        "type": "immobilier",
        "prixAchat": 50000,
        "valeurActuelle": 45000,
        "devise": "USD",
        "dateAcquisition": "2023-01-15",
        "etatActuel": "bon"
      }
    ],
    "stocks": [
      {
        "id": "stock-001", 
        "designation": "Matériel informatique",
        "categorie": "equipement",
        "quantiteStock": 50,
        "unite": "pièces",
        "coutUnitaire": 500,
        "valeurTotaleStock": 25000
      }
    ],
    "valorisation": {
      "totalActifs": 45000,
      "totalStocks": 25000,
      "patrimoineTotal": 70000
    }
  }
}
```

#### Ajouter un Actif

```http
POST /land/api/v1/companies/{id}/patrimoine/assets
Content-Type: application/json
```

**Corps de la requête** :
```json
{
  "designation": "Véhicule de service",
  "type": "vehicule",
  "description": "Toyota Hilux 2023",
  "prixAchat": 35000,
  "valeurActuelle": 35000,
  "devise": "USD",
  "dateAcquisition": "2023-11-01",
  "etatActuel": "neuf",
  "marque": "Toyota",
  "modele": "Hilux",
  "proprietaire": "propre"
}
```

#### Modifier un Actif

```http
PUT /land/api/v1/companies/{id}/patrimoine/assets/{assetId}
Content-Type: application/json
```

#### Supprimer un Actif

```http
DELETE /land/api/v1/companies/{id}/patrimoine/assets/{assetId}
```

#### Ajouter un Stock

```http
POST /land/api/v1/companies/{id}/patrimoine/stocks
Content-Type: application/json
```

**Corps de la requête** :
```json
{
  "designation": "Ordinateurs portables",
  "categorie": "equipement",
  "quantiteStock": 20,
  "unite": "pièces",
  "seuilMinimum": 5,
  "coutUnitaire": 800,
  "devise": "USD",
  "emplacement": "Bureau principal",
  "etatStock": "excellent",
  "fournisseurPrincipal": "Dell Congo"
}
```

#### Modifier un Stock

```http
PUT /land/api/v1/companies/{id}/patrimoine/stocks/{stockId}
Content-Type: application/json
```

#### Supprimer un Stock

```http
DELETE /land/api/v1/companies/{id}/patrimoine/stocks/{stockId}
```

#### Calculer la Valorisation

```http
GET /land/api/v1/companies/{id}/patrimoine/valorisation
```

**Réponse** :
```json
{
  "data": {
    "totalActifsImmobilises": 80000,
    "totalActifsCirculants": 45000,
    "depreciationTotale": 5000,
    "valeurNetteComptable": 120000,
    "derniereMiseAJour": "2025-11-10T14:30:00Z"
  }
}
```

### 🧪 Endpoint de Test (Développement)

```http
POST /land/api/v1/companies/test
Content-Type: application/json
```

**Description** : Endpoint de test sans authentification pour valider la connectivité.

**Corps de la requête** :
```json
{
  "message": "Test connection"
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Company endpoint is working!",
  "data": {
    "message": "Test connection"
  },
  "timestamp": "2025-11-10T14:30:00Z"
}
```

## ⚙️ Logique Métier Moderne

### Processus de Création Étendu

1. **Création Basique** : Informations générales obligatoires
2. **Identification Étendue** : Formulaire complet progressif
3. **Validation en Temps Réel** : Vérification des données légales
4. **Association Utilisateur** : Liaison automatique avec le créateur

### Gestion des Formulaires Progressifs

Le système supporte un remplissage progressif du formulaire d'identification :

```typescript
// Étapes du formulaire
enum FormStep {
  GENERAL_INFO = 'general',
  LEGAL_INFO = 'legal', 
  PATRIMONY = 'patrimony',
  SPECIFICITIES = 'specificities',
  PERFORMANCE = 'performance'
}

// État de complétude
interface CompletionStatus {
  generalInfo: boolean;
  legalInfo: boolean;
  patrimonyAndMeans: boolean;
  specificities: boolean;
  performance: boolean;
  overallCompletion: number; // %
}
```

### Validation et Conformité

#### Validation des Données Légales
- **RCCM** : Format CD/[PROVINCE]/RCCM/[ANNÉE]-[TYPE]-[NUMÉRO]
- **Numéro Fiscal** : Validation selon standards RDC
- **Capital Social** : Cohérence entre autorisé et libéré

#### Compliance Automatique
- Vérification dates d'expiration licences
- Alertes conformité fiscale
- Validation cohérence données financières

### Upload et Gestion de Fichiers

```typescript
// Types de fichiers supportés
interface FileUpload {
  type: 'logo' | 'license' | 'certificate' | 'financial_statement';
  url: string;
  cloudinaryId: string;
  uploadedAt: Date;
  size: number;
  mimeType: string;
}
```

### Calculs Automatiques

Le système calcule automatiquement :
- **Ratios Financiers** : Marges, ROI, ROE
- **Score de Complétude** : Pourcentage de remplissage
- **Indicateurs de Performance** : KPI sectoriels
- **Score de Risque** : Analyse de crédit basique

### Intégrations Externes

#### Services Tiers
- **Géolocalisation** : Google Maps API pour coordonnées
- **Vérification Légale** : API OHADA pour validation RCCM
- **Données Sectorielles** : Sources externes pour benchmarking

#### Notifications et Alertes
- **Échéances Légales** : Rappels renouvellement licences
- **Mise à Jour Données** : Suggestions de mise à jour périodique
- **Opportunités** : Alertes financement/partenariats

## ⚡ Workflows Inter-Services (Kafka)

### Événements Entreprise Publiés

Le service customer publie automatiquement des événements Kafka lors des actions sur les entreprises :

#### Événements CRUD de Base
```typescript
// company.created
{
  topic: 'wanzo.customer.sme.created',
  data: {
    customerId: string;
    smeId: string;
    type: 'SME';
    name: string;
    email: string;
    registrationNumber?: string;
    createdAt: string;
  }
}

// company.updated
{
  topic: 'wanzo.customer.sme.updated', 
  data: {
    customerId: string;
    smeId: string;
    updatedAt: string;
    changedFields: string[];
  }
}

// company.deleted
{
  topic: 'wanzo.customer.sme.deleted',
  data: {
    customerId: string;
    smeId: string;
    deletedAt: string;
  }
}
```

#### Événements de Validation
```typescript
// company.validated
{
  topic: 'wanzo.customer.sme.validated',
  data: {
    customerId: string;
    smeId: string;
    previousStatus: 'pending';
    newStatus: 'active';
    validatedAt: string;
    validatedBy: string;
  }
}

// company.suspended
{
  topic: 'wanzo.customer.sme.suspended',
  data: {
    customerId: string;
    smeId: string;
    previousStatus: 'active';
    newStatus: 'suspended';
    suspendedAt: string;
    suspendedBy: string;
    reason: string;
  }
}
```

#### Partage de Profil avec Admin-Service
```typescript
// admin.customer.company.profile.shared
{
  topic: 'admin.customer.company.profile.shared',
  data: {
    customerId: string;
    customerType: 'COMPANY';
    name: string;
    email: string;
    logo?: string;
    companyProfile: {
      legalForm: string;
      industry: string;
      rccm?: string;
      taxId?: string;
      activities: string[];
      // ... autres données entreprise
    };
    extendedProfile?: {
      generalInfo: object;
      legalInfo: object;
      patrimonyAndMeans: object;
      // ... formulaire étendu
    };
    patrimoine: {
      assets: object[];
      stocks: object[];
      totalAssetsValue: number;
    };
    profileCompleteness: {
      percentage: number;
      missingFields: string[];
      completedSections: string[];
    };
    lastProfileUpdate: string;
  }
}
```

### Communication avec Autres Services

Les événements entreprise sont consommés par :
- **Admin Service** : Gestion et monitoring des profils
- **Analytics Service** : Analyses sectorielles et benchmarking
- **Accounting Service** : Facturation et comptabilité
- **Portfolio Institution Service** : Évaluation de crédit

## 🔒 Sécurité et Permissions

### Contrôle d'Accès
- **Propriétaire** : Accès complet aux données
- **Employés** : Accès lecture selon rôle
- **Partenaires** : Accès limité données publiques
- **Administrateurs** : Accès global avec audit trail

### Protection des Données
- **Données Sensibles** : Chiffrement finances et données personnelles
- **Audit Trail** : Traçabilité modifications importantes
- **Backup** : Sauvegarde automatique données critiques
- **RGPD Compliance** : Respect protection données personnelles

## 📊 Métriques et Analytics

### Tableaux de Bord
- **Complétude Profil** : Progression remplissage
- **Performance** : KPI en temps réel
- **Comparaison** : Benchmarking sectoriel
- **Évolution** : Tendances historiques

### Rapports Automatiques
- **Rapport Financier** : Synthèse performance
- **Due Diligence** : Dossier investisseur
- **Compliance** : État conformité réglementaire
- **Export** : PDF/Excel pour partenaires

## 🔄 Changelog Version 2.1

### Nouvelles Fonctionnalités

#### Secteurs d'Activité
- ✅ **Secteur principal** : Champ obligatoire distinct
- ✅ **Secteurs secondaires** : Interface tags avec suggestions
- ✅ **Secteurs personnalisés** : Ajout libre de nouveaux secteurs
- ✅ **Compatibilité** : Maintien de l'interface `activities` existante

#### Gestion du Patrimoine
- ✅ **Actifs détaillés** : Prix d'achat vs valeur actuelle
- ✅ **États étendus** : 6 niveaux d'état (Neuf → Détérioré)
- ✅ **Actifs circulants** : Composant spécialisé pour les stocks
- ✅ **Traçabilité** : Date d'acquisition, marque, modèle, localisation

#### Stocks et Inventaires
- ✅ **Catégorisation** : 6 types (Matière première → Emballage)
- ✅ **Valorisation** : Coût unitaire × Quantité automatique
- ✅ **Rotation** : Durée de rotation, seuils d'alerte
- ✅ **Gestion** : Fournisseur, lot, code article, emplacement

### Améliorations UX/UI
- ✅ **Interface intuitive** : Formulaires par étapes
- ✅ **Validation temps réel** : Contrôles immédiats
- ✅ **Auto-calculs** : Valeurs totales automatiques
- ✅ **Suggestions** : Aide contextuelle

### Compatibilité
- ✅ **Backward compatible** : Anciens champs maintenus
- ✅ **Migration transparente** : Conversion automatique
- ✅ **Types étendus** : Interfaces enrichies sans breaking changes

### API Changes
- ✅ **Nouveaux endpoints** : Support des nouvelles structures
- ✅ **Validation Zod** : Schémas mis à jour
- ✅ **Sérialisation/Désérialisation** : Conversion automatique entre formats
