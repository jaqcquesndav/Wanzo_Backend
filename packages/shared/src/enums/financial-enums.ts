/**
 * ENUMS FINANCIERS UNIFIÉS
 * 
 * Ce fichier centralise TOUS les enums financiers pour éliminer les duplications
 * trouvées dans customer-service, payment-service, gestion_commerciale_service,
 * portfolio-institution-service et admin-service.
 * 
 * Conforme aux standards:
 * - ISO 20022 (Financial Services Universal)
 * - ISO 4217 (Currency Codes)
 * - BIC/SWIFT Standards
 * - FATF/GAFI Compliance
 */

/**
 * MÉTHODES DE PAIEMENT UNIFIÉES - CONTEXTE B2C vs B2B
 * 
 * Remplace 5 définitions dupliquées:
 * - apps/customer-service/src/modules/billing/entities/payment.entity.ts
 * - apps/gestion_commerciale_service/src/modules/financial-transactions/entities/financial-transaction.entity.ts
 * - apps/portfolio-institution-service/src/modules/virements/entities/disbursement.entity.ts
 * - apps/portfolio-institution-service/src/modules/portfolios/entities/traditional-disbursement.entity.ts
 * - Versions partielles dans payment-service
 */
export enum UnifiedPaymentMethod {
  // === B2C METHODS - PAIEMENTS ABONNEMENTS CLIENTS ===
  MOBILE_MONEY_AIRTEL = 'MM_AM',      // Airtel Money (SerdiPay) - Abonnements clients
  MOBILE_MONEY_ORANGE = 'MM_OM',      // Orange Money (SerdiPay) - Abonnements clients  
  MOBILE_MONEY_MPESA = 'MM_MP',       // M-Pesa (SerdiPay) - Abonnements clients
  MOBILE_MONEY_AFRICELL = 'MM_AF',    // Africell Money (SerdiPay) - Abonnements clients
  SERDIPAY = 'SRDP',                  // SerdiPay générique - Abonnements clients
  
  // === B2B METHODS - OPÉRATIONS FINANCIÈRES INSTITUTIONS ===
  // ISO 20022 Standard Methods
  SEPA_CREDIT_TRANSFER = 'SCT',       // Single Euro Payments Area Credit Transfer
  SEPA_DIRECT_DEBIT = 'SDD',          // SEPA Direct Debit
  SWIFT_WIRE_TRANSFER = 'SWT',        // SWIFT Wire Transfer
  ACH_CREDIT_TRANSFER = 'ACH',        // Automated Clearing House
  REAL_TIME_GROSS_SETTLEMENT = 'RTGS', // Central Bank RTGS
  INSTANT_PAYMENT = 'INST',           // Instant Payment
  
  // Regional B2B Methods (RDC/Africa)
  BANK_TRANSFER = 'BNKT',             // Virement bancaire classique B2B
  CASH = 'CASH',                      // Espèces - Opérations commerciales
  CHECK = 'CHCK',                     // Chèque - Transactions B2B
  MONEY_ORDER = 'MORD',               // Mandat
  BANK_DRAFT = 'BDFT',                // Traite bancaire
  ELECTRONIC_TRANSFER = 'ELTR',       // Transfert électronique B2B
  
  // Digital B2B Methods
  CARD_PAYMENT = 'CARD',              // Carte bancaire B2B
  E_WALLET = 'EWLT',                  // Portefeuille électronique B2B
  CRYPTOCURRENCY = 'CRPT',            // Cryptomonnaie
  
  // Third-party B2B Providers  
  PAYPAL = 'PYPL',                    // PayPal B2B
  STRIPE = 'STRP',                    // Stripe B2B
  
  // Trade Finance Methods
  LETTER_OF_CREDIT = 'LOC',           // Lettre de crédit
  DOCUMENTARY_COLLECTION = 'DCOL',    // Encaissement documentaire
  BANK_GUARANTEE = 'BGAR',            // Garantie bancaire
  
  // === LEGACY COMPATIBILITY ===
  MOBILE_MONEY = 'MOBI',              // Mobile Money générique (à mapper)
  UNKNOWN = 'UNKN'                    // Pour migration des anciennes données
}

/**
 * STATUTS DE TRANSACTION UNIFIÉS - CONTEXTE B2C vs B2B
 * 
 * Remplace 4 définitions dupliquées:
 * - apps/customer-service: PENDING, COMPLETED, FAILED, REFUNDED
 * - apps/gestion_commerciale_service: VERIFIED, PENDING, REJECTED  
 * - apps/payment-service: PENDING, SUCCESS, FAILED
 * - Versions partielles dans autres services
 */
export enum UnifiedTransactionStatus {
  // === B2C STATUS - PAIEMENTS ABONNEMENTS ===
  SUBSCRIPTION_PENDING = 'SUB_PEND',      // Abonnement en attente
  SUBSCRIPTION_ACTIVE = 'SUB_ACTV',        // Abonnement actif
  SUBSCRIPTION_EXPIRED = 'SUB_EXPR',       // Abonnement expiré
  SUBSCRIPTION_CANCELLED = 'SUB_CANC',     // Abonnement annulé
  MOBILE_PAYMENT_PENDING = 'MOB_PEND',     // Paiement mobile en attente
  MOBILE_PAYMENT_CONFIRMED = 'MOB_CONF',   // Paiement mobile confirmé
  MOBILE_PAYMENT_FAILED = 'MOB_FAIL',      // Échec paiement mobile
  B2C_REFUND_PENDING = 'B2C_REF_PEND',     // Remboursement B2C en attente
  B2C_REFUND_COMPLETED = 'B2C_REF_COMP',   // Remboursement B2C complété
  
  // === B2B STATUS - ISO 20022 STANDARD ===
  INITIATED = 'ACSP',                 // AcceptedSettlementInProcess
  ACCEPTED = 'ACCC',                  // AcceptedCustomerCredit
  PENDING = 'PDNG',                   // Pending B2B
  PROCESSING = 'ACTC',                // AcceptedTechnicalValidation
  SETTLED = 'ACSC',                   // AcceptedSettlementCompleted
  REJECTED = 'RJCT',                  // Rejected
  CANCELLED = 'CANC',                 // Cancelled
  RETURNED = 'RTND',                  // Returned
  SUSPENDED = 'SUSP',                 // Suspended
  PARTIALLY_SETTLED = 'PART',         // PartiallySettled
  
  // === BUSINESS STATUS (mapped to ISO) ===
  SUCCESS = 'ACSC',                   // Alias pour SETTLED
  COMPLETED = 'ACSC',                 // Alias pour SETTLED
  FAILED = 'RJCT',                    // Alias pour REJECTED
  REFUNDED = 'RTND',                  // Alias pour RETURNED
  VERIFIED = 'ACCC',                  // Alias pour ACCEPTED
  
  // === COMPLIANCE STATUS ===
  UNDER_REVIEW = 'SUSP',              // En cours de vérification AML
  COMPLIANCE_HOLD = 'SUSP',           // Blocage compliance
  FRAUD_SUSPECTED = 'SUSP',           // Suspicion de fraude
  
  // === TECHNICAL STATUS ===
  TIMEOUT = 'RJCT',                   // Timeout technique
  NETWORK_ERROR = 'SUSP',             // Erreur réseau temporaire
  INSUFFICIENT_FUNDS = 'RJCT',        // Fonds insuffisants
  INVALID_ACCOUNT = 'RJCT',           // Compte invalide
  
  // === LEGACY COMPATIBILITY ===
  UNKNOWN = 'UNKN'                    // Pour migration
}

/**
 * TYPES DE TRANSACTION UNIFIÉS - CONTEXTE B2C vs B2B
 * 
 * Remplace 3 définitions dupliquées:
 * - apps/gestion_commerciale_service: INCOME, EXPENSE, TRANSFER
 * - packages/shared/src/services/aml-compliance.service.ts: DOMESTIC_WIRE, INTERNATIONAL_WIRE, etc.
 * - Versions partielles dans autres services
 */
export enum UnifiedTransactionType {
  // === B2C TRANSACTION TYPES - PAIEMENTS ABONNEMENTS ===
  SUBSCRIPTION_PAYMENT = 'SUBP',      // Paiement d'abonnement client
  SUBSCRIPTION_RENEWAL = 'SUBR',      // Renouvellement d'abonnement
  PLAN_UPGRADE = 'PLUPR',             // Mise à niveau de plan
  PLAN_DOWNGRADE = 'PLDGR',           // Rétrogradation de plan
  TOKEN_PURCHASE = 'TOKP',            // Achat de tokens
  REFUND_SUBSCRIPTION = 'REFB',       // Remboursement abonnement
  
  // === B2B TRANSACTION TYPES - OPÉRATIONS FINANCIÈRES ===
  // ISO 20022 Standard Types
  CREDIT_TRANSFER = 'CDTR',           // Virement créditeur B2B
  DIRECT_DEBIT = 'DDBT',              // Prélèvement B2B
  CARD_TRANSACTION = 'CARD',          // Transaction carte B2B
  CASH_MANAGEMENT = 'CASH',           // Gestion de trésorerie
  SECURITIES_SETTLEMENT = 'SECS',     // Règlement-livraison titres
  FOREIGN_EXCHANGE = 'FXTR',          // Change
  LOAN_DEPOSIT = 'LOAN',              // Prêt/Dépôt
  TRADE_FINANCE = 'TRAD',             // Financement du commerce
  TREASURY = 'TRES',                  // Trésorerie
  DOCUMENTARY_CREDIT = 'DOCO',        // Crédit documentaire
  
  // Business B2B Types
  CUSTOMER_PAYMENT = 'CPAY',          // Paiement reçu d'un client B2B
  SUPPLIER_PAYMENT = 'SPAY',          // Paiement à un fournisseur
  LOAN_DISBURSEMENT = 'LDIS',         // Décaissement de prêt
  LOAN_REPAYMENT = 'LREP',            // Remboursement de prêt
  INTEREST_PAYMENT = 'INTP',          // Paiement d'intérêts
  FEE_COLLECTION = 'FEEC',            // Collecte de frais
  DIVIDEND_PAYMENT = 'DIVP',          // Paiement de dividendes
  
  // Commercial Operations
  SALE = 'SALE',                      // Vente B2B
  PURCHASE = 'PURCH',                 // Achat B2B
  INVOICE_PAYMENT = 'INVP',           // Paiement de facture
  B2B_EXPENSE = 'B2BE',               // Dépense B2B
  B2B_REFUND = 'B2BR',                // Remboursement B2B
  
  // === GENERIC TYPES ===
  PAYMENT = 'PYMT',                   // Paiement général
  INVOICE = 'INVC',                   // Facturation
  GENERAL_REFUND = 'GREF',            // Remboursement général
  DISBURSEMENT = 'DISB',              // Décaissement
  COLLECTION = 'COLL',                // Encaissement
  FEE = 'FEES',                       // Frais
  COMMISSION = 'COMM',                // Commission
  INTEREST = 'INTR',                  // Intérêts
  DIVIDEND = 'DIVD',                  // Dividende
  SALARY = 'SALA',                    // Salaire
  BONUS = 'BONS',                     // Prime
  EXPENSE_REIMBURSEMENT = 'EXPR',     // Remboursement de frais
  
  // === BUSINESS ACCOUNTING TYPES ===
  INCOME = 'INCM',                    // Recette
  ACCOUNTING_EXPENSE = 'ACEX',        // Dépense comptable
  TRANSFER = 'TRFR',                  // Transfert interne
  ADJUSTMENT = 'ADJT',                // Ajustement comptable
  CORRECTION = 'CORR',                // Correction
  
  // === COMPLIANCE & AML TYPES ===
  DOMESTIC_WIRE = 'DWIR',             // Virement domestique
  INTERNATIONAL_WIRE = 'IWIR',        // Virement international
  CASH_DEPOSIT = 'CDEP',              // Dépôt d'espèces
  CASH_WITHDRAWAL = 'CWTH',           // Retrait d'espèces
  CHECK_DEPOSIT = 'CHDP',             // Dépôt de chèque
  ATM_WITHDRAWAL = 'AWTD',            // Retrait DAB
  POS_PAYMENT = 'POSP',               // Paiement TPE
  ONLINE_PAYMENT = 'ONLP',            // Paiement en ligne
  MOBILE_PAYMENT = 'MOBP',            // Paiement mobile
  
  // === SUBSCRIPTION & RECURRING ===
  SUBSCRIPTION = 'SUBS',              // Abonnement
  RECURRING_PAYMENT = 'RECP',         // Paiement récurrent
  INSTALLMENT = 'INST',               // Échéance
  
  // === LEGACY COMPATIBILITY ===
  UNKNOWN = 'UNKN'                    // Pour migration
}

/**
 * DEVISES SUPPORTÉES (ISO 4217)
 * 
 * Centralise la gestion des devises au lieu de string libre
 */
export enum SupportedCurrency {
  // === PRINCIPALES DEVISES INTERNATIONALES ===
  USD = 'USD',                        // Dollar américain
  EUR = 'EUR',                        // Euro
  GBP = 'GBP',                        // Livre sterling
  JPY = 'JPY',                        // Yen japonais
  CHF = 'CHF',                        // Franc suisse
  CAD = 'CAD',                        // Dollar canadien
  AUD = 'AUD',                        // Dollar australien
  
  // === DEVISES AFRICAINES ===
  CDF = 'CDF',                        // Franc congolais (RDC)
  XAF = 'XAF',                        // Franc CFA (Afrique centrale)
  XOF = 'XOF',                        // Franc CFA (Afrique de l'ouest)
  ZAR = 'ZAR',                        // Rand sud-africain
  NGN = 'NGN',                        // Naira nigérian
  GHS = 'GHS',                        // Cedi ghanéen
  KES = 'KES',                        // Shilling kenyan
  UGX = 'UGX',                        // Shilling ougandais
  TZS = 'TZS',                        // Shilling tanzanien
  RWF = 'RWF',                        // Franc rwandais
  
  // === CRYPTO-MONNAIES (ISO-like codes) ===
  BTC = 'XBT',                        // Bitcoin (ISO code)
  ETH = 'ETH',                        // Ethereum
  USDT = 'USDT',                      // Tether USD
  USDC = 'USDC'                       // USD Coin
}

/**
 * PRIORITÉS DE TRANSACTION
 * 
 * Définit l'importance/urgence des transactions
 */
export enum TransactionPriority {
  LOW = 'LOW',                        // Priorité basse
  NORMAL = 'NORM',                    // Priorité normale
  HIGH = 'HIGH',                      // Priorité haute
  URGENT = 'URGT',                    // Urgente
  CRITICAL = 'CRIT'                   // Critique (temps réel)
}

/**
 * CANAUX DE TRANSACTION
 * 
 * Définit par quel canal la transaction a été initiée
 */
export enum TransactionChannel {
  WEB = 'WEB',                        // Site web
  MOBILE_APP = 'MAPP',                // Application mobile
  API = 'API',                        // API directe
  BRANCH = 'BRNC',                    // Agence
  ATM = 'ATM',                        // Distributeur automatique
  POS = 'POS',                        // Terminal de paiement
  PHONE = 'PHON',                     // Téléphone
  EMAIL = 'MAIL',                     // Email
  BATCH = 'BTCH',                     // Traitement par lot
  SYSTEM = 'SYST'                     // Système automatique
}

/**
 * NIVEAUX DE RISQUE AML
 * 
 * Classification du risque pour compliance
 */
export enum AMLRiskLevel {
  LOW = 'LOW',                        // Risque faible
  MEDIUM = 'MED',                     // Risque moyen
  HIGH = 'HIGH',                      // Risque élevé
  VERY_HIGH = 'VHIG',                 // Risque très élevé
  PROHIBITED = 'PROH'                 // Interdit
}

/**
 * MAPPING DE COMPATIBILITÉ
 * 
 * Pour faciliter la migration des anciens enums
 */
export const LEGACY_PAYMENT_METHOD_MAPPING = {
  // customer-service mapping
  'credit_card': UnifiedPaymentMethod.CARD_PAYMENT,
  'debit_card': UnifiedPaymentMethod.CARD_PAYMENT,
  'bank_transfer': UnifiedPaymentMethod.BANK_TRANSFER,
  'paypal': UnifiedPaymentMethod.PAYPAL,
  'stripe': UnifiedPaymentMethod.STRIPE,
  'mobile_money': UnifiedPaymentMethod.MOBILE_MONEY,
  
  // gestion_commerciale_service mapping
  'cash': UnifiedPaymentMethod.CASH,
  'check': UnifiedPaymentMethod.CHECK,
  
  // payment-service mapping (si nécessaire)
  'serdipay': UnifiedPaymentMethod.SERDIPAY
} as const;

export const LEGACY_PAYMENT_STATUS_MAPPING = {
  // customer-service mapping
  'pending': UnifiedTransactionStatus.PENDING,
  'completed': UnifiedTransactionStatus.COMPLETED,
  'failed': UnifiedTransactionStatus.FAILED,
  'refunded': UnifiedTransactionStatus.REFUNDED,
  
  // gestion_commerciale_service mapping
  'verified': UnifiedTransactionStatus.VERIFIED,
  'rejected': UnifiedTransactionStatus.REJECTED,
  
  // payment-service mapping
  'success': UnifiedTransactionStatus.SUCCESS
} as const;

export const LEGACY_TRANSACTION_TYPE_MAPPING = {
  // gestion_commerciale_service mapping
  'income': UnifiedTransactionType.INCOME,
  'expense': UnifiedTransactionType.ACCOUNTING_EXPENSE,
  'transfer': UnifiedTransactionType.TRANSFER,
  
  // aml-compliance mapping
  'domestic_wire': UnifiedTransactionType.DOMESTIC_WIRE,
  'international_wire': UnifiedTransactionType.INTERNATIONAL_WIRE,
  'card_payment': UnifiedTransactionType.CARD_TRANSACTION,
  'cash_deposit': UnifiedTransactionType.CASH_DEPOSIT,
  'cash_withdrawal': UnifiedTransactionType.CASH_WITHDRAWAL,
  'ach_transfer': UnifiedTransactionType.CREDIT_TRANSFER,
  'check_deposit': UnifiedTransactionType.CHECK_DEPOSIT
} as const;

/**
 * HELPERS DE VALIDATION
 */
export class FinancialEnumsHelper {
  /**
   * Convertit un ancien PaymentMethod vers le nouveau standard
   */
  static mapLegacyPaymentMethod(legacy: string): UnifiedPaymentMethod {
    return LEGACY_PAYMENT_METHOD_MAPPING[legacy as keyof typeof LEGACY_PAYMENT_METHOD_MAPPING] 
           || UnifiedPaymentMethod.UNKNOWN;
  }
  
  /**
   * Convertit un ancien PaymentStatus vers le nouveau standard
   */
  static mapLegacyPaymentStatus(legacy: string): UnifiedTransactionStatus {
    return LEGACY_PAYMENT_STATUS_MAPPING[legacy as keyof typeof LEGACY_PAYMENT_STATUS_MAPPING]
           || UnifiedTransactionStatus.UNKNOWN;
  }
  
  /**
   * Convertit un ancien TransactionType vers le nouveau standard
   */
  static mapLegacyTransactionType(legacy: string): UnifiedTransactionType {
    return LEGACY_TRANSACTION_TYPE_MAPPING[legacy as keyof typeof LEGACY_TRANSACTION_TYPE_MAPPING]
           || UnifiedTransactionType.UNKNOWN;
  }
  
  /**
   * Valide si une devise est supportée
   */
  static isSupportedCurrency(currency: string): boolean {
    return Object.values(SupportedCurrency).includes(currency as SupportedCurrency);
  }
  
  /**
   * Retourne les méthodes de paiement disponibles pour une région
   */
  static getPaymentMethodsForRegion(region: 'EUROPE' | 'AFRICA' | 'GLOBAL'): UnifiedPaymentMethod[] {
    switch (region) {
      case 'EUROPE':
        return [
          UnifiedPaymentMethod.SEPA_CREDIT_TRANSFER,
          UnifiedPaymentMethod.SEPA_DIRECT_DEBIT,
          UnifiedPaymentMethod.CARD_PAYMENT,
          UnifiedPaymentMethod.INSTANT_PAYMENT
        ];
      case 'AFRICA':
        return [
          UnifiedPaymentMethod.MOBILE_MONEY,
          UnifiedPaymentMethod.BANK_TRANSFER,
          UnifiedPaymentMethod.CASH,
          UnifiedPaymentMethod.CHECK
        ];
      case 'GLOBAL':
      default:
        return Object.values(UnifiedPaymentMethod);
    }
  }
}

