/**
 * Interfaces standardisées pour les écritures comptables
 * Utilisées par tous les services pour assurer la compatibilité
 */

/**
 * Types de journaux comptables standardisés
 */
export enum StandardJournalType {
  GENERAL = 'general',
  SALES = 'sales',
  PURCHASES = 'purchases',
  BANK = 'bank',
  CASH = 'cash',
  INVENTORY = 'inventory',
  FINANCIAL = 'financial',
  MISCELLANEOUS = 'miscellaneous',
}

/**
 * Statuts des écritures comptables
 */
export enum JournalEntryStatus {
  PENDING = 'pending',
  VALIDATED = 'validated',
  POSTED = 'posted',
  CANCELLED = 'cancelled',
  ERROR = 'error',
}

/**
 * Interface standardisée pour une ligne d'écriture comptable
 */
export interface StandardJournalLineDto {
  accountCode: string;
  description: string;  // Standardisé sur 'description' au lieu de 'label'
  debit: number;        // Obligatoire, 0 si pas de débit
  credit: number;       // Obligatoire, 0 si pas de crédit
}

/**
 * Interface standardisée pour une écriture comptable complète
 */
export interface StandardJournalEntryDto {
  id: string;
  sourceId: string;                    // ID de la source (opération commerciale, etc.)
  sourceType: string;                  // Type de source ('commerce_operation', 'manual', etc.)
  clientId: string;
  companyId: string;
  date: string;                        // Format ISO 8601
  description: string;
  amount: number;                      // Montant total
  currency: string;                    // Code devise (CDF, USD, EUR)
  createdAt: string;                   // Format ISO 8601
  createdBy: string;
  status: JournalEntryStatus;
  journalType: StandardJournalType;
  lines: StandardJournalLineDto[];     // Minimum 2 lignes
  metadata?: Record<string, any>;      // Métadonnées optionnelles
}

/**
 * Topics Kafka pour les écritures comptables
 */
export enum AccountingEventTopics {
  JOURNAL_ENTRY_CREATED = 'accounting.journal.entry',
  JOURNAL_ENTRY_STATUS = 'accounting.journal.status',
  JOURNAL_ENTRY_VALIDATED = 'accounting.journal.validated',
  JOURNAL_ENTRY_POSTED = 'accounting.journal.posted',
}

/**
 * Interface pour les événements de statut des écritures comptables
 */
export interface JournalEntryStatusEvent {
  journalEntryId: string;
  sourceId: string;
  success: boolean;
  message: string;
  timestamp: string;                   // Format ISO 8601
  processingTimeMs?: number;
  error?: {
    code: string;
    details?: any;
  };
}

/**
 * Mappings standardisés des comptes SYSCOHADA
 */
export const SYSCOHADA_ACCOUNT_MAPPING = {
  SALE: {
    debit: '411000',    // Clients
    credit: '701000',   // Ventes de marchandises
    journalType: StandardJournalType.SALES,
  },
  EXPENSE: {
    debit: '607000',    // Achats de marchandises
    credit: '401000',   // Fournisseurs
    journalType: StandardJournalType.PURCHASES,
  },
  FINANCING: {
    debit: '512000',    // Banque
    credit: '164000',   // Emprunts et dettes assimilées
    journalType: StandardJournalType.FINANCIAL,
  },
  INVENTORY: {
    debit: '310000',    // Stocks de marchandises
    credit: '603000',   // Variation des stocks
    journalType: StandardJournalType.INVENTORY,
  },
  TRANSACTION: {
    debit: '471000',    // Comptes d'attente
    credit: '471100',   // Comptes d'attente créditeurs
    journalType: StandardJournalType.MISCELLANEOUS,
  },
} as const;

/**
 * Validation d'une écriture comptable
 */
export interface JournalEntryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
  difference: number;
}

/**
 * Utilitaires de validation
 */
export class JournalEntryValidator {
  static validate(entry: StandardJournalEntryDto): JournalEntryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation des champs obligatoires
    if (!entry.id) errors.push('ID is required');
    if (!entry.sourceId) errors.push('Source ID is required');
    if (!entry.companyId) errors.push('Company ID is required');
    if (!entry.date) errors.push('Date is required');
    if (!entry.description) errors.push('Description is required');
    if (!entry.lines || entry.lines.length < 2) {
      errors.push('At least 2 journal lines are required');
    }

    // Validation des lignes
    const totalDebit = entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = entry.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01; // Tolérance de 1 centime

    if (!isBalanced) {
      errors.push(`Journal entry is not balanced. Difference: ${difference.toFixed(2)}`);
    }

    // Validation des codes de comptes
    entry.lines.forEach((line, index) => {
      if (!line.accountCode) {
        errors.push(`Line ${index + 1}: Account code is required`);
      }
      if (!line.description) {
        errors.push(`Line ${index + 1}: Description is required`);
      }
      if (line.debit < 0 || line.credit < 0) {
        errors.push(`Line ${index + 1}: Debit and credit must be positive`);
      }
      if (line.debit > 0 && line.credit > 0) {
        warnings.push(`Line ${index + 1}: Both debit and credit are positive`);
      }
      if (line.debit === 0 && line.credit === 0) {
        errors.push(`Line ${index + 1}: Either debit or credit must be positive`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      isBalanced,
      totalDebit,
      totalCredit,
      difference,
    };
  }

  static createBalancedEntry(
    sourceId: string,
    sourceType: string,
    companyId: string,
    operationType: keyof typeof SYSCOHADA_ACCOUNT_MAPPING,
    amount: number,
    description: string,
    clientId?: string
  ): StandardJournalEntryDto {
    const mapping = SYSCOHADA_ACCOUNT_MAPPING[operationType];
    const entryId = `je_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: entryId,
      sourceId,
      sourceType,
      clientId: clientId || 'unknown',
      companyId,
      date: new Date().toISOString(),
      description,
      amount: Math.abs(amount),
      currency: 'CDF',
      createdAt: new Date().toISOString(),
      createdBy: 'adha-ai-service',
      status: JournalEntryStatus.PENDING,
      journalType: mapping.journalType,
      lines: [
        {
          accountCode: mapping.debit,
          description: `${description} - Débit`,
          debit: Math.abs(amount),
          credit: 0,
        },
        {
          accountCode: mapping.credit,
          description: `${description} - Crédit`,
          debit: 0,
          credit: Math.abs(amount),
        },
      ],
      metadata: {
        generatedBy: 'adha-ai-automatic-processing',
        operationType,
        needsReview: true,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}