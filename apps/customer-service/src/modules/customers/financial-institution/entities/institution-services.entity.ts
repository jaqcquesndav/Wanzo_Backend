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
 * Entité pour les services financiers des institutions
 * Gère les produits bancaires, tarifications et conditions d'accès
 */
@Entity('institutions_services')
@Index(['institutionId'])
@Index(['serviceCode'], { unique: true })
@Index(['category'])
@Index(['type'])
@Index(['status'])
@Index(['launchDate'])
@Index(['isActive'])
export class InstitutionServicesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  institutionId: string;

  // === INFORMATIONS DE BASE ===
  @Column({ type: 'varchar', length: 255, nullable: false })
  serviceName: string;

  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  @Index()
  serviceCode: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  shortDescription?: string;

  @Column({
    type: 'enum',
    enum: [
      'deposits', 'loans', 'payments', 'cards', 'investments', 'insurance',
      'forex', 'trade_finance', 'treasury', 'advisory', 'digital', 'other'
    ],
    nullable: false
  })
  @Index()
  category: string;

  @Column({
    type: 'enum',
    enum: [
      'savings_account', 'checking_account', 'fixed_deposit', 'current_account',
      'personal_loan', 'business_loan', 'mortgage', 'auto_loan', 'microfinance',
      'money_transfer', 'bill_payment', 'mobile_payment', 'online_banking',
      'debit_card', 'credit_card', 'prepaid_card',
      'mutual_funds', 'bonds', 'stocks', 'pension_plan',
      'life_insurance', 'general_insurance',
      'currency_exchange', 'letters_of_credit', 'guarantees',
      'advisory', 'wealth_management', 'other'
    ],
    nullable: false
  })
  @Index()
  type: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'suspended', 'discontinued', 'under_development'],
    default: 'under_development'
  })
  @Index()
  status: string;

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ type: 'date', nullable: false })
  @Index()
  launchDate: Date;

  @Column({ type: 'date', nullable: true })
  discontinuationDate?: Date;

  // === CIBLE ET ÉLIGIBILITÉ ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Critères d\'éligibilité pour le service'
  })
  eligibilityCriteria?: {
    ageRequirements?: {
      minimum?: number;
      maximum?: number;
    };
    incomeRequirements?: {
      minimum?: number;
      currency?: string;
      frequency?: string;
      verificationRequired?: boolean;
    };
    documentRequirements?: string[];
    creditScoreRequirements?: {
      minimum?: number;
      provider?: string;
    };
    residencyRequirements?: {
      countries?: string[];
      provinces?: string[];
      cities?: string[];
      minimumDuration?: number;
    };
    employmentRequirements?: {
      types?: string[];
      minimumTenure?: number;
      sectors?: string[];
    };
    existingRelationship?: boolean;
    minimumDeposit?: {
      amount: number;
      currency: string;
    };
    additionalCriteria?: string[];
  };

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Segments de clientèle ciblés'
  })
  targetSegments?: Array<{
    segmentName: string;
    description: string;
    priority: string | 'low';
    isActive: boolean;
  }>;

  // === STRUCTURE TARIFAIRE ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Structure des frais et commissions'
  })
  fees?: {
    setupFee?: {
      amount: number;
      currency: string;
      waived?: boolean;
      waiverConditions?: string[];
    };
    monthlyFee?: {
      amount: number;
      currency: string;
      waived?: boolean;
      waiverConditions?: string[];
    };
    transactionFees?: Array<{
      transactionType: string;
      feeType: string | 'tiered';
      amount?: number;
      percentage?: number;
      currency: string;
      minimum?: number;
      maximum?: number;
      tiers?: Array<{
        from: number;
        to?: number;
        rate: number;
      }>;
    }>;
    penaltyFees?: Array<{
      penaltyType: string;
      amount: number;
      currency: string;
      conditions: string[];
    }>;
    otherFees?: Array<{
      feeType: string;
      description: string;
      amount: number;
      currency: string;
      frequency?: string;
    }>;
  };

  // === TAUX D'INTÉRÊT ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Structure des taux d\'intérêt'
  })
  interestRates?: {
    savingsRate?: {
      rate: number;
      type: string;
      tiers?: Array<{
        from: number;
        to?: number;
        rate: number;
      }>;
      compoundingFrequency?: string | 'quarterly' | 'annually';
    };
    loanRate?: {
      baseRate: number;
      margin: number;
      effectiveRate: number;
      type: string;
      benchmark?: string;
      reviewFrequency?: string;
    };
    creditCardRate?: {
      purchaseRate: number;
      cashAdvanceRate: number;
      balanceTransferRate: number;
      penaltyRate: number;
    };
  };

  // === LIMITES ET PLAFONDS ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Limites et plafonds du service'
  })
  limits?: {
    minimumAmounts?: {
      deposit?: { amount: number; currency: string; };
      loan?: { amount: number; currency: string; };
      transaction?: { amount: number; currency: string; };
    };
    maximumAmounts?: {
      deposit?: { amount: number; currency: string; };
      loan?: { amount: number; currency: string; };
      transaction?: { amount: number; currency: string; };
      dailyLimit?: { amount: number; currency: string; };
      monthlyLimit?: { amount: number; currency: string; };
    };
    transactionLimits?: {
      daily?: { count: number; amount: number; currency: string; };
      monthly?: { count: number; amount: number; currency: string; };
      yearly?: { count: number; amount: number; currency: string; };
    };
    otherLimits?: Array<{
      limitType: string;
      value: number;
      unit: string;
      description: string;
    }>;
  };

  // === CONDITIONS ET TERMES ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Conditions générales du service'
  })
  terms?: {
    minimumTerm?: { value: number; unit: string | 'years'; };
    maximumTerm?: { value: number; unit: string | 'years'; };
    noticePeriod?: { value: number; unit: string; };
    renewalTerms?: string[];
    cancellationTerms?: string[];
    penaltyConditions?: string[];
    specialConditions?: string[];
  };

  // === CANAUX DE DISTRIBUTION ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Canaux par lesquels le service est disponible'
  })
  channels?: Array<{
    channelType: string | 'mobile' | 'phone' | 'atm' | 'agent' | 'mail';
    isAvailable: boolean;
    limitations?: string[];
    additionalFees?: {
      amount: number;
      currency: string;
      description: string;
    };
  }>;

  // === PROCESSUS D'APPLICATION ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Processus de demande et d\'approbation'
  })
  applicationProcess?: {
    steps: Array<{
      stepNumber: number;
      stepName: string;
      description: string;
      estimatedTime: string;
      requiredDocuments?: string[];
      canBeOnline: boolean;
    }>;
    totalProcessingTime: string;
    approvalLevels: Array<{
      level: number;
      authority: string;
      thresholds?: {
        amount?: number;
        currency?: string;
      };
    }>;
    automaticApproval?: {
      enabled: boolean;
      criteria?: string[];
      limits?: {
        amount: number;
        currency: string;
      };
    };
  };

  // === SUPPORT ET SERVICE CLIENT ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Support client et assistance'
  })
  customerSupport?: {
    supportChannels: Array<{
      channel: string | 'chat' | 'branch' | 'whatsapp';
      availability: string;
      contactInfo: string;
      language: string[];
    }>;
    selfServiceOptions: string[];
    faqAvailable: boolean;
    userManualAvailable: boolean;
    trainingSessions: boolean;
  };

  // === SÉCURITÉ ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Mesures de sécurité et authentification'
  })
  securityFeatures?: {
    authenticationMethods: string[];
    encryptionStandards: string[];
    fraudDetection: boolean;
    transactionLimits: boolean;
    alertSystems: string[];
    complianceStandards: string[];
  };

  // === INTÉGRATIONS TECHNOLOGIQUES ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Intégrations avec d\'autres systèmes'
  })
  integrations?: {
    coreSystem: string;
    paymentSystems: string[];
    thirdPartyProviders: Array<{
      provider: string;
      service: string;
      integrationDate: string;
      isActive: boolean;
    }>;
    apis: Array<{
      apiName: string;
      version: string;
      purpose: string;
      isPublic: boolean;
    }>;
  };

  // === PERFORMANCE ET MÉTRIQUES ===
  @Column({ type: 'int', default: 0 })
  totalCustomers: number;

  @Column({ type: 'int', default: 0 })
  activeCustomers: number;

  @Column({ type: 'int', default: 0 })
  newCustomersThisMonth: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalVolume: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  monthlyVolume: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  averageTransactionSize: number;

  @Column({ type: 'varchar', length: 10, default: 'CDF' })
  currency: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  customerSatisfactionScore?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  netPromoterScore?: number;

  // === REVENUS ===
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  monthlyRevenue: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  yearlyRevenue: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  profitMargin: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  operatingCosts: number;

  // === CONFORMITÉ RÉGLEMENTAIRE ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Exigences réglementaires applicables'
  })
  regulatoryCompliance?: {
    applicableRegulations: string[];
    licenses: Array<{
      licenseType: string;
      number: string;
      issuer: string;
      issuedDate: string;
      expiryDate?: string;
      status: string | 'suspended';
    }>;
    reportingRequirements: Array<{
      reportType: string;
      frequency: string;
      recipient: string;
      nextDueDate: string;
    }>;
    complianceChecks: Array<{
      checkType: string;
      lastCheckDate: string;
      nextCheckDate: string;
      status: string | 'pending';
    }>;
  };

  // === MARKETING ET PROMOTION ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Campagnes marketing et promotions'
  })
  marketingInfo?: {
    keyFeatures: string[];
    competitiveAdvantages: string[];
    targetingMessages: Array<{
      segment: string;
      message: string;
      channels: string[];
    }>;
    activeCampaigns: Array<{
      campaignName: string;
      startDate: string;
      endDate: string;
      budget: number;
      currency: string;
      channels: string[];
      isActive: boolean;
    }>;
  };

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
   * Calcule l'âge du service en années
   */
  getServiceAge(): number {
    const today = new Date();
    const launch = new Date(this.launchDate);
    return Math.floor((today.getTime() - launch.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  /**
   * Vérifie si le service est actif et disponible
   */
  isAvailableForCustomers(): boolean {
    return this.isActive && 
           this.status === 'active' && 
           (!this.discontinuationDate || new Date(this.discontinuationDate) > new Date());
  }

  /**
   * Calcule le taux de croissance des clients
   */
  getCustomerGrowthRate(): number {
    if (this.totalCustomers === 0) return 0;
    return (this.newCustomersThisMonth / this.totalCustomers) * 100;
  }

  /**
   * Calcule le taux d'activité des clients
   */
  getCustomerActivityRate(): number {
    if (this.totalCustomers === 0) return 0;
    return (this.activeCustomers / this.totalCustomers) * 100;
  }

  /**
   * Calcule la rentabilité du service
   */
  getProfitability(): number {
    if (this.operatingCosts === 0) return 0;
    return ((this.monthlyRevenue - this.operatingCosts) / this.operatingCosts) * 100;
  }

  /**
   * Vérifie si le service est rentable
   */
  isProfitable(): boolean {
    return this.monthlyRevenue > this.operatingCosts;
  }

  /**
   * Récupère les frais d'ouverture
   */
  getSetupFee(): { amount: number; currency: string; waived: boolean } | null {
    if (!this.fees?.setupFee) return null;
    return {
      amount: this.fees.setupFee.amount,
      currency: this.fees.setupFee.currency,
      waived: this.fees.setupFee.waived || false
    };
  }

  /**
   * Récupère les frais mensuels
   */
  getMonthlyFee(): { amount: number; currency: string; waived: boolean } | null {
    if (!this.fees?.monthlyFee) return null;
    return {
      amount: this.fees.monthlyFee.amount,
      currency: this.fees.monthlyFee.currency,
      waived: this.fees.monthlyFee.waived || false
    };
  }

  /**
   * Vérifie si un client est éligible (basique)
   */
  checkBasicEligibility(clientData: {
    age?: number;
    monthlyIncome?: number;
    hasExistingRelationship?: boolean;
  }): { eligible: boolean; reasons: string[] } {
    const reasons: string[] = [];
    let eligible = true;

    if (!this.eligibilityCriteria) return { eligible: true, reasons: [] };

    // Vérification de l'âge
    if (this.eligibilityCriteria.ageRequirements) {
      const ageReq = this.eligibilityCriteria.ageRequirements;
      if (clientData.age) {
        if (ageReq.minimum && clientData.age < ageReq.minimum) {
          eligible = false;
          reasons.push(`Âge minimum requis: ${ageReq.minimum} ans`);
        }
        if (ageReq.maximum && clientData.age > ageReq.maximum) {
          eligible = false;
          reasons.push(`Âge maximum autorisé: ${ageReq.maximum} ans`);
        }
      }
    }

    // Vérification du revenu
    if (this.eligibilityCriteria.incomeRequirements && clientData.monthlyIncome) {
      const incomeReq = this.eligibilityCriteria.incomeRequirements;
      if (incomeReq.minimum && clientData.monthlyIncome < incomeReq.minimum) {
        eligible = false;
        reasons.push(`Revenu minimum requis: ${incomeReq.minimum} ${incomeReq.currency || 'CDF'}`);
      }
    }

    // Vérification de la relation existante
    if (this.eligibilityCriteria.existingRelationship && !clientData.hasExistingRelationship) {
      eligible = false;
      reasons.push('Relation bancaire existante requise');
    }

    return { eligible, reasons };
  }

  /**
   * Récupère les canaux disponibles
   */
  getAvailableChannels(): string[] {
    if (!this.channels) return [];
    return this.channels
      .filter(channel => channel.isAvailable)
      .map(channel => channel.channelType);
  }

  /**
   * Calcule le temps de traitement estimé total
   */
  getEstimatedProcessingTime(): string {
    return this.applicationProcess?.totalProcessingTime || 'Non spécifié';
  }

  /**
   * Vérifie si l'approbation automatique est possible
   */
  canAutoApprove(amount?: number): boolean {
    if (!this.applicationProcess?.automaticApproval?.enabled) return false;
    
    if (amount && this.applicationProcess.automaticApproval.limits) {
      return amount <= this.applicationProcess.automaticApproval.limits.amount;
    }
    
    return true;
  }

  /**
   * Récupère le score de performance global
   */
  getPerformanceScore(): number {
    let score = 0;
    let factors = 0;

    // Croissance clients (25%)
    const growthRate = this.getCustomerGrowthRate();
    if (growthRate > 0) {
      score += Math.min(growthRate * 5, 25);
      factors += 25;
    }

    // Taux d'activité (25%)
    const activityRate = this.getCustomerActivityRate();
    score += (activityRate / 100) * 25;
    factors += 25;

    // Satisfaction client (25%)
    if (this.customerSatisfactionScore) {
      score += (this.customerSatisfactionScore / 5) * 25;
      factors += 25;
    }

    // Rentabilité (25%)
    if (this.isProfitable()) {
      score += 25;
    }
    factors += 25;

    return factors > 0 ? (score / factors) * 100 : 0;
  }

  /**
   * Vérifie si le service nécessite une attention managériale
   */
  requiresAttention(): boolean {
    return (
      !this.isProfitable() ||
      this.getCustomerGrowthRate() < 0 ||
      this.getCustomerActivityRate() < 50 ||
      (this.customerSatisfactionScore !== null && this.customerSatisfactionScore !== undefined && this.customerSatisfactionScore < 3)
    );
  }

  /**
   * Génère un résumé des caractéristiques principales
   */
  getServiceSummary(): {
    basicInfo: string;
    pricing: string;
    eligibility: string;
    performance: string;
  } {
    const basicInfo = `${this.serviceName} (${this.type}) - ${this.status}`;
    
    const setupFee = this.getSetupFee();
    const monthlyFee = this.getMonthlyFee();
    const pricing = `Frais d'ouverture: ${setupFee ? `${setupFee.amount} ${setupFee.currency}` : 'Aucun'}, ` +
                   `Frais mensuels: ${monthlyFee ? `${monthlyFee.amount} ${monthlyFee.currency}` : 'Aucun'}`;

    const hasAgeReq = this.eligibilityCriteria?.ageRequirements?.minimum;
    const hasIncomeReq = this.eligibilityCriteria?.incomeRequirements?.minimum;
    const eligibility = `Âge minimum: ${hasAgeReq || 'Non spécifié'}, ` +
                       `Revenu minimum: ${hasIncomeReq || 'Non spécifié'}`;

    const performance = `${this.totalCustomers} clients, ` +
                       `${this.getCustomerActivityRate().toFixed(1)}% actifs, ` +
                       `Performance: ${this.getPerformanceScore().toFixed(1)}%`;

    return { basicInfo, pricing, eligibility, performance };
  }
}