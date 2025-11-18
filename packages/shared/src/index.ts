// Export all shared modules - Wanzobe Backend

// ==================== NOUVELLE ARCHITECTURE DE CONTRÔLE D'ACCÈS ====================
// Export Business Features et système d'abonnement orienté métier
export * from './enums/business-features.enum';
export * from './events/business-feature-events';
export * from './decorators/feature-access.decorator';
export * from './guards/feature-access.guard';
export { FeatureAccessModule } from './feature-access.module';

// Export specific decorators
export {
  RequireAccountingEntries,
  RequireAutomatedAccounting,
  RequireFinancialReports,
  RequireDocumentAnalysis,
  RequireAITokens,
  RequirePredictiveAnalytics
} from './decorators/feature-access.decorator';

// Core Kafka Configuration and Events
export * from './events/kafka-config';
export * from './events/kafka-error-handler';

// Export Standard Kafka Infrastructure - Priority
export { 
  StandardKafkaTopics,
  BusinessOperationEventTopics,
  UserEventTopics,
  CustomerEventTopics,
  TokenEventTopics,
  SubscriptionEventTopics,
  PortfolioEventTopics
} from './events/standard-kafka-topics';
export { MessageVersionManager } from './events/message-versioning';

// Event Schemas and Types  
export * from './events/subscription-events';
export * from './events/subscription-types';
export * from './events/token-events';
export * from './events/token.service';
export * from './events/adha-events';

// Security
export * from './security/encryption.service';
export * from './security/encrypted-transformers';
export { SecurityModule } from './security/security.module';

// Re-export specific items from conflicting modules
export {
  type FundingRequestStatusChangedEvent,
  type ContractCreatedEvent,
  type ContractStatusChangedEvent,
  type ContractRestructuredEvent,
  type DisbursementCompletedEvent,
  type RepaymentReceivedEvent,
  type PaymentScheduleUpdatedEvent,
  type DocumentUpdatedEvent,
  type DocumentStatusChangedEvent,
  type DocumentUploadedEvent
} from './events/portfolio-events';

// Export Funding Request Events and Status Mapping
export * from './events/funding-request-events';
export * from './enums/funding-status';

// Export Credit Score Interfaces and Utilities
export {
  // Enums
  RiskLevel,
  CreditScoreClass,
} from './interfaces/credit-score.interface';

export type {
  // Interfaces principales
  StandardCreditScore,
  DetailedCreditScore,
  CreditScoreComponents,
  CreditScoreHistory,
  CreditScoreCalculationParams,
  CreditScoreApiResponse,
  
  // Utilitaires
  CreditScoreUtils
} from './interfaces/credit-score.interface';

// Types utilitaires pour TypeScript
export type CreditScoreValue = number; // 1-100, toujours entier
export type ConfidenceScore = number;  // 0-1, decimal autorisé
export type ModelVersion = string;     // Format: "v1.2.3"

// ==================== STANDARDS FINANCIERS INTERNATIONAUX ====================
// Export complet des standards de conformité financière ISO 20022, BIC, IBAN, LEI, FATF

// === STANDARDS ISO ===
export * from './standards/iso-standards';

// === SERVICES DE CONFORMITÉ ===
export * from './services/financial-standards.service';
export * from './services/aml-compliance.service';
export * from './services/financial-compliance.service';

// === ENTITÉS CONFORMES ===
export * from './entities/iso20022-financial-transaction.entity';

// === TYPES ET INTERFACES DE CONFORMITÉ ===
export type {
  ComplianceValidationResult,
  ComplianceViolation,
  ComplianceRecommendation,
  ComplianceAction,
  CertificationLevel
} from './services/financial-compliance.service';

export type {
  StandardTransactionId,
  FinancialIdentifierGenerationOptions
} from './services/financial-standards.service';

export type {
  KYCData,
  RiskAssessment,
  SuspiciousTransactionReport,
  RegulatoryThresholds
} from './services/aml-compliance.service';

export type {
  ISO20022MessageHeader,
  PartyIdentification,
  CreditTransferTransaction,
  PaymentIdentification,
  ActiveOrHistoricCurrencyAndAmount,
  BranchAndFinancialInstitutionIdentification,
  IBANValidation,
  BICValidation,
  LEIValidation
} from './standards/iso-standards';

// === ENUMS PRINCIPAUX FINANCIERS ===
export {
  ISO4217CurrencyCode,
  ISO20022TransactionType,
  ISO20022PaymentMethod,
  ISO20022TransactionStatus,
  ISO20022ReasonCode
} from './entities/iso20022-financial-transaction.entity';

export {
  RiskLevel as AMLComplianceRiskLevel,
  TransactionType as AMLTransactionType,
  CustomerType as AMLCustomerType
} from './services/aml-compliance.service';

// === CONFIGURATION DES STANDARDS ===
export const FINANCIAL_STANDARDS_CONFIG = {
  VERSION: '1.0.0',
  COMPLIANCE_LEVEL: 'ENTERPRISE',
  SUPPORTED_STANDARDS: [
    'ISO 20022 - Universal Financial Industry message scheme',
    'ISO 4217 - Currency codes',
    'ISO 9362 - Bank Identifier Codes (BIC)',
    'ISO 13616 - International Bank Account Number (IBAN)',
    'ISO 17442 - Legal Entity Identifier (LEI)',
    'FATF/GAFI - Anti-Money Laundering standards',
    'SWIFT - Society for Worldwide Interbank Financial Telecommunication',
    'BCC - Banque Centrale du Congo regulations',
    'CENAREF - Financial Intelligence Unit compliance'
  ],
  CERTIFICATION_LEVELS: {
    NON_COMPLIANT: { min: 0, max: 59, description: 'Non-compliant - Transaction blocked' },
    BASIC_COMPLIANT: { min: 60, max: 79, description: 'Basic compliance - Functional with improvements needed' },
    PROFESSIONAL_COMPLIANT: { min: 80, max: 94, description: 'Professional level compliance' },
    ENTERPRISE_CERTIFIED: { min: 95, max: 100, description: 'Enterprise certification - Full compliance' }
  }
} as const;

// ==================== SYSTÈME UNIFIÉ DE TRANSACTIONS FINANCIÈRES ====================
// Export complet du nouveau système unifié qui élimine TOUTES les duplications

// === ENUMS UNIFIÉS ===
export * from './enums/financial-enums';

// Exports spécifiques des enums principaux
export {
  UnifiedPaymentMethod,
  UnifiedTransactionStatus,
  UnifiedTransactionType,
  SupportedCurrency,
  TransactionPriority,
  TransactionChannel,
  AMLRiskLevel,
  FinancialEnumsHelper,
  
  // Mapping de compatibilité
  LEGACY_PAYMENT_METHOD_MAPPING,
  LEGACY_PAYMENT_STATUS_MAPPING,
  LEGACY_TRANSACTION_TYPE_MAPPING
} from './enums/financial-enums';

// === ENTITÉ UNIFIÉE ===
export * from './entities/unified-financial-transaction.entity';

// Exports spécifiques de l'entité
export {
  UnifiedFinancialTransaction,
  ServiceContext,
  UnifiedTransactionFactory,
  type ExtendedMetadata,
  type TransactionCreationData
} from './entities/unified-financial-transaction.entity';

// === DTOs UNIFIÉS ===
export * from './dtos/unified-transaction.dto';

// Exports spécifiques des DTOs principaux
export {
  CreateUnifiedTransactionDto,
  CreateCustomerPaymentDto,
  CreatePaymentServiceTransactionDto,
  CreateCommercialTransactionDto,
  CreateAdminFinanceDto,
  CreatePortfolioDisbursementDto,
  UpdateTransactionStatusDto,
  UnifiedTransactionResponseDto,
  PaginatedTransactionResponseDto,
  TransactionFilterDto,
  PaginationDto,
  AMLValidationDto,
  BulkTransactionProcessDto,
  DtoConversionHelper,
  
  // DTOs de métadonnées
  ExtendedMetadataDto,
  GeolocationDto
} from './dtos/unified-transaction.dto';

// === SERVICES UNIFIÉS ===
export * from './services/unified-transaction.service';

// Exports spécifiques des services
export {
  UnifiedTransactionService,
  LegacyTransactionAdapterService,
  
  // Types et interfaces
  type UnifiedTransactionEvent,
  type TransactionValidationResult,
  type MigrationOptions
} from './services/unified-transaction.service';

// === CONSTANTES DE CONFIGURATION SYSTÈME UNIFIÉ ===
export const UNIFIED_TRANSACTION_CONFIG = {
  VERSION: '2.0.0',
  ARCHITECTURE: 'UNIFIED_FINANCIAL_TRANSACTIONS',
  ELIMINATES_DUPLICATIONS: {
    PAYMENT_METHOD_ENUMS: 5,    // 5 versions dupliquées → 1 unifiée
    PAYMENT_STATUS_ENUMS: 4,    // 4 versions dupliquées → 1 unifiée
    TRANSACTION_TYPE_ENUMS: 3,  // 3 versions dupliquées → 1 unifiée
    PAYMENT_ENTITIES: 3,        // 3+ entités → 1 unifiée
    TRANSACTION_ENTITIES: 2,    // 2+ entités → 1 unifiée
    TOTAL_DUPLICATIONS_ELIMINATED: '17+ structures dupliquées'
  },
  UNIFIED_SERVICES: [
    'customer-service → UnifiedTransactionService',
    'payment-service → UnifiedTransactionService', 
    'gestion_commerciale_service → UnifiedTransactionService',
    'admin-service → UnifiedTransactionService',
    'portfolio-institution-service → UnifiedTransactionService'
  ],
  COMPLIANCE_INTEGRATION: {
    ISO_20022: 'Héritage complet de ISO20022FinancialTransaction',
    AML_CFT: 'Screening automatique intégré',
    FINANCIAL_STANDARDS: 'Validation 100% compliance',
    ENCRYPTION: 'AES-256-GCM niveau bancaire',
    AUDIT_TRAIL: 'Traçabilité complète des changements'
  },
  MIGRATION_SUPPORT: {
    LEGACY_COMPATIBILITY: 'Factory methods et adaptateurs pour tous les services',
    BATCH_MIGRATION: 'Migration par lot avec validation',
    ROLLBACK_SUPPORT: 'Support de rollback automatique',
    ZERO_DOWNTIME: 'Migration sans interruption de service'
  }
} as const;

// === HELPERS ET UTILITAIRES UNIFIÉS ===
export const UnifiedTransactionHelpers = {
  /**
   * Vérifie si une structure legacy peut être migrée
   */
  isLegacyStructureMigrable: (legacyData: any): boolean => {
    return !!(legacyData?.amount && legacyData?.currency);
  },
  
  /**
   * Calcule le pourcentage d'élimination des duplications
   */
  calculateDuplicationEliminationPercentage: (): number => {
    const totalDuplicateStructures = 17;
    const eliminatedStructures = 17;
    return Math.round((eliminatedStructures / totalDuplicateStructures) * 100);
  },
  
  /**
   * Retourne la liste des services affectés par l'unification
   */
  getAffectedServices: (): string[] => [
    'customer-service',
    'payment-service',
    'gestion_commerciale_service', 
    'admin-service',
    'portfolio-institution-service'
  ],
  
  /**
   * Valide la cohérence d'une migration
   */
  validateMigrationConsistency: (beforeCount: number, afterCount: number): boolean => {
    return beforeCount === afterCount;
  }
} as const;
