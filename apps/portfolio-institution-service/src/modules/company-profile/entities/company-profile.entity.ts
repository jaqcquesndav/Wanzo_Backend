import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * Cache local du profil complet des companies (PME/SME)
 * 
 * SOURCE PRIMAIRE: accounting-service (HTTP) - données financières opérationnelles
 * SOURCE SECONDAIRE: customer-service (Kafka) - enrichissement administratif
 * 
 * Stratégie de réconciliation:
 * - accounting-service = source de vérité pour métriques financières
 * - customer-service = enrichissement pour données administratives/légales
 * - En cas de conflit de noms, accounting-service gagne
 */
@Entity('company_profiles')
@Index(['companyName'])
@Index(['sector'])
@Index(['lastSyncFromAccounting'])
export class CompanyProfile {
  /**
   * Identifiant unique de la company
   * Correspond au client_id utilisé dans Contract, Disbursement, Repayment, etc.
   */
  @PrimaryColumn('uuid')
  id!: string;

  // ============================================================
  // DONNÉES PRIMAIRES - SOURCE: accounting-service (HTTP)
  // ============================================================

  /**
   * Nom de la company (source de vérité: accounting-service)
   */
  @Column({ length: 500 })
  @Index()
  companyName!: string;

  /**
   * Secteur d'activité
   */
  @Column({ length: 200 })
  sector!: string;

  /**
   * Chiffre d'affaires total (CDF)
   */
  @Column('decimal', { precision: 20, scale: 2, default: 0 })
  totalRevenue!: number;

  /**
   * Chiffre d'affaires annuel (CDF)
   */
  @Column('decimal', { precision: 20, scale: 2, default: 0 })
  annualRevenue!: number;

  /**
   * Profit net (CDF)
   */
  @Column('decimal', { precision: 20, scale: 2, default: 0 })
  netProfit!: number;

  /**
   * Total des actifs (CDF)
   */
  @Column('decimal', { precision: 20, scale: 2, default: 0 })
  totalAssets!: number;

  /**
   * Total des passifs (CDF)
   */
  @Column('decimal', { precision: 20, scale: 2, default: 0 })
  totalLiabilities!: number;

  /**
   * Flux de trésorerie (CDF)
   */
  @Column('decimal', { precision: 20, scale: 2, default: 0 })
  cashFlow!: number;

  /**
   * Ratio d'endettement (0.0 - 1.0)
   */
  @Column('decimal', { precision: 5, scale: 4, default: 0 })
  debtRatio!: number;

  /**
   * Fonds de roulement (CDF)
   */
  @Column('decimal', { precision: 20, scale: 2, default: 0 })
  workingCapital!: number;

  /**
   * Score de crédit (1-100)
   */
  @Column('int', { default: 0 })
  @Index()
  creditScore!: number;

  /**
   * Rating financier (AAA, AA, A, BBB, BB, B, C, D, E)
   */
  @Column({ length: 10, default: 'N/A' })
  financialRating!: string;

  /**
   * Croissance du chiffre d'affaires YoY (%)
   */
  @Column('decimal', { precision: 6, scale: 2, default: 0 })
  revenueGrowth!: number;

  /**
   * Marge bénéficiaire (%)
   */
  @Column('decimal', { precision: 6, scale: 2, default: 0 })
  profitMargin!: number;

  /**
   * EBITDA (CDF)
   */
  @Column('decimal', { precision: 20, scale: 2, nullable: true })
  ebitda?: number;

  /**
   * Nombre d'employés (source primaire: accounting-service)
   */
  @Column('int', { default: 0 })
  employeeCount!: number;

  /**
   * Taille de l'entreprise (small, medium, large)
   */
  @Column({ length: 50, default: 'small' })
  companySize!: string;

  /**
   * Site web de l'entreprise (source: accounting-service)
   */
  @Column({ length: 500, nullable: true })
  websiteUrl?: string;

  // ============================================================
  // DONNÉES SECONDAIRES - SOURCE: customer-service (Kafka)
  // Enrichissement du profil avec données administratives/légales
  // ============================================================

  /**
   * Forme juridique (SARL, SA, SAS, etc.)
   */
  @Column({ length: 100, nullable: true })
  legalForm?: string;

  /**
   * Industrie/secteur détaillé (depuis customer-service)
   */
  @Column({ length: 200, nullable: true })
  industry?: string;

  /**
   * Numéro RCCM (Registre de Commerce)
   */
  @Column({ length: 100, nullable: true })
  @Index()
  rccm?: string;

  /**
   * Numéro d'identification fiscale
   */
  @Column({ length: 100, nullable: true })
  @Index()
  taxId?: string;

  /**
   * Numéro d'identification nationale
   */
  @Column({ length: 100, nullable: true })
  natId?: string;

  /**
   * Année de création
   */
  @Column('int', { nullable: true })
  yearFounded?: number;

  /**
   * Structure du capital { amount: number, currency: string }
   */
  @Column('jsonb', { nullable: true })
  capital?: {
    amount: number;
    currency: string;
  };

  /**
   * Informations du propriétaire principal
   * { id: string, name: string, email: string, phone?: string }
   */
  @Column('jsonb', { nullable: true })
  owner?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };

  /**
   * Liste des associés
   * Array<{ id: string, name: string, shares: number, role: string }>
   */
  @Column('jsonb', { nullable: true })
  associates?: Array<{
    id: string;
    name: string;
    shares: number;
    role: string;
  }>;

  /**
   * Emplacements/succursales
   * Array<{ id: string, address: string, city: string, country: string, isPrimary: boolean }>
   */
  @Column('jsonb', { nullable: true })
  locations?: Array<{
    id: string;
    address: string;
    city: string;
    country: string;
    isPrimary: boolean;
  }>;

  /**
   * Personnes de contact
   * Array<{ name: string, role: string, email: string, phone: string }>
   */
  @Column('jsonb', { nullable: true })
  contactPersons?: Array<{
    name: string;
    role: string;
    email: string;
    phone: string;
  }>;

  /**
   * Affiliations (CNSS, INPP, etc.)
   * { cnss?: string, inpp?: string, [key: string]: any }
   */
  @Column('jsonb', { nullable: true })
  affiliations?: {
    cnss?: string;
    inpp?: string;
    [key: string]: any;
  };

  /**
   * Médias sociaux
   * { facebook?: string, linkedin?: string, twitter?: string, [key: string]: any }
   */
  @Column('jsonb', { nullable: true })
  socialMedia?: {
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    [key: string]: any;
  };

  /**
   * Email de la company (depuis customer-service)
   */
  @Column({ length: 255, nullable: true })
  email?: string;

  /**
   * Téléphone de la company (depuis customer-service)
   */
  @Column({ length: 50, nullable: true })
  phone?: string;

  /**
   * Logo URL
   */
  @Column({ length: 500, nullable: true })
  logo?: string;

  /**
   * Adresse complète
   */
  @Column('text', { nullable: true })
  address?: string;

  /**
   * Statut dans customer-service (active, suspended, etc.)
   */
  @Column({ length: 50, nullable: true })
  customerServiceStatus?: string;

  // ============================================================
  // MÉTADONNÉES DE SYNCHRONISATION
  // ============================================================

  /**
   * Date de dernière synchronisation depuis accounting-service
   */
  @Column({ type: 'timestamp', nullable: true })
  @Index()
  lastSyncFromAccounting?: Date;

  /**
   * Date de dernière synchronisation depuis customer-service
   */
  @Column({ type: 'timestamp', nullable: true })
  lastSyncFromCustomer?: Date;

  /**
   * Pourcentage de complétude du profil (0-100)
   * Basé sur le nombre de champs remplis vs total
   */
  @Column('int', { default: 0 })
  profileCompleteness!: number;

  /**
   * Indicateur si les données accounting sont à jour
   * false = nécessite re-sync
   */
  @Column({ default: true })
  isAccountingDataFresh!: boolean;

  /**
   * Indicateur si les données customer sont à jour
   */
  @Column({ default: true })
  isCustomerDataFresh!: boolean;

  /**
   * Source de création de l'entrée
   */
  @Column({ length: 100, default: 'system' })
  createdBy!: string;

  /**
   * Source de dernière modification
   */
  @Column({ length: 100, nullable: true })
  lastModifiedBy?: string;

  /**
   * Métadonnées additionnelles flexibles
   */
  @Column('jsonb', { nullable: true })
  metadata?: {
    syncHistory?: Array<{
      source: 'accounting' | 'customer';
      timestamp: string;
      status: 'success' | 'partial' | 'failed';
      error?: string;
    }>;
    conflicts?: Array<{
      field: string;
      accountingValue: any;
      customerValue: any;
      resolvedWith: 'accounting' | 'customer';
      timestamp: string;
    }>;
    [key: string]: any;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // ============================================================
  // MÉTHODES UTILITAIRES
  // ============================================================

  /**
   * Calcule le pourcentage de complétude du profil
   */
  calculateCompleteness(): number {
    const fields = [
      this.companyName,
      this.sector,
      this.totalRevenue,
      this.annualRevenue,
      this.creditScore,
      this.legalForm,
      this.rccm,
      this.taxId,
      this.owner,
      this.email,
      this.phone,
      this.address,
      this.employeeCount,
      this.yearFounded,
    ];

    const filledFields = fields.filter((field) => {
      if (field === null || field === undefined) return false;
      if (typeof field === 'string' && field.trim() === '') return false;
      if (typeof field === 'number' && field === 0) return false;
      return true;
    }).length;

    return Math.round((filledFields / fields.length) * 100);
  }

  /**
   * Vérifie si les données accounting nécessitent un refresh
   * (> 24h depuis dernière sync)
   */
  needsAccountingSync(): boolean {
    if (!this.lastSyncFromAccounting) return true;
    const hoursSinceSync = (Date.now() - this.lastSyncFromAccounting.getTime()) / (1000 * 60 * 60);
    return hoursSinceSync > 24;
  }

  /**
   * Vérifie si les données customer nécessitent un refresh
   * (> 7 jours depuis dernière sync)
   */
  needsCustomerSync(): boolean {
    if (!this.lastSyncFromCustomer) return true;
    const daysSinceSync = (Date.now() - this.lastSyncFromCustomer.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceSync > 7;
  }

  /**
   * Enregistre un conflit de données entre sources
   */
  recordConflict(field: string, accountingValue: any, customerValue: any, resolvedWith: 'accounting' | 'customer'): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    if (!this.metadata.conflicts) {
      this.metadata.conflicts = [];
    }

    this.metadata.conflicts.push({
      field,
      accountingValue,
      customerValue,
      resolvedWith,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Enregistre une synchronisation dans l'historique
   */
  recordSync(source: 'accounting' | 'customer', status: 'success' | 'partial' | 'failed', error?: string): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    if (!this.metadata.syncHistory) {
      this.metadata.syncHistory = [];
    }

    this.metadata.syncHistory.push({
      source,
      timestamp: new Date().toISOString(),
      status,
      error,
    });

    // Garder seulement les 20 dernières entrées
    if (this.metadata.syncHistory.length > 20) {
      this.metadata.syncHistory = this.metadata.syncHistory.slice(-20);
    }
  }
}
