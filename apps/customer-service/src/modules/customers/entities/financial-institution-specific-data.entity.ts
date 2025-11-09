import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum InstitutionType {
  BANK = 'bank',
  INSURANCE = 'insurance',
  INVESTMENT_FUND = 'investment_fund',
  MICROFINANCE = 'microfinance',
  PENSION_FUND = 'pension_fund',
  CREDIT_UNION = 'credit_union',
  OTHER = 'other'
}

export enum InstitutionCategory {
  COMMERCIAL = 'commercial',
  DEVELOPMENT = 'development',
  COOPERATIVE = 'cooperative',
  PRIVATE = 'private',
  PUBLIC = 'public',
  OTHER = 'other'
}

/**
 * Entité FinancialInstitutionSpecificData - Données spécifiques aux institutions financières
 */
@Entity('financial_institution_specific_data')
export class FinancialInstitutionSpecificData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: InstitutionType,
    nullable: true
  })
  type!: InstitutionType;

  @Column({
    type: 'enum',
    enum: InstitutionCategory,
    nullable: true
  })
  category?: InstitutionCategory;

  @Column({ nullable: true })
  licenseNumber!: string;

  @Column({ nullable: true })
  establishedDate!: Date;

  // Website et présence digitale
  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true })
  facebookPage?: string;

  @Column({ nullable: true })
  linkedinPage?: string;

  @Column({ nullable: true })
  twitterHandle?: string;

  @Column({ nullable: true })
  instagramHandle?: string;

  // NOUVEAUX CHAMPS v2.1 - Conformité documentation
  @Column({ nullable: true })
  denominationSociale?: string;

  @Column({ nullable: true })
  sigleLegalAbrege?: string;

  @Column({ nullable: true })
  typeInstitution?: string;

  @Column({ nullable: true })
  autorisationExploitation?: string;

  @Column({ type: 'date', nullable: true })
  dateOctroi?: Date;

  @Column({ nullable: true })
  autoriteSupervision?: string;

  @Column({ type: 'date', nullable: true })
  dateAgrement?: Date;

  @Column('jsonb', { nullable: true })
  coordonneesGeographiques?: {
    latitude?: number;
    longitude?: number;
    adresseComplete?: string;
  };

  @Column('jsonb', { nullable: true })
  capaciteFinanciere?: {
    capitalSocial?: number;
    fondsPropresDeclares?: number;
    limitesOperationnelles?: string[];
    monnaieReference?: 'USD' | 'CDF' | 'EUR';
  };

  @Column('simple-array', { nullable: true })
  zonesCouverture?: string[];

  @Column('simple-array', { nullable: true })
  typeOperation?: string[];

  @Column({ 
    type: 'enum',
    enum: ['actif', 'suspendu', 'en_arret', 'liquidation'],
    default: 'actif'
  })
  statutOperationnel?: 'actif' | 'suspendu' | 'en_arret' | 'liquidation';

  // Informations réglementaires étendues
  @Column('jsonb', { nullable: true })
  regulatoryInfo?: {
    bccLicense?: string;
    bccRegistrationDate?: Date;
    regulatoryStatus?: 'active' | 'suspended' | 'pending';
    licenseExpiryDate?: Date;
    lastInspectionDate?: Date;
    complianceRating?: string;
    authorizedActivities?: string[];
  };

  // Couleurs de marque et identité visuelle  
  @Column('jsonb', { nullable: true })
  brandColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };

  // Capital et structure financière détaillée
  @Column('jsonb', { nullable: true })
  capitalStructure?: {
    authorizedCapital?: {
      amount: number;
      currency: 'USD' | 'CDF' | 'EUR';
    };
    paidUpCapital?: {
      amount: number;
      currency: 'USD' | 'CDF' | 'EUR';
    };
    shareholders?: Array<{
      name: string;
      percentage: number;
      type: 'individual' | 'corporate' | 'government';
    }>;
  };

  @Column('jsonb', { nullable: true })
  branches?: Array<{
    id: string;
    name: string;
    address: {
      street: string;
      commune: string;
      city: string;
      province: string;
      country: string;
    };
    coordinates?: {
      lat: number;
      lng: number;
    };
    manager?: string;
    phone?: string;
    email?: string;
    openingHours?: string;
  }>;

  @Column('jsonb', { nullable: true })
  contacts?: {
    general?: {
      email?: string;
      phone?: string;
    };
    customerService?: {
      email?: string;
      phone?: string;
      whatsapp?: string;
    };
    investorRelations?: {
      email?: string;
      phone?: string;
    };
  };

  @Column('jsonb', { nullable: true })
  leadership?: {
    ceo?: {
      id?: string;
      name?: string;
      gender?: string;
      title?: string;
      bio?: string;
      email?: string;
      phone?: string;
      linkedin?: string;
      photo?: string;
      yearsOfExperience?: number;
      previousRoles?: Array<{
        company: string;
        position: string;
        duration: string;
      }>;
      education?: Array<{
        institution: string;
        degree: string;
        year?: number;
      }>;
      specializations?: string[];
    };
    executiveTeam?: Array<{
      id?: string;
      name?: string;
      gender?: string;
      title?: string;
      department?: string;
      email?: string;
      phone?: string;
      yearsOfExperience?: number;
      specializations?: string[];
      reportingTo?: string;
    }>;
    boardMembers?: Array<{
      id?: string;
      name: string;
      position: string;
      organization?: string;
      appointmentDate?: Date;
      termEnd?: Date;
      isIndependent?: boolean;
      expertise?: string[];
    }>;
    advisoryBoard?: Array<{
      name: string;
      expertise: string;
      organization?: string;
    }>;
  };

  @Column('jsonb', { nullable: true })
  services?: {
    personalBanking?: string[];
    businessBanking?: string[];
    specializedServices?: string[];
    digitalServices?: {
      mobileBanking?: boolean;
      internetBanking?: boolean;
      cardlessWithdrawal?: boolean;
      mobilePayments?: boolean;
      apiIntegration?: boolean;
    };
    creditProducts?: Array<{
      name: string;
      type: 'personal' | 'business' | 'mortgage' | 'micro';
      minAmount?: number;
      maxAmount?: number;
      currency: 'USD' | 'CDF' | 'EUR';
      interestRate?: number;
      collateralRequired?: boolean;
    }>;
    investmentProducts?: Array<{
      name: string;
      type: 'savings' | 'fixed_deposit' | 'investment_fund' | 'pension';
      minimumInvestment?: number;
      expectedReturn?: number;
      riskLevel: 'low' | 'medium' | 'high';
    }>;
  };

  @Column('jsonb', { nullable: true })
  financialInfo?: {
    assets?: number;
    capital?: number;
    currency?: string;
    yearFounded?: number;
    totalDeposits?: number;
    totalLoans?: number;
    numberOfCustomers?: number;
    numberOfEmployees?: number;
    branchesCount?: number;
    atmsCount?: number;
    marketShare?: number;
    profitabilityMetrics?: {
      roi?: number; // Return on Investment
      roe?: number; // Return on Equity  
      npl?: number; // Non-Performing Loans ratio
      costToIncomeRatio?: number;
    };
    regulatoryCompliance?: {
      bcc?: boolean;
      fatca?: boolean;
      aml?: boolean;
      kyc?: boolean;
      basel?: 'basel_i' | 'basel_ii' | 'basel_iii';
      ifrs?: boolean;
      lastAuditDate?: Date;
      auditFirm?: string;
    };
  };

  @Column('jsonb', { nullable: true })
  creditRating?: {
    agency?: string;
    rating?: string;
    outlook?: string;
    lastUpdated?: Date;
    ratingHistory?: Array<{
      rating: string;
      date: Date;
      reason?: string;
    }>;
  };

  @Column('jsonb', { nullable: true })
  digitalPresence?: {
    hasMobileBanking?: boolean;
    hasInternetBanking?: boolean;
    mobileAppRating?: number;
    appDownloads?: number;
    digitalTransactionVolume?: number;
    apiIntegrations?: string[];
    technologicalCapabilities?: {
      coreSystem?: string;
      paymentProcessors?: string[];
      securityCertifications?: string[];
      cloudInfrastructure?: boolean;
    };
    appLinks?: {
      android?: string;
      ios?: string;
      web?: string;
    };
  };

  // Informations sur les partenariats et affiliations
  @Column('jsonb', { nullable: true })
  partnerships?: {
    bankingNetworks?: string[];
    paymentPartners?: string[];
    technologyPartners?: string[];
    internationalCorrespondents?: Array<{
      bankName: string;
      country: string;
      services: string[];
    }>;
  };

  // Certifications et accréditations
  @Column('jsonb', { nullable: true })
  certifications?: {
    iso?: string[];
    industryAccreditations?: string[];
    awardsReceived?: Array<{
      award: string;
      year: number;
      category: string;
    }>;
  };

  @Column({ nullable: true })
  primaryRegulator!: string;

  @Column({ nullable: true })
  yearEstablished!: number;

  @Column({ nullable: true })
  branchCount!: number;

  @Column({ nullable: true })
  clientCount!: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  assetUnderManagement!: number;

  @Column('jsonb', { nullable: true })
  reportingRequirements!: Array<{
    type: string;
    frequency: string;
    lastSubmitted: Date;
    nextDue: Date;
  }>;

  @Column('jsonb', { nullable: true })
  complianceInfo!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
