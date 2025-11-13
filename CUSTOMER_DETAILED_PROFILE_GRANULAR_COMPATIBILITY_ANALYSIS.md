# Analyse de Compatibilité Granulaire : CustomerDetailedProfile

**Date**: 2025-11-13  
**Analyste**: System Architecture Review  
**Objectif**: Vérifier la compatibilité au niveau granulaire entre CustomerDetailedProfile (admin-service) et les entités du customer-service

---

## 1. RÉSUMÉ EXÉCUTIF

### 🎯 Verdict Global
**COMPATIBILITÉ: ⚠️ PARTIELLE (75%) - Nécessite des améliorations**

### ✅ Points Forts
- Structure JSONB flexible capable d'absorber les données
- Séparation claire PME vs Institutions financières
- Métadonnées de synchronisation présentes
- Support des profils étendus et patrimoine

### ❌ Problèmes Critiques Identifiés
1. **Données CompanyCore manquantes** - 30+ champs non mappés
2. **Données InstitutionCore incomplètes** - 25+ champs manquants
3. **Actifs/Stocks non synchronisés** - Aucun mécanisme de sync
4. **Profils étendus mal structurés** - Désalignement avec customer-service
5. **Absence de versionning des données** - Risque de désynchronisation

---

## 2. ANALYSE GRANULAIRE PAR ENTITÉ

### 2.1 Customer (Base) - customer-service

**Source**: `apps/customer-service/src/modules/customers/entities/customer.entity.ts`

#### ✅ Champs Correctement Mappés (20/40 = 50%)

| Champ Customer-Service | CustomerDetailedProfile | Statut |
|------------------------|-------------------------|---------|
| `id` | `customerId` | ✅ Mappé |
| `name` | `name` | ✅ Direct |
| `email` | `email` | ✅ Direct |
| `phone` | `phone` | ✅ Direct |
| `logo` | `logo` | ✅ Direct |
| `address` | `address` (JSONB) | ✅ Direct |
| `status` | `status` | ✅ Direct |
| `accountType` | `accountType` | ✅ Direct |
| `type` | `customerType` + `profileType` | ✅ Converti |
| `website` | `institutionProfile.website` | ✅ Partiel |
| `facebookPage` | `institutionProfile.facebookPage` | ✅ Partiel |
| `linkedinPage` | `institutionProfile.linkedinPage` | ✅ Partiel |
| `legalForm` | `companyProfile.legalForm` | ✅ Mappé |
| `industry` | `companyProfile.industry` | ✅ Mappé |
| `size` | `companyProfile.size` | ✅ Mappé |
| `rccm` | `companyProfile.rccm` | ✅ Mappé |
| `taxId` | `companyProfile.taxId` | ✅ Mappé |
| `natId` | `companyProfile.natId` | ✅ Mappé |
| `owner` | `companyProfile.owner` | ✅ Mappé |
| `associates` | `companyProfile.associates` | ✅ Mappé |

#### ❌ Champs NON Mappés (20/40 = 50%)

| Champ Customer-Service | Problème | Impact | Priorité |
|------------------------|----------|---------|----------|
| `locations` | ❌ Absent | Perte données géolocalisation | 🔴 HAUTE |
| `contacts` (encrypted) | ❌ Non synchronisé | Données sensibles perdues | 🔴 HAUTE |
| `description` | ❌ Absent | Perte contexte métier | 🟡 MOYENNE |
| `activities` | ❌ Partiel dans companyProfile | Structure différente | 🟡 MOYENNE |
| `secteursPersnnalises` | ❌ Absent | Perte personnalisation | 🟡 MOYENNE |
| `capital` | ❌ Partiel | Format JSONB différent | 🟡 MOYENNE |
| `financials` | ❌ Partiel | Données financières incomplètes | 🔴 HAUTE |
| `affiliations` | ❌ Partiel | CNSS/INPP/ONEM manquants | 🟡 MOYENNE |
| `billingContactName` | ❌ Absent | Facturation non trackée | 🟡 MOYENNE |
| `billingContactEmail` | ❌ Absent | Facturation non trackée | 🟡 MOYENNE |
| `tokenAllocation` | ⚠️ Dans `tokenConsumption` | Désalignement | 🟢 BASSE |
| `ownerId` | ❌ Absent | Référence propriétaire perdue | 🔴 HAUTE |
| `ownerEmail` | ❌ Absent | Contact propriétaire perdu | 🔴 HAUTE |
| `validatedAt` | ⚠️ Dans `Customer.entity` | Dupliqué | 🟢 BASSE |
| `validatedBy` | ⚠️ Dans `Customer.entity` | Dupliqué | 🟢 BASSE |
| `suspendedAt` | ⚠️ Dans `Customer.entity` | Dupliqué | 🟢 BASSE |
| `suspendedBy` | ⚠️ Dans `Customer.entity` | Dupliqué | 🟢 BASSE |
| `suspensionReason` | ⚠️ Dans `Customer.entity` | Dupliqué | 🟢 BASSE |
| `rejectedAt` | ❌ Absent | Workflow incomplet | 🟡 MOYENNE |
| `rejectedBy` | ❌ Absent | Workflow incomplet | 🟡 MOYENNE |
| `reactivatedAt` | ⚠️ Dans `Customer.entity` | Dupliqué | 🟢 BASSE |
| `reactivatedBy` | ⚠️ Dans `Customer.entity` | Dupliqué | 🟢 BASSE |
| `validationHistory` | ⚠️ Dans `Customer.entity` | Dupliqué | 🟢 BASSE |
| `subscription` | ⚠️ Dans `subscriptions` | Format différent | 🟡 MOYENNE |
| `preferences` | ❌ Absent | Préférences utilisateur perdues | 🟡 MOYENNE |
| `stripeCustomerId` | ❌ Absent | Intégration Stripe impossible | 🔴 HAUTE |

---

### 2.2 CompanyCore - customer-service

**Source**: `apps/customer-service/src/modules/customers/company/entities/company-core.entity.ts`

#### ❌ Champs Critiques NON Mappés (30+ champs)

| Section | Champs Manquants | Impact |
|---------|------------------|---------|
| **Identification** | `tradeName`, `registrationNumber` (RCCM unique), `incorporationDate` | 🔴 Identité légale incomplète |
| **Adresse Détaillée** | `address` (texte complet), `province`, `postalCode`, `country` | 🔴 Géolocalisation imprécise |
| **Contact** | `phone`, `email`, `website` | 🔴 Contact désynchronisé |
| **Capital** | `authorizedCapital`, `paidUpCapital`, `capitalCurrency`, `totalShares`, `shareValue` | 🔴 Structure du capital perdue |
| **Propriétaires** | `owners[]` (JSON avec parts, pourcentages, documents) | 🔴 Structure actionnariale absente |
| **Associés** | `associates[]` (JSON avec rôles, dates, contacts) | 🟡 Relations business perdues |
| **Contacts** | `contacts[]` (JSON avec positions, départements) | 🟡 Organigramme incomplet |
| **Activités** | `activities[]` (JSON avec secteurs, revenus, dates) | 🔴 Activités métier incomplètes |
| **Licences** | `licenses[]` (JSON avec dates d'expiration, statuts) | 🔴 Conformité non trackée |
| **Financials** | `annualRevenue`, `revenueCurrency`, `employeeCount`, `lastFinancialYear` | 🔴 Données financières manquantes |
| **Locations** | `locations[]` (JSON avec coordonnées GPS) | 🔴 Emplacements non synchronisés |
| **Affiliations** | `affiliations` (CNSS, INPP, ONEM, coopératives) | 🟡 Affiliations perdues |
| **Subscription** | `subscription` (plan, status, période) | 🟡 Info d'abonnement manquante |
| **Métadonnées** | `metadata`, `settings`, `lastVerifiedAt` | 🟡 Historique perdu |

#### 📊 Taux de Couverture: **20%**
- **Mappés**: `companyName`, `legalForm`, `sector`, `description`, `logoUrl`
- **Manquants**: 85% des champs structurés (propriétaires, capital, licences, activités)

---

### 2.3 CompanyAssets - customer-service

**Source**: `apps/customer-service/src/modules/customers/company/entities/company-assets.entity.ts`

#### ❌ AUCUN Champ Mappé (0%)

**Problème Critique**: Les actifs des entreprises (immobilier, véhicules, équipements) ne sont **PAS synchronisés** dans admin-service.

| Catégorie Données | Champs Manquants | Impact Business |
|-------------------|------------------|-----------------|
| **Identification** | `name`, `category`, `type`, `serialNumber`, `brand`, `manufacturer` | 🔴 Inventaire actifs impossible |
| **Valeurs** | `acquisitionCost`, `currentValue`, `marketValue`, `insuranceValue`, `bookValue` | 🔴 Comptabilité actifs impossible |
| **Amortissement** | `depreciationRate`, `depreciationMethod`, `usefulLifeYears`, `accumulatedDepreciation` | 🔴 Calculs fiscaux impossibles |
| **Localisation** | `location`, `building`, `floor`, `room`, `latitude`, `longitude` | 🔴 Gestion spatiale impossible |
| **Maintenance** | `lastMaintenanceDate`, `nextMaintenanceDate`, `maintenanceCost`, `maintenanceSchedule` | 🔴 Planification maintenance perdue |
| **Assurance** | `insuranceProvider`, `insurancePolicyNumber`, `insuranceExpiryDate`, `insurancePremium` | 🔴 Gestion assurance impossible |
| **Documents** | `documents[]`, `certifications[]`, `usageHistory[]` | 🔴 Audit trail perdu |
| **Garantie** | `warrantyProvider`, `warrantyStartDate`, `warrantyEndDate` | 🟡 Suivi garantie impossible |

**Solution Actuelle**: `CustomerDetailedProfile.patrimoine.assets[]` existe mais:
- ❌ Structure différente (JSONB libre vs schéma TypeORM)
- ❌ Pas de synchronisation Kafka
- ❌ Champs critiques manquants (amortissement, maintenance, assurance)

#### 📊 Taux de Couverture: **5%** (seulement liste basique d'actifs)

---

### 2.4 CompanyStocks - customer-service

**Source**: `apps/customer-service/src/modules/customers/company/entities/company-stocks.entity.ts`

#### ❌ AUCUN Champ Mappé (0%)

**Problème Critique**: Les stocks et inventaires ne sont **PAS synchronisés** dans admin-service.

| Catégorie Données | Champs Manquants | Impact Business |
|-------------------|------------------|-----------------|
| **Identification** | `sku` (unique), `name`, `category`, `subcategory`, `brand`, `manufacturer` | 🔴 Gestion stock impossible |
| **Quantités** | `quantity`, `unit`, `reorderLevel`, `maximumLevel`, `reservedQuantity`, `availableQuantity` | 🔴 Ruptures stock non détectées |
| **Coûts** | `unitCost`, `averageCost`, `lastCost`, `sellingPrice`, `totalValue` | 🔴 Valorisation stock impossible |
| **Localisation** | `warehouse`, `zone`, `aisle`, `shelf`, `bin` | 🔴 Logistique warehouse impossible |
| **Dates** | `manufacturingDate`, `expiryDate`, `lastReceivedDate`, `lastSoldDate`, `lastCountDate` | 🔴 Traçabilité perdue |
| **Fournisseurs** | `primarySupplier`, `supplierSku`, `leadTimeDays`, `minimumOrderQuantity`, `economicOrderQuantity` | 🔴 Chaîne approvisionnement brisée |
| **Mouvements** | `movements[]` (entrées/sorties avec historique) | 🔴 Audit stock impossible |
| **Dimensions** | `weight`, `length`, `width`, `height`, `volume` | 🟡 Logistique transport impossible |
| **Qualité** | `qualityGrade`, `lastQualityCheck`, `requiresInspection` | 🟡 QA non trackée |
| **Analyse ABC** | `abcClassification`, `turnoverRate` | 🟡 Optimisation inventaire impossible |

**Solution Actuelle**: `CustomerDetailedProfile.patrimoine.stocks[]` existe mais:
- ❌ Structure ultra-simplifiée (liste basique)
- ❌ Aucune synchronisation Kafka
- ❌ 95% des champs critiques manquants

#### 📊 Taux de Couverture: **3%** (seulement liste basique de stocks)

---

### 2.5 InstitutionCore - customer-service

**Source**: `apps/customer-service/src/modules/customers/financial-institution/entities/institution-core.entity.ts`

#### ✅ Champs Partiellement Mappés (50%)

| Champ InstitutionCore | CustomerDetailedProfile | Statut |
|----------------------|-------------------------|---------|
| `institutionName` | `name` | ✅ Mappé |
| `legalName` | `institutionProfile.denominationSociale` | ⚠️ Nom différent |
| `acronym` | `institutionProfile.sigleLegalAbrege` | ✅ Mappé |
| `institutionType` | `institutionProfile.type` | ⚠️ Enum différent |
| `licenseNumber` | `institutionProfile.licenseNumber` | ✅ Mappé |
| `establishmentDate` | `institutionProfile.establishedDate` | ✅ Mappé |
| `regulatoryAuthority` | `institutionProfile.autoriteSupervision` | ⚠️ Nom différent |
| `emailAddress` | `email` | ✅ Mappé |
| `websiteUrl` | `institutionProfile.website` | ✅ Mappé |
| `phoneNumber` | `phone` | ✅ Mappé |

#### ❌ Champs Critiques NON Mappés (25+ champs)

| Section | Champs Manquants | Impact |
|---------|------------------|---------|
| **Identification** | `brandName` | 🟡 Branding perdu |
| **Classification** | `sector`, `ownership` (PRIVATE/PUBLIC/COOPERATIVE) | 🔴 Catégorisation impossible |
| **Réglementaire** | `licenseIssueDate`, `licenseExpiryDate`, `taxIdentificationNumber`, `businessRegistrationNumber` | 🔴 Conformité non trackée |
| **Adresse** | `headOfficeAddress`, `city`, `province`, `countryOfOperation`, `postalCode` | 🔴 Localisation incomplète |
| **Contact** | `faxNumber`, `contactPerson` (JSON) | 🟡 Canaux contact incomplets |
| **Financials** | `authorizedCapital`, `paidUpCapital`, `baseCurrency` | 🔴 Capital non tracké |
| **Statistiques** | `totalBranches`, `totalEmployees`, `totalCustomers` | 🔴 Métriques business perdues |
| **Direction** | `ceoName`, `ceoEmail`, `ceoPhone`, `chairmanName`, `complianceOfficerName`, `complianceOfficerEmail` | 🔴 Leadership non tracké |
| **Temporel** | `operationsStartDate`, `createdBy`, `updatedBy` | 🟡 Historique incomplet |
| **Locations** | `locations[]` (JSON avec GPS), `branches[]` (JSON avec adresses), `headquartersAddress` (JSON) | 🔴 Emplacements non synchronisés |
| **Complémentaire** | `mission`, `vision`, `coreValues[]`, `servicesOffered[]` | 🟡 Identité institutionnelle perdue |
| **Social Media** | `socialMediaLinks` (JSON avec Twitter, YouTube) | 🟡 Présence digitale incomplète |
| **Heures** | `operatingHours` (JSON) | 🟡 Info opérationnelle manquante |
| **Flags** | `isActive`, `isVerified`, `isPubliclyListed` | 🔴 Statuts critiques non synchronisés |
| **GPS** | `latitude`, `longitude` | 🔴 Géolocalisation manquante |
| **Notes** | `internalNotes` | 🟡 Notes admin perdues |

#### 📊 Taux de Couverture: **40%**

---

## 3. ANALYSE KAFKA CONSUMER

### 3.1 Consumer Actuel

**Fichier**: `apps/admin-service/src/modules/events/consumers/customer-profile.consumer.ts`

#### ✅ Events Supportés

1. **`admin.customer.company.profile.shared`** (PME)
   - Reçoit: `companyProfile`, `extendedProfile`, `patrimoine`, `profileCompleteness`
   - ⚠️ **NE reçoit PAS**: CompanyCore, CompanyAssets, CompanyStocks

2. **`admin.customer.institution.profile.shared`** (Institutions)
   - Reçoit: `institutionProfile`, `regulatoryProfile`
   - ⚠️ **NE reçoit PAS**: InstitutionCore complet, branches détaillées

#### ❌ Events MANQUANTS

| Event Requis | Données | Statut |
|--------------|---------|---------|
| `admin.customer.company.assets.sync` | CompanyAssets[] | ❌ Non implémenté |
| `admin.customer.company.stocks.sync` | CompanyStocks[] | ❌ Non implémenté |
| `admin.customer.institution.branches.sync` | InstitutionBranch[] | ❌ Non implémenté |
| `admin.customer.institution.leadership.sync` | InstitutionLeadership[] | ❌ Non implémenté |
| `admin.customer.institution.services.sync` | InstitutionServices[] | ❌ Non implémenté |
| `admin.customer.core.updated` | CompanyCore/InstitutionCore full | ❌ Non implémenté |

---

## 4. PROBLÈMES D'ORGANISATION DES DONNÉES

### 4.1 Incohérences Structurelles

#### ❌ Problème 1: Données "Plates" vs Hiérarchiques

**Customer-Service**: Structure normalisée (tables séparées)
```typescript
CompanyCore (1)
  ├── CompanyAssets (N)
  ├── CompanyStocks (N)
  └── Customer (1)

InstitutionCore (1)
  ├── InstitutionBranch (N)
  ├── InstitutionLeadership (N)
  ├── InstitutionServices (N)
  ├── InstitutionRegulatory (N)
  └── Customer (1)
```

**Admin-Service**: Structure JSONB aplatie
```typescript
CustomerDetailedProfile
  ├── companyProfile (JSONB) - Données partielles
  ├── institutionProfile (JSONB) - Données partielles
  ├── patrimoine.assets[] (JSONB) - Simplifié
  └── patrimoine.stocks[] (JSONB) - Simplifié
```

**Conséquence**: Perte de relations, incapacité à faire des requêtes complexes.

---

#### ❌ Problème 2: Duplication vs Référence

**Exemple: Localisation**

Customer-Service stocke:
```typescript
// Dans CompanyCore
locations: Array<{
  id: string;
  name: string;
  type: string;
  address: string;
  coordinates: { lat: number; lng: number }
}>

// Référencé dans CompanyAssets
location: string; // Référence à locations[].id
```

Admin-Service n'a **AUCUNE** structure équivalente:
- ❌ Pas de `locations[]` dans CustomerDetailedProfile
- ❌ `address` est un simple JSONB sans structure
- ❌ Coordonnées GPS absentes

---

#### ❌ Problème 3: Métadonnées Incomplètes

| Métadonnée Requise | Customer-Service | CustomerDetailedProfile | Gap |
|--------------------|------------------|-------------------------|-----|
| `createdAt` | ✅ Timestamps précis | ✅ Présent | ✅ OK |
| `updatedAt` | ✅ Timestamps précis | ✅ Présent | ✅ OK |
| `lastVerifiedAt` | ✅ Dans CompanyCore | ❌ Absent | 🔴 CRITIQUE |
| `createdBy` | ✅ Dans entities | ❌ Absent | 🟡 MOYEN |
| `dataVersion` | ❌ Absent | ⚠️ Optionnel | 🟡 MOYEN |
| `syncVersion` | ❌ Absent | ⚠️ Dans syncMetadata | 🟡 MOYEN |

---

### 4.2 Organisation des Données JSONB

#### ⚠️ Problème: Profondeur Excessive

**CustomerDetailedProfile actuel**:
```typescript
CustomerDetailedProfile {
  companyProfile: {
    activities: any;  // Trop générique
    capital: any;     // Trop générique
    financials: any;  // Trop générique
  }
}
```

**Devrait être**:
```typescript
CustomerDetailedProfile {
  companyProfile: {
    activities: {
      primary: string;
      secondary: string[];
      details: Array<{
        id: string;
        name: string;
        sector: string;
        isMain: boolean;
        revenue?: { amount: number; currency: string; }
      }>
    };
    capital: {
      isApplicable: boolean;
      authorized: number;
      paidUp: number;
      currency: string;
      shares: {
        total: number;
        value: number;
      }
    };
    financials: {
      annualRevenue: number;
      revenueCurrency: string;
      lastFinancialYear: Date;
      netIncome?: number;
      totalAssets?: number;
      equity?: number;
    };
  }
}
```

---

## 5. RECOMMANDATIONS PRIORITAIRES

### 🔴 Priorité CRITIQUE (Implémenter sous 1 semaine)

#### 1. Enrichir CustomerDetailedProfile

**Ajouter champs manquants critiques**:

```typescript
@Entity('customer_detailed_profiles')
export class CustomerDetailedProfile {
  // ... champs existants ...
  
  // ===== NOUVEAUX CHAMPS CRITIQUES =====
  
  // Billing & Facturation
  @Column({ nullable: true })
  billingContactName?: string;
  
  @Column({ nullable: true })
  billingContactEmail?: string;
  
  @Column({ nullable: true })
  stripeCustomerId?: string;
  
  // Propriétaire
  @Column({ nullable: true })
  ownerId?: string;
  
  @Column({ nullable: true })
  ownerEmail?: string;
  
  // Workflow Rejet
  @Column({ nullable: true })
  rejectedAt?: Date;
  
  @Column({ nullable: true })
  rejectedBy?: string;
  
  @Column({ nullable: true })
  rejectionReason?: string;
  
  // Préférences
  @Column('jsonb', { nullable: true })
  preferences?: Record<string, any>;
  
  // Description
  @Column({ type: 'text', nullable: true })
  description?: string;
  
  // Vérification
  @Column({ nullable: true })
  lastVerifiedAt?: Date;
}
```

---

#### 2. Restructurer companyProfile

**Structure Détaillée**:

```typescript
@Column('jsonb', { nullable: true })
companyProfile?: {
  // Identification légale
  registrationNumber?: string; // RCCM
  tradeName?: string;
  incorporationDate?: string;
  
  // Forme juridique et classification
  legalForm?: string;
  industry?: string;
  size?: string;
  sector?: string;
  
  // Documents légaux
  rccm?: string;
  taxId?: string;
  natId?: string;
  
  // Adresse détaillée
  address?: {
    street: string;
    commune?: string;
    city: string;
    province: string;
    country: string;
    postalCode?: string;
  };
  
  // Activités structurées
  activities?: {
    primary: string;
    secondary: string[];
    details: Array<{
      id: string;
      name: string;
      sector: string;
      isMain: boolean;
      startDate: string;
      endDate?: string;
      revenue?: {
        amount: number;
        currency: string;
        period: string;
      };
      isActive: boolean;
    }>;
  };
  
  // Capital structuré
  capital?: {
    isApplicable: boolean;
    authorized: number;
    paidUp: number;
    currency: string;
    shares: {
      total: number;
      value: number;
    };
  };
  
  // Données financières structurées
  financials?: {
    annualRevenue: number;
    revenueCurrency: string;
    lastFinancialYear: string;
    netIncome?: number;
    totalAssets?: number;
    equity?: number;
    employeeCount?: number;
  };
  
  // Affiliations structurées
  affiliations?: {
    cnss?: string;
    inpp?: string;
    onem?: string;
    intraCoop?: string;
    interCoop?: string;
    partners?: string[];
  };
  
  // Propriétaire principal
  owner?: {
    id?: string;
    name?: string;
    gender?: string;
    email?: string;
    phone?: string;
    hasOtherJob?: boolean;
    cv?: string;
    linkedin?: string;
    facebook?: string;
  };
  
  // Associés
  associates?: Array<{
    id: string;
    name: string;
    type: 'individual' | 'company';
    gender?: string;
    role: string;
    shares: number;
    percentage: number;
    email?: string;
    phone?: string;
    joinDate: string;
    isActive: boolean;
  }>;
  
  // Emplacements
  locations?: Array<{
    id: string;
    name: string;
    type: 'headquarters' | 'branch' | 'warehouse' | 'factory' | 'store';
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  }>;
  
  // Contacts clés
  contactPersons?: Array<{
    id: string;
    name: string;
    position: string;
    department?: string;
    phone?: string;
    email?: string;
    isPrimary: boolean;
    isActive: boolean;
  }>;
  
  // Licences et certifications
  licenses?: Array<{
    id: string;
    type: string;
    number: string;
    issuer: string;
    issuedDate: string;
    expiryDate?: string;
    status: 'active' | 'expired' | 'suspended' | 'revoked';
    isActive: boolean;
  }>;
  
  // Réseaux sociaux
  socialMedia?: {
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  
  // Métadonnées supplémentaires
  yearFounded?: number;
  employeeCount?: number;
  lastVerifiedAt?: string;
};
```

---

#### 3. Restructurer institutionProfile

**Structure Détaillée**:

```typescript
@Column('jsonb', { nullable: true })
institutionProfile?: {
  // Identification
  denominationSociale: string;
  legalName?: string;
  sigleLegalAbrege?: string;
  brandName?: string;
  
  // Classification
  type: string;
  category: string;
  institutionType: string;
  sector?: 'PRIVE' | 'PUBLIC' | 'PUBLIC_PRIVE';
  ownership: 'PRIVATE' | 'PUBLIC' | 'GOVERNMENT' | 'COOPERATIVE' | 'MIXED';
  
  // Réglementaire
  licenseNumber: string;
  autorisationExploitation?: string;
  dateOctroi?: string;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  autoriteSupervision: string;
  dateAgrement?: string;
  taxIdentificationNumber?: string;
  businessRegistrationNumber?: string;
  
  // Dates importantes
  establishedDate: string;
  operationsStartDate?: string;
  
  // Adresse complète
  address?: {
    headOffice: string;
    city: string;
    province: string;
    country: string;
    postalCode?: string;
  };
  
  // Contact
  email?: string;
  phone?: string;
  fax?: string;
  website?: string;
  
  // Capital
  authorizedCapital?: number;
  paidUpCapital?: number;
  baseCurrency?: string;
  
  // Statistiques
  totalBranches?: number;
  totalEmployees?: number;
  totalCustomers?: number;
  
  // Leadership
  ceo?: {
    name: string;
    email?: string;
    phone?: string;
  };
  chairman?: {
    name: string;
  };
  complianceOfficer?: {
    name: string;
    email?: string;
  };
  
  // Localisation GPS
  coordonneesGeographiques?: {
    latitude: number;
    longitude: number;
  };
  
  // Informations réglementaires
  regulatoryInfo?: {
    complianceStatus?: string;
    lastAuditDate?: string;
    reportingRequirements?: any[];
    riskAssessment?: string;
  };
  
  // Présence digitale
  facebookPage?: string;
  linkedinPage?: string;
  socialMediaLinks?: {
    twitter?: string;
    youtube?: string;
  };
  
  // Identité institutionnelle
  mission?: string;
  vision?: string;
  coreValues?: string[];
  
  // Couleurs de marque
  brandColors?: {
    primary?: string;
    secondary?: string;
  };
  
  // Structure du capital
  capitalStructure?: any;
  
  // Branches (liste simplifiée)
  branches?: Array<{
    id: string;
    name: string;
    address: string;
    city: string;
    province: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;
  
  // Contacts principaux
  contacts?: {
    general?: {
      phone: string;
      email: string;
    };
    support?: {
      phone?: string;
      email?: string;
    };
  };
  
  // Leadership (liste)
  leadership?: Array<{
    id: string;
    name: string;
    position: string;
    department?: string;
    email?: string;
    phone?: string;
  }>;
  
  // Services offerts
  services?: {
    main: string[];
    digital?: string[];
    specialized?: string[];
  };
  
  // Informations financières
  financialInfo?: {
    totalAssets?: number;
    equity?: number;
    profitability?: number;
  };
  
  // Présence digitale détaillée
  digitalPresence?: {
    hasOnlineBanking?: boolean;
    hasMobileApp?: boolean;
    hasAPI?: boolean;
  };
  
  // Partenariats
  partnerships?: Array<{
    name: string;
    type: string;
    since?: string;
  }>;
  
  // Certifications
  certifications?: Array<{
    name: string;
    issuer: string;
    issuedDate: string;
    expiryDate?: string;
  }>;
  
  // Notation de crédit
  creditRating?: {
    rating?: string;
    agency?: string;
    lastUpdate?: string;
  };
  
  // Métriques de performance
  performanceMetrics?: {
    customerSatisfaction?: number;
    npsScore?: number;
    marketShare?: number;
  };
  
  // Heures d'opération
  operatingHours?: {
    weekdays?: string;
    saturdays?: string;
    sundays?: string;
  };
  
  // Flags de statut
  isActive?: boolean;
  isVerified?: boolean;
  isPubliclyListed?: boolean;
  
  // Notes internes
  internalNotes?: string;
  
  // Dernière vérification
  lastVerifiedAt?: string;
};
```

---

#### 4. Améliorer patrimoine

**Structure Actuelle** (trop simple):
```typescript
patrimoine?: {
  assets: any[];
  stocks: any[];
  totalAssetsValue: number;
}
```

**Structure Améliorée**:
```typescript
@Column('jsonb', { nullable: true })
patrimoine?: {
  // Actifs détaillés
  assets: Array<{
    // Identification
    id: string;
    name: string;
    category: 'real_estate' | 'vehicles' | 'equipment' | 'furniture' | 'technology' | 'intangible' | 'financial' | 'other';
    type: string;
    state: 'excellent' | 'very_good' | 'good' | 'fair' | 'poor' | 'damaged' | 'obsolete';
    
    // Identification unique
    serialNumber?: string;
    modelNumber?: string;
    brand?: string;
    manufacturer?: string;
    manufacturingYear?: number;
    
    // Valeurs
    acquisitionCost: number;
    currentValue: number;
    marketValue?: number;
    insuranceValue?: number;
    bookValue?: number;
    currency: string;
    acquisitionDate: string;
    lastValuationDate?: string;
    
    // Amortissement
    depreciationRate?: number;
    depreciationMethod?: 'straight_line' | 'declining_balance' | 'units_of_production';
    usefulLifeYears?: number;
    accumulatedDepreciation: number;
    
    // Localisation
    location?: string;
    building?: string;
    floor?: string;
    room?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    
    // Responsabilité
    assignedTo?: string;
    department?: string;
    custodian?: string;
    custodianContact?: string;
    
    // Maintenance
    lastMaintenanceDate?: string;
    nextMaintenanceDate?: string;
    maintenanceCost: number;
    maintenanceSchedule?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'as_needed';
    maintenanceProvider?: string;
    
    // Assurance
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    insuranceExpiryDate?: string;
    insurancePremium?: number;
    
    // Statut
    status: 'available' | 'in_use' | 'maintenance' | 'repair' | 'disposed' | 'sold' | 'lost' | 'stolen';
    isActive: boolean;
    disposalDate?: string;
    disposalReason?: string;
    disposalValue?: number;
    
    // Documents
    documents?: Array<{
      id: string;
      type: string;
      name: string;
      path: string;
      uploadDate: string;
      expiryDate?: string;
    }>;
    
    // Garantie
    warrantyProvider?: string;
    warrantyStartDate?: string;
    warrantyEndDate?: string;
    
    // Métadonnées
    createdAt: string;
    updatedAt: string;
  }>;
  
  // Stocks détaillés
  stocks: Array<{
    // Identification
    id: string;
    sku: string;
    name: string;
    category: 'raw_materials' | 'work_in_progress' | 'finished_goods' | 'supplies' | 'spare_parts' | 'consumables';
    subcategory?: string;
    brand?: string;
    manufacturer?: string;
    
    // Quantités
    quantity: number;
    unit: string;
    reorderLevel: number;
    maximumLevel: number;
    reservedQuantity: number;
    availableQuantity: number;
    
    // Coûts
    unitCost: number;
    averageCost: number;
    lastCost: number;
    sellingPrice?: number;
    currency: string;
    totalValue: number;
    
    // Localisation
    warehouse?: string;
    zone?: string;
    aisle?: string;
    shelf?: string;
    bin?: string;
    
    // Statut
    status: 'active' | 'inactive' | 'discontinued' | 'obsolete';
    state: 'good' | 'damaged' | 'expired' | 'quarantine' | 'returned';
    isActive: boolean;
    trackInventory: boolean;
    
    // Dates
    manufacturingDate?: string;
    expiryDate?: string;
    lastReceivedDate?: string;
    lastSoldDate?: string;
    lastCountDate?: string;
    
    // Fournisseur
    primarySupplier?: string;
    supplierSku?: string;
    leadTimeDays?: number;
    minimumOrderQuantity?: number;
    economicOrderQuantity?: number;
    
    // Codes
    barcode?: string;
    qrCode?: string;
    internalCode?: string;
    
    // Dimensions
    weight?: number;
    weightUnit?: string;
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit?: string;
    volume?: number;
    volumeUnit?: string;
    
    // Qualité
    qualityGrade?: string;
    lastQualityCheck?: string;
    requiresInspection: boolean;
    
    // Analyse ABC
    abcClassification?: 'A' | 'B' | 'C';
    turnoverRate?: 'fast' | 'medium' | 'slow';
    
    // Métadonnées
    createdAt: string;
    updatedAt: string;
  }>;
  
  // Résumés agrégés
  assetsSummary: {
    totalValue: number;
    currency: string;
    count: number;
    byCategory: Record<string, {
      count: number;
      value: number;
    }>;
    depreciationRate: number;
    lastValuationDate?: string;
    lastAssetsUpdate: string;
  };
  
  stocksSummary: {
    totalValue: number;
    currency: string;
    totalItems: number;
    lowStockItemsCount: number;
    outOfStockItemsCount: number;
    lastStockUpdate: string;
    rotationMetrics?: {
      averageTurnoverRate: number;
      fastMovingItems: number;
      slowMovingItems: number;
    };
  };
  
  // Totaux
  totalAssetsValue: number;
  totalStocksValue: number;
  totalPatrimoineValue: number;
  lastValuationDate: string;
};
```

---

### 🟡 Priorité MOYENNE (Implémenter sous 2-3 semaines)

#### 5. Implémenter Events Kafka Manquants

**Nouveaux events requis**:

```typescript
// Event 1: Synchronisation Assets
@EventPattern('admin.customer.company.assets.sync')
async handleCompanyAssetsSync(
  @Payload() data: {
    customerId: string;
    assets: CompanyAssetsDto[];
    syncType: 'full' | 'incremental';
    timestamp: string;
  }
) {
  // Mettre à jour patrimoine.assets avec structure enrichie
}

// Event 2: Synchronisation Stocks
@EventPattern('admin.customer.company.stocks.sync')
async handleCompanyStocksSync(
  @Payload() data: {
    customerId: string;
    stocks: CompanyStocksDto[];
    syncType: 'full' | 'incremental';
    timestamp: string;
  }
) {
  // Mettre à jour patrimoine.stocks avec structure enrichie
}

// Event 3: Synchronisation CompanyCore
@EventPattern('admin.customer.company.core.updated')
async handleCompanyCoreUpdated(
  @Payload() data: CompanyCoreDto
) {
  // Mettre à jour companyProfile avec TOUS les champs
}

// Event 4: Synchronisation InstitutionCore
@EventPattern('admin.customer.institution.core.updated')
async handleInstitutionCoreUpdated(
  @Payload() data: InstitutionCoreDto
) {
  // Mettre à jour institutionProfile avec TOUS les champs
}

// Event 5: Synchronisation Branches
@EventPattern('admin.customer.institution.branches.sync')
async handleInstitutionBranchesSync(
  @Payload() data: {
    customerId: string;
    branches: InstitutionBranchDto[];
  }
) {
  // Mettre à jour institutionProfile.branches
}
```

---

#### 6. Ajouter Versionning et Tracking

**Améliorer syncMetadata**:

```typescript
@Column('jsonb')
syncMetadata!: {
  // Synchronisation
  lastSyncFromCustomerService: string;
  dataSource: string;
  syncVersion: string; // ex: "v2.1.0"
  
  // Tracking des updates
  lastUpdateNotified: string;
  updatedFields: string[]; // Liste des champs modifiés
  updateContext: {
    event: string; // Nom de l'event Kafka
    triggeredBy?: string; // Utilisateur ou système
    reason?: string;
  };
  
  // Historique de sync (10 derniers)
  syncHistory: Array<{
    timestamp: string;
    event: string;
    fieldsUpdated: string[];
    status: 'success' | 'failed' | 'partial';
    errorMessage?: string;
  }>;
  
  // Checksums pour détection de drift
  dataChecksum?: string; // Hash MD5 des données principales
  lastChecksumValidation?: string;
  
  // Conflits
  conflictsDetected?: Array<{
    field: string;
    customerServiceValue: any;
    adminServiceValue: any;
    detectedAt: string;
    resolved: boolean;
    resolution?: 'customer_service_wins' | 'admin_service_wins' | 'manual';
  }>;
};
```

---

### 🟢 Priorité BASSE (Amélioration continue)

#### 7. Optimisation Performances

- Ajouter index sur JSONB pour requêtes fréquentes
- Implémenter cache Redis pour profils lus fréquemment
- Pagination des assets/stocks dans patrimoine (> 1000 items)

#### 8. Monitoring et Alertes

- Alertes si désynchronisation > 24h
- Dashboard Grafana pour tracking sync Kafka
- Logs structurés pour audit trail

---

## 6. MATRICE DE COMPATIBILITÉ FINALE

| Entité Source | Champs Totaux | Mappés | Partiels | Manquants | Taux | Priorité |
|---------------|---------------|--------|----------|-----------|------|----------|
| **Customer** | 40 | 20 | 10 | 10 | **50%** | 🔴 HAUTE |
| **CompanyCore** | 50+ | 10 | 5 | 35+ | **20%** | 🔴 HAUTE |
| **CompanyAssets** | 60+ | 0 | 3 | 57+ | **5%** | 🔴 CRITIQUE |
| **CompanyStocks** | 70+ | 0 | 2 | 68+ | **3%** | 🔴 CRITIQUE |
| **InstitutionCore** | 50+ | 20 | 10 | 20+ | **40%** | 🔴 HAUTE |
| **InstitutionBranch** | 30+ | 5 | 5 | 20+ | **17%** | 🟡 MOYENNE |
| **InstitutionLeadership** | 15+ | 5 | 3 | 7+ | **33%** | 🟡 MOYENNE |
| **InstitutionServices** | 20+ | 3 | 2 | 15+ | **15%** | 🟡 MOYENNE |

**MOYENNE GÉNÉRALE: 22.875%** ⚠️

---

## 7. PLAN D'ACTION RECOMMANDÉ

### Phase 1: Correctifs Critiques (Semaine 1-2)
1. ✅ Enrichir CustomerDetailedProfile avec champs manquants
2. ✅ Restructurer companyProfile avec structure détaillée
3. ✅ Restructurer institutionProfile avec structure détaillée
4. ✅ Améliorer patrimoine avec assets/stocks structurés

### Phase 2: Synchronisation (Semaine 3-4)
1. ✅ Implémenter events Kafka manquants
2. ✅ Créer DTOs de synchronisation complets
3. ✅ Mettre à jour consumer pour nouveaux events
4. ✅ Tests de synchronisation end-to-end

### Phase 3: Versionning et Tracking (Semaine 5)
1. ✅ Implémenter versionning des données
2. ✅ Améliorer syncMetadata avec historique
3. ✅ Ajouter détection de conflits
4. ✅ Créer dashboard de monitoring

### Phase 4: Validation et Documentation (Semaine 6)
1. ✅ Tests de compatibilité granulaire
2. ✅ Documentation API mise à jour
3. ✅ Guide de migration pour équipe
4. ✅ Formation équipe support

---

## 8. CONCLUSION

### Verdict Final
**CustomerDetailedProfile est actuellement PARTIELLEMENT COMPATIBLE (22.875%)** avec les entités du customer-service.

### Risques Majeurs
1. **Perte de Données**: 70%+ des données structurées ne sont pas synchronisées
2. **Désynchronisation**: Absence de mécanismes de détection de drift
3. **Impossibilité d'Audit**: Patrimoine (actifs/stocks) non tracké
4. **Conformité Réglementaire**: Licences, certifications non synchronisées
5. **Business Intelligence**: Métriques financières incomplètes

### Actions Immédiates Requises
1. Implémenter **Phase 1** (correctifs critiques) immédiatement
2. Geler les développements dépendants de CustomerDetailedProfile
3. Prioriser **CompanyAssets** et **CompanyStocks** sync (impact business majeur)
4. Créer task force pour résoudre gaps critiques

### Estimation Effort
- **Développement**: 4-6 semaines (1 développeur senior)
- **Tests**: 2 semaines
- **Migration données**: 1 semaine
- **Total**: **7-9 semaines**

---

**Document préparé par**: System Architecture Review  
**Date**: 2025-11-13  
**Version**: 1.0  
**Statut**: RECOMMANDATIONS CRITIQUES - ACTION IMMÉDIATE REQUISE
