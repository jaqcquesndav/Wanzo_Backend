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
  equipment?: Array<{
    category: string;
    description: string;
    quantity: number;
    unitValue: number;
    totalValue: number;
    currency: string;
    acquisitionDate: Date;
    condition: 'new' | 'good' | 'fair' | 'poor';
  }>;
  vehicles?: Array<{
    type: 'car' | 'truck' | 'motorcycle' | 'other';
    brand: string;
    model: string;
    year: number;
    value: number;
    currency: string;
    isOwned: boolean;
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