import { User } from '../../auth/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum FinancingType {
  BUSINESS_LOAN = 'businessLoan',
  EQUIPMENT_LOAN = 'equipmentLoan',
  WORKING_CAPITAL = 'workingCapital',
  EXPANSION_LOAN = 'expansionLoan',
  LINE_OF_CREDIT = 'lineOfCredit',
}

export enum FinancingRequestStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'underReview',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DISBURSED = 'disbursed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

interface Document {
  id: string;
  type: string;
  name: string;
  url: string;
  uploadDate: Date;
}

interface BusinessInformation {
  name: string;
  registrationNumber: string;
  address: string;
  yearsInBusiness: number;
  numberOfEmployees: number;
  annualRevenue: number;
}

interface FinancialInformation {
  monthlyRevenue: number;
  monthlyExpenses: number;
  existingLoans: Array<{
    lender: string;
    originalAmount: number;
    outstandingBalance: number;
    monthlyPayment: number;
  }>;
}

@Entity('financing_requests')
export class FinancingRecord {
  @ApiProperty({ description: 'Identifiant unique de la demande', example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID de l\'utilisateur qui possède cette demande' })
  @Column()
  userId: string;

  @ApiProperty({ description: 'Utilisateur qui possède cette demande', type: () => User })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ description: 'ID de l\'entreprise', example: '123e4567-e89b-12d3-a456-426614174001' })
  @Column({ nullable: true })
  businessId: string;

  @ApiProperty({ description: 'ID du produit de financement', example: '123e4567-e89b-12d3-a456-426614174002' })
  @Column({ nullable: true })
  productId: string;

  @ApiProperty({ 
    description: 'Type de financement', 
    enum: FinancingType,
    example: FinancingType.BUSINESS_LOAN
  })
  @Column({
    type: 'enum',
    enum: FinancingType,
  })
  type: FinancingType;

  @ApiProperty({ description: 'Montant demandé', example: 50000 })
  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @ApiProperty({ description: 'Devise (CDF, USD, etc.)', example: 'CDF' })
  @Column()
  currency: string;

  @ApiProperty({ description: 'Durée en mois', example: 12 })
  @Column('int')
  term: number;

  @ApiProperty({ description: 'Objet du financement', example: 'Achat d\'équipements' })
  @Column()
  purpose: string;

  @ApiProperty({ description: 'ID de l\'institution financière', example: '123e4567-e89b-12d3-a456-426614174003', nullable: true })
  @Column({ nullable: true })
  institutionId: string;

  @ApiProperty({ description: 'ID du contrat portfolio-institution associé', example: '123e4567-e89b-12d3-a456-426614174004', nullable: true })
  @Column({ name: 'contract_id', nullable: true })
  contractId: string;

  @ApiProperty({ description: 'Date de soumission', example: '2023-08-01T12:30:00.000Z' })
  @Column({ name: 'application_date', nullable: true })
  applicationDate: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour du statut', example: '2023-08-02T10:15:00.000Z', nullable: true })
  @Column({ name: 'last_status_update_date', nullable: true })
  lastStatusUpdateDate: Date;

  @ApiProperty({ description: 'Date d\'approbation (si applicable)', example: '2023-08-15T14:20:00.000Z', nullable: true })
  @Column({ name: 'approval_date', nullable: true })
  approvalDate: Date;

  @ApiProperty({ description: 'Date de décaissement (si applicable)', example: '2023-08-20T09:45:00.000Z', nullable: true })
  @Column({ name: 'disbursement_date', nullable: true })
  disbursementDate: Date;

  @ApiProperty({ 
    description: 'Statut de la demande',
    enum: FinancingRequestStatus,
    example: FinancingRequestStatus.SUBMITTED,
    default: FinancingRequestStatus.DRAFT
  })
  @Column({
    type: 'enum',
    enum: FinancingRequestStatus,
    default: FinancingRequestStatus.DRAFT,
  })
  status: FinancingRequestStatus;

  @ApiProperty({ description: 'Informations sur l\'entreprise' })
  @Column({
    type: 'jsonb',
    nullable: true
  })
  businessInformation: BusinessInformation;

  @ApiProperty({ description: 'Informations financières' })
  @Column({
    type: 'jsonb',
    nullable: true
  })
  financialInformation: FinancialInformation;

  @ApiProperty({ description: 'Documents soumis' })
  @Column({
    type: 'jsonb',
    nullable: true
  })
  documents: Document[];

  @ApiProperty({ description: 'Notes supplémentaires', nullable: true })
  @Column({ nullable: true })
  notes: string;

  // ============= CHAMPS SCORE CRÉDIT XGBOOST =============
  
  @ApiProperty({ 
    description: 'Score crédit calculé par XGBoost (1-100)', 
    example: 75,
    minimum: 1,
    maximum: 100,
    nullable: true 
  })
  @Column({ name: 'credit_score', type: 'int', nullable: true })
  creditScore: number;

  @ApiProperty({ 
    description: 'Date de calcul du score crédit', 
    example: '2023-08-01T12:30:00.000Z',
    nullable: true 
  })
  @Column({ name: 'credit_score_calculated_at', nullable: true })
  creditScoreCalculatedAt: Date;

  @ApiProperty({ 
    description: 'Date d\'expiration du score crédit (validité 30 jours)', 
    example: '2023-08-31T12:30:00.000Z',
    nullable: true 
  })
  @Column({ name: 'credit_score_valid_until', nullable: true })
  creditScoreValidUntil: Date;

  @ApiProperty({ 
    description: 'Version du modèle XGBoost utilisé', 
    example: 'v1.2.3',
    nullable: true 
  })
  @Column({ name: 'credit_score_model_version', nullable: true })
  creditScoreModelVersion: string;

  @ApiProperty({ 
    description: 'Niveau de risque basé sur le score crédit', 
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    example: 'MEDIUM',
    nullable: true 
  })
  @Column({ name: 'risk_level', nullable: true })
  riskLevel: string;

  @ApiProperty({ 
    description: 'Score de confiance du modèle (0-1)', 
    example: 0.85,
    minimum: 0,
    maximum: 1,
    nullable: true 
  })
  @Column({ name: 'confidence_score', type: 'decimal', precision: 3, scale: 2, nullable: true })
  confidenceScore: number;

  @ApiProperty({ 
    description: 'Source des données utilisées pour le calcul', 
    example: 'accounting_transactions_6m',
    nullable: true 
  })
  @Column({ name: 'credit_score_data_source', nullable: true })
  creditScoreDataSource: string;

  @ApiProperty({ 
    description: 'Composants détaillés du score crédit XGBoost', 
    example: {
      cashFlowQuality: 78,
      businessStability: 82,
      financialHealth: 65,
      paymentBehavior: 90,
      growthTrend: 70
    },
    nullable: true 
  })
  @Column({ name: 'credit_score_components', type: 'jsonb', nullable: true })
  creditScoreComponents: {
    cashFlowQuality: number;
    businessStability: number;
    financialHealth: number;
    paymentBehavior: number;
    growthTrend: number;
  };

  @ApiProperty({ 
    description: 'Facteurs explicatifs du score', 
    example: [
      'Flux de trésorerie réguliers détectés',
      'Croissance constante du chiffre d\'affaires',
      'Ratio d\'endettement acceptable'
    ],
    nullable: true 
  })
  @Column({ name: 'credit_score_explanation', type: 'jsonb', nullable: true })
  creditScoreExplanation: string[];

  @ApiProperty({ 
    description: 'Recommandations basées sur l\'analyse', 
    example: [
      'Maintenir la régularité des flux',
      'Diversifier les sources de revenus',
      'Optimiser la gestion de trésorerie'
    ],
    nullable: true 
  })
  @Column({ name: 'credit_score_recommendations', type: 'jsonb', nullable: true })
  creditScoreRecommendations: string[];

  // ============= FIN CHAMPS SCORE CRÉDIT =============

  @ApiProperty({ description: 'Date when the record was created', example: '2025-06-01T10:00:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Date when the record was last updated', example: '2025-06-01T10:00:00.000Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}
