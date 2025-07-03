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
    };
    executiveTeam?: Array<{
      id?: string;
      name?: string;
      gender?: string;
      title?: string;
      department?: string;
      email?: string;
      phone?: string;
    }>;
    boardMembers?: Array<{
      name: string;
      position: string;
      organization?: string;
    }>;
  };

  @Column('jsonb', { nullable: true })
  services?: {
    personalBanking?: string[];
    businessBanking?: string[];
    specializedServices?: string[];
  };

  @Column('jsonb', { nullable: true })
  financialInfo?: {
    assets?: number;
    capital?: number;
    currency?: string;
    yearFounded?: number;
    regulatoryCompliance?: {
      bcc?: boolean;
      fatca?: boolean;
      aml?: boolean;
    };
  };

  @Column('jsonb', { nullable: true })
  creditRating?: {
    agency?: string;
    rating?: string;
    outlook?: string;
    lastUpdated?: Date;
  };

  @Column('jsonb', { nullable: true })
  digitalPresence?: {
    hasMobileBanking?: boolean;
    hasInternetBanking?: boolean;
    appLinks?: {
      android?: string;
      ios?: string;
    };
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
