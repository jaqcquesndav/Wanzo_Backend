import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { InstitutionBranchEntity } from './institution-branch.entity';
import { InstitutionLeadershipEntity } from './institution-leadership.entity';
import { InstitutionServicesEntity } from './institution-services.entity';
import { InstitutionRegulatoryEntity } from './institution-regulatory.entity';

/**
 * Entité pour les informations de base des institutions financières
 * Gère les profils institutionnels, licences et contacts principaux
 */
@Entity('institutions_core')
@Index(['institutionName'], { unique: true })
@Index(['licenseNumber'], { unique: true })
@Index(['type'])
@Index(['status'])
@Index(['establishedDate'])
@Index(['city'])
export class InstitutionCoreEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // === INFORMATIONS DE BASE ===
  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  @Index()
  institutionName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  shortName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tradeName?: string;

  @Column({
    type: 'enum',
    enum: [
      'commercial_bank', 'investment_bank', 'central_bank', 'development_bank',
      'microfinance', 'credit_union', 'insurance_company', 'pension_fund',
      'investment_fund', 'brokerage', 'payment_institution', 'money_transfer',
      'forex_bureau', 'leasing_company', 'other'
    ],
    nullable: false
  })
  @Index()
  type: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'suspended', 'under_review', 'liquidation', 'closed'],
    default: 'under_review'
  })
  @Index()
  status: string;

  @Column({ type: 'date', nullable: false })
  @Index()
  establishedDate: Date;

  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  @Index()
  licenseNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  regulatoryAuthority: string;

  @Column({ type: 'date', nullable: false })
  licenseIssuedDate: Date;

  @Column({ type: 'date', nullable: true })
  licenseExpiryDate?: Date;

  // === DESCRIPTION ===
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  mission?: string;

  @Column({ type: 'text', nullable: true })
  vision?: string;

  // === ADRESSE DU SIÈGE SOCIAL ===
  @Column({ type: 'text', nullable: false })
  headquartersAddress: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  @Index()
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  province: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode?: string;

  @Column({ type: 'varchar', length: 100, default: 'RDC' })
  country: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude?: number;

  // === CONTACT ===
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  fax?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerServicePhone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerServiceEmail?: string;

  // === INFORMATIONS LÉGALES ===
  @Column({ type: 'varchar', length: 50, nullable: true })
  registrationNumber?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  legalForm?: string;

  // === CAPITAL ET FINANCES ===
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  authorizedCapital: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  paidUpCapital: number;

  @Column({ type: 'varchar', length: 10, default: 'CDF' })
  capitalCurrency: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  totalAssets?: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  totalDeposits?: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  totalLoans?: number;

  @Column({ type: 'date', nullable: true })
  lastFinancialReportDate?: Date;

  // === OPÉRATIONS ===
  @Column({ type: 'int', default: 0 })
  totalBranches: number;

  @Column({ type: 'int', default: 0 })
  totalEmployees: number;

  @Column({ type: 'int', default: 0 })
  totalCustomers: number;

  @Column({ type: 'json', nullable: true })
  operatingHours?: {
    monday?: { open: string; close: string; };
    tuesday?: { open: string; close: string; };
    wednesday?: { open: string; close: string; };
    thursday?: { open: string; close: string; };
    friday?: { open: string; close: string; };
    saturday?: { open: string; close: string; };
    sunday?: { open: string; close: string; };
  };

  // === LICENCES ET AUTORISATIONS (JSON) ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Licences et autorisations supplémentaires'
  })
  licenses?: Array<{
    id: string;
    type: 'banking' | 'insurance' | 'securities' | 'microfinance' | 'payment' | 'forex' | 'other';
    number: string;
    issuer: string;
    issuedDate: string;
    expiryDate?: string;
    status: 'active' | 'expired' | 'suspended' | 'revoked';
    scope?: string;
    conditions?: string[];
    isActive: boolean;
  }>;

  // === AFFILIATIONS ET MEMBERSHIPS (JSON) ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Affiliations et adhésions à des organisations'
  })
  affiliations?: Array<{
    id: string;
    organizationName: string;
    organizationType: string;
    membershipType: string;
    joinDate: string;
    endDate?: string;
    membershipNumber?: string;
    benefits?: string[];
    isActive: boolean;
  }>;

  // === CORRESPONDANTS BANCAIRES (JSON) ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Relations avec d\'autres institutions financières'
  })
  correspondentBanks?: Array<{
    id: string;
    bankName: string;
    country: string;
    swift?: string;
    accountNumber?: string;
    currency: string;
    relationshipType: 'nostro' | 'vostro' | 'correspondent';
    establishedDate: string;
    isActive: boolean;
  }>;

  // === TECHNOLOGIES ET SYSTÈMES ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Systèmes et technologies utilisés'
  })
  systems?: {
    coreSystem?: string;
    paymentSystems?: string[];
    channels?: string[];
    security?: string[];
    backup?: string;
  };

  // === CERTIFICATIONS (JSON) ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Certifications de qualité et conformité'
  })
  certifications?: Array<{
    id: string;
    type: string;
    name: string;
    issuer: string;
    issuedDate: string;
    expiryDate?: string;
    scope: string;
    status: 'active' | 'expired' | 'suspended';
    isActive: boolean;
  }>;

  // === PARTENAIRES STRATÉGIQUES (JSON) ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Partenaires stratégiques et alliances'
  })
  partners?: Array<{
    id: string;
    partnerName: string;
    partnerType: string;
    partnershipType: string;
    startDate: string;
    endDate?: string;
    services?: string[];
    isActive: boolean;
  }>;

  // === NOTATION ET ÉVALUATION ===
  @Column({ type: 'varchar', length: 10, nullable: true })
  creditRating?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ratingAgency?: string;

  @Column({ type: 'date', nullable: true })
  lastRatingDate?: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ratingOutlook?: string;

  // === INDICATEURS DE PERFORMANCE ===
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  capitalAdequacyRatio?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  returnOnAssets?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  returnOnEquity?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  nonPerformingLoansRatio?: number;

  // === CONTACTS PRINCIPAUX (JSON) ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Contacts principaux de l\'institution'
  })
  primaryContacts?: Array<{
    id: string;
    name: string;
    position: string;
    department: string;
    phone?: string;
    email?: string;
    isPrimary: boolean;
    contactType: 'executive' | 'operational' | 'regulatory' | 'media';
    isActive: boolean;
  }>;

  // === MÉTADONNÉES ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Données additionnelles et métadonnées'
  })
  metadata?: Record<string, any>;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Paramètres de configuration'
  })
  settings?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // === RELATIONS ===
  @OneToMany(() => InstitutionBranchEntity, branch => branch.institution, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  branches: InstitutionBranchEntity[];

  @OneToMany(() => InstitutionLeadershipEntity, leadership => leadership.institution, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  leadership: InstitutionLeadershipEntity[];

  @OneToMany(() => InstitutionServicesEntity, service => service.institution, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  services: InstitutionServicesEntity[];

  @OneToMany(() => InstitutionRegulatoryEntity, regulatory => regulatory.institution, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  regulatory: InstitutionRegulatoryEntity[];

  // === TIMESTAMPS ===
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP'
  })
  updatedAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Date de dernière vérification des informations'
  })
  lastVerifiedAt?: Date;

  // === MÉTHODES UTILITAIRES ===

  /**
   * Calcule l'âge de l'institution en années
   */
  getInstitutionAge(): number {
    const today = new Date();
    const established = new Date(this.establishedDate);
    return Math.floor((today.getTime() - established.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  /**
   * Vérifie si l'institution est active
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Vérifie si la licence principale est valide
   */
  isLicenseValid(): boolean {
    if (!this.licenseExpiryDate) return true; // Licence permanente
    return new Date() <= new Date(this.licenseExpiryDate);
  }

  /**
   * Récupère les licences actives
   */
  getActiveLicenses(): NonNullable<typeof this.licenses> {
    if (!this.licenses) return [];
    return this.licenses.filter(license => 
      license.isActive && 
      license.status === 'active' &&
      (!license.expiryDate || new Date(license.expiryDate) > new Date())
    );
  }

  /**
   * Récupère les licences expirées ou qui expirent bientôt
   */
  getExpiringLicenses(daysThreshold: number = 30): NonNullable<typeof this.licenses> {
    if (!this.licenses) return [];
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    
    return this.licenses.filter(license => 
      license.isActive && 
      license.expiryDate &&
      new Date(license.expiryDate) <= thresholdDate
    );
  }

  /**
   * Récupère le contact principal
   */
  getPrimaryContact(): NonNullable<typeof this.primaryContacts>[0] | null {
    if (!this.primaryContacts || this.primaryContacts.length === 0) return null;
    return this.primaryContacts.find(contact => contact.isPrimary && contact.isActive) || null;
  }

  /**
   * Récupère les affiliations actives
   */
  getActiveAffiliations(): NonNullable<typeof this.affiliations> {
    if (!this.affiliations) return [];
    return this.affiliations.filter(affiliation => 
      affiliation.isActive && 
      (!affiliation.endDate || new Date(affiliation.endDate) > new Date())
    );
  }

  /**
   * Calcule le ratio d'adéquation des fonds propres
   */
  getCapitalAdequacyStatus(): 'excellent' | 'good' | 'adequate' | 'low' | 'critical' | 'unknown' {
    if (!this.capitalAdequacyRatio) return 'unknown';
    
    if (this.capitalAdequacyRatio >= 15) return 'excellent';
    if (this.capitalAdequacyRatio >= 12) return 'good';
    if (this.capitalAdequacyRatio >= 8) return 'adequate';
    if (this.capitalAdequacyRatio >= 6) return 'low';
    return 'critical';
  }

  /**
   * Vérifie si l'institution nécessite une surveillance réglementaire
   */
  requiresRegulatoryAttention(): boolean {
    return (
      this.status === 'under_review' ||
      this.status === 'suspended' ||
      !this.isLicenseValid() ||
      this.getExpiringLicenses(30).length > 0 ||
      (this.capitalAdequacyRatio !== null && this.capitalAdequacyRatio < 8) ||
      (this.nonPerformingLoansRatio !== null && this.nonPerformingLoansRatio > 10)
    );
  }

  /**
   * Formate l'adresse complète du siège
   */
  getFullHeadquartersAddress(): string {
    const parts = [this.headquartersAddress, this.city, this.province];
    if (this.postalCode) parts.push(this.postalCode);
    if (this.country && this.country !== 'RDC') parts.push(this.country);
    return parts.filter(Boolean).join(', ');
  }

  /**
   * Calcule la taille de l'institution
   */
  getInstitutionSize(): 'large' | 'medium' | 'small' | 'micro' {
    if (!this.totalAssets) return 'micro';
    
    // Seuils en millions CDF (à adapter selon les standards locaux)
    if (this.totalAssets >= 1000000000000) return 'large';   // > 1000 milliards
    if (this.totalAssets >= 100000000000) return 'medium';   // > 100 milliards
    if (this.totalAssets >= 10000000000) return 'small';     // > 10 milliards
    return 'micro';
  }

  /**
   * Vérifie si l'institution offre des services bancaires complets
   */
  isFullServiceBank(): boolean {
    return this.type === 'commercial_bank' && this.totalBranches > 5;
  }
}