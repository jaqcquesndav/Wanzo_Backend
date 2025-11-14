# API Documentation - Gestion Clients Admin v2.1

## Sommaire

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture des Données](#architecture-des-données)
   - [Synchronisation Kafka v2.1](#synchronisation-kafka-v21)
   - [Consumer Kafka](#consumer-kafka)
   - [Entité Centrale: CustomerDetailedProfile](#entité-centrale--customerdetailedprofile)
   - [Énumérations](#énumérations)
3. [Structures de Données par Type](#structures-de-données-par-type)
   - [Profil PME (companyProfile)](#1-profil-pme-companyprofile)
   - [Profil Institution Financière (institutionProfile)](#2-profil-institution-financière-institutionprofile)
   - [Structure Patrimoine (PatrimoineStructured)](#3-structure-patrimoine-patrimoinestructured)
4. [API Endpoints](#api-endpoints)
   - [Contrôleur Principal: AdminCustomerProfilesController](#contrôleur-principal--admincustomerprofilescontroller)
   - [Contrôleur v2.1: CustomerProfileV2Controller](#contrôleur-v21--customerprofilev2controller)
5. [DTOs](#dtos)
   - [DTO de Réponse Principal](#dto-de-réponse-principal)
   - [DTOs de Synchronisation Kafka v2.1](#dtos-de-synchronisation-kafka-v21)
6. [Gestion des Erreurs](#gestion-des-erreurs)
7. [Authentification et Autorisation](#authentification-et-autorisation)
8. [Événements Audit](#événements-audit)
9. [Métriques et Monitoring](#métriques-et-monitoring)
10. [Limitations et Contraintes](#limitations-et-contraintes)
11. [Exemples d'Utilisation](#exemples-dutilisation)
12. [Notes de Version](#notes-de-version)

---

## Vue d'ensemble

L'API Admin de gestion des clients fournit un accès unifié aux profils clients (PME et institutions financières) synchronisés depuis le customer-service via Kafka. Cette API permet aux administrateurs de consulter, monitorer et analyser tous les types de clients dans une interface unifiée.

**Version**: 2.1.0  
**Base URL (via API Gateway)**: `http://localhost:8000/admin/api/v1`  
**Base URL (directe - admin-service)**: `http://localhost:3001`  
**Dernière mise à jour**: Novembre 2025

### 🔄 Architecture de Routing

L'API Gateway (port 8000) détecte le prefix `admin/api/v1` dans l'URL et le **coupe automatiquement** avant de router vers admin-service (port 3001).

**Exemple:**
- **Client appelle**: `http://localhost:8000/admin/api/v1/customer-profiles`
- **API Gateway coupe**: `/admin/api/v1`
- **Admin-service reçoit**: `/customer-profiles`
- **Controller traite**: `@Controller('customer-profiles')`

Toutes les routes documentées ci-dessous utilisent la Base URL complète via API Gateway.

### Caractéristiques Principales

✅ **Synchronisation en Temps Réel**: 17+ événements Kafka pour synchronisation automatique  
✅ **Support v2.0 Complet**: 90+ champs français pour les institutions financières  
✅ **Dual Controller**: API v1 (legacy) + API v2.1 (optimisée)  
✅ **Filtrage Avancé**: Recherche par zones géographiques, types, métriques financières  
✅ **Métriques Différenciées**: `financialMetrics` (institutions) / `inventoryMetrics` (PME)  
✅ **Historique Complet**: Tracking de tous les changements et événements  
✅ **Alertes Administratives**: Gestion centralisée des alertes et risques

## Architecture des Données

### Synchronisation Kafka v2.1

Les données clients sont synchronisées en temps réel depuis le `customer-service` via les événements Kafka suivants :

#### Événements Principaux v2.1
- `admin.customer.company.profile.shared` - Profils entreprises (legacy)
- `admin.customer.institution.profile.shared` - Profils institutions (legacy)
- `admin.customer.company.core.full.sync` - **Synchronisation complète PME v2.1**
- `admin.customer.institution.core.full.sync` - **Synchronisation complète Institutions v2.1**

#### Événements Patrimoine
- `admin.customer.company.assets.sync` - Synchronisation des actifs (full/incremental/partial)
- `admin.customer.company.stocks.sync` - Synchronisation des stocks (full/incremental/partial)
- `admin.customer.company.patrimoine.full.sync` - Synchronisation patrimoine complet

#### Événements Institutions Spécifiques
- `admin.customer.institution.branches.sync` - Synchronisation des agences
- `admin.customer.institution.leadership.sync` - Synchronisation du leadership

#### Événements de Mise à Jour
- `admin.customer.profile.incremental.update` - Mises à jour incrémentielles
- `admin.customer.profile.critical.changes` - Changements critiques nécessitant attention
- `admin.customer.profile.revalidation.request` - Demandes de revalidation

#### Événements Monitoring
- `admin.customer.sync.health.check` - Vérification santé de la synchronisation

#### Événements Souscriptions
- `admin-service.subscription.created` - Nouvelle souscription créée
- `admin-service.subscription.cancelled` - Souscription annulée
- `admin-service.subscription.renewed` - Souscription renouvelée
- `admin-service.subscription.plan_changed` - Changement de plan

#### Consumer Kafka

Le service utilise `CustomerProfileConsumer` qui écoute tous les événements ci-dessus et synchronise automatiquement les données dans l'entité `CustomerDetailedProfile`. Les handlers principaux sont:

- **`handleInstitutionCoreFullSync`**: Traite les synchronisations complètes Institution v2.0 (90+ champs français)
- **`handleCompanyCoreFullSync`**: Traite les synchronisations complètes PME
- **`handleCompanyAssetsSync`**: Met à jour le patrimoine (actifs professionnels)
- **`handleCompanyStocksSync`**: Met à jour le patrimoine (stocks)
- **`handleInstitutionBranchesSync`**: Synchronise les agences des institutions
- **`handleInstitutionLeadershipSync`**: Synchronise le leadership/direction
- **`handleProfileIncrementalUpdate`**: Applique les mises à jour incrémentielles de champs
- **`handleProfileCriticalChanges`**: Traite les changements critiques et crée des alertes
- **`handleProfileRevalidationRequest`**: Enregistre les demandes de revalidation
- **`handleSyncHealthCheck`**: Vérifie la santé de la synchronisation

Toutes les synchronisations mettent à jour les métadonnées de sync (`lastSyncAt`, `syncMetadata`) et maintiennent l'historique des changements.

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
  institutionProfile?: InstitutionProfileStructured; // Utilisé si customerType = 'FINANCIAL_INSTITUTION' (v2.0 - 90+ champs français)

  // Patrimoine (JSONB)
  @Column('jsonb', { nullable: true })
  patrimoine?: PatrimoineStructured;

  // Métriques Financières (Institutions uniquement)
  @Column('jsonb', { nullable: true })
  financialMetrics?: {
    capitalSocialActuel?: number;
    fondsPropresMontant?: number;
    totalBilan?: number;
    chiffreAffairesAnnuel?: number;
  };

  // Métriques Inventaire (Companies uniquement)
  @Column('jsonb', { nullable: true })
  inventoryMetrics?: {
    stockValorisation?: number;
    actifsProfessionnelsValorisation?: number;
    patrimoineTotal?: number;
    derniereEvaluation?: string;
  };

  // Données Partenariat
  @Column('jsonb', { nullable: true })
  partnershipData?: {
    motivationPrincipale?: string;
    servicesPrioritaires?: string[];
    autresBesoins?: string;
    referencePartenaire?: string;
  };

  // Données Opérationnelles
  @Column('jsonb', { nullable: true })
  operationalData?: {
    nombreAgences?: number;
    effectifTotal?: number;
    zonesCouverture?: string[];
  };

  // Souscriptions
  @Column('jsonb', { nullable: true })
  subscriptions?: Array<{
    id: string;
    planId: string;
    status: string;
    startDate: string;
    endDate?: string;
    price: number;
    stripeSubscriptionId?: string;
  }>;

  // Utilisateurs liés
  @Column('jsonb', { nullable: true })
  users?: Array<{
    userId: string;
    email: string;
    role: string;
    permissions: string[];
  }>;

  // Consommation tokens
  @Column('jsonb', { nullable: true })
  tokenConsumption?: {
    totalUsed: number;
    remaining: number;
    lastResetDate: string;
  };

  // Alertes
  @Column('jsonb', { nullable: true })
  alerts?: Array<{
    id: string;
    type: string;
    message: string;
    severity: string;
    createdAt: string;
    resolvedAt?: string;
  }>;

  // Informations facturation
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

  // Statut validation
  @Column('jsonb', { nullable: true })
  validationStatus?: {
    isValidated: boolean;
    validatedAt?: string;
    validatedBy?: string;
    rejectedAt?: string;
    rejectedBy?: string;
    rejectionReason?: string;
  };

  // Préférences
  @Column('jsonb', { nullable: true })
  preferences?: {
    notifications?: boolean;
    language?: string;
    timezone?: string;
  };

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastVerifiedAt?: Date;

  @Column({ nullable: true })
  accountType?: string;

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

Structure complète v2.0 reçue via Kafka de customer-service (**90+ champs - 100% nomenclature française**) :

```typescript
interface InstitutionProfileStructured {
  // === SECTION 1: Identification Légale (10 champs) ===
  denominationSociale: string;                    // Dénomination sociale officielle
  sigle?: string;                                 // Sigle/acronyme
  numeroAgrement: string;                         // Numéro d'agrément BCC/ARCA
  numeroNIF?: string;                            // Numéro NIF
  numeroRCCM?: string;                           // Numéro RCCM
  typeInstitution: InstitutionType;              // BANQUE | IMF | COOPERATIVE_EPARGNE_CREDIT | BUREAU_CHANGE | ETABLISSEMENT_MICRO_CREDIT | COOPERATIVE_MICRO_CREDIT | ETABLISSEMENT_PAIEMENT | AUTRE
  dateAgrement?: string;                         // Date agrément ISO
  autoriteSupervision?: string;                  // BCC, ARCA, etc.
  activitesAutorisees?: string[];                // Activités autorisées
  categorieInstitution?: string;                 // Catégorie selon réglementation
  
  // === SECTION 2: Informations Financières (8 champs) ===
  capitalSocialMinimum?: number;                 // Capital social minimum réglementaire
  capitalSocialActuel?: number;                  // Capital social actuel
  fondsPropresMontant?: number;                  // Montant fonds propres
  totalBilan?: number;                           // Total bilan
  chiffreAffairesAnnuel?: number;               // Chiffre d'affaires annuel
  ratioSolvabilite?: number;                    // Ratio de solvabilité
  totalDepots?: number;                         // Total dépôts
  totalCreditsOctroyes?: number;                // Total crédits octroyés
  
  // === SECTION 3: Effectif et Infrastructure (6 champs) ===
  nombreAgences?: number;                        // Nombre d'agences total
  nombrePointsService?: number;                  // Nombre de points de service
  nombreGuichetsAutomatiques?: number;           // Nombre DAB/GAB
  effectifTotal?: number;                        // Effectif total employés
  nombreCadres?: number;                         // Nombre cadres
  nombreAgentsOperationnels?: number;            // Nombre agents opérationnels
  
  // === SECTION 4: Actionnariat (3 champs - structures complexes) ===
  structureActionnariat?: Array<{
    nom: string;
    pourcentageDetention: number;
    typeActionnaire: 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE' | 'ETAT' | 'AUTRE';
    nationalite?: string;
  }>;
  principauxActionnaires?: Array<{
    nom: string;
    pourcentageDetention: number;
    origine?: string;
  }>;
  partenairesStrategiques?: Array<{
    nom: string;
    typePartenariat: string;
    domaineCollaboration?: string;
  }>;
  
  // === SECTION 5: Gouvernance (4 champs - structures complexes) ===
  conseilAdministration?: Array<{
    nom: string;
    prenom: string;
    fonction: string;
    dateNomination?: string;
  }>;
  directionGenerale?: Array<{
    nom: string;
    prenom: string;
    fonction: string;
    dateNomination?: string;
  }>;
  comitesSpecialises?: Array<{
    nomComite: string;
    typeComite: string;
    president?: string;
  }>;
  auditeurs?: Array<{
    nom: string;
    type: 'INTERNE' | 'EXTERNE';
    cabinet?: string;
  }>;
  
  // === SECTION 6: Réseau Géographique (3 champs - structures complexes) ===
  siegeSocial?: {
    adresseComplete: string;
    commune: string;
    ville: string;
    pays: string;
    telephone?: string;
    email?: string;
  };
  agences?: Array<{
    nom: string;
    adresseComplete: string;
    ville: string;
    province?: string;
    telephone?: string;
    typeAgence: 'PRINCIPALE' | 'SECONDAIRE' | 'POINT_SERVICE';
    dateOuverture?: string;
  }>;
  zonesCouverture?: string[];                    // Provinces/régions couvertes
  
  // === SECTION 7: Services et Produits Financiers (7 champs) ===
  servicesOfferts?: string[];                    // Services offerts
  produitsBancaires?: string[];                  // Produits bancaires
  servicesCredit?: string[];                     // Services crédit disponibles
  servicesInvestissement?: string[];             // Services d'investissement
  servicesGarantie?: string[];                   // Services de garantie
  servicesTransactionnels?: string[];            // Services transactionnels
  servicesConseil?: string[];                    // Services de conseil
  
  // === SECTION 8: Partenariat Wanzo (7 champs) ===
  motivationPrincipale?: string;                 // Motivation principale partenariat
  servicesPrioritaires?: string[];               // Services Wanzo prioritaires
  volumeTransactionsEstime?: string;             // Volume transactions estimé
  typeClienteleCible?: string[];                 // Type clientèle ciblée
  besoinsSpecifiques?: string;                   // Besoins spécifiques
  autresBesoins?: string;                        // Autres besoins
  referencePartenaire?: string;                  // Référence partenaire
  
  // === SECTION 9: Conditions Commerciales (4 champs) ===
  grillesTarifaires?: Array<{
    typeService: string;
    tarifsApplicables: any;
  }>;
  conditionsPreferentielles?: Array<{
    typeCondition: string;
    description: string;
    avantages?: string;
  }>;
  modalitesPaiement?: string[];                  // Modalités paiement acceptées
  delaisReglement?: string;                      // Délais règlement
  
  // === SECTION 10: Documents et Conformité (7 champs) ===
  documentsLegaux?: Array<{
    typeDocument: string;
    numeroReference?: string;
    dateEmission?: string;
    urlDocument?: string;
  }>;
  certificationsObtenues?: string[];             // Certifications obtenues
  accordsConformite?: Array<{
    typeAccord: string;
    description: string;
  }>;
  licencesSpeciales?: string[];                  // Licences spéciales
  derniereInspection?: string;                   // Date dernière inspection
  rapportsConformiteAnnuels?: Array<{
    annee: number;
    statut: string;
  }>;
  notesConformite?: string;                      // Notes de conformité
  
  // === SECTION 11: Informations de Contact Étendues (2 champs) ===
  contactsPrincipaux?: Array<{
    nom: string;
    fonction: string;
    email: string;
    telephone?: string;
  }>;
  presenceEnLigne?: {
    siteWeb?: string;
    reseauxSociaux?: {
      facebook?: string;
      linkedin?: string;
      twitter?: string;
    };
  };
  
  // === SECTION 12: Métadonnées et Synchronisation (5 champs) ===
  statut?: string;                               // Statut général institution
  derniereActualisation?: string;                // Date dernière actualisation
  sourceData?: string;                           // Source des données
  versionData?: string;                          // Version des données
  notesAdministratives?: string;                 // Notes administratives internes
  
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

### 3. Structure Patrimoine (PatrimoineStructured)

Structure complète du patrimoine reçue via Kafka pour les PME.

```typescript
interface PatrimoineStructured {
  // Actifs Professionnels
  actifsProfessionnels?: Array<{
    id: string;
    nom: string;
    description?: string;
    categorie: string;              // 'immobilier', 'vehicule', 'equipement', 'materiel_informatique', etc.
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
    documentsAssocies?: string[];
    metadata?: Record<string, any>;
  }>;
  
  // Stocks
  stocks?: Array<{
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
  }>;
  
  // Synthèse Valorisation
  synthese?: {
    totalActifsProfessionnels?: number;
    totalStocks?: number;
    patrimoineTotal?: number;
    derniereEvaluation?: string;
    nombreActifs?: number;
    nombreStocks?: number;
    evolutionAnnuelle?: number;     // Pourcentage d'évolution
  };
  
  // Métadonnées
  metadata?: {
    derniereMiseAJour?: string;
    methodeEvaluation?: string;
    frequenceEvaluation?: string;
    prochainInventaire?: string;
  };
}
```

### 4. Données de Patrimoine (AssetData v2.1)

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

#### 3. Obtenir les Statistiques Globales

```http
GET /admin/customer-profiles/stats
```

**Réponse :**
```typescript
interface ProfileStatsResponse {
  totalProfiles: number;
  byType: {
    PME: number;
    FINANCIAL_INSTITUTION: number;
  };
  byAdminStatus: {
    under_review: number;
    validated: number;
    suspended: number;
    rejected: number;
  };
  byComplianceRating: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  averageCompleteness: number;
  profilesWithRiskFlags: number;
  recentSyncs: {
    last24h: number;
    last7days: number;
    last30days: number;
  };
}
```

#### 4. Rechercher des Profils

```http
GET /admin/customer-profiles/search
```

**Paramètres de requête :**
```typescript
interface SearchProfilesQuery {
  query: string;              // Terme de recherche
  fields?: string[];          // Champs à rechercher (name, email, etc.)
  customerType?: 'PME' | 'FINANCIAL_INSTITUTION';
  limit?: number;             // Défaut: 20
}
```

**Réponse :**
```typescript
interface SearchResultsResponse {
  results: Array<{
    customerId: string;
    name: string;
    email: string;
    customerType: string;
    adminStatus: string;
    profileCompleteness: number;
    matchedFields: string[];  // Champs où la correspondance a été trouvée
    relevanceScore: number;   // Score de pertinence (0-100)
  }>;
  totalResults: number;
  searchTime: number;         // Temps de recherche en ms
}
```

#### 5. Obtenir l'Historique d'un Profil

```http
GET /admin/customer-profiles/{customerId}/history
```

**Réponse :**
```typescript
interface ProfileHistoryResponse {
  customerId: string;
  events: Array<{
    id: string;
    type: string;             // 'created', 'updated', 'status_changed', 'synced', etc.
    timestamp: string;
    actor?: string;           // ID admin qui a effectué l'action
    changes?: Record<string, { from: any; to: any }>;
    metadata?: Record<string, any>;
  }>;
  total: number;
}
```

### Contrôleur v2.1 : CustomerProfileV2Controller

Base URL: `/admin/v2/customer-profiles`

Ce contrôleur fournit des endpoints optimisés pour la gestion des profils clients avec support complet des structures v2.0.

#### 1. Obtenir un Profil Complet v2

```http
GET /admin/v2/customer-profiles/{customerId}
```

**Réponse :**
```typescript
// Retourne AdminCustomerProfileDto avec toutes les sections v2.0/v2.1
// incluant institutionProfile avec 90+ champs français
```

#### 2. Lister les Profils v2 avec Filtres Avancés

```http
GET /admin/v2/customer-profiles
```

**Paramètres de requête :**
```typescript
interface ListProfilesV2Query {
  page?: number;
  limit?: number;
  customerType?: 'PME' | 'FINANCIAL_INSTITUTION';
  adminStatus?: string[];           // Array de statuts
  complianceRating?: string[];      // Array de ratings
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  
  // Filtres v2.1 avancés
  hasFinancialMetrics?: boolean;
  hasInventoryMetrics?: boolean;
  hasSubscriptions?: boolean;
  subscriptionStatus?: string;
  minTotalBilan?: number;
  maxTotalBilan?: number;
  nombreAgencesMin?: number;
  typeInstitution?: string[];       // Array de types d'institutions
  zonesCouverture?: string[];       // Filtrer par zones géographiques
}
```

#### 3. Obtenir les Métriques Financières

```http
GET /admin/v2/customer-profiles/{customerId}/financial-metrics
```

**Réponse :**
```typescript
interface FinancialMetricsResponse {
  customerId: string;
  customerType: string;
  
  // Pour institutions
  institutionMetrics?: {
    capitalSocialActuel?: number;
    fondsPropresMontant?: number;
    totalBilan?: number;
    chiffreAffairesAnnuel?: number;
    ratioSolvabilite?: number;
    totalDepots?: number;
    totalCreditsOctroyes?: number;
  };
  
  // Pour PME
  companyMetrics?: {
    stockValorisation?: number;
    actifsProfessionnelsValorisation?: number;
    patrimoineTotal?: number;
    derniereEvaluation?: string;
    chiffreAffairesAnnuel?: number;
    beneficeNet?: number;
    totalActifs?: number;
    totalPassifs?: number;
  };
  
  lastUpdated: string;
}
```

#### 4. Obtenir les Données de Partenariat

```http
GET /admin/v2/customer-profiles/{customerId}/partnership
```

**Réponse :**
```typescript
interface PartnershipDataResponse {
  customerId: string;
  motivationPrincipale?: string;
  servicesPrioritaires?: string[];
  autresBesoins?: string;
  referencePartenaire?: string;
  volumeTransactionsEstime?: string;
  typeClienteleCible?: string[];
  besoinsSpecifiques?: string;
}
```

#### 5. Mettre à Jour les Alertes

```http
PATCH /admin/v2/customer-profiles/{customerId}/alerts
```

**Corps de la requête :**
```typescript
interface UpdateAlertsRequest {
  action: 'add' | 'resolve' | 'remove';
  alertId?: string;                    // Pour resolve/remove
  newAlert?: {                         // Pour add
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
  };
  resolvedBy?: string;                 // ID admin pour resolve
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

## DTOs de Synchronisation Kafka v2.1

### CompanyCoreFullSyncDto

DTO reçu lors de la synchronisation complète d'un profil PME depuis customer-service.

```typescript
export class CompanyCoreFullSyncDto {
  customerId: string;
  name: string;
  email: string;
  phone?: string;
  logo?: string;
  address?: any;
  status: string;
  
  // Informations légales
  legalForm?: string;
  industry?: string;
  rccm?: string;
  taxId?: string;
  natId?: string;
  yearFounded?: number;
  
  // Structure organisationnelle
  owner?: {
    nom: string;
    prenom: string;
    fonction: string;
    pourcentageActions?: number;
  };
  associates?: Array<{
    nom: string;
    prenom: string;
    fonction: string;
    pourcentageActions: number;
  }>;
  
  // Informations financières
  capital?: {
    montant: number;
    devise: string;
  };
  employeeCount?: number;
  
  // Métadonnées de synchronisation
  syncMetadata?: {
    lastSyncFromCustomerService: string;
    dataSource: string;
    dataVersion: string;
  };
  
  timestamp: string;
}
```

### InstitutionCoreFullSyncDto

DTO reçu lors de la synchronisation complète d'un profil Institution depuis customer-service (**90+ champs v2.0**).

```typescript
export class InstitutionCoreFullSyncDto {
  customerId: string;
  
  // === SECTION 1: Identification Légale ===
  denominationSociale: string;
  sigle?: string;
  numeroAgrement: string;
  numeroNIF?: string;
  numeroRCCM?: string;
  typeInstitution: string;
  dateAgrement?: string;
  autoriteSupervision?: string;
  activitesAutorisees?: string[];
  categorieInstitution?: string;
  
  // === SECTION 2: Informations Financières ===
  capitalSocialMinimum?: number;
  capitalSocialActuel?: number;
  fondsPropresMontant?: number;
  totalBilan?: number;
  chiffreAffairesAnnuel?: number;
  ratioSolvabilite?: number;
  totalDepots?: number;
  totalCreditsOctroyes?: number;
  
  // === SECTION 3: Effectif et Infrastructure ===
  nombreAgences?: number;
  nombrePointsService?: number;
  nombreGuichetsAutomatiques?: number;
  effectifTotal?: number;
  nombreCadres?: number;
  nombreAgentsOperationnels?: number;
  
  // === SECTION 4: Actionnariat ===
  structureActionnariat?: Array<{
    nom: string;
    pourcentageDetention: number;
    typeActionnaire: string;
    nationalite?: string;
  }>;
  principauxActionnaires?: Array<{
    nom: string;
    pourcentageDetention: number;
    origine?: string;
  }>;
  partenairesStrategiques?: Array<{
    nom: string;
    typePartenariat: string;
    domaineCollaboration?: string;
  }>;
  
  // === SECTION 5: Gouvernance ===
  conseilAdministration?: Array<{
    nom: string;
    prenom: string;
    fonction: string;
    dateNomination?: string;
  }>;
  directionGenerale?: Array<{
    nom: string;
    prenom: string;
    fonction: string;
    dateNomination?: string;
  }>;
  comitesSpecialises?: Array<{
    nomComite: string;
    typeComite: string;
    president?: string;
  }>;
  auditeurs?: Array<{
    nom: string;
    type: string;
    cabinet?: string;
  }>;
  
  // === SECTION 6: Réseau Géographique ===
  siegeSocial?: {
    adresseComplete: string;
    commune: string;
    ville: string;
    pays: string;
    telephone?: string;
    email?: string;
  };
  agences?: Array<{
    nom: string;
    adresseComplete: string;
    ville: string;
    province?: string;
    telephone?: string;
    typeAgence: string;
    dateOuverture?: string;
  }>;
  zonesCouverture?: string[];
  
  // === SECTION 7: Services et Produits ===
  servicesOfferts?: string[];
  produitsBancaires?: string[];
  servicesCredit?: string[];
  servicesInvestissement?: string[];
  servicesGarantie?: string[];
  servicesTransactionnels?: string[];
  servicesConseil?: string[];
  
  // === SECTION 8: Partenariat Wanzo ===
  motivationPrincipale?: string;
  servicesPrioritaires?: string[];
  volumeTransactionsEstime?: string;
  typeClienteleCible?: string[];
  besoinsSpecifiques?: string;
  autresBesoins?: string;
  referencePartenaire?: string;
  
  // === SECTION 9: Conditions Commerciales ===
  grillesTarifaires?: Array<{
    typeService: string;
    tarifsApplicables: any;
  }>;
  conditionsPreferentielles?: Array<{
    typeCondition: string;
    description: string;
    avantages?: string;
  }>;
  modalitesPaiement?: string[];
  delaisReglement?: string;
  
  // === SECTION 10: Documents et Conformité ===
  documentsLegaux?: Array<{
    typeDocument: string;
    numeroReference?: string;
    dateEmission?: string;
    urlDocument?: string;
  }>;
  certificationsObtenues?: string[];
  accordsConformite?: Array<{
    typeAccord: string;
    description: string;
  }>;
  licencesSpeciales?: string[];
  derniereInspection?: string;
  rapportsConformiteAnnuels?: Array<{
    annee: number;
    statut: string;
  }>;
  notesConformite?: string;
  
  // === SECTION 11: Contact ===
  contactsPrincipaux?: Array<{
    nom: string;
    fonction: string;
    email: string;
    telephone?: string;
  }>;
  presenceEnLigne?: {
    siteWeb?: string;
    reseauxSociaux?: any;
  };
  
  // === SECTION 12: Métadonnées ===
  statut?: string;
  derniereActualisation?: string;
  sourceData?: string;
  versionData?: string;
  notesAdministratives?: string;
  
  // Informations de base synchronisées
  email: string;
  phone?: string;
  logo?: string;
  address?: any;
  status: string;
  
  // Métadonnées de synchronisation
  syncMetadata?: {
    lastSyncFromCustomerService: string;
    dataSource: string;
    dataVersion: string;
  };
  
  timestamp: string;
}
```

### CompanyAssetsSyncDto

DTO reçu lors de la synchronisation des actifs d'une PME.

```typescript
export class CompanyAssetsSyncDto {
  customerId: string;
  syncType: 'full' | 'incremental' | 'partial';
  
  assets: Array<{
    id: string;
    nom: string;
    description: string;
    categorie: string;
    sousCategorie?: string;
    prixAchat: number;
    dateAcquisition: string;
    valeurActuelle: number;
    dateEvaluation: string;
    etatActuel: string;
    proprietaire: string;
    localisation?: string;
    numeroSerie?: string;
    garantie?: {
      dateExpiration: string;
      fournisseur: string;
    };
    documentsAssocies?: string[];
    metadata?: Record<string, any>;
  }>;
  
  deletedAssetIds?: string[];   // IDs des actifs supprimés (pour sync incrémental)
  
  totalValorisation: number;
  dateEvaluation: string;
  
  timestamp: string;
}
```

### CompanyStocksSyncDto

DTO reçu lors de la synchronisation des stocks d'une PME.

```typescript
export class CompanyStocksSyncDto {
  customerId: string;
  syncType: 'full' | 'incremental' | 'partial';
  
  stocks: Array<{
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
    etatStock: string;
    metadata?: Record<string, any>;
  }>;
  
  deletedStockIds?: string[];   // IDs des stocks supprimés (pour sync incrémental)
  
  valeurTotaleInventaire: number;
  dernierInventaire: string;
  
  timestamp: string;
}
```

### AdminCustomerProfileListDto

DTO utilisé pour les listes de profils (endpoint GET /admin/customer-profiles).

```typescript
export class AdminCustomerProfileListDto {
  customerId: string;
  profileType: string;
  customerType: string;
  
  name: string;
  email: string;
  phone?: string;
  logo?: string;
  status: string;
  
  adminStatus: string;
  complianceRating: string;
  profileCompleteness: number;
  riskFlagsCount: number;
  
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Métriques rapides
  quickMetrics?: {
    totalPatrimoine?: number;
    totalBilan?: number;
    nombreAgences?: number;
  };
}
```

### ProfileIncrementalUpdateDto

DTO reçu lors de mises à jour incrémentielles de profils.

```typescript
export class ProfileIncrementalUpdateDto {
  customerId: string;
  updateType: 'partial_update' | 'field_update' | 'metadata_update';
  
  updatedFields: {
    fieldPath: string;          // Chemin du champ (e.g., "companyProfile.capital.montant")
    oldValue?: any;
    newValue: any;
    updateReason?: string;
  }[];
  
  timestamp: string;
  updatedBy?: string;
}
```

### ProfileCriticalChangesDto

DTO reçu lors de changements critiques nécessitant attention administrative.

```typescript
export class ProfileCriticalChangesDto {
  customerId: string;
  changeType: 'status_change' | 'financial_threshold' | 'compliance_issue' | 'risk_detected';
  
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
    requiresAction: boolean;
    suggestedAction?: string;
  }>;
  
  timestamp: string;
  alertLevel: 'info' | 'warning' | 'critical';
}
```

### ProfileRevalidationRequestDto

DTO reçu lors de demandes de revalidation de profil.

```typescript
export class ProfileRevalidationRequestDto {
  customerId: string;
  requestReason: string;
  requestedBy: 'customer' | 'system' | 'admin';
  
  changedSections?: string[];    // Sections du profil ayant changé
  documentsToReview?: string[];  // IDs des documents à réviser
  
  priority: 'low' | 'normal' | 'high' | 'urgent';
  deadline?: string;
  
  timestamp: string;
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

### 1. Lister tous les Profils avec Pagination

```javascript
const response = await fetch('/admin/customer-profiles?' + new URLSearchParams({
  page: '1',
  limit: '20',
  sortBy: 'createdAt',
  sortOrder: 'DESC'
}), {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const data = await response.json();
console.log(`Total profils: ${data.pagination.total}`);
console.log(`Profils sur cette page: ${data.profiles.length}`);
```

### 2. Rechercher des Institutions Financières par Type

```javascript
const response = await fetch('/admin/v2/customer-profiles?' + new URLSearchParams({
  customerType: 'FINANCIAL_INSTITUTION',
  typeInstitution: ['BANQUE', 'IMF'],
  nombreAgencesMin: '5',
  page: '1',
  limit: '50'
}), {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const institutions = await response.json();
```

### 3. Obtenir un Profil Complet avec toutes les Données v2.0

```javascript
const customerId = '550e8400-e29b-41d4-a716-446655440000';
const response = await fetch(`/admin/v2/customer-profiles/${customerId}`, {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const profile = await response.json();

// Accéder aux données Institution v2.0 (90+ champs français)
if (profile.customerType === 'FINANCIAL_INSTITUTION') {
  console.log('Dénomination:', profile.institutionProfile.denominationSociale);
  console.log('Capital actuel:', profile.institutionProfile.capitalSocialActuel);
  console.log('Nombre agences:', profile.institutionProfile.nombreAgences);
  console.log('Services Wanzo prioritaires:', profile.institutionProfile.servicesPrioritaires);
}

// Accéder aux métriques financières
if (profile.financialMetrics) {
  console.log('Total bilan:', profile.financialMetrics.totalBilan);
  console.log('Fonds propres:', profile.financialMetrics.fondsPropresMontant);
}
```

### 4. Obtenir les Statistiques Globales

```javascript
const response = await fetch('/admin/customer-profiles/stats', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const stats = await response.json();
console.log('Total profils:', stats.totalProfiles);
console.log('PME:', stats.byType.PME);
console.log('Institutions:', stats.byType.FINANCIAL_INSTITUTION);
console.log('Complétude moyenne:', stats.averageCompleteness + '%');
```

### 5. Rechercher des Profils par Nom ou Email

```javascript
const response = await fetch('/admin/customer-profiles/search?' + new URLSearchParams({
  query: 'banque centrale',
  fields: ['name', 'email'],
  customerType: 'FINANCIAL_INSTITUTION',
  limit: '10'
}), {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const results = await response.json();
results.results.forEach(result => {
  console.log(`${result.name} - Score: ${result.relevanceScore}/100`);
});
```

### 6. Obtenir l'Historique d'un Profil

```javascript
const customerId = '550e8400-e29b-41d4-a716-446655440000';
const response = await fetch(`/admin/customer-profiles/${customerId}/history`, {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const history = await response.json();
history.events.forEach(event => {
  console.log(`[${event.timestamp}] ${event.type}:`, event.changes);
});
```

### 7. Obtenir les Métriques Financières d'une Institution (v2.1)

```javascript
const customerId = '550e8400-e29b-41d4-a716-446655440000';
const response = await fetch(`/admin/v2/customer-profiles/${customerId}/financial-metrics`, {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const metrics = await response.json();
if (metrics.institutionMetrics) {
  console.log('Capital social actuel:', metrics.institutionMetrics.capitalSocialActuel);
  console.log('Total bilan:', metrics.institutionMetrics.totalBilan);
  console.log('Ratio de solvabilité:', metrics.institutionMetrics.ratioSolvabilite);
}
```

### 8. Filtrer par Zones de Couverture Géographique

```javascript
const response = await fetch('/admin/v2/customer-profiles?' + new URLSearchParams({
  customerType: 'FINANCIAL_INSTITUTION',
  zonesCouverture: ['Kinshasa', 'Lubumbashi'],
  minTotalBilan: '1000000',
  page: '1',
  limit: '25'
}), {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const institutions = await response.json();
```

### 9. Gérer les Alertes d'un Profil (v2.1)

```javascript
// Ajouter une alerte
const response = await fetch(`/admin/v2/customer-profiles/${customerId}/alerts`, {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'add',
    newAlert: {
      type: 'compliance_review',
      message: 'Révision annuelle de conformité requise',
      severity: 'warning'
    }
  })
});

// Résoudre une alerte
const resolveResponse = await fetch(`/admin/v2/customer-profiles/${customerId}/alerts`, {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'resolve',
    alertId: 'alert-123',
    resolvedBy: 'admin-456'
  })
});
```

### 10. Obtenir les Données de Partenariat Wanzo (v2.1)

```javascript
const customerId = '550e8400-e29b-41d4-a716-446655440000';
const response = await fetch(`/admin/v2/customer-profiles/${customerId}/partnership`, {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const partnership = await response.json();
console.log('Motivation:', partnership.motivationPrincipale);
console.log('Services prioritaires:', partnership.servicesPrioritaires);
console.log('Volume estimé:', partnership.volumeTransactionsEstime);
console.log('Clientèle cible:', partnership.typeClienteleCible);
```

---

## Notes de Version

### v2.1 (Novembre 2025) - Actuel

**Nouvelles Fonctionnalités:**
- ✅ Contrôleur v2.1 (`CustomerProfileV2Controller`) avec endpoints optimisés
- ✅ Support complet des structures Institution v2.0 (90+ champs français)
- ✅ Séparation `financialMetrics` (institutions) / `inventoryMetrics` (PME)
- ✅ Gestion des alertes administratives
- ✅ Données de partenariat Wanzo détaillées
- ✅ Filtres avancés (zones géographiques, types d'institutions, bilans)
- ✅ Métriques financières dédiées par type de client
- ✅ 17+ événements Kafka pour synchronisation complète

**Améliorations:**
- ✅ Performance des recherches améliorée
- ✅ Pagination optimisée (jusqu'à 100 résultats/page)
- ✅ Historique complet des changements
- ✅ Statistiques en temps réel

**Structures de Données:**
- ✅ `InstitutionProfileStructured`: 12 sections, 90+ champs (100% français)
- ✅ `CustomerDetailedProfile`: 90+ champs incluant souscriptions, users, tokens
- ✅ 10+ DTOs pour synchronisation Kafka

### v2.0 (Octobre 2025)

**Fonctionnalités Initiales:**
- ✅ Entité `CustomerDetailedProfile` unifiée
- ✅ Synchronisation Kafka basique (7 événements)
- ✅ Endpoints CRUD de base
- ✅ Profils PME et Institutions séparés

---

Cette documentation reflète exactement l'implémentation réelle du système v2.1, avec les structures de données synchronisées via Kafka, les 17+ événements Kafka, les 90+ champs français des institutions v2.0, et toutes les fonctionnalités disponibles dans l'admin-service.