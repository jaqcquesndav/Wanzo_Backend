/**
 * TYPES FINANCIERS PARTAGÉS
 * 
 * Ce fichier contient les types et enums partagés entre entities et DTOs
 * pour éviter les dépendances circulaires
 */

/**
 * CONTEXTE DE SERVICE
 * Définit quel service a initié la transaction pour la logique métier spécifique
 */
export enum ServiceContext {
  CUSTOMER = 'CUSTOMER',                    // customer-service (billing, payments)
  PAYMENT = 'PAYMENT',                      // payment-service (provider transactions)
  COMMERCIAL = 'COMMERCIAL',                // gestion_commerciale_service (SME transactions)
  ADMIN = 'ADMIN',                          // admin-service (finance management)
  PORTFOLIO = 'PORTFOLIO',                  // portfolio-institution-service (disbursements)
  ANALYTICS = 'ANALYTICS',                  // analytics-service (analysis)
  ACCOUNTING = 'ACCOUNTING',                // accounting-service (journal entries)
  SYSTEM = 'SYSTEM'                         // System-generated transactions
}

/**
 * CONTEXTE BUSINESS - B2C vs B2B
 * Définit le type d'opération financière pour appliquer les règles métier appropriées
 */
export enum BusinessContext {
  B2C = 'B2C',                             // Business-to-Consumer (paiements abonnements)
  B2B = 'B2B',                             // Business-to-Business (opérations institutionnelles)
  INTERNAL = 'INTERNAL'                     // Opérations internes système
}

/**
 * MÉTADONNÉES ÉTENDUES
 * Structure flexible pour les données spécifiques à chaque contexte
 * Enrichie pour supporter la différenciation B2C/B2B avec types simples
 */
export interface ExtendedMetadata {
  // === B2C SPECIFIC METADATA ===
  b2cSubscriptionPlan?: string;             // BASIC, STANDARD, PREMIUM, ENTERPRISE
  b2cMobileOperator?: string;               // AIRTEL, ORANGE, MPESA, AFRICELL
  b2cCustomerPhone?: string;                // Téléphone du client
  b2cCustomerEmail?: string;                // Email du client
  b2cPaymentFrequency?: string;             // MONTHLY, QUARTERLY, YEARLY
  b2cRenewalDate?: Date;                    // Date de renouvellement abonnement
  b2cAutoRenewal?: boolean;                 // Renouvellement automatique activé
  
  // === B2B SPECIFIC METADATA ===
  b2bInstitutionId?: string;                // ID de l'institution
  b2bInstitutionName?: string;              // Nom de l'institution
  b2bContractNumber?: string;               // Numéro de contrat
  b2bLoanId?: string;                       // ID du prêt
  b2bDisbursementScheduleId?: string;       // ID échéancier décaissement
  b2bRepaymentScheduleId?: string;          // ID échéancier remboursement
  b2bInterestRate?: number;                 // Taux d'intérêt
  b2bDuration?: number;                     // Durée en mois
  b2bCollateral?: string;                   // Description de la garantie
  b2bApprovalLevel?: number;                // Niveau d'approbation requis (0-5)
  b2bApprovedBy?: string;                   // ID de l'approbateur
  b2bApprovalDate?: Date;                   // Date d'approbation
  
  // === CUSTOMER SERVICE CONTEXT ===
  customerId?: string;
  invoiceId?: string;
  subscriptionId?: string;
  planId?: string;
  billingCycle?: string;

  // === PAYMENT SERVICE CONTEXT ===
  providerId?: string;
  providerName?: string;
  providerTransactionId?: string;
  sessionId?: string;
  clientPhone?: string;
  telecom?: string;
  clientReference?: string;

  // === COMMERCIAL SERVICE CONTEXT ===
  supplierId?: string;
  contractId?: string;
  invoiceNumber?: string;

  // === ADMIN SERVICE CONTEXT ===
  adminUserId?: string;
  departmentId?: string;
  budgetId?: string;
  approvalLevel?: number;

  // === PORTFOLIO SERVICE CONTEXT ===
  portfolioId?: string;
  institutionId?: string;
  disbursementType?: string;
  loanId?: string;
  repaymentScheduleId?: string;

  // === TECHNICAL METADATA ===
  userAgent?: string;
  ipAddress?: string;
  deviceFingerprint?: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    country: string;
    city: string;
  };

  // === BUSINESS METADATA ===
  businessCategory?: string;
  vatNumber?: string;
  taxExempt?: boolean;
  fiscalYear?: string;

  // === LEGACY MIGRATION ===
  legacySystemId?: string;
  legacyTableName?: string;
  migrationBatch?: string;
  migrationDate?: Date;
  
  // === AML/CFT COMPLIANCE ===
  amlScreeningId?: string;
  amlScreeningDate?: Date;
  amlScreeningResult?: string;
  watchlistMatch?: boolean;
  sanctionsMatch?: boolean;
  pepMatch?: boolean;                       // Politically Exposed Person
  adverseMediaMatch?: boolean;
  complianceNotes?: string;
  
  // === FLEXIBLE ADDITIONAL DATA ===
  [key: string]: any;                       // Pour extensions futures
}
