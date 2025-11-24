import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CompanyCoreEntity } from './company-core.entity';

/**
 * Entité pour les actifs des entreprises
 * Gère l'immobilier, véhicules, équipements et autres biens
 */
@Entity('companies_assets')
@Index(['companyId'])
@Index(['category'])
@Index(['type'])
@Index(['state'])
@Index(['acquisitionDate'])
@Index(['currentValue'])
export class CompanyAssetsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  companyId: string;

  // === INFORMATIONS DE BASE ===
  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ['real_estate', 'vehicles', 'equipment', 'furniture', 'technology', 'intangible', 'financial', 'other'],
    nullable: false
  })
  category: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  type: string;

  @Column({
    type: 'enum',
    enum: ['excellent', 'very_good', 'good', 'fair', 'poor', 'damaged', 'obsolete'],
    default: 'good'
  })
  state: string;

  // === IDENTIFICATION ===
  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  serialNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  modelNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  manufacturer?: string;

  @Column({ type: 'int', nullable: true })
  manufacturingYear?: number;

  // === VALEURS FINANCIÈRES ===
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  acquisitionCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  currentValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  marketValue?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  insuranceValue?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  bookValue?: number;

  @Column({ type: 'varchar', length: 10, default: 'CDF' })
  currency: string;

  @Column({ type: 'date', nullable: false })
  acquisitionDate: Date;

  @Column({ type: 'date', nullable: true })
  lastValuationDate?: Date;

  // === AMORTISSEMENT ===
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  depreciationRate?: number;

  @Column({
    type: 'enum',
    enum: ['straight_line', 'declining_balance', 'units_of_production', 'sum_of_years'],
    nullable: true
  })
  depreciationMethod?: string;

  @Column({ type: 'int', nullable: true })
  usefulLifeYears?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  accumulatedDepreciation: number;

  // === LOCALISATION ===
  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  building?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  floor?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  room?: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude?: number;

  // === RESPONSABILITÉ ===
  @Column({ type: 'varchar', length: 255, nullable: true })
  assignedTo?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  custodian?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  custodianContact?: string;

  // === MAINTENANCE ===
  @Column({ type: 'date', nullable: true })
  lastMaintenanceDate?: Date;

  @Column({ type: 'date', nullable: true })
  nextMaintenanceDate?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  maintenanceCost: number;

  @Column({
    type: 'enum',
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'as_needed'],
    nullable: true
  })
  maintenanceSchedule?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  maintenanceProvider?: string;

  // === ASSURANCE ===
  @Column({ type: 'varchar', length: 255, nullable: true })
  insuranceProvider?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  insurancePolicyNumber?: string;

  @Column({ type: 'date', nullable: true })
  insuranceExpiryDate?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  insurancePremium?: number;

  // === DOCUMENTS ET CERTIFICATIONS ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Documents associés à l\'actif'
  })
  documents?: Array<{
    id: string;
    type: string;
    name: string;
    path: string;
    uploadDate: string;
    expiryDate?: string;
    isActive: boolean;
  }>;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Certifications et conformités'
  })
  certifications?: Array<{
    id: string;
    type: string;
    number: string;
    issuer: string;
    issuedDate: string;
    expiryDate?: string;
    status: string;
    isActive: boolean;
  }>;

  // === HISTORIQUE D'UTILISATION ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Historique des utilisations et transferts'
  })
  usageHistory?: Array<{
    id: string;
    action: string;
    date: string;
    user: string;
    location?: string;
    notes?: string;
    duration?: number;
  }>;

  // === SPÉCIFICATIONS TECHNIQUES ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Spécifications techniques détaillées'
  })
  specifications?: Record<string, any>;

  // === GARANTIE ===
  @Column({ type: 'varchar', length: 255, nullable: true })
  warrantyProvider?: string;

  @Column({ type: 'date', nullable: true })
  warrantyStartDate?: Date;

  @Column({ type: 'date', nullable: true })
  warrantyEndDate?: Date;

  @Column({ type: 'text', nullable: true })
  warrantyTerms?: string;

  // === STATUT ET DISPONIBILITÉ ===
  @Column({
    type: 'enum',
    enum: ['available', 'in_use', 'maintenance', 'repair', 'disposed', 'sold', 'lost', 'stolen'],
    default: 'available'
  })
  status: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'date', nullable: true })
  disposalDate?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  disposalReason?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  disposalValue?: number;

  // === MÉTADONNÉES ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Données additionnelles et métadonnées'
  })
  metadata?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // === RELATION ===
  @ManyToOne(() => CompanyCoreEntity, {
    onDelete: 'CASCADE',
    nullable: false
  })
  @JoinColumn({ name: 'companyId' })
  company: CompanyCoreEntity;

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

  // === MÉTHODES UTILITAIRES ===

  /**
   * Calcule l'âge de l'actif en années
   */
  getAssetAge(): number {
    const today = new Date();
    const acquisition = new Date(this.acquisitionDate);
    return Math.floor((today.getTime() - acquisition.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  /**
   * Calcule la dépréciation actuelle
   */
  getCurrentDepreciation(): number {
    if (!this.depreciationRate || !this.usefulLifeYears) return 0;
    
    const ageInYears = this.getAssetAge();
    const maxDepreciationYears = Math.min(ageInYears, this.usefulLifeYears);
    
    if (this.depreciationMethod === 'straight_line') {
      return (this.acquisitionCost * this.depreciationRate * maxDepreciationYears) / 100;
    }
    
    return this.accumulatedDepreciation;
  }

  /**
   * Calcule la valeur nette comptable
   */
  getNetBookValue(): number {
    return Math.max(0, this.acquisitionCost - this.getCurrentDepreciation());
  }

  /**
   * Vérifie si l'actif est sous garantie
   */
  isUnderWarranty(): boolean {
    if (!this.warrantyEndDate) return false;
    return new Date() <= new Date(this.warrantyEndDate);
  }

  /**
   * Vérifie si l'assurance est expirée
   */
  isInsuranceExpired(): boolean {
    if (!this.insuranceExpiryDate) return false;
    return new Date() > new Date(this.insuranceExpiryDate);
  }

  /**
   * Vérifie si une maintenance est due
   */
  isMaintenanceDue(): boolean {
    if (!this.nextMaintenanceDate) return false;
    return new Date() >= new Date(this.nextMaintenanceDate);
  }

  /**
   * Calcule le taux de dépréciation effectif
   */
  getEffectiveDepreciationRate(): number {
    if (this.acquisitionCost === 0) return 0;
    return (this.getCurrentDepreciation() / this.acquisitionCost) * 100;
  }

  /**
   * Vérifie si l'actif est disponible
   */
  isAvailable(): boolean {
    return this.status === 'available' && this.isActive;
  }

  /**
   * Récupère la localisation complète
   */
  getFullLocation(): string {
    const parts = [this.location, this.building, this.floor, this.room];
    return parts.filter(Boolean).join(' - ');
  }
}