import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
// Commented out to avoid circular dependencies during development
// import { InstitutionBranchEntity } from './institution-branch.entity';
import { InstitutionLeadershipEntity } from './institution-leadership.entity';
// import { InstitutionServicesEntity } from './institution-services.entity';
// import { InstitutionRegulatoryEntity } from './institution-regulatory.entity';

/**
 * Entité pour les informations de base des institutions financières
 * Gère les profils institutionnels, licences et contacts principaux
 */
@Entity('institutions_core')
@Index(['institutionName'], { unique: true })
@Index(['licenseNumber'], { unique: true })
@Index(['taxIdentificationNumber'], { unique: true })
@Index(['businessRegistrationNumber'], { unique: true })
@Index(['institutionType'])
@Index(['status'])
@Index(['countryOfOperation'])
export class InstitutionCoreEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // === IDENTIFICATION PRINCIPALE ===
  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  institutionName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  legalName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  acronym?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  brandName?: string;

  // === CLASSIFICATION ===
  @Column({
    type: 'enum',
    enum: [
      'COMMERCIAL_BANK',
      'INVESTMENT_BANK',
      'SAVINGS_BANK',
      'COOPERATIVE_BANK',
      'MICROFINANCE_INSTITUTION',
      'CREDIT_UNION',
      'INSURANCE_COMPANY',
      'ASSET_MANAGEMENT',
      'BROKERAGE_FIRM',
      'PAYMENT_PROCESSOR',
      'FINTECH_COMPANY',
      'CENTRAL_BANK',
      'DEVELOPMENT_BANK',
      'ISLAMIC_BANK',
      'PENSION_FUND',
    ],
  })
  @Index()
  institutionType!: string;

  @Column({
    type: 'enum',
    enum: ['PRIVATE', 'PUBLIC', 'GOVERNMENT', 'COOPERATIVE', 'MIXED'],
    default: 'PRIVATE',
  })
  ownership!: string;

  @Column({
    type: 'enum',
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'UNDER_REVIEW', 'CLOSED'],
    default: 'ACTIVE',
  })
  @Index()
  status!: string;

  // === INFORMATIONS RÉGLEMENTAIRES ===
  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  @Index()
  licenseNumber?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  regulatoryAuthority?: string;

  @Column({ type: 'date', nullable: true })
  licenseIssueDate?: Date;

  @Column({ type: 'date', nullable: true })
  licenseExpiryDate?: Date;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  @Index()
  taxIdentificationNumber?: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  @Index()
  businessRegistrationNumber?: string;

  // === ADRESSE ET CONTACT ===
  @Column({ type: 'varchar', length: 255, nullable: true })
  headOfficeAddress?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  province?: string;

  @Column({ type: 'varchar', length: 100, default: 'DRC' })
  @Index()
  countryOfOperation!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  faxNumber?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailAddress?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  websiteUrl?: string;

  // === DONNÉES FINANCIÈRES DE BASE ===
  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  authorizedCapital?: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  paidUpCapital?: number;

  @Column({
    type: 'enum',
    enum: ['CDF', 'USD', 'EUR', 'GBP', 'JPY', 'CNY'],
    default: 'CDF',
  })
  baseCurrency!: string;

  @Column({ type: 'integer', default: 0 })
  totalBranches!: number;

  @Column({ type: 'integer', default: 0 })
  totalEmployees!: number;

  @Column({ type: 'integer', default: 0 })
  totalCustomers!: number;

  // === INFORMATIONS DE DIRECTION ===
  @Column({ type: 'varchar', length: 255, nullable: true })
  ceoName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ceoEmail?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ceoPhone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  chairmanName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  complianceOfficerName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  complianceOfficerEmail?: string;

  // === INFORMATIONS TEMPORELLES ===
  @Column({ type: 'date', nullable: true })
  establishmentDate?: Date;

  @Column({ type: 'date', nullable: true })
  operationsStartDate?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  updatedBy?: string;

  // === INFORMATIONS COMPLÉMENTAIRES ===
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  mission?: string;

  @Column({ type: 'text', nullable: true })
  vision?: string;

  @Column({ type: 'simple-array', nullable: true })
  coreValues?: string[];

  @Column({ type: 'simple-array', nullable: true })
  servicesOffered?: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  logoUrl?: string;

  @Column({ type: 'json', nullable: true })
  socialMediaLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };

  @Column({ type: 'json', nullable: true })
  operatingHours?: {
    weekdays?: string;
    saturdays?: string;
    sundays?: string;
  };

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ type: 'boolean', default: false })
  isPubliclyListed!: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude?: number;

  @Column({ type: 'text', nullable: true })
  internalNotes?: string;

  // === RELATIONS (Commentées pour éviter les dépendances circulaires) ===
  // @OneToMany(() => InstitutionBranchEntity, (branch) => branch.institution)
  // branches?: InstitutionBranchEntity[];

  @OneToMany(() => InstitutionLeadershipEntity, (leadership) => leadership.institution)
  leadership?: InstitutionLeadershipEntity[];

  // @OneToMany(() => InstitutionServicesEntity, (service) => service.institution)
  // services?: InstitutionServicesEntity[];

  // @OneToMany(() => InstitutionRegulatoryEntity, (regulatory) => regulatory.institution)
  // regulatory?: InstitutionRegulatoryEntity[];

  // === MÉTHODES UTILITAIRES ===
  
  /**
   * Obtient le nom complet de l'institution
   */
  getFullName(): string {
    return this.legalName || this.institutionName;
  }

  /**
   * Obtient l'adresse complète
   */
  getFullAddress(): string {
    const parts = [
      this.headOfficeAddress,
      this.city,
      this.province,
      this.countryOfOperation,
    ].filter(Boolean);
    return parts.join(', ');
  }

  /**
   * Vérifie si l'institution est opérationnelle
   */
  isOperational(): boolean {
    return this.status === 'ACTIVE' && this.isActive;
  }

  /**
   * Obtient les coordonnées géographiques
   */
  getCoordinates(): { lat: number; lng: number } | null {
    if (this.latitude && this.longitude) {
      return { lat: this.latitude, lng: this.longitude };
    }
    return null;
  }

  /**
   * Vérifie if la licence est valide
   */
  hasValidLicense(): boolean {
    if (!this.licenseExpiryDate) return true;
    return new Date() < this.licenseExpiryDate;
  }

  /**
   * Calcule l'âge de l'institution en années
   */
  getInstitutionAge(): number | null {
    if (!this.establishmentDate) return null;
    const now = new Date();
    const established = new Date(this.establishmentDate);
    return now.getFullYear() - established.getFullYear();
  }

  /**
   * Obtient un résumé de l'institution
   */
  getSummary(): string {
    return `${this.institutionName} - ${this.institutionType} établie en ${
      this.establishmentDate ? new Date(this.establishmentDate).getFullYear() : 'N/A'
    }`;
  }

  /**
   * Vérifie si l'institution est publique
   */
  isPublic(): boolean {
    return this.ownership === 'PUBLIC' || this.ownership === 'GOVERNMENT';
  }

  /**
   * Obtient les informations de contact principales
   */
  getContactInfo(): {
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
  } {
    return {
      phone: this.phoneNumber,
      email: this.emailAddress,
      address: this.getFullAddress(),
      website: this.websiteUrl,
    };
  }

  /**
   * Obtient les informations du CEO
   */
  getCEOInfo(): {
    name?: string;
    email?: string;
    phone?: string;
  } | null {
    if (!this.ceoName) return null;
    return {
      name: this.ceoName,
      email: this.ceoEmail,
      phone: this.ceoPhone,
    };
  }

  /**
   * Met à jour les statistiques
   */
  updateStatistics(stats: {
    totalBranches?: number;
    totalEmployees?: number;
    totalCustomers?: number;
  }): void {
    if (stats.totalBranches !== undefined) {
      this.totalBranches = stats.totalBranches;
    }
    if (stats.totalEmployees !== undefined) {
      this.totalEmployees = stats.totalEmployees;
    }
    if (stats.totalCustomers !== undefined) {
      this.totalCustomers = stats.totalCustomers;
    }
    this.updatedAt = new Date();
  }

  /**
   * Marque l'institution comme vérifiée
   */
  markAsVerified(verifiedBy: string): void {
    this.isVerified = true;
    this.updatedBy = verifiedBy;
    this.updatedAt = new Date();
  }

  /**
   * Désactive l'institution
   */
  deactivate(reason?: string): void {
    this.isActive = false;
    this.status = 'INACTIVE';
    if (reason) {
      this.internalNotes = `${this.internalNotes || ''}\nDésactivée: ${reason} (${new Date().toISOString()})`;
    }
    this.updatedAt = new Date();
  }

  /**
   * Obtient une représentation JSON simplifiée
   */
  toJSON(): any {
    return {
      id: this.id,
      institutionName: this.institutionName,
      legalName: this.legalName,
      institutionType: this.institutionType,
      status: this.status,
      licenseNumber: this.licenseNumber,
      contactInfo: this.getContactInfo(),
      isActive: this.isActive,
      isVerified: this.isVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}