import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../../entities/customer.entity';

/**
 * Entité pour les informations de base des entreprises
 * Gère les profils, contacts, propriétaires, associés, activités et capital
 */
@Entity('companies_core')
@Index(['companyName'], { unique: true })
@Index(['registrationNumber'], { unique: true })
@Index(['taxNumber'], { unique: true })
@Index(['status'])
@Index(['sector'])
@Index(['createdAt'])
export class CompanyCoreEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // === RELATION AVEC CUSTOMER ===
  @Column({ type: 'varchar', nullable: true })
  customerId?: string;

  @OneToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer?: Customer;

  // === INFORMATIONS DE BASE ===
  @Column({ type: 'varchar', length: 255, nullable: false })
  @Index()
  companyName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tradeName?: string;

  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  registrationNumber: string;

  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  taxNumber?: string;

  @Column({
    type: 'enum',
    enum: [
      'SARL', 'SA', 'SAS', 'SASU', 'SNC', 'SCS', 'SCA',
      'EURL', 'EI', 'EIRL', 'Coopérative', 'Association', 'ONG'
    ],
    nullable: false
  })
  legalForm: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'suspended', 'dissolved', 'pending'],
    default: 'pending'
  })
  @Index()
  status: string;

  @Column({ type: 'date', nullable: false })
  incorporationDate: Date;

  @Column({ type: 'varchar', length: 100, nullable: false })
  @Index()
  sector: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logoUrl?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  facebookPage?: string;

  // === ADRESSE SIÈGE SOCIAL ===
  @Column({ type: 'text', nullable: false })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  province: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode?: string;

  @Column({ type: 'varchar', length: 100, default: 'RDC' })
  country: string;

  // === CONTACT ===
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  // === CAPITAL ===
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  authorizedCapital: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  paidUpCapital: number;

  @Column({ type: 'varchar', length: 10, default: 'CDF' })
  capitalCurrency: string;

  @Column({ type: 'int', default: 1 })
  totalShares: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  shareValue: number;

  // === PROPRIÉTAIRES (JSON) ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Liste des propriétaires avec leurs parts'
  })
  owners?: Array<{
    id: string;
    name: string;
    type: 'individual' | 'company';
    shares: number;
    percentage: number;
    joinDate: string;
    idDocument?: string;
    contact?: {
      phone?: string;
      email?: string;
      address?: string;
    };
    isActive: boolean;
  }>;

  // === ASSOCIÉS (JSON) ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Liste des associés et partenaires'
  })
  associates?: Array<{
    id: string;
    name: string;
    type: 'individual' | 'company';
    role: string;
    joinDate: string;
    endDate?: string;
    contact?: {
      phone?: string;
      email?: string;
      address?: string;
    };
    isActive: boolean;
  }>;

  // === CONTACTS PRINCIPAUX (JSON) ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Contacts principaux de l\'entreprise'
  })
  contacts?: Array<{
    id: string;
    name: string;
    position: string;
    department?: string;
    phone?: string;
    email?: string;
    isPrimary: boolean;
    isActive: boolean;
  }>;

  // === ACTIVITÉS (JSON) ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Liste des activités principales'
  })
  activities?: Array<{
    id: string;
    name: string;
    description?: string;
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

  // === LICENCES ET CERTIFICATIONS (JSON) ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Licences et certifications'
  })
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

  // === INFORMATIONS FINANCIÈRES ===
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  annualRevenue?: number;

  @Column({ type: 'varchar', length: 10, default: 'CDF' })
  revenueCurrency: string;

  @Column({ type: 'int', nullable: true })
  employeeCount?: number;

  @Column({ type: 'date', nullable: true })
  lastFinancialYear?: Date;

  // === LOCATIONS ET EMPLACEMENTS (JSON) ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Emplacements et localisations de l\'entreprise'
  })
  locations?: Array<{
    id: string;
    name: string;
    type: string;
    address?: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  }>;

  // === AFFILIATIONS INSTITUTIONNELLES (JSON) ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Affiliations avec institutions (CNSS, INPP, ONEM, etc.)'
  })
  affiliations?: {
    cnss?: string;
    inpp?: string;
    onem?: string;
    intraCoop?: string;
    interCoop?: string;
    partners?: string[];
  };

  // === INFORMATIONS SUBSCRIPTION (JSON) ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Informations d\'abonnement et plan'
  })
  subscription?: {
    plan?: {
      name?: string;
    };
    status?: string;
    currentPeriodEnd?: Date;
  };

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

  // === RELATIONS ===
  // Relations vers les actifs et stocks seront ajoutées si nécessaires
  // @OneToMany(() => CompanyAssetsEntity, (asset: CompanyAssetsEntity) => asset.company)
  // assets: CompanyAssetsEntity[];

  // @OneToMany(() => CompanyStocksEntity, (stock: CompanyStocksEntity) => stock.company)
  // stocks: CompanyStocksEntity[];

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
   * Calcule le pourcentage de propriété total
   */
  getTotalOwnershipPercentage(): number {
    if (!this.owners || this.owners.length === 0) return 0;
    return this.owners
      .filter(owner => owner.isActive)
      .reduce((total, owner) => total + owner.percentage, 0);
  }

  /**
   * Vérifie si l'entreprise est entièrement détenue
   */
  isFullyOwned(): boolean {
    return this.getTotalOwnershipPercentage() >= 100;
  }

  /**
   * Récupère le propriétaire principal
   */
  getPrimaryOwner(): NonNullable<typeof this.owners>[0] | null {
    if (!this.owners || this.owners.length === 0) return null;
    return this.owners
      .filter(owner => owner.isActive)
      .sort((a, b) => b.percentage - a.percentage)[0] || null;
  }

  /**
   * Récupère le contact principal
   */
  getPrimaryContact(): NonNullable<typeof this.contacts>[0] | null {
    if (!this.contacts || this.contacts.length === 0) return null;
    return this.contacts.find(contact => contact.isPrimary && contact.isActive) || null;
  }

  /**
   * Récupère l'activité principale
   */
  getMainActivity(): NonNullable<typeof this.activities>[0] | null {
    if (!this.activities || this.activities.length === 0) return null;
    return this.activities.find(activity => activity.isMain && activity.isActive) || null;
  }

  /**
   * Vérifie si l'entreprise est active
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Calcule l'âge de l'entreprise en années
   */
  getCompanyAge(): number {
    const today = new Date();
    const incorporation = new Date(this.incorporationDate);
    return Math.floor((today.getTime() - incorporation.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  /**
   * Formate l'adresse complète
   */
  getFullAddress(): string {
    const parts = [this.address, this.city, this.province];
    if (this.postalCode) parts.push(this.postalCode);
    if (this.country && this.country !== 'RDC') parts.push(this.country);
    return parts.filter(Boolean).join(', ');
  }
}