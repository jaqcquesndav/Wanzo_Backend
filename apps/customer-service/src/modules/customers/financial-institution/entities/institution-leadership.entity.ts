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
 * Entité pour le leadership des institutions financières
 * Gère les dirigeants, conseil d'administration et structure organisationnelle
 */
@Entity('institutions_leadership')
@Index(['institutionId'])
@Index(['role'])
@Index(['level'])
@Index(['status'])
@Index(['appointmentDate'])
@Index(['isCurrentPosition'])
export class InstitutionLeadershipEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  institutionId: string;

  // === INFORMATIONS PERSONNELLES ===
  @Column({ type: 'varchar', length: 255, nullable: false })
  fullName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({
    type: 'enum',
    enum: ['male', 'female', 'other'],
    nullable: true
  })
  gender?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nationality?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  idNumber?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  passportNumber?: string;

  // === POSITION ET RÔLE ===
  @Column({
    type: 'enum',
    enum: [
      'ceo', 'president', 'chairman', 'vice_chairman', 'coo', 'cfo', 'cro', 'cto', 'cso',
      'board_member', 'independent_director', 'executive_director', 'managing_director',
      'deputy_ceo', 'general_manager', 'branch_manager', 'regional_manager',
      'head_of_audit', 'head_of_compliance', 'head_of_risk', 'head_of_operations',
      'head_of_finance', 'head_of_hr', 'head_of_it', 'head_of_legal',
      'other'
    ],
    nullable: false
  })
  @Index()
  role: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customRoleTitle?: string;

  @Column({
    type: 'enum',
    enum: ['board', 'executive', 'senior_management', 'middle_management', 'operational'],
    nullable: false
  })
  @Index()
  level: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department?: string;

  @Column({ type: 'boolean', default: true })
  @Index()
  isCurrentPosition: boolean;

  // === NOMINATION ET MANDAT ===
  @Column({ type: 'date', nullable: false })
  @Index()
  appointmentDate: Date;

  @Column({ type: 'date', nullable: true })
  termStartDate?: Date;

  @Column({ type: 'date', nullable: true })
  termEndDate?: Date;

  @Column({ type: 'date', nullable: true })
  actualEndDate?: Date;

  @Column({
    type: 'enum',
    enum: ['active', 'suspended', 'resigned', 'terminated', 'retired', 'deceased'],
    default: 'active'
  })
  @Index()
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  appointedBy?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  appointmentAuthority?: string;

  @Column({ type: 'text', nullable: true })
  appointmentConditions?: string;

  // === APPROBATIONS RÉGLEMENTAIRES ===
  @Column({ type: 'boolean', default: false })
  requiresRegulatoryApproval: boolean;

  @Column({ type: 'boolean', default: false })
  regulatoryApprovalReceived: boolean;

  @Column({ type: 'date', nullable: true })
  regulatoryApprovalDate?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  regulatoryAuthority?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  approvalReferenceNumber?: string;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Conditions et restrictions réglementaires'
  })
  regulatoryConditions?: string[];

  // === CONTACT ===
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  emergencyContact?: string;

  // === EXPÉRIENCE PROFESSIONNELLE ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Historique professionnel'
  })
  professionalExperience?: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description?: string;
    industry: string;
    isRelevant: boolean;
  }>;

  @Column({ type: 'int', nullable: true })
  totalExperienceYears?: number;

  @Column({ type: 'int', nullable: true })
  financialSectorExperienceYears?: number;

  @Column({ type: 'int', nullable: true })
  leadershipExperienceYears?: number;

  // === ÉDUCATION ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Formation et éducation'
  })
  education?: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    graduationYear: number;
    country: string;
    isVerified: boolean;
  }>;

  // === CERTIFICATIONS ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Certifications professionnelles'
  })
  certifications?: Array<{
    id: string;
    name: string;
    issuer: string;
    issuedDate: string;
    expiryDate?: string;
    number?: string;
    status: string | 'suspended';
    isActive: boolean;
  }>;

  // === COMPÉTENCES ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Compétences et expertises'
  })
  skills?: Array<{
    category: string;
    skills: string[];
    level: string | 'advanced' | 'expert';
  }>;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Langues parlées'
  })
  languages?: Array<{
    language: string;
    level: string | 'fluent' | 'native';
    isWritten: boolean;
    isSpoken: boolean;
  }>;

  // === RÉMUNÉRATION ===
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  baseSalary?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  bonuses: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  allowances: number;

  @Column({ type: 'varchar', length: 10, default: 'CDF' })
  salaryCurrency: string;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Avantages et bénéfices'
  })
  benefits?: {
    healthInsurance?: boolean;
    lifeInsurance?: boolean;
    retirement?: boolean;
    carAllowance?: boolean;
    housingAllowance?: boolean;
    education?: boolean;
    other?: string[];
  };

  // === PERFORMANCE ET ÉVALUATION ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Évaluations de performance'
  })
  performanceReviews?: Array<{
    id: string;
    reviewDate: string;
    reviewPeriod: { start: string; end: string; };
    reviewer: string;
    overallRating: number;
    strengths: string[];
    areasForImprovement: string[];
    goals: string[];
    nextReviewDate?: string;
  }>;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  latestPerformanceRating?: number;

  @Column({ type: 'date', nullable: true })
  lastPerformanceReviewDate?: Date;

  // === GOUVERNANCE ET COMITÉS ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Participation aux comités'
  })
  committeeParticipation?: Array<{
    id: string;
    committeeName: string;
    role: string | 'secretary';
    joinDate: string;
    endDate?: string;
    isActive: boolean;
  }>;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Responsabilités de gouvernance'
  })
  governanceResponsibilities?: string[];

  // === CONFLITS D'INTÉRÊTS ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Déclarations de conflits d\'intérêts'
  })
  conflictOfInterestDeclarations?: Array<{
    id: string;
    declarationDate: string;
    nature: string;
    description: string;
    mitigationMeasures?: string[];
    status: string | 'resolved';
    reviewDate?: string;
  }>;

  @Column({ type: 'date', nullable: true })
  lastConflictReviewDate?: Date;

  // === AUTRES MANDATS ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Autres mandats et positions'
  })
  otherPositions?: Array<{
    id: string;
    organization: string;
    position: string;
    startDate: string;
    endDate?: string;
    isPaid: boolean;
    isActive: boolean;
    potentialConflict: boolean;
  }>;

  // === FORMATION CONTINUE ===
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Formation continue et développement professionnel'
  })
  continuousEducation?: Array<{
    id: string;
    program: string;
    provider: string;
    completionDate: string;
    hours: number;
    certificate?: string;
    topic: string;
  }>;

  @Column({ type: 'int', default: 0 })
  annualTrainingHours: number;

  // === SUCCESSION ===
  @Column({ type: 'varchar', length: 255, nullable: true })
  successor?: string;

  @Column({ type: 'date', nullable: true })
  successionPlanDate?: Date;

  @Column({ type: 'boolean', default: false })
  isSuccessionPlanned: boolean;

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
  @ManyToOne(() => InstitutionCoreEntity, institution => institution.leadership, {
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
   * Calcule l'âge de la personne
   */
  getAge(): number | null {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Calcule la durée en poste (en années)
   */
  getTenure(): number {
    const endDate = this.actualEndDate || (this.isCurrentPosition ? new Date() : this.termEndDate);
    if (!endDate) return 0;
    
    const start = new Date(this.appointmentDate);
    const end = new Date(endDate);
    return Math.floor((end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  /**
   * Vérifie si le mandat est en cours
   */
  isActiveTerm(): boolean {
    if (!this.isCurrentPosition || this.status !== 'active') return false;
    if (!this.termEndDate) return true;
    return new Date() <= new Date(this.termEndDate);
  }

  /**
   * Vérifie si le mandat arrive à expiration bientôt
   */
  isTermExpiringSoon(daysThreshold: number = 90): boolean {
    if (!this.termEndDate || !this.isActiveTerm()) return false;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    return new Date(this.termEndDate) <= thresholdDate;
  }

  /**
   * Vérifie si l'approbation réglementaire est requise mais manquante
   */
  needsRegulatoryApproval(): boolean {
    return this.requiresRegulatoryApproval && !this.regulatoryApprovalReceived;
  }

  /**
   * Calcule le salaire total annuel
   */
  getTotalAnnualCompensation(): number {
    const baseSalary = this.baseSalary || 0;
    return (baseSalary * 12) + this.bonuses + this.allowances;
  }

  /**
   * Vérifie si la personne est membre du conseil d'administration
   */
  isBoardMember(): boolean {
    return this.level === 'board' || 
           ['chairman', 'vice_chairman', 'board_member', 'independent_director', 'executive_director'].includes(this.role);
  }

  /**
   * Vérifie si la personne est un dirigeant exécutif
   */
  isExecutive(): boolean {
    return this.level === 'executive' || 
           ['ceo', 'president', 'coo', 'cfo', 'cro', 'cto', 'cso', 'managing_director', 'deputy_ceo'].includes(this.role);
  }

  /**
   * Récupère les certifications actives
   */
  getActiveCertifications(): NonNullable<typeof this.certifications> {
    if (!this.certifications) return [];
    return this.certifications.filter(cert => 
      cert.isActive && 
      cert.status === 'active' &&
      (!cert.expiryDate || new Date(cert.expiryDate) > new Date())
    );
  }

  /**
   * Récupère les certifications qui expirent bientôt
   */
  getExpiringSoon(daysThreshold: number = 60): NonNullable<typeof this.certifications> {
    if (!this.certifications) return [];
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    
    return this.certifications.filter(cert => 
      cert.isActive && 
      cert.expiryDate &&
      new Date(cert.expiryDate) <= thresholdDate
    );
  }

  /**
   * Vérifie si la formation continue est à jour
   */
  isTrainingUpToDate(requiredHours: number = 40): boolean {
    const currentYear = new Date().getFullYear();
    if (!this.continuousEducation) return false;
    
    const currentYearHours = this.continuousEducation
      .filter(training => new Date(training.completionDate).getFullYear() === currentYear)
      .reduce((total, training) => total + training.hours, 0);
    
    return currentYearHours >= requiredHours;
  }

  /**
   * Calcule le score d'éligibilité basé sur l'expérience et les qualifications
   */
  getEligibilityScore(): number {
    let score = 0;

    // Expérience (40 points max)
    if (this.totalExperienceYears) {
      score += Math.min(this.totalExperienceYears * 2, 40);
    }

    // Expérience secteur financier (30 points max)
    if (this.financialSectorExperienceYears) {
      score += Math.min(this.financialSectorExperienceYears * 3, 30);
    }

    // Éducation (15 points max)
    if (this.education && this.education.length > 0) {
      score += Math.min(this.education.length * 5, 15);
    }

    // Certifications (10 points max)
    const activeCerts = this.getActiveCertifications();
    score += Math.min(activeCerts.length * 2, 10);

    // Performance (5 points max)
    if (this.latestPerformanceRating) {
      score += this.latestPerformanceRating;
    }

    return Math.min(score, 100);
  }

  /**
   * Vérifie si un renouvellement de mandat est dû
   */
  isDueForRenewal(monthsThreshold: number = 6): boolean {
    if (!this.termEndDate || !this.isActiveTerm()) return false;
    const thresholdDate = new Date();
    thresholdDate.setMonth(thresholdDate.getMonth() + monthsThreshold);
    return new Date(this.termEndDate) <= thresholdDate;
  }

  /**
   * Génère un résumé des qualifications
   */
  getQualificationsSummary(): {
    experience: string;
    education: string;
    certifications: string;
    performance: string;
  } {
    const experience = `${this.totalExperienceYears || 0} ans d'expérience totale, ` +
                      `${this.financialSectorExperienceYears || 0} ans dans le secteur financier`;

    const educationCount = this.education?.length || 0;
    const education = `${educationCount} diplôme${educationCount > 1 ? 's' : ''}`;

    const activeCerts = this.getActiveCertifications();
    const certifications = `${activeCerts.length} certification${activeCerts.length > 1 ? 's' : ''} active${activeCerts.length > 1 ? 's' : ''}`;

    const performance = this.latestPerformanceRating ? 
                       `Dernière évaluation: ${this.latestPerformanceRating}/5` : 
                       'Pas d\'évaluation récente';

    return { experience, education, certifications, performance };
  }
}