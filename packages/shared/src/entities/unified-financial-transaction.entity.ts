/**
 * ENTITÉ FINANCIÈRE UNIFIÉE - CONTEXTE B2C vs B2B
 * 
 * Cette entité unifie TOUTES les structures de transactions financières
 * existantes dans les différents services tout en supportant la différenciation
 * entre paiements d'abonnements B2C et opérations financières B2B complexes.
 * 
 * Remplace et unifie:
 * - apps/customer-service/src/modules/billing/entities/payment.entity.ts
 * - apps/payment-service/src/modules/payments/entities/payment-transaction.entity.ts
 * - apps/gestion_commerciale_service/src/modules/financial-transactions/entities/financial-transaction.entity.ts
 * - apps/admin-service/src/modules/finance/entities/finance.entity.ts
 * - apps/portfolio-institution-service/src/modules/portfolios/entities/traditional-disbursement.entity.ts
 * - apps/portfolio-institution-service/src/modules/virements/entities/disbursement.entity.ts
 * 
 * DIFFÉRENCIATION B2C vs B2B:
 * - B2C: Paiements abonnements clients via mobile money (montants fixes, validation simple)
 * - B2B: Opérations financières institutionnelles (montants variables, conformité stricte)
 */

import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsOptional, 
  IsString, 
  IsNumber, 
  IsUUID, 
  IsObject,
  IsBoolean,
  Min,
  Max,
  Length,
  Matches
} from 'class-validator';
import { Transform } from 'class-transformer';

// Import des entités et services de base
import { 
  ISO20022FinancialTransaction,
  ISO20022TransactionType,
  ISO20022PaymentMethod,
  ISO20022TransactionStatus
} from './iso20022-financial-transaction.entity';
// import { encryptTransformer } from '../transformers/encryption.transformer';

// Import des nouveaux enums unifiés et contextes B2C/B2B
import {
  UnifiedPaymentMethod,
  UnifiedTransactionStatus,
  UnifiedTransactionType,
  SupportedCurrency,
  TransactionPriority,
  TransactionChannel,
  AMLRiskLevel,
  FinancialEnumsHelper
} from '../enums/financial-enums';

// Import des types partagés pour éviter les dépendances circulaires
import {
  ServiceContext,
  BusinessContext,
  ExtendedMetadata
} from '../types/financial-types';

// Ré-export pour compatibilité
export { ServiceContext, BusinessContext };
export type { ExtendedMetadata };

/**
 * MÉTADONNÉES ÉTENDUES - SUITE
 * Les 30 premières lignes sont définies dans financial-types.ts
 * Voici la suite de l'interface (continuation)
 */
@Entity('unified_financial_transactions')
@Index(['serviceContext', 'status'])
@Index(['createdAt', 'serviceContext'])
@Index(['amount', 'currency'])
@Index(['legacyId', 'legacyTable'])
export class UnifiedFinancialTransaction extends ISO20022FinancialTransaction {
  
  // === CONTEXTE ET IDENTIFICATION ===
  
  @ApiProperty({ 
    enum: ServiceContext,
    description: 'Service qui a initié la transaction'
  })
  @Column({
    type: 'enum',
    enum: ServiceContext,
    nullable: false
  })
  @IsEnum(ServiceContext)
  serviceContext!: ServiceContext;

  @ApiProperty({ 
    enum: BusinessContext,
    description: 'Contexte business - B2C (abonnements) vs B2B (opérations financières)'
  })
  @Column({
    type: 'enum',
    enum: BusinessContext,
    nullable: false,
    default: BusinessContext.B2C
  })
  @Index()
  @IsEnum(BusinessContext)
  businessContext!: BusinessContext;
  
  @ApiPropertyOptional({ description: 'ID legacy pour migration' })
  @Column({ nullable: true })
  @Index()
  @IsOptional()
  @IsString()
  legacyId?: string;
  
  @ApiPropertyOptional({ description: 'Table legacy pour traçabilité' })
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  legacyTable?: string;
  
  // === CHAMPS BUSINESS UNIFIÉS ===
  
  @ApiProperty({ 
    enum: UnifiedTransactionType,
    description: 'Type de transaction unifié'
  })
  @Column({
    type: 'enum',
    enum: UnifiedTransactionType,
    nullable: false
  })
  @IsEnum(UnifiedTransactionType)
  unifiedType!: UnifiedTransactionType;
  
  @ApiProperty({ 
    enum: UnifiedPaymentMethod,
    description: 'Méthode de paiement unifiée'
  })
  @Column({
    type: 'enum',
    enum: UnifiedPaymentMethod,
    nullable: false
  })
  @IsEnum(UnifiedPaymentMethod)
  unifiedPaymentMethod!: UnifiedPaymentMethod;
  
  @ApiProperty({ 
    enum: UnifiedTransactionStatus,
    description: 'Statut de transaction unifié'
  })
  @Column({
    type: 'enum',
    enum: UnifiedTransactionStatus,
    default: UnifiedTransactionStatus.INITIATED
  })
  @IsEnum(UnifiedTransactionStatus)
  unifiedStatus!: UnifiedTransactionStatus;
  
  @ApiProperty({ 
    enum: SupportedCurrency,
    description: 'Devise supportée (ISO 4217)'
  })
  @Column({
    type: 'enum',
    enum: SupportedCurrency,
    nullable: false
  })
  @IsEnum(SupportedCurrency)
  unifiedCurrency!: SupportedCurrency;
  
  // === MONTANTS AVEC PRECISION BANCAIRE ===
  
  @ApiProperty({ 
    type: 'number',
    description: 'Montant principal avec précision bancaire',
    example: 1000.50
  })
  @Column('decimal', { precision: 18, scale: 2, nullable: false })
  // @Transform(encryptTransformer.to, { toPlainOnly: false })
  // @Transform(encryptTransformer.from, { toClassOnly: false })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  unifiedAmount!: number;
  
  @ApiPropertyOptional({ 
    type: 'number',
    description: 'Frais de transaction',
    example: 5.00
  })
  @Column('decimal', { precision: 18, scale: 2, nullable: true })
  // @Transform(encryptTransformer.to, { toPlainOnly: false })
  // @Transform(encryptTransformer.from, { toClassOnly: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  transactionFee?: number;
  
  @ApiPropertyOptional({ 
    type: 'number',
    description: 'Taux de change appliqué',
    example: 1.0850
  })
  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  exchangeRate?: number;
  
  // === PRIORITÉ ET CANAL ===
  
  @ApiProperty({ 
    enum: TransactionPriority,
    description: 'Priorité de traitement'
  })
  @Column({
    type: 'enum',
    enum: TransactionPriority,
    default: TransactionPriority.NORMAL
  })
  @IsEnum(TransactionPriority)
  priority!: TransactionPriority;
  
  @ApiProperty({ 
    enum: TransactionChannel,
    description: 'Canal d\'initiation'
  })
  @Column({
    type: 'enum',
    enum: TransactionChannel,
    nullable: false
  })
  @IsEnum(TransactionChannel)
  channel!: TransactionChannel;
  
  // === COMPLIANCE ET SÉCURITÉ ===
  
  @ApiProperty({ 
    enum: AMLRiskLevel,
    description: 'Niveau de risque AML'
  })
  @Column({
    type: 'enum',
    enum: AMLRiskLevel,
    default: AMLRiskLevel.LOW
  })
  @IsEnum(AMLRiskLevel)
  amlRiskLevel!: AMLRiskLevel;
  
  @ApiPropertyOptional({ description: 'Score de risque calculé (0-100)' })
  @Column({ type: 'smallint', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  riskScore?: number;
  
  @ApiPropertyOptional({ description: 'Indicateurs de fraude détectés' })
  @Column({ type: 'json', nullable: true })
  @IsOptional()
  @IsObject()
  fraudIndicators?: Record<string, any>;
  
  // === MÉTADONNÉES ÉTENDUES ===
  
  @ApiPropertyOptional({ 
    type: 'object',
    description: 'Métadonnées étendues spécifiques au contexte'
  })
  @Column({ type: 'jsonb', nullable: true })
  // @Transform(encryptTransformer.to, { toPlainOnly: false })
  // @Transform(encryptTransformer.from, { toClassOnly: false })
  @IsOptional()
  @IsObject()
  extendedMetadata?: ExtendedMetadata;

  // === CHAMPS SPÉCIFIQUES B2C ===
  
  @ApiPropertyOptional({ 
    description: 'Plan d\'abonnement (contexte B2C uniquement - BASIC, STANDARD, PREMIUM, ENTERPRISE)',
    example: 'STANDARD'
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index()
  @IsOptional()
  @IsString()
  b2cSubscriptionPlan?: string;

  @ApiPropertyOptional({ 
    description: 'Nom du client B2C',
    example: 'Jean-Claude Kambala'
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  b2cClientName?: string;

  @ApiPropertyOptional({ 
    description: 'Numéro téléphone mobile money (B2C)',
    example: '+243998765432'
  })
  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index()
  @IsOptional()
  @IsString()
  @Length(10, 20)
  b2cClientPhone?: string;

  @ApiPropertyOptional({ 
    description: 'Mois d\'abonnement payés (B2C)',
    example: 1
  })
  @Column({ type: 'smallint', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  b2cSubscriptionMonths?: number;

  @ApiPropertyOptional({ 
    description: 'Renouvellement automatique activé (B2C)',
    example: false
  })
  @Column({ type: 'boolean', nullable: true, default: false })
  @IsOptional()
  @IsBoolean()
  b2cAutoRenewal?: boolean;

  @ApiPropertyOptional({ 
    description: 'ID transaction opérateur mobile (B2C)',
    example: 'AM-2024110901234'
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index()
  @IsOptional()
  @IsString()
  @Length(5, 50)
  b2cOperatorTransactionId?: string;

  // === CHAMPS SPÉCIFIQUES B2B ===
  
  @ApiPropertyOptional({ 
    description: 'Type d\'institution (contexte B2B uniquement - BANK, MICROFINANCE, COOPERATIVE, INSURANCE)',
    example: 'BANK'
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index()
  @IsOptional()
  @IsString()
  b2bInstitutionType?: string;

  @ApiPropertyOptional({ 
    description: 'Référence end-to-end ISO 20022 (B2B)',
    example: 'E2E-WANZO-20241110-001'
  })
  @Column({ type: 'varchar', length: 35, nullable: true })
  @Index()
  @IsOptional()
  @IsString()
  @Length(1, 35)
  b2bEndToEndReference?: string;

  @ApiPropertyOptional({ 
    description: 'Code BIC banque correspondante (B2B)',
    example: 'CHASUS33'
  })
  @Column({ type: 'varchar', length: 11, nullable: true })
  @IsOptional()
  @IsString()
  @Length(8, 11)
  @Matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, { message: 'Format BIC invalide' })
  b2bCorrespondentBankBic?: string;

  @ApiPropertyOptional({ 
    description: 'Type de message SWIFT (B2B)',
    example: 'MT103'
  })
  @Column({ type: 'varchar', length: 10, nullable: true })
  @IsOptional()
  @IsString()
  @Length(3, 10)
  b2bSwiftMessageType?: string;

  @ApiPropertyOptional({ 
    description: 'Répartition des frais (B2B)',
    example: 'SHA',
    enum: ['OUR', 'BEN', 'SHA']
  })
  @Column({ type: 'varchar', length: 3, nullable: true })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  b2bChargeBearer?: string;

  @ApiPropertyOptional({ 
    description: 'Informations conformité AML (B2B)',
    type: 'object'
  })
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  b2bComplianceData?: {
    amlCategory?: string;
    fundsOriginCountry?: string;
    fundsDestinationCountry?: string;
    economicNature?: string;
    requiredDocuments?: string[];
    declarationExempt?: boolean;
    riskAssessment?: string;
    complianceNotes?: string;
  };
  
  // === TRAÇABILITÉ ET AUDIT ===
  
  @ApiPropertyOptional({ description: 'Utilisateur ayant initié la transaction' })
  @Column({ nullable: true })
  @Index()
  @IsOptional()
  @IsUUID()
  initiatedBy?: string;
  
  @ApiPropertyOptional({ description: 'Utilisateur ayant approuvé la transaction' })
  @Column({ nullable: true })
  @IsOptional()
  @IsUUID()
  approvedBy?: string;
  
  @ApiPropertyOptional({ description: 'Date d\'approbation' })
  @Column({ type: 'timestamptz', nullable: true })
  @IsOptional()
  approvedAt?: Date;
  
  @ApiPropertyOptional({ description: 'Date de finalisation' })
  @Column({ type: 'timestamptz', nullable: true })
  @IsOptional()
  completedAt?: Date;
  
  @ApiPropertyOptional({ description: 'Raison du rejet/échec' })
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  rejectionReason?: string;
  
  @ApiPropertyOptional({ description: 'Description de la transaction' })
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
  
  // === COMPATIBILITÉ LEGACY ===
  
  /**
   * Convertit vers le format customer-service Payment
   */
  toCustomerPayment(): any {
    return {
      id: this.id,
      amount: this.unifiedAmount,
      currency: this.unifiedCurrency,
      method: FinancialEnumsHelper.mapLegacyPaymentMethod(this.unifiedPaymentMethod),
      status: FinancialEnumsHelper.mapLegacyPaymentStatus(this.unifiedStatus),
      customerId: this.extendedMetadata?.customerId,
      invoiceId: this.extendedMetadata?.invoiceId,
      subscriptionId: this.extendedMetadata?.subscriptionId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  
  /**
   * Convertit vers le format payment-service PaymentTransaction
   */
  toPaymentTransaction(): any {
    return {
      id: this.id,
      amount: this.unifiedAmount.toString(), // PaymentService utilise string
      currency: this.unifiedCurrency,
      status: this.unifiedStatus,
      provider: this.extendedMetadata?.providerName || 'Unified',
      providerTransactionId: this.extendedMetadata?.providerTransactionId,
      sessionId: this.extendedMetadata?.sessionId,
      clientPhone: this.extendedMetadata?.clientPhone,
      telecom: this.extendedMetadata?.telecom,
      clientReference: this.extendedMetadata?.clientReference,
      paymentType: this.unifiedType,
      customerId: this.extendedMetadata?.customerId,
      meta: this.extendedMetadata,
      completedAt: this.completedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  
  /**
   * Convertit vers le format gestion_commerciale_service FinancialTransaction
   */
  toCommercialTransaction(): any {
    return {
      id: this.id,
      amount: this.unifiedAmount,
      type: this.unifiedType,
      paymentMethod: this.unifiedPaymentMethod,
      status: this.unifiedStatus,
      description: this.description,
      userId: this.initiatedBy,
      customerId: this.extendedMetadata?.customerId,
      supplierId: this.extendedMetadata?.supplierId,
      contractId: this.extendedMetadata?.contractId,
      invoiceNumber: this.extendedMetadata?.invoiceNumber,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  
  /**
   * Convertit vers le format admin-service Finance
   */
  toAdminFinance(): any {
    return {
      id: this.id,
      amount: this.unifiedAmount,
      currency: this.unifiedCurrency,
      transactionType: this.unifiedType,
      description: this.description,
      adminUserId: this.extendedMetadata?.adminUserId,
      departmentId: this.extendedMetadata?.departmentId,
      budgetId: this.extendedMetadata?.budgetId,
      approvalLevel: this.extendedMetadata?.approvalLevel,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  
  /**
   * Convertit vers le format portfolio-service Disbursement
   */
  toPortfolioDisbursement(): any {
    return {
      id: this.id,
      amount: this.unifiedAmount,
      currency: this.unifiedCurrency,
      paymentMethod: this.unifiedPaymentMethod,
      status: this.unifiedStatus,
      portfolioId: this.extendedMetadata?.portfolioId,
      institutionId: this.extendedMetadata?.institutionId,
      disbursementType: this.extendedMetadata?.disbursementType,
      loanId: this.extendedMetadata?.loanId,
      repaymentScheduleId: this.extendedMetadata?.repaymentScheduleId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  
  // === FACTORY METHODS ===
  
  /**
   * Crée une transaction depuis les données customer-service
   */
  static fromCustomerPayment(paymentData: any): UnifiedFinancialTransaction {
    const transaction = new UnifiedFinancialTransaction();
    
    transaction.serviceContext = ServiceContext.CUSTOMER;
    transaction.unifiedAmount = paymentData.amount;
    transaction.unifiedCurrency = paymentData.currency as SupportedCurrency;
    transaction.unifiedPaymentMethod = FinancialEnumsHelper.mapLegacyPaymentMethod(paymentData.method);
    transaction.unifiedStatus = FinancialEnumsHelper.mapLegacyPaymentStatus(paymentData.status);
    transaction.unifiedType = UnifiedTransactionType.PAYMENT;
    transaction.channel = TransactionChannel.WEB; // Default
    transaction.priority = TransactionPriority.NORMAL;
    transaction.amlRiskLevel = AMLRiskLevel.LOW;
    
    transaction.extendedMetadata = {
      customerId: paymentData.customerId,
      invoiceId: paymentData.invoiceId,
      subscriptionId: paymentData.subscriptionId,
      planId: paymentData.planId
    };
    
    // Mapping vers ISO 20022
    transaction.transactionType = ISO20022TransactionType.CREDIT_TRANSFER;
    transaction.paymentMethod = ISO20022PaymentMethod.CARD_PAYMENT;
    transaction.status = ISO20022TransactionStatus.PENDING;
    
    return transaction;
  }
  
  /**
   * Crée une transaction depuis les données payment-service
   */
  static fromPaymentService(paymentData: any): UnifiedFinancialTransaction {
    const transaction = new UnifiedFinancialTransaction();
    
    transaction.serviceContext = ServiceContext.PAYMENT;
    transaction.unifiedAmount = typeof paymentData.amount === 'string' 
      ? parseFloat(paymentData.amount) 
      : paymentData.amount;
    transaction.unifiedCurrency = paymentData.currency as SupportedCurrency;
    transaction.unifiedStatus = FinancialEnumsHelper.mapLegacyPaymentStatus(paymentData.status);
    transaction.unifiedType = UnifiedTransactionType.PAYMENT;
    transaction.channel = TransactionChannel.API; // Provider API
    transaction.priority = TransactionPriority.HIGH; // Provider transactions sont prioritaires
    transaction.amlRiskLevel = AMLRiskLevel.MEDIUM; // Providers externes = risque moyen
    
    transaction.extendedMetadata = {
      providerId: paymentData.provider,
      providerName: paymentData.provider,
      providerTransactionId: paymentData.providerTransactionId,
      sessionId: paymentData.sessionId,
      clientPhone: paymentData.clientPhone,
      telecom: paymentData.telecom,
      clientReference: paymentData.clientReference,
      customerId: paymentData.customerId
    };
    
    return transaction;
  }
  
  // === MÉTHODES DE VALIDATION ===
  
  /**
   * Valide la cohérence des données selon le contexte
   */
  validateContextData(): string[] {
    const errors: string[] = [];
    
    switch (this.serviceContext) {
      case ServiceContext.CUSTOMER:
        if (!this.extendedMetadata?.customerId) {
          errors.push('Customer transactions require customerId');
        }
        break;
        
      case ServiceContext.PAYMENT:
        if (!this.extendedMetadata?.providerId) {
          errors.push('Payment transactions require providerId');
        }
        break;
        
      case ServiceContext.COMMERCIAL:
        if (!this.extendedMetadata?.customerId && !this.extendedMetadata?.supplierId) {
          errors.push('Commercial transactions require customerId or supplierId');
        }
        break;
        
      case ServiceContext.PORTFOLIO:
        if (!this.extendedMetadata?.portfolioId) {
          errors.push('Portfolio transactions require portfolioId');
        }
        break;
    }
    
    return errors;
  }
  
  /**
   * Calcule le score de risque automatiquement
   */
  calculateRiskScore(): number {
    let score = 0;
    
    // Montant
    if (this.unifiedAmount > 10000) score += 20;
    else if (this.unifiedAmount > 5000) score += 10;
    
    // Méthode de paiement
    if (this.unifiedPaymentMethod === UnifiedPaymentMethod.CASH) score += 15;
    if (this.unifiedPaymentMethod === UnifiedPaymentMethod.CRYPTOCURRENCY) score += 25;
    
    // Canal
    if (this.channel === TransactionChannel.ATM) score += 10;
    if (this.channel === TransactionChannel.API) score += 5;
    
    // Métadonnées suspectes
    if (this.fraudIndicators && Object.keys(this.fraudIndicators).length > 0) {
      score += 30;
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * Met à jour le niveau de risque AML basé sur le score
   */
  updateAMLRiskLevel(): void {
    this.riskScore = this.calculateRiskScore();
    
    if (this.riskScore >= 80) {
      this.amlRiskLevel = AMLRiskLevel.VERY_HIGH;
    } else if (this.riskScore >= 60) {
      this.amlRiskLevel = AMLRiskLevel.HIGH;
    } else if (this.riskScore >= 30) {
      this.amlRiskLevel = AMLRiskLevel.MEDIUM;
    } else {
      this.amlRiskLevel = AMLRiskLevel.LOW;
    }
  }
}

/**
 * INTERFACE POUR FACTORY METHODS
 */
export interface TransactionCreationData {
  amount: number;
  currency: string;
  type: string;
  paymentMethod: string;
  status?: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * FACTORY CLASS POUR CRÉATION SIMPLIFIÉE
 */
export class UnifiedTransactionFactory {
  
  static createFromLegacyData(
    data: TransactionCreationData,
    context: ServiceContext
  ): UnifiedFinancialTransaction {
    const transaction = new UnifiedFinancialTransaction();
    
    transaction.serviceContext = context;
    transaction.unifiedAmount = data.amount;
    transaction.unifiedCurrency = data.currency as SupportedCurrency;
    transaction.unifiedType = FinancialEnumsHelper.mapLegacyTransactionType(data.type);
    transaction.unifiedPaymentMethod = FinancialEnumsHelper.mapLegacyPaymentMethod(data.paymentMethod);
    transaction.unifiedStatus = data.status 
      ? FinancialEnumsHelper.mapLegacyPaymentStatus(data.status)
      : UnifiedTransactionStatus.INITIATED;
    
    transaction.description = data.description;
    transaction.extendedMetadata = data.metadata as ExtendedMetadata;
    
    // Valeurs par défaut
    transaction.channel = TransactionChannel.API;
    transaction.priority = TransactionPriority.NORMAL;
    transaction.updateAMLRiskLevel();
    
    return transaction;
  }
}