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
import { InstitutionCoreEntity } from './institution-core.entity';

/**
 * Entité pour les succursales et agences des institutions financières
 * Gère les points de service, géolocalisation et services par succursale
 */
@Entity('institutions_branches')
@Index(['institutionId'])
@Index(['branchCode'], { unique: true })
@Index(['type'])
@Index(['status'])
@Index(['city'])
@Index(['openingDate'])
export class InstitutionBranchEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  institutionId: string;

  // === INFORMATIONS DE BASE ===
  @Column({ type: 'varchar', length: 255, nullable: false })
  branchName: string;

  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  @Index()
  branchCode: string;

  @Column({
    type: 'enum',
    enum: [
      'headquarters', 'main_branch', 'branch', 'sub_branch', 
      'agency', 'kiosk', 'atm_point', 'mobile_branch', 
      'representative_office', 'liaison_office'
    ],
    nullable: false
  })
  @Index()
  type: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'temporarily_closed', 'under_renovation', 'closed'],
    default: 'active'
  })
  @Index()
  status: string;

  @Column({ type: 'date', nullable: false })
  @Index()
  openingDate: Date;

  @Column({ type: 'date', nullable: true })
  closingDate?: Date;

  // === ADRESSE ET LOCALISATION ===
  @Column({ type: 'text', nullable: false })
  address: string;

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

  @Column({ type: 'varchar', length: 255, nullable: true })
  landmark?: string;

  @Column({ type: 'text', nullable: true })
  directions?: string;

  // === CONTACT ===
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  fax?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  // === HEURES D'OUVERTURE ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Heures d\'ouverture par jour de la semaine'
  })
  operatingHours?: {
    monday?: { open: string; close: string; isClosed?: boolean; };
    tuesday?: { open: string; close: string; isClosed?: boolean; };
    wednesday?: { open: string; close: string; isClosed?: boolean; };
    thursday?: { open: string; close: string; isClosed?: boolean; };
    friday?: { open: string; close: string; isClosed?: boolean; };
    saturday?: { open: string; close: string; isClosed?: boolean; };
    sunday?: { open: string; close: string; isClosed?: boolean; };
  };

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Heures spéciales pour jours fériés ou événements'
  })
  specialHours?: Array<{
    date: string;
    reason: string;
    hours?: { open: string; close: string; };
    isClosed: boolean;
  }>;

  // === PERSONNEL ===
  @Column({ type: 'int', default: 0 })
  totalEmployees: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  branchManager?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  managerPhone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  managerEmail?: string;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Structure du personnel par département'
  })
  staffStructure?: {
    tellers?: number;
    customerService?: number;
    security?: number;
    administration?: number;
    sales?: number;
    operations?: number;
    other?: number;
  };

  // === SERVICES DISPONIBLES (JSON) ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Services financiers disponibles dans cette succursale'
  })
  services?: Array<{
    id: string;
    serviceName: string;
    serviceCode?: string;
    category: string;
    isActive: boolean;
    operatingHours?: { open: string; close: string; };
    requirements?: string[];
    fees?: Record<string, any>;
    limitations?: Record<string, any>;
    description?: string;
  }>;

  // === ÉQUIPEMENTS ET INFRASTRUCTURES ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Équipements et infrastructures disponibles'
  })
  facilities?: {
    atms?: number;
    depositMachines?: number;
    tellers?: number;
    privateOffices?: number;
    waitingArea?: boolean;
    parking?: boolean;
    parkingSpaces?: number;
    disabledAccess?: boolean;
    security?: string[];
    technology?: string[];
    other?: string[];
  };

  // === INFORMATIONS FINANCIÈRES ===
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  monthlyRevenue: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  monthlyDeposits: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  monthlyLoans: number;

  @Column({ type: 'int', default: 0 })
  monthlyTransactions: number;

  @Column({ type: 'int', default: 0 })
  totalCustomers: number;

  @Column({ type: 'int', default: 0 })
  newCustomersThisMonth: number;

  // === PERFORMANCE ET INDICATEURS ===
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  customerSatisfactionScore?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  averageServiceTime?: number; // en minutes

  @Column({ type: 'int', nullable: true })
  averageQueueLength?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  operationalEfficiencyScore?: number;

  // === SÉCURITÉ ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Mesures de sécurité en place'
  })
  securityMeasures?: {
    cameras?: number;
    alarmSystem?: boolean;
    securityGuards?: number;
    fireSystem?: boolean;
    accessControl?: boolean;
    vault?: boolean;
    emergencyPlan?: boolean;
    lastSecurityAudit?: string;
  };

  // === CONFORMITÉ ET AUDIT ===
  @Column({ type: 'date', nullable: true })
  lastInspectionDate?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastInspector?: string;

  @Column({
    type: 'enum',
    enum: ['compliant', 'minor_issues', 'major_issues', 'non_compliant'],
    nullable: true
  })
  complianceStatus?: string;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Historique des audits et inspections'
  })
  auditHistory?: Array<{
    id: string;
    date: string;
    type: string;
    auditor: string;
    findings: string[];
    recommendations: string[];
    status: string | 'conditional';
    followUpDate?: string;
  }>;

  // === BUDGET ET COÛTS ===
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monthlyOperatingCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monthlyRentCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monthlyUtilitiesCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monthlyStaffCost: number;

  @Column({ type: 'varchar', length: 10, default: 'CDF' })
  currency: string;

  // === ZONE DE DESSERTE ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Zone géographique desservie par la succursale'
  })
  serviceArea?: {
    radius?: number; // en km
    neighborhoods?: string[];
    zipCodes?: string[];
    boundaries?: {
      north?: number;
      south?: number;
      east?: number;
      west?: number;
    };
  };

  // === PARTENAIRES LOCAUX ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Partenaires locaux et agents'
  })
  localPartners?: Array<{
    id: string;
    name: string;
    type: string;
    services: string[];
    contact?: {
      phone?: string;
      email?: string;
      address?: string;
    };
    isActive: boolean;
  }>;

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
  @ManyToOne(() => InstitutionCoreEntity, {
    onDelete: 'CASCADE',
    nullable: false
  })
  @JoinColumn({ name: 'institutionId' })
  institution: InstitutionCoreEntity;

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
   * Vérifie si la succursale est ouverte à un moment donné
   */
  isOpenAt(date: Date): boolean {
    if (this.status !== 'active') return false;

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()] as keyof NonNullable<typeof this.operatingHours>;

    if (!this.operatingHours || !this.operatingHours[dayName]) return false;

    const dayHours = this.operatingHours[dayName];
    if (dayHours?.isClosed) return false;

    if (!dayHours?.open || !dayHours?.close) return false;

    const currentTime = date.toTimeString().slice(0, 5); // HH:MM format
    return currentTime >= dayHours.open && currentTime <= dayHours.close;
  }

  /**
   * Vérifie si la succursale est active et opérationnelle
   */
  isOperational(): boolean {
    return this.status === 'active' && (!this.closingDate || new Date(this.closingDate) > new Date());
  }

  /**
   * Calcule l'âge de la succursale en années
   */
  getBranchAge(): number {
    const today = new Date();
    const opening = new Date(this.openingDate);
    return Math.floor((today.getTime() - opening.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  /**
   * Récupère les services actifs
   */
  getActiveServices(): NonNullable<typeof this.services> {
    if (!this.services) return [];
    return this.services.filter(service => service.isActive);
  }

  /**
   * Vérifie si un service spécifique est disponible
   */
  hasService(serviceName: string): boolean {
    if (!this.services) return false;
    return this.services.some(service => 
      service.serviceName === serviceName && service.isActive
    );
  }

  /**
   * Calcule le ratio revenus/coûts
   */
  getProfitabilityRatio(): number {
    const totalCosts = this.monthlyOperatingCost + this.monthlyRentCost + 
                      this.monthlyUtilitiesCost + this.monthlyStaffCost;
    if (totalCosts === 0) return 0;
    return this.monthlyRevenue / totalCosts;
  }

  /**
   * Vérifie si la succursale est profitable
   */
  isProfitable(): boolean {
    return this.getProfitabilityRatio() > 1;
  }

  /**
   * Calcule le nombre de clients par employé
   */
  getCustomersPerEmployee(): number {
    if (this.totalEmployees === 0) return 0;
    return this.totalCustomers / this.totalEmployees;
  }

  /**
   * Calcule le revenu par client
   */
  getRevenuePerCustomer(): number {
    if (this.totalCustomers === 0) return 0;
    return this.monthlyRevenue / this.totalCustomers;
  }

  /**
   * Vérifie si la succursale nécessite une attention managériale
   */
  requiresAttention(): boolean {
    return (
      !this.isProfitable() ||
      (this.customerSatisfactionScore !== null && this.customerSatisfactionScore !== undefined && this.customerSatisfactionScore < 3) ||
      (this.operationalEfficiencyScore !== null && this.operationalEfficiencyScore !== undefined && this.operationalEfficiencyScore < 70) ||
      this.complianceStatus === 'non_compliant' ||
      this.complianceStatus === 'major_issues'
    );
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

  /**
   * Calcule la distance par rapport à un point (en km)
   */
  getDistanceFrom(lat: number, lng: number): number | null {
    if (!this.latitude || !this.longitude) return null;

    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRadians(this.latitude - lat);
    const dLng = this.toRadians(this.longitude - lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat)) * Math.cos(this.toRadians(this.latitude)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convertit des degrés en radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Récupère les heures d'ouverture du jour
   */
  getTodayHours(): { open: string; close: string; isClosed: boolean } | null {
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[today.getDay()] as keyof NonNullable<typeof this.operatingHours>;

    if (!this.operatingHours || !this.operatingHours[dayName]) {
      return { open: '09:00', close: '17:00', isClosed: false }; // Heures par défaut
    }

    const dayHours = this.operatingHours[dayName];
    return {
      open: dayHours?.open || '09:00',
      close: dayHours?.close || '17:00',
      isClosed: dayHours?.isClosed || false
    };
  }

  /**
   * Calcule le score de performance global
   */
  getOverallPerformanceScore(): number {
    let score = 0;
    let factors = 0;

    // Profitabilité (30%)
    if (this.getProfitabilityRatio() > 0) {
      score += Math.min(this.getProfitabilityRatio() * 30, 30);
      factors += 30;
    }

    // Satisfaction client (25%)
    if (this.customerSatisfactionScore !== null && this.customerSatisfactionScore !== undefined) {
      score += (this.customerSatisfactionScore / 5) * 25;
      factors += 25;
    }

    // Efficacité opérationnelle (25%)
    if (this.operationalEfficiencyScore !== null && this.operationalEfficiencyScore !== undefined) {
      score += (this.operationalEfficiencyScore / 100) * 25;
      factors += 25;
    }

    // Conformité (20%)
    if (this.complianceStatus) {
      const complianceScore = this.complianceStatus === 'compliant' ? 20 :
                             this.complianceStatus === 'minor_issues' ? 15 :
                             this.complianceStatus === 'major_issues' ? 10 : 0;
      score += complianceScore;
      factors += 20;
    }

    return factors > 0 ? (score / factors) * 100 : 0;
  }
}