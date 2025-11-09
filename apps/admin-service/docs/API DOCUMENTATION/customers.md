# API Documentation - Gestion Clients Admin

## Vue d'ensemble

L'API Admin de gestion des clients fournit un accès unifié aux profils clients (PME et institutions financières) synchronisés depuis le customer-service via Kafka. Cette API permet aux administrateurs de gérer, valider et surveiller tous les types de clients dans une interface unifiée.

## Architecture des Données

### Synchronisation Kafka

Les données clients sont synchronisées en temps réel depuis le `customer-service` via les événements Kafka suivants :

#### Événements Principaux
- `admin.customer.complete.profile.v2_1` - Profils complets v2.1 (unifié PME/Institution)
- `admin.customer.company.profile.shared` - Profils spécifiques entreprises
- `admin.customer.institution.profile.shared` - Profils spécifiques institutions
- `admin.customer.profile.updated` - Notifications de mise à jour
- `admin.customer.enterprise.identification` - Formulaires d'identification étendus
- `admin.customer.assets.data` - Données de patrimoine (AssetData v2.1)
- `admin.customer.stocks.data` - Données de stock (StockData v2.1)

### Entité Centrale : CustomerDetailedProfile

```typescript
export class CustomerDetailedProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  customerId: string;

  @Column({
    type: 'enum',
    enum: ProfileType,
    default: ProfileType.COMPANY
  })
  profileType: ProfileType; // COMPANY | INSTITUTION

  @Column({
    type: 'varchar',
    length: 50
  })
  customerType: 'PME' | 'FINANCIAL_INSTITUTION';

  // Informations de base synchronisées
  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  logo?: string;

  @Column('jsonb', { nullable: true })
  address?: any;

  @Column({
    type: 'enum',
    enum: CustomerStatus,
    default: CustomerStatus.PENDING
  })
  status: CustomerStatus;

  // Profils spécialisés (JSONB pour flexibilité)
  @Column('jsonb', { nullable: true })
  companyProfile?: CompanyProfileData; // Utilisé si customerType = 'PME'

  @Column('jsonb', { nullable: true })
  institutionProfile?: InstitutionProfileData; // Utilisé si customerType = 'FINANCIAL_INSTITUTION'

  // Données administratives
  @Column({
    type: 'enum',
    enum: AdminStatus,
    default: AdminStatus.UNDER_REVIEW
  })
  adminStatus: AdminStatus;

  @Column({
    type: 'enum',
    enum: ComplianceRating,
    default: ComplianceRating.MEDIUM
  })
  complianceRating: ComplianceRating;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  profileCompleteness: number;

  @Column('text', { array: true, default: [] })
  riskFlags: string[];

  // Métadonnées de synchronisation
  @Column('jsonb', { nullable: true })
  syncMetadata?: {
    lastSyncFromCustomerService: string;
    dataSource: string;
    dataVersion?: string;
  };

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Énumérations

```typescript
export enum ProfileType {
  COMPANY = 'COMPANY',
  INSTITUTION = 'INSTITUTION'
}

export enum AdminStatus {
  UNDER_REVIEW = 'under_review',
  VALIDATED = 'validated',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected'
}

export enum ComplianceRating {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}
```

## Structures de Données par Type

### 1. Profil PME (companyProfile)

Structure complète reçue via Kafka de customer-service :

```typescript
interface CompanyProfileData {
  // Informations légales de base
  legalForm?: string;           // Forme juridique (SARL, SA, SAS, etc.)
  industry?: string;            // Secteur d'activité
  rccm?: string;               // Numéro RCCM
  taxId?: string;              // Numéro d'identification fiscale
  natId?: string;              // Numéro d'identification nationale
  yearFounded?: number;        // Année de création
  employeeCount?: number;      // Nombre d'employés

  // Informations financières et d'activité
  activities?: {
    principales?: string[];
    secondaires?: string[];
    description?: string;
  };
  capital?: {
    montant: number;
    devise: string;
    repartition?: any[];
  };
  
  // Structure organisationnelle
  owner?: {
    nom: string;
    prenom: string;
    fonction: string;
    pourcentageActions?: number;
    contact?: any;
  };
  associates?: Array<{
    nom: string;
    prenom: string;
    fonction: string;
    pourcentageActions: number;
    dateEntree?: string;
  }>;

  // Implantations géographiques
  locations?: Array<{
    type: 'siege' | 'agence' | 'depot' | 'autre';
    adresse: any;
    superficie?: number;
    statut: 'proprie' | 'loue';
  }>;

  // Données financières
  financials?: {
    chiffreAffairesAnnuel?: number;
    beneficeNet?: number;
    totalActifs?: number;
    totalPassifs?: number;
    ratioEndettement?: number;
    dernierBilan?: string; // Date
  };

  // Relations d'affaires
  affiliations?: {
    groupeParent?: string;
    filiales?: string[];
    partenaires?: string[];
  };

  // Informations de contact étendues
  contactPersons?: Array<{
    nom: string;
    fonction: string;
    email: string;
    telephone?: string;
    mobile?: string;
  }>;

  // Présence en ligne
  socialMedia?: {
    website?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
}
```

### 2. Profil Institution Financière (institutionProfile)

Structure complète reçue via Kafka de customer-service (70+ champs) :

```typescript
interface InstitutionProfileData {
  // Informations légales et réglementaires de base
  denominationSociale: string;
  sigleLegalAbrege?: string;
  numeroAgrement: string;           // Numéro d'agrément officiel
  dateAgrement: string;            // Date d'obtention de l'agrément
  autoriteSupervision: string;     // BCC, ARCA, etc.
  typeInstitution: string;         // Banque, IMF, Coopérative, etc.
  categorieInstitution?: string;   // Catégorie selon la réglementation
  
  // Activités autorisées et services
  activitesAutorisees: string[];   // Activités autorisées par l'agrément
  servicesOfferts: string[];       // Services actuellement offerts
  produitsBancaires?: string[];    // Produits bancaires spécifiques
  
  // Structure du capital et actionnariat
  capitalSocial: number;
  capitalMinimumReglementaire: number;
  structureActionnariat: Array<{
    nom: string;
    pourcentage: number;
    type: 'personne_physique' | 'personne_morale' | 'etat' | 'autre';
  }>;
  principauxActionnaires: Array<{
    nom: string;
    pourcentage: number;
    dateEntree?: string;
    origine?: string;
  }>;
  
  // Gouvernance et direction
  conseilAdministration: Array<{
    nom: string;
    prenom: string;
    fonction: string;
    dateNomination: string;
    mandatExpiration?: string;
    experience?: string;
  }>;
  directionGenerale: Array<{
    nom: string;
    prenom: string;
    poste: string;
    dateNomination: string;
    qualification?: string;
    experience?: string;
  }>;
  comitesSpecialises: Array<{
    nom: string;
    type: string;
    president: string;
    membres: string[];
    frequenceReunions?: string;
  }>;
  
  // Réseau et implantations
  siegeSocial: {
    adresse: any;
    telephone: string;
    email: string;
    superficie?: number;
  };
  agences: Array<{
    nom: string;
    adresse: any;
    telephone?: string;
    dateOuverture?: string;
    typeAgence: 'principale' | 'secondaire' | 'point_service';
    superficie?: number;
    nombreEmployes?: number;
  }>;
  pointsService: Array<{
    type: 'distributeur' | 'guichet' | 'agent' | 'autre';
    localisation: any;
    statut: 'operationnel' | 'en_maintenance' | 'hors_service';
  }>;
  reseauDistribution: {
    couvertureGeographique: string[];
    nombrePointsService: number;
    populationDesservie?: number;
  };
  
  // Informations financières consolidées
  chiffreAffaires: number;
  totalBilan: number;
  fondsPropreNets: number;
  ratioSolvabilite: number;
  ratioLiquidite?: number;
  provisions?: number;
  creancesDouteuses?: number;
  notationCredit?: {
    agence: string;
    note: string;
    dateEvaluation: string;
    perspective?: string;
  };
  
  // Présence digitale et innovation
  siteWeb?: string;
  plateformeDigitale?: {
    nom: string;
    url: string;
    fonctionnalites: string[];
    nombreUtilisateurs?: number;
  };
  servicesEnLigne: string[];
  applicationsMobiles?: Array<{
    nom: string;
    plateforme: string;
    dateDeployement: string;
    nombreTelecharges?: number;
  }>;
  
  // Partenariats et affiliations
  partenairesStrategiques?: Array<{
    nom: string;
    typePartenariat: string;
    dateDebut: string;
    domaineCollaboration?: string;
  }>;
  affiliationsInternationales?: Array<{
    organisation: string;
    typeAffiliation: string;
    dateAdhesion?: string;
  }>;
  reseauxCorrespondants?: Array<{
    banque: string;
    pays: string;
    devise: string;
    typeRelation: string;
  }>;
  
  // Conformité et certifications
  certificationsISO?: string[];
  auditExterne?: {
    cabinetAudit: string;
    derniereDate: string;
    prochainAudit?: string;
    conclusions?: string;
  };
  rapportsConformite: Array<{
    type: string;
    periode: string;
    statut: 'conforme' | 'non_conforme' | 'en_cours';
    observations?: string;
  }>;
  
  // Performance et indicateurs
  historiquePerformances?: Array<{
    annee: number;
    resultatNet: number;
    roi: number;
    croissanceActivite: number;
    partMarche?: number;
  }>;
  indicateursRisque?: {
    niveauRisqueGlobal: 'faible' | 'moyen' | 'eleve';
    risqueCredit?: number;
    risqueLiquidite?: number;
    risqueOperationnel?: number;
    derniereMiseAJour: string;
  };
  
  // Stratégie et perspectives
  perspectivesStrategiques?: string;
  projetsDeveloppement?: string[];
  investissementsPrevis?: Array<{
    domaine: string;
    montant: number;
    echeance: string;
  }>;
  
  // Métadonnées et notes
  notesSpeciales?: string;
  dateCreationProfil: string;
  derniereMiseAJour: string;
  validePar?: string;
  statutValidation?: 'en_attente' | 'valide' | 'rejete';
}
```

### 3. Données de Patrimoine (AssetData v2.1)

```typescript
interface AssetData {
  id: string;
  nom: string;
  description: string;
  categorie: string;                // 'immobilier', 'vehicule', 'equipement', etc.
  sousCategorie?: string;
  prixAchat: number;
  dateAcquisition: string;
  valeurActuelle: number;
  dateEvaluation: string;
  etatActuel: 'neuf' | 'tres_bon' | 'bon' | 'moyen' | 'mauvais' | 'deteriore';
  proprietaire: string;
  localisation?: string;
  numeroSerie?: string;
  garantie?: {
    dateExpiration: string;
    fournisseur: string;
  };
  documentsAssocies?: string[];     // IDs des documents justificatifs
  metadata?: Record<string, any>;
}
```

### 4. Données de Stock (StockData v2.1)

```typescript
interface StockData {
  id: string;
  nomProduit: string;
  codeProduit: string;
  categorie: string;
  quantiteStock: number;
  seuilMinimum: number;
  seuilMaximum: number;
  coutUnitaire: number;
  valeurTotaleStock: number;
  uniteMessure: string;
  fournisseurPrincipal?: string;
  dateEntreeStock: string;
  dateDerniereRotation?: string;
  emplacementStock: string;
  etatStock: 'disponible' | 'reserve' | 'endommage' | 'expire';
  metadata?: Record<string, any>;
}
```

## API Endpoints

### Contrôleur Principal : AdminCustomerProfilesController

Base URL: `/admin/customer-profiles`

#### 1. Lister les Profils Clients

```http
GET /admin/customer-profiles
```

**Paramètres de requête :**
```typescript
interface ListProfilesQuery {
  page?: number;              // Page (défaut: 1)
  limit?: number;             // Nombre par page (défaut: 10, max: 100)
  customerType?: 'PME' | 'FINANCIAL_INSTITUTION';
  adminStatus?: AdminStatus;
  complianceRating?: ComplianceRating;
  search?: string;            // Recherche sur nom, email
  sortBy?: 'name' | 'createdAt' | 'profileCompleteness' | 'adminStatus';
  sortOrder?: 'ASC' | 'DESC'; // Défaut: DESC
  minCompleteness?: number;   // Pourcentage minimum de complétude
  hasRiskFlags?: boolean;     // Filtrer les profils avec des drapeaux de risque
}
```

**Réponse :**
```typescript
interface ListProfilesResponse {
  profiles: AdminCustomerProfileDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: {
    appliedFilters: Record<string, any>;
    availableFilters: {
      customerTypes: Array<{ value: string; count: number }>;
      adminStatuses: Array<{ value: string; count: number }>;
      complianceRatings: Array<{ value: string; count: number }>;
    };
  };
}
```

#### 2. Obtenir les Détails d'un Profil

```http
GET /admin/customer-profiles/{customerId}
```

**Réponse :**
```typescript
// Retourne AdminCustomerProfileDto avec tous les détails
```

#### 3. Valider un Profil Client

```http
POST /admin/customer-profiles/{customerId}/validate
```

**Corps de la requête :**
```typescript
interface ValidateProfileRequest {
  adminId: string;
  validationNotes?: string;
  complianceRating?: ComplianceRating;
  conditions?: string[];      // Conditions spéciales de validation
}
```

#### 4. Suspendre un Profil Client

```http
POST /admin/customer-profiles/{customerId}/suspend
```

**Corps de la requête :**
```typescript
interface SuspendProfileRequest {
  adminId: string;
  reason: string;
  duration?: number;          // Durée en jours (optionnel)
  notifyCustomer?: boolean;   // Défaut: true
}
```

#### 5. Réactiver un Profil Client

```http
POST /admin/customer-profiles/{customerId}/reactivate
```

**Corps de la requête :**
```typescript
interface ReactivateProfileRequest {
  adminId: string;
  reactivationNotes?: string;
  newComplianceRating?: ComplianceRating;
}
```

#### 6. Mettre à Jour le Rating de Conformité

```http
PATCH /admin/customer-profiles/{customerId}/compliance-rating
```

**Corps de la requête :**
```typescript
interface UpdateComplianceRatingRequest {
  adminId: string;
  newRating: ComplianceRating;
  justification: string;
  reviewDate?: string;
}
```

#### 7. Gérer les Drapeaux de Risque

```http
POST /admin/customer-profiles/{customerId}/risk-flags
PUT /admin/customer-profiles/{customerId}/risk-flags
DELETE /admin/customer-profiles/{customerId}/risk-flags
```

**Corps de la requête :**
```typescript
interface ManageRiskFlagsRequest {
  adminId: string;
  flags: string[];            // Drapeaux à ajouter/remplacer
  action: 'add' | 'remove' | 'replace';
  justification?: string;
}
```

#### 8. Demander une Synchronisation

```http
POST /admin/customer-profiles/{customerId}/sync
```

**Corps de la requête :**
```typescript
interface RequestSyncRequest {
  adminId: string;
  syncType: 'partial' | 'full';
  requestedData?: string[];   // Données spécifiques à synchroniser
  priority: 'low' | 'normal' | 'high' | 'urgent';
  reason?: string;
}
```

## DTO de Réponse Principal

### AdminCustomerProfileDto

```typescript
export class AdminCustomerProfileDto {
  customerId: string;
  profileType: ProfileType;
  customerType: 'PME' | 'FINANCIAL_INSTITUTION';
  
  // Informations de base
  name: string;
  email: string;
  phone?: string;
  logo?: string;
  address?: any;
  status: CustomerStatus;
  
  // Profil spécialisé selon le type
  companyProfile?: CompanyProfileData;           // Si customerType = 'PME'
  institutionProfile?: InstitutionProfileData;   // Si customerType = 'FINANCIAL_INSTITUTION'
  
  // Informations administratives
  adminStatus: AdminStatus;
  complianceRating: ComplianceRating;
  profileCompleteness: number;
  riskFlags: string[];
  
  // Métriques KYC
  kycStatus: {
    isComplete: boolean;
    completionPercentage: number;
    missingDocuments: string[];
    verificationStatus: 'pending' | 'verified' | 'rejected';
    lastVerificationDate?: string;
    verifiedBy?: string;
  };
  
  // Données étendues (si disponibles)
  extendedData?: {
    assets?: AssetData[];
    stocks?: StockData[];
    totalPatrimoine?: number;
    lastAssetUpdate?: string;
  };
  
  // Métadonnées système
  syncMetadata?: {
    lastSyncFromCustomerService: string;
    dataSource: string;
    dataVersion?: string;
    syncStatus: 'synced' | 'pending' | 'error';
    needsResync: boolean;
  };
  
  // Informations de suivi administratif
  adminTracking: {
    createdAt: string;
    updatedAt: string;
    lastReviewDate?: string;
    lastReviewedBy?: string;
    nextReviewDue?: string;
    reviewNotes?: string[];
  };
  
  // Insights automatiques
  insights?: {
    riskScore: number;
    recommendations: string[];
    alerts: string[];
    opportunities: string[];
    lastAnalysisDate: string;
  };
}
```

## Gestion des Erreurs

### Codes d'Erreur Spécifiques

- `CUSTOMER_NOT_FOUND` (404) - Profil client non trouvé
- `CUSTOMER_ALREADY_VALIDATED` (409) - Profil déjà validé
- `CUSTOMER_SUSPENDED` (423) - Profil suspendu
- `INSUFFICIENT_DATA` (422) - Données insuffisantes pour l'opération
- `SYNC_IN_PROGRESS` (429) - Synchronisation en cours
- `INVALID_CUSTOMER_TYPE` (400) - Type de client invalide
- `COMPLIANCE_CHECK_FAILED` (422) - Vérification de conformité échouée

### Structure d'Erreur Standard

```typescript
interface AdminApiError {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
    adminAction?: string;        // Action administrative suggérée
    supportReference?: string;   // Référence pour le support
  };
}
```

## Authentification et Autorisation

- **Authentification** : JWT avec rôle `admin` requis
- **Guard** : `JwtBlacklistGuard` - Vérifie les tokens blacklistés
- **Rôles requis** : `ADMIN`, `SUPER_ADMIN`
- **Permissions spéciales** :
  - `validate-customers` - Valider les profils
  - `suspend-customers` - Suspendre les profils
  - `manage-risk-flags` - Gérer les drapeaux de risque
  - `force-sync` - Forcer la synchronisation

## Événements Audit

Toutes les actions administratives génèrent des événements d'audit :

```typescript
interface AdminAuditEvent {
  eventType: string;
  adminId: string;
  customerId: string;
  action: string;
  timestamp: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}
```

Types d'événements trackés :
- `CUSTOMER_VALIDATED`
- `CUSTOMER_SUSPENDED`
- `CUSTOMER_REACTIVATED`
- `COMPLIANCE_RATING_UPDATED`
- `RISK_FLAGS_MODIFIED`
- `SYNC_REQUESTED`
- `PROFILE_ACCESSED`

## Métriques et Monitoring

### Métriques Disponibles

- Nombre de profils par statut administratif
- Taux de complétude moyen par type de client
- Temps de traitement des validations
- Fréquence des synchronisations
- Distribution des ratings de conformité
- Alertes de risque actives

### Endpoints de Monitoring

```http
GET /admin/customer-profiles/metrics/summary
GET /admin/customer-profiles/metrics/completeness
GET /admin/customer-profiles/metrics/risk-distribution
GET /admin/customer-profiles/metrics/sync-status
```

## Limitations et Contraintes

- **Rate Limiting** : 1000 requêtes/heure par admin
- **Pagination** : Maximum 100 éléments par page
- **Synchronisation** : Maximum 10 synchronisations simultanées
- **Recherche** : Index sur `name`, `email`, `customerId`
- **Archivage** : Profils inactifs > 2 ans archivés automatiquement

## Exemples d'Utilisation

### Recherche de Profils PME avec Risques

```javascript
const response = await fetch('/admin/customer-profiles?' + new URLSearchParams({
  customerType: 'PME',
  hasRiskFlags: 'true',
  minCompleteness: '70',
  sortBy: 'profileCompleteness',
  sortOrder: 'ASC'
}));
```

### Validation d'une Institution Financière

```javascript
const response = await fetch('/admin/customer-profiles/550e8400-e29b-41d4-a716-446655440000/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    adminId: 'admin-123',
    validationNotes: 'Profil complet et conforme aux exigences',
    complianceRating: 'HIGH',
    conditions: ['Rapport annuel requis', 'Audit externe obligatoire']
  })
});
```

Cette documentation reflète exactement l'implémentation réelle du système, avec les structures de données synchronisées via Kafka et les fonctionnalités disponibles dans l'admin-service.