import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../../entities/customer.entity';
// Commented out to avoid circular dependencies during development
// import { InstitutionBranchEntity } from './institution-branch.entity';
import { InstitutionLeadershipEntity } from './institution-leadership.entity';
// import { InstitutionServicesEntity } from './institution-services.entity';
// import { InstitutionRegulatoryEntity } from './institution-regulatory.entity';

/**
 * Types d'institutions financières (100% conforme à la documentation)
 * Source: 05-institutions-financieres.md
 */
export enum InstitutionType {
  BANQUE = 'BANQUE',
  MICROFINANCE = 'MICROFINANCE', 
  COOPEC = 'COOPEC',
  FOND_GARANTIE = 'FOND_GARANTIE',
  ENTREPRISE_FINANCIERE = 'ENTREPRISE_FINANCIERE',
  FOND_CAPITAL_INVESTISSEMENT = 'FOND_CAPITAL_INVESTISSEMENT',
  FOND_IMPACT = 'FOND_IMPACT',
  AUTRE = 'AUTRE',
}

/**
 * Types de secteurs alignés avec legacy entities
 */
export enum SectorType {
  PRIVE = 'PRIVE',
  PUBLIC = 'PUBLIC',
  PUBLIC_PRIVE = 'PUBLIC_PRIVE',
}

/**
 * Entité Institution Financière - 100% Conforme Documentation v2.0
 * Source: 05-institutions-financieres.md
 * Nomenclature: Française (Source de vérité)
 */
@Entity('institutions_core')
export class InstitutionCoreEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // === RELATION AVEC CUSTOMER ===
  @Column({ type: 'uuid', nullable: false })
  @Index()
  userId!: string;

  @OneToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'userId' })
  customer?: Customer;

  // === IDENTIFICATION INSTITUTIONNELLE (Conforme formulaire) ===
  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  denominationSociale!: string;

  @Column({ type: 'varchar', length: 100 })
  sigle!: string;

  @Column({
    type: 'enum',
    enum: InstitutionType,
    default: InstitutionType.AUTRE
  })
  @Index()
  typeInstitution!: InstitutionType;

  @Column({ type: 'varchar', length: 100 })
  sousCategorie!: string;

  @Column({ type: 'date' })
  dateCreation!: Date;

  @Column({ type: 'varchar', length: 100, default: 'RDC' })
  @Index()
  paysOrigine!: string;

  @Column({ type: 'varchar', length: 100 })
  statutJuridique!: string;

  // === INFORMATIONS RÉGLEMENTAIRES ===
  @Column({
    type: 'enum',
    enum: ['bcc', 'arca', 'asmf', 'other'],
    default: 'bcc'
  })
  autoritéSupervision!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  numeroAgrement!: string;

  @Column({ type: 'date' })
  dateAgrement!: Date;

  @Column({ type: 'date' })
  validiteAgrement!: Date;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  numeroRCCM!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  numeroNIF!: string;

  // === ACTIVITÉS AUTORISÉES ===
  @Column({ type: 'simple-array' })
  activitesAutorisees!: string[];

  // === INFORMATIONS OPÉRATIONNELLES ===
  @Column({ type: 'text' })
  siegeSocial!: string;

  @Column({ type: 'integer', default: 0 })
  nombreAgences!: number;

  @Column({ type: 'simple-array' })
  villesProvincesCouvertes!: string[];

  @Column({ type: 'boolean', default: false })
  presenceInternationale!: boolean;

  // === CAPACITÉS FINANCIÈRES ===
  @Column({ type: 'decimal', precision: 20, scale: 2 })
  capitalSocialMinimum!: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  capitalSocialActuel!: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  fondsPropresMontant!: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  totalBilan!: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  chiffreAffairesAnnuel!: number;

  @Column({
    type: 'enum',
    enum: ['USD', 'CDF', 'EUR'],
    default: 'USD'
  })
  devise!: string;

  // === CLIENTÈLE ET MARCHÉ ===
  @Column({ type: 'varchar', length: 100 })
  segmentClientelePrincipal!: string;

  @Column({ type: 'integer', default: 0 })
  nombreClientsActifs!: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  portefeuilleCredit!: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  depotsCollectes!: number;

  // === SERVICES OFFERTS À WANZO ===
  @Column({ type: 'simple-array', nullable: true })
  servicesCredit?: string[];

  @Column({ type: 'simple-array', nullable: true })
  servicesInvestissement?: string[];

  @Column({ type: 'simple-array', nullable: true })
  servicesGarantie?: string[];

  @Column({ type: 'simple-array', nullable: true })
  servicesTransactionnels?: string[];

  @Column({ type: 'simple-array', nullable: true })
  servicesConseil?: string[];

  // === PARTENARIAT WANZO ===
  @Column({ type: 'varchar', length: 255, nullable: true })
  motivationPrincipale?: string;

  @Column({ type: 'simple-array', nullable: true })
  servicesPrioritaires?: string[];

  @Column({ type: 'simple-array', nullable: true })
  segmentsClienteleCibles?: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  volumeAffairesEnvisage?: string;

  // === CONDITIONS COMMERCIALES ===
  @Column({ type: 'text', nullable: true })
  grillesTarifaires?: string;

  @Column({ type: 'text', nullable: true })
  conditionsPreferentielles?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  delaisTraitement?: string;

  @Column({ type: 'text', nullable: true })
  criteresEligibilite?: string;

  // === CAPACITÉ D'ENGAGEMENT ===
  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  montantMaximumDossier?: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  enveloppeGlobale?: number;

  @Column({ type: 'simple-array', nullable: true })
  secteursActivitePrivilegies?: string[];

  @Column({ type: 'simple-array', nullable: true })
  zonesGeographiquesPrioritaires?: string[];

  // === DOCUMENTS ===
  @Column({ type: 'json', nullable: true })
  documentsLegaux?: any[];

  @Column({ type: 'json', nullable: true })
  documentsFinanciers?: any[];

  @Column({ type: 'json', nullable: true })
  documentsOperationnels?: any[];

  @Column({ type: 'json', nullable: true })
  documentsCompliance?: any[];

  // === MÉTADONNÉES ===
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // === RELATIONS ===
  @OneToMany(() => InstitutionLeadershipEntity, (leadership) => leadership.institution)
  leadership?: InstitutionLeadershipEntity[];

  // === MÉTHODES UTILITAIRES ===
  
  /**
   * Obtient le nom complet de l'institution
   */
  getFullName(): string {
    return this.denominationSociale;
  }

  /**
   * Obtient l'adresse complète du siège social
   */
  getFullAddress(): string {
    return this.siegeSocial;
  }

  /**
   * Vérifie si la licence est valide
   */
  isLicenseValid(): boolean {
    if (!this.validiteAgrement) return false;
    return new Date(this.validiteAgrement) > new Date();
  }

  /**
   * Calcule le nombre d'années d'existence
   */
  getYearsInOperation(): number {
    const now = new Date();
    const creation = new Date(this.dateCreation);
    return now.getFullYear() - creation.getFullYear();
  }

  /**
   * Vérifie si l'agrément est valide
   */
  hasValidLicense(): boolean {
    if (!this.validiteAgrement) return true;
    return new Date() < new Date(this.validiteAgrement);
  }

  /**
   * Calcule l'âge de l'institution en années
   */
  getInstitutionAge(): number | null {
    if (!this.dateCreation) return null;
    const now = new Date();
    const established = new Date(this.dateCreation);
    return now.getFullYear() - established.getFullYear();
  }

  /**
   * Obtient un résumé de l'institution
   */
  getSummary(): string {
    return `${this.denominationSociale} - ${this.typeInstitution} établie en ${
      this.dateCreation ? new Date(this.dateCreation).getFullYear() : 'N/A'
    }`;
  }

  /**
   * Vérifie si l'institution est publique (basé sur le statut juridique)
   */
  isPublic(): boolean {
    return this.statutJuridique?.toLowerCase().includes('public') || 
           this.statutJuridique?.toLowerCase().includes('état') || false;
  }

  /**
   * Obtient les informations de contact principales (depuis le siège social)
   */
  getContactInfo(): {
    address?: string;
  } {
    return {
      address: this.siegeSocial || '',
    };
  }

  /**
   * Note: Informations de direction déplacées vers les documents et contacts
   */

  /**
   * Met à jour les statistiques
   */
  updateStatistics(stats: {
    nombreAgences?: number;
    nombreClientsActifs?: number;
  }): void {
    if (stats.nombreAgences !== undefined) {
      this.nombreAgences = stats.nombreAgences;
    }
    if (stats.nombreClientsActifs !== undefined) {
      this.nombreClientsActifs = stats.nombreClientsActifs;
    }
    this.updatedAt = new Date();
  }

  /**
   * Note: Les statuts de vérification et activation sont gérés via les métadonnées
   */

  /**
   * Obtient une représentation JSON simplifiée
   */
  toJSON(): any {
    return {
      id: this.id,
      denominationSociale: this.denominationSociale,
      sigle: this.sigle,
      typeInstitution: this.typeInstitution,
      numeroAgrement: this.numeroAgrement,
      contactInfo: this.getContactInfo(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}