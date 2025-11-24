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
 * Entité pour la conformité réglementaire des institutions financières
 * Gère les licences, certifications, audits et obligations légales
 */
@Entity('institutions_regulatory')
@Index(['institutionId'])
@Index(['regulatorCode'])
@Index(['complianceStatus'])
@Index(['riskRating'])
@Index(['lastAuditDate'])
@Index(['nextReviewDate'])
export class InstitutionRegulatoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  institutionId: string;

  // === INFORMATIONS GÉNÉRALES ===
  @Column({
    type: 'enum',
    enum: ['compliant', 'partially_compliant', 'non_compliant', 'under_review', 'suspended'],
    default: 'under_review'
  })
  @Index()
  complianceStatus: string;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  })
  @Index()
  riskRating: string;

  @Column({ type: 'date', nullable: true })
  @Index()
  lastAuditDate?: Date;

  @Column({ type: 'date', nullable: true })
  @Index()
  nextReviewDate?: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index()
  regulatorCode?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  primaryRegulator?: string;

  // === LICENCES ET AUTORISATIONS ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Licences et autorisations détenues'
  })
  licenses?: Array<{
    licenseId: string;
    licenseType: string;
    licenseName: string;
    licenseNumber: string;
    issuer: string;
    issuedDate: string;
    expiryDate?: string;
    renewalDate?: string;
    status: string;
    scope: string[];
    restrictions?: string[];
    conditions?: string[];
    renewalFee?: {
      amount: number;
      currency: string;
      dueDate?: string;
    };
    documents: Array<{
      documentType: string;
      documentName: string;
      documentPath?: string;
      uploadDate: string;
    }>;
  }>;

  // === CERTIFICATIONS ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Certifications et accréditations'
  })
  certifications?: Array<{
    certificationId: string;
    certificationName: string;
    certifyingBody: string;
    certificationNumber: string;
    certificationDate: string;
    expiryDate?: string;
    status: string;
    scope: string;
    maintenanceRequirements?: string[];
    renewalProcess?: string;
    associatedCosts?: {
      initialCost: number;
      renewalCost: number;
      currency: string;
    };
  }>;

  // === OBLIGATIONS RÉGLEMENTAIRES ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Obligations et exigences réglementaires'
  })
  regulatoryObligations?: {
    capitalRequirements?: {
      minimumCapital: {
        amount: number;
        currency: string;
      };
      currentCapital: {
        amount: number;
        currency: string;
        lastUpdated: string;
      };
      adequacyRatio: number;
      tier1Ratio?: number;
      leverageRatio?: number;
    };
    reserveRequirements?: {
      cashReserveRatio: number;
      statutoryReserveRatio: number;
      currentReserves: {
        amount: number;
        currency: string;
        lastUpdated: string;
      };
      complianceStatus: string;
    };
    liquidityRequirements?: {
      liquidityCoverageRatio: number;
      netStableFundingRatio: number;
      currentLiquidity: {
        amount: number;
        currency: string;
        lastUpdated: string;
      };
      stressTestResults?: Array<{
        testDate: string;
        scenario: string;
        result: string;
        recommendations?: string[];
      }>;
    };
    governanceRequirements?: {
      boardComposition: {
        minimumMembers: number;
        currentMembers: number;
        independentMembers: number;
        requiredExpertise: string[];
      };
      auditCommittee: {
        established: boolean;
        members: number;
        lastMeeting: string;
        meetingFrequency: string;
      };
      riskCommittee: {
        established: boolean;
        members: number;
        lastMeeting: string;
        meetingFrequency: string;
      };
    };
  };

  // === RAPPORTS RÉGLEMENTAIRES ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Exigences de rapportage'
  })
  reportingRequirements?: Array<{
    reportId: string;
    reportName: string;
    reportType: string;
    frequency: string;
    recipient: string;
    format: string;
    dueDate: string;
    lastSubmissionDate?: string;
    submissionStatus: string;
    submissionMethod: string;
    penalties?: {
      lateSubmissionFee: number;
      currency: string;
      escalationProcedure: string[];
    };
    nextDueDate: string;
    isActive: boolean;
  }>;

  // === AUDITS ET INSPECTIONS ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Historique des audits et inspections'
  })
  auditsHistory?: Array<{
    auditId: string;
    auditType: string;
    auditor: string;
    startDate: string;
    endDate?: string;
    status: string;
    scope: string[];
    findings: Array<{
      findingId: string;
      category: string;
      description: string;
      recommendation: string;
      remedialAction?: string;
      targetDate?: string;
      status: string;
      responsible: string;
    }>;
    overallRating?: string;
    managementResponse?: string;
    followUpAuditRequired: boolean;
    followUpDate?: string;
    costs?: {
      auditFees: number;
      remedialCosts: number;
      currency: string;
    };
  }>;

  // === SANCTIONS ET PÉNALITÉS ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Sanctions et pénalités reçues'
  })
  sanctionsHistory?: Array<{
    sanctionId: string;
    sanctionType: string;
    issuingAuthority: string;
    sanctionDate: string;
    reason: string;
    description: string;
    severity: string;
    financialPenalty?: {
      amount: number;
      currency: string;
      paidDate?: string;
      paymentStatus: string;
    };
    operationalRestrictions?: string[];
    complianceActions: Array<{
      action: string;
      dueDate: string;
      completionDate?: string;
      status: string;
      verificationRequired: boolean;
    }>;
    appealProcess?: {
      appealFiled: boolean;
      appealDate?: string;
      appellateBody?: string;
      appealOutcome?: string;
      finalResolutionDate?: string;
    };
    status: string;
    publicDisclosure: boolean;
  }>;

  // === CONFORMITÉ AML/CFT ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Conformité anti-blanchiment et financement du terrorisme'
  })
  amlCompliance?: {
    amlPolicy: {
      lastUpdate: string;
      nextReview: string;
      approvedBy: string;
      version: string;
    };
    kycProcedures: {
      customerIdentification: boolean;
      customerDueDiligence: boolean;
      enhancedDueDiligence: boolean;
      ongoingMonitoring: boolean;
      riskAssessment: boolean;
    };
    transactionMonitoring: {
      systemImplemented: boolean;
      systemName?: string;
      lastUpdate?: string;
      alertsGenerated: number;
      alertsInvestigated: number;
      suspiciousReports: number;
    };
    training: {
      annualTrainingCompleted: boolean;
      lastTrainingDate?: string;
      trainingProvider?: string;
      employeesTrained: number;
      totalEmployees: number;
    };
    reportingCompliance: {
      suspiciousTransactionReports: number;
      currencyTransactionReports: number;
      lastReportDate?: string;
      reportingTimeliness: string;
    };
  };

  // === PROTECTION DES CONSOMMATEURS ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Mesures de protection des consommateurs'
  })
  consumerProtection?: {
    disclosurePolicies: {
      interestRates: boolean;
      feesAndCharges: boolean;
      termsAndConditions: boolean;
      riskDisclosure: boolean;
      transparencyScore: number;
    };
    complaintHandling: {
      complaintPolicy: boolean;
      internalOmbudsman: boolean;
      complaintChannels: string[];
      averageResolutionTime: number;
      totalComplaints: number;
      resolvedComplaints: number;
      escalatedComplaints: number;
    };
    fairLending: {
      lendingPolicy: boolean;
      nonDiscriminationPolicy: boolean;
      accessibilityMeasures: string[];
      financialLiteracyPrograms: boolean;
    };
    dataProtection: {
      dataProtectionPolicy: boolean;
      privacyNotice: boolean;
      consentManagement: boolean;
      dataBreachProcedures: boolean;
      lastDataAudit?: string;
    };
  };

  // === CYBERSÉCURITÉ ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Conformité en matière de cybersécurité'
  })
  cybersecurityCompliance?: {
    securityFramework: string;
    lastSecurityAssessment: string;
    nextAssessmentDue: string;
    securityIncidents: Array<{
      incidentDate: string;
      incidentType: string;
      severity: string;
      reportedToRegulator: boolean;
      resolved: boolean;
      resolutionDate?: string;
    }>;
    securityMeasures: {
      encryptionStandards: string[];
      accessControls: boolean;
      networkSecurity: boolean;
      endpointProtection: boolean;
      backupAndRecovery: boolean;
      incidentResponsePlan: boolean;
    };
    thirdPartyRisk: {
      vendorAssessments: boolean;
      contractualRequirements: boolean;
      ongoingMonitoring: boolean;
      criticalVendors: number;
      assessedVendors: number;
    };
  };

  // === INITIATIVES DE CONFORMITÉ ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Projets et initiatives de conformité en cours'
  })
  complianceInitiatives?: Array<{
    initiativeId: string;
    initiativeName: string;
    description: string;
    regulatoryDriver: string;
    priority: string;
    startDate: string;
    targetCompletionDate: string;
    actualCompletionDate?: string;
    status: string;
    budget: {
      allocated: number;
      spent: number;
      currency: string;
    };
    milestones: Array<{
      milestoneId: string;
      description: string;
      dueDate: string;
      completionDate?: string;
      status: string;
    }>;
    risks: Array<{
      riskId: string;
      description: string;
      impact: string;
      mitigation: string;
    }>;
    teamMembers: Array<{
      name: string;
      role: string;
      responsibility: string;
    }>;
  }>;

  // === COÛTS DE CONFORMITÉ ===
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  annualComplianceCosts: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  regulatoryFees: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  auditCosts: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  trainingCosts: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  technologyCosts: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  penaltiesPaid: number;

  @Column({ type: 'varchar', length: 10, default: 'CDF' })
  costsCurrency: string;

  // === INDICATEURS DE PERFORMANCE ===
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  complianceScore?: number;

  @Column({ type: 'int', default: 0 })
  openFindings: number;

  @Column({ type: 'int', default: 0 })
  overdueActions: number;

  @Column({ type: 'int', default: 0 })
  expiredLicenses: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  auditRating?: number;

  // === CONTACTS RÉGLEMENTAIRES ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Contacts avec les régulateurs'
  })
  regulatoryContacts?: Array<{
    regulatorName: string;
    contactPerson: string;
    role: string;
    email: string;
    phone: string;
    address?: string;
    relationshipManager: string;
    lastContact?: string;
    nextScheduledContact?: string;
    communicationPreference: string;
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
   * Vérifie si l'institution est en conformité générale
   */
  isGenerallyCompliant(): boolean {
    return this.complianceStatus === 'compliant' && 
           this.openFindings === 0 && 
           this.overdueActions === 0 && 
           this.expiredLicenses === 0;
  }

  /**
   * Calcule le nombre de jours depuis le dernier audit
   */
  getDaysSinceLastAudit(): number | null {
    if (!this.lastAuditDate) return null;
    const today = new Date();
    const auditDate = new Date(this.lastAuditDate);
    return Math.floor((today.getTime() - auditDate.getTime()) / (24 * 60 * 60 * 1000));
  }

  /**
   * Calcule le nombre de jours jusqu'à la prochaine revue
   */
  getDaysToNextReview(): number | null {
    if (!this.nextReviewDate) return null;
    const today = new Date();
    const reviewDate = new Date(this.nextReviewDate);
    return Math.floor((reviewDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  }

  /**
   * Vérifie si une revue est due bientôt (dans les 30 jours)
   */
  isReviewDueSoon(): boolean {
    const daysToReview = this.getDaysToNextReview();
    return daysToReview !== null && daysToReview <= 30 && daysToReview >= 0;
  }

  /**
   * Récupère les licences actives
   */
  getActiveLicenses(): any[] {
    if (!this.licenses) return [];
    return this.licenses.filter(license => license.status === 'active');
  }

  /**
   * Récupère les licences expirées ou expirantes bientôt
   */
  getExpiringLicenses(daysAhead: number = 90): any[] {
    if (!this.licenses) return [];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    return this.licenses.filter(license => {
      if (!license.expiryDate) return false;
      const expiryDate = new Date(license.expiryDate);
      return expiryDate <= futureDate || license.status === 'expired';
    });
  }

  /**
   * Calcule le score de conformité global
   */
  calculateComplianceScore(): number {
    let score = 100;
    
    // Pénalités pour les problèmes critiques
    if (this.complianceStatus === 'non_compliant') score -= 30;
    else if (this.complianceStatus === 'partially_compliant') score -= 15;
    
    // Pénalités pour les risques
    if (this.riskRating === 'critical') score -= 25;
    else if (this.riskRating === 'high') score -= 15;
    else if (this.riskRating === 'medium') score -= 5;
    
    // Pénalités pour les constats ouverts
    score -= Math.min(this.openFindings * 2, 20);
    
    // Pénalités pour les actions en retard
    score -= Math.min(this.overdueActions * 3, 15);
    
    // Pénalités pour les licences expirées
    score -= Math.min(this.expiredLicenses * 10, 30);
    
    return Math.max(score, 0);
  }

  /**
   * Récupère les sanctions actives
   */
  getActiveSanctions(): any[] {
    if (!this.sanctionsHistory) return [];
    return this.sanctionsHistory.filter(sanction => sanction.status === 'active');
  }

  /**
   * Calcule le montant total des pénalités non payées
   */
  getUnpaidPenalties(): { amount: number; currency: string } {
    if (!this.sanctionsHistory) return { amount: 0, currency: this.costsCurrency };
    
    let totalAmount = 0;
    this.sanctionsHistory.forEach(sanction => {
      if (sanction.financialPenalty && 
          ['pending', 'partial'].includes(sanction.financialPenalty.paymentStatus)) {
        totalAmount += sanction.financialPenalty.amount;
      }
    });
    
    return { amount: totalAmount, currency: this.costsCurrency };
  }

  /**
   * Récupère les rapports en retard
   */
  getOverdueReports(): any[] {
    if (!this.reportingRequirements) return [];
    const today = new Date().toISOString().split('T')[0];
    
    return this.reportingRequirements.filter(report => 
      report.isActive && 
      report.dueDate < today && 
      ['not_submitted', 'late'].includes(report.submissionStatus)
    );
  }

  /**
   * Récupère les constats critiques ouverts
   */
  getCriticalFindings(): any[] {
    if (!this.auditsHistory) return [];
    
    const criticalFindings: any[] = [];
    this.auditsHistory.forEach(audit => {
      audit.findings.forEach(finding => {
        if (finding.category === 'critical' && finding.status === 'open') {
          criticalFindings.push({
            ...finding,
            auditId: audit.auditId,
            auditor: audit.auditor,
            auditDate: audit.startDate
          });
        }
      });
    });
    
    return criticalFindings;
  }

  /**
   * Vérifie l'adéquation des fonds propres
   */
  isCapitalAdequate(): boolean {
    const capitalReq = this.regulatoryObligations?.capitalRequirements;
    if (!capitalReq) return true;
    
    return capitalReq.currentCapital.amount >= capitalReq.minimumCapital.amount;
  }

  /**
   * Calcule le ratio de liquidité
   */
  getLiquidityRatio(): number | null {
    const liquidityReq = this.regulatoryObligations?.liquidityRequirements;
    if (!liquidityReq) return null;
    
    return liquidityReq.liquidityCoverageRatio;
  }

  /**
   * Vérifie si l'AML/CFT est conforme
   */
  isAMLCompliant(): boolean {
    if (!this.amlCompliance) return false;
    
    const kycComplete = Object.values(this.amlCompliance.kycProcedures || {}).every(Boolean);
    const trainingCurrent = this.amlCompliance.training?.annualTrainingCompleted || false;
    const monitoringActive = this.amlCompliance.transactionMonitoring?.systemImplemented || false;
    
    return kycComplete && trainingCurrent && monitoringActive;
  }

  /**
   * Récupère le coût total de conformité
   */
  getTotalComplianceCost(): number {
    return this.annualComplianceCosts + this.regulatoryFees + this.auditCosts + 
           this.trainingCosts + this.technologyCosts + this.penaltiesPaid;
  }

  /**
   * Calcule le ratio coût de conformité / revenus (si disponible)
   */
  getComplianceCostRatio(totalRevenue: number): number {
    if (totalRevenue === 0) return 0;
    return (this.getTotalComplianceCost() / totalRevenue) * 100;
  }

  /**
   * Génère un rapport de statut de conformité
   */
  getComplianceStatusReport(): {
    overallStatus: string;
    riskLevel: string;
    urgentActions: string[];
    recommendations: string[];
    nextSteps: string[];
  } {
    const urgentActions: string[] = [];
    const recommendations: string[] = [];
    const nextSteps: string[] = [];

    // Actions urgentes
    if (this.overdueActions > 0) {
      urgentActions.push(`${this.overdueActions} action(s) de conformité en retard`);
    }
    if (this.expiredLicenses > 0) {
      urgentActions.push(`${this.expiredLicenses} licence(s) expirée(s) à renouveler`);
    }
    if (this.getOverdueReports().length > 0) {
      urgentActions.push(`${this.getOverdueReports().length} rapport(s) en retard`);
    }

    // Recommandations
    if (this.riskRating === 'high' || this.riskRating === 'critical') {
      recommendations.push('Réviser et renforcer les mesures de gestion des risques');
    }
    if (!this.isAMLCompliant()) {
      recommendations.push('Mettre à jour les procédures AML/CFT');
    }
    if (this.getExpiringLicenses(90).length > 0) {
      recommendations.push('Planifier le renouvellement des licences arrivant à échéance');
    }

    // Prochaines étapes
    if (this.isReviewDueSoon()) {
      nextSteps.push('Préparer la prochaine revue réglementaire');
    }
    if (this.complianceScore && this.complianceScore < 80) {
      nextSteps.push('Élaborer un plan d\'amélioration de la conformité');
    }

    return {
      overallStatus: this.complianceStatus,
      riskLevel: this.riskRating,
      urgentActions,
      recommendations,
      nextSteps
    };
  }

  /**
   * Vérifie si l'institution nécessite une attention réglementaire immédiate
   */
  requiresImmediateAttention(): boolean {
    return (
      this.complianceStatus === 'non_compliant' ||
      this.riskRating === 'critical' ||
      this.overdueActions > 0 ||
      this.expiredLicenses > 0 ||
      this.getCriticalFindings().length > 0 ||
      this.getActiveSanctions().length > 0
    );
  }
}