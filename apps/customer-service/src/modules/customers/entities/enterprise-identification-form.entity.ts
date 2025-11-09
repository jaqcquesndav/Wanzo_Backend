import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';

export enum LegalFormOHADA {
  SARL = 'SARL',
  SA = 'SA',
  SNC = 'SNC',
  SCS = 'SCS',
  GIE = 'GIE',
  EURL = 'EURL'
}

export enum CompanyType {
  STARTUP = 'startup',
  TRADITIONAL = 'traditional'
}

// NOUVEAU v2.1 - Interface pour les secteurs d'activité étendus
export interface ActivitiesExtended {
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

export interface GeneralInfo {
  companyName: string;
  tradeName?: string;
  legalForm: LegalFormOHADA;
  companyType: CompanyType;
  sector: string;
  foundingDate?: Date;
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
  mainContact: {
    name: string;
    position: string;
    email: string;
    phone: string;
    alternativePhone?: string;
  };
  digitalPresence?: {
    website?: string;
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    twitter?: string;
  };
}

export interface LegalInfo {
  rccm?: string;
  taxNumber?: string;
  nationalId?: string;
  employerNumber?: string;
  socialSecurityNumber?: string;
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
  taxCompliance: {
    isUpToDate: boolean;
    lastFilingDate?: Date;
    nextFilingDue?: Date;
  };
  legalStatus: {
    hasLegalIssues: boolean;
    issues?: string[];
    hasGovernmentContracts: boolean;
    contractTypes?: string[];
  };
}

export interface PatrimonyAndMeans {
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
  realEstate?: Array<{
    type: 'office' | 'warehouse' | 'factory' | 'store' | 'land';
    address: string;
    surface: number;
    value: number;
    currency: string;
    isOwned: boolean;
    monthlyRent?: number;
  }>;
  // Mise à jour v2.1 - Actifs immobilisés détaillés avec patrimoine
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
  // Mise à jour v2.1 - Véhicules avec structure détaillée
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

  // NOUVEAU v2.1 - Stocks et Inventaires (Actifs Circulants)
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
  humanResources: {
    totalEmployees: number;
    permanentEmployees: number;
    temporaryEmployees: number;
    consultants: number;
    keyPersonnel: Array<{
      name: string;
      position: string;
      experience: number;
      education: string;
      isShareholder: boolean;
    }>;
  };
}

export interface StartupSpecificities {
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
}

export interface TraditionalSpecificities {
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
    repeatCustomerRate: number;
    averageCustomerValue: number;
    customerTypes: ('b2b' | 'b2c' | 'government')[];
  };
}

export interface Specificities {
  startup?: StartupSpecificities;
  traditional?: TraditionalSpecificities;
}

export interface Performance {
  financial: {
    revenue: Array<{
      year: number;
      amount: number;
      currency: string;
      isProjected: boolean;
    }>;
    profitability: Array<{
      year: number;
      grossProfit: number;
      netProfit: number;
      currency: string;
      margins: {
        gross: number;
        net: number;
      };
    }>;
    cashFlow: {
      monthly: Array<{
        month: string;
        inflow: number;
        outflow: number;
        netFlow: number;
      }>;
    };
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
  operational: {
    productivity: {
      outputPerEmployee?: number;
      revenuePerEmployee?: number;
      utilizationRate?: number;
    };
    quality: {
      defectRate?: number;
      customerSatisfaction?: number;
      returnRate?: number;
    };
    efficiency: {
      orderFulfillmentTime?: number;
      inventoryTurnover?: number;
      costPerUnit?: number;
    };
  };
  market: {
    growth: {
      customerGrowthRate: number;
      marketExpansion: string[];
      newProductsLaunched: number;
    };
    digital: {
      onlinePresence: {
        website: boolean;
        ecommerce: boolean;
        socialMedia: string[];
      };
      digitalSales?: number;
    };
  };
}

/**
 * Entité EnterpriseIdentificationForm - Formulaire d'identification étendu pour les entreprises
 */
@Entity('enterprise_identification_forms')
export class EnterpriseIdentificationForm {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  customerId!: string;

  @Column('jsonb')
  generalInfo!: GeneralInfo;

  @Column('jsonb', { nullable: true })
  legalInfo?: LegalInfo;

  @Column('jsonb', { nullable: true })
  patrimonyAndMeans?: PatrimonyAndMeans;

  @Column('jsonb', { nullable: true })
  specificities?: Specificities;

  @Column('jsonb', { nullable: true })
  performance?: Performance;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  completionPercentage!: number;

  @Column('jsonb', {
    default: {
      generalInfo: false,
      legalInfo: false,
      patrimonyAndMeans: false,
      specificities: false,
      performance: false
    }
  })
  completionStatus!: {
    generalInfo: boolean;
    legalInfo: boolean;
    patrimonyAndMeans: boolean;
    specificities: boolean;
    performance: boolean;
  };

  @OneToOne(() => Customer, customer => customer.extendedIdentification)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Méthode pour calculer le pourcentage de complétude
  calculateCompletion(): void {
    let completed = 0;
    const total = 5;

    if (this.generalInfo) {
      completed++;
      this.completionStatus.generalInfo = true;
    }
    if (this.legalInfo) {
      completed++;
      this.completionStatus.legalInfo = true;
    }
    if (this.patrimonyAndMeans) {
      completed++;
      this.completionStatus.patrimonyAndMeans = true;
    }
    if (this.specificities) {
      completed++;
      this.completionStatus.specificities = true;
    }
    if (this.performance) {
      completed++;
      this.completionStatus.performance = true;
    }

    this.completionPercentage = (completed / total) * 100;
  }
}