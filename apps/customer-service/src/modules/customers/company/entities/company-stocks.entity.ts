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
 * Entité pour les stocks et inventaires des entreprises
 * Gère les matières premières, produits finis et mouvements de stock
 */
@Entity('companies_stocks')
@Index(['companyId'])
@Index(['sku'], { unique: true })
@Index(['category'])
@Index(['state'])
@Index(['quantity'])
@Index(['unitCost'])
@Index(['reorderLevel'])
export class CompanyStocksEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  companyId: string;

  // === INFORMATIONS DE BASE ===
  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  @Index()
  sku: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ['raw_materials', 'work_in_progress', 'finished_goods', 'supplies', 'spare_parts', 'consumables'],
    nullable: false
  })
  @Index()
  category: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subcategory?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  manufacturer?: string;

  // === QUANTITÉS ===
  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  @Index()
  quantity: number;

  @Column({ type: 'varchar', length: 20, nullable: false })
  unit: string; // kg, pcs, liters, m², etc.

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  @Index()
  reorderLevel: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  maximumLevel: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  reservedQuantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  availableQuantity: number;

  // === COÛTS ET VALEURS ===
  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: false })
  @Index()
  unitCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  averageCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  lastCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  sellingPrice?: number;

  @Column({ type: 'varchar', length: 10, default: 'CDF' })
  currency: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalValue: number;

  // === LOCALISATION ===
  @Column({ type: 'varchar', length: 255, nullable: true })
  warehouse?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  zone?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  aisle?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  shelf?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  bin?: string;

  // === STATUT ET ÉTAT ===
  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'discontinued', 'obsolete'],
    default: 'active'
  })
  status: string;

  @Column({
    type: 'enum',
    enum: ['good', 'damaged', 'expired', 'quarantine', 'returned'],
    default: 'good'
  })
  @Index()
  state: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: true })
  trackInventory: boolean;

  // === DATES IMPORTANTES ===
  @Column({ type: 'date', nullable: true })
  manufacturingDate?: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'date', nullable: true })
  lastReceivedDate?: Date;

  @Column({ type: 'date', nullable: true })
  lastSoldDate?: Date;

  @Column({ type: 'date', nullable: true })
  lastCountDate?: Date;

  // === INFORMATIONS FOURNISSEUR ===
  @Column({ type: 'varchar', length: 255, nullable: true })
  primarySupplier?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  supplierSku?: string;

  @Column({ type: 'int', nullable: true })
  leadTimeDays?: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
  minimumOrderQuantity?: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
  economicOrderQuantity?: number;

  // === MOUVEMENTS DE STOCK (JSON) ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Historique des mouvements de stock'
  })
  movements?: Array<{
    id: string;
    type: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    reason: string;
    reference?: string;
    date: string;
    user?: string;
    supplierInfo?: string;
    customerInfo?: string;
    notes?: string;
  }>;

  // === SPÉCIFICATIONS TECHNIQUES ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Spécifications et caractéristiques techniques'
  })
  specifications?: Record<string, any>;

  // === CODES ET IDENTIFIANTS ===
  @Column({ type: 'varchar', length: 50, nullable: true })
  barcode?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  qrCode?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  internalCode?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  hsCode?: string; // Code du système harmonisé

  // === DIMENSIONS ET POIDS ===
  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight?: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  weightUnit?: string; // kg, g, lb

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  length?: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  width?: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  height?: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  dimensionUnit?: string; // cm, m, in

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  volume?: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  volumeUnit?: string; // m³, l, ft³

  // === GESTION QUALITÉ ===
  @Column({ type: 'varchar', length: 100, nullable: true })
  qualityGrade?: string;

  @Column({ type: 'date', nullable: true })
  lastQualityCheck?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  qualityNotes?: string;

  @Column({ type: 'boolean', default: false })
  requiresInspection: boolean;

  // === INFORMATIONS COMPTABLES ===
  @Column({ type: 'varchar', length: 100, nullable: true })
  accountingCode?: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  taxRate?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxCategory?: string;

  // === ANALYSE ABC ===
  @Column({
    type: 'enum',
    enum: ['A', 'B', 'C'],
    nullable: true,
    comment: 'Classification ABC basée sur la valeur'
  })
  abcClassification?: string;

  @Column({
    type: 'enum',
    enum: ['fast', 'medium', 'slow'],
    nullable: true,
    comment: 'Vitesse de rotation'
  })
  turnoverRate?: string;

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
   * Vérifie si le stock est en faible quantité
   */
  isLowStock(): boolean {
    return this.quantity <= this.reorderLevel;
  }

  /**
   * Vérifie si le stock est en rupture
   */
  isOutOfStock(): boolean {
    return this.quantity <= 0;
  }

  /**
   * Vérifie si le stock est sur-stocké
   */
  isOverstocked(): boolean {
    return this.quantity > this.maximumLevel;
  }

  /**
   * Calcule la valeur totale du stock
   */
  calculateTotalValue(): number {
    return this.quantity * this.unitCost;
  }

  /**
   * Calcule la quantité disponible pour vente
   */
  getAvailableForSale(): number {
    return Math.max(0, this.quantity - this.reservedQuantity);
  }

  /**
   * Vérifie si le produit est périmé
   */
  isExpired(): boolean {
    if (!this.expiryDate) return false;
    return new Date() > new Date(this.expiryDate);
  }

  /**
   * Calcule les jours jusqu'à expiration
   */
  getDaysUntilExpiry(): number | null {
    if (!this.expiryDate) return null;
    const today = new Date();
    const expiry = new Date(this.expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Vérifie si une commande de réapprovisionnement est nécessaire
   */
  needsReorder(): boolean {
    return this.isActive && this.trackInventory && this.isLowStock() && !this.isObsolete();
  }

  /**
   * Calcule la quantité recommandée pour réapprovisionnement
   */
  getReorderQuantity(): number {
    if (!this.needsReorder()) return 0;
    
    if (this.economicOrderQuantity && this.economicOrderQuantity > 0) {
      return this.economicOrderQuantity;
    }
    
    if (this.minimumOrderQuantity && this.minimumOrderQuantity > 0) {
      return Math.max(this.minimumOrderQuantity, this.maximumLevel - this.quantity);
    }
    
    return this.maximumLevel - this.quantity;
  }

  /**
   * Vérifie si le produit est obsolète
   */
  isObsolete(): boolean {
    return this.status === 'obsolete' || this.status === 'discontinued';
  }

  /**
   * Calcule le taux de rotation
   */
  calculateTurnoverRate(soldQuantityPeriod: number, periodDays: number): number {
    if (this.quantity === 0) return 0;
    const dailySales = soldQuantityPeriod / periodDays;
    return (dailySales * 365) / this.quantity;
  }

  /**
   * Vérifie si le stock nécessite une inspection
   */
  needsInspection(): boolean {
    return this.requiresInspection && this.state === 'quarantine';
  }

  /**
   * Récupère la localisation complète
   */
  getFullLocation(): string {
    const parts = [this.warehouse, this.zone, this.aisle, this.shelf, this.bin];
    return parts.filter(Boolean).join('-');
  }

  /**
   * Ajoute un mouvement de stock
   */
  addMovement(movement: Omit<NonNullable<typeof this.movements>[0], 'id'>): void {
    if (!this.movements) {
      this.movements = [];
    }
    
    const newMovement = {
      id: Date.now().toString(),
      ...movement
    };
    
    this.movements.unshift(newMovement);
    
    // Garde seulement les 100 derniers mouvements pour éviter une table trop lourde
    if (this.movements.length > 100) {
      this.movements = this.movements.slice(0, 100);
    }
  }

  /**
   * Met à jour les quantités après un mouvement
   */
  updateQuantityAfterMovement(type: string, quantity: number): void {
    switch (type) {
      case 'in':
        this.quantity += quantity;
        break;
      case 'out':
        this.quantity = Math.max(0, this.quantity - quantity);
        break;
      case 'adjustment':
        this.quantity = Math.max(0, quantity);
        break;
    }
    
    this.availableQuantity = Math.max(0, this.quantity - this.reservedQuantity);
    this.totalValue = this.calculateTotalValue();
  }
}