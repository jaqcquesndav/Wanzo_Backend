/**
 * Schémas standardisés pour les messages Kafka
 * Compatible entre NestJS/TypeScript et Django/Python
 */

// Types de base partagés
export enum OperationType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
  EXPENSE = 'EXPENSE',
  PAYMENT = 'PAYMENT',
  RECEIPT = 'RECEIPT',
  TRANSFER = 'TRANSFER',
  LOAN = 'LOAN',
  INVENTORY = 'INVENTORY',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum OperationStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum JournalEntryType {
  SALES = 'SALES',
  PURCHASES = 'PURCHASES',
  FINANCIAL = 'FINANCIAL',
  INVENTORY = 'INVENTORY',
  MISCELLANEOUS = 'MISCELLANEOUS',
}

// Schémas pour Commerce Operations
export interface BusinessOperationEventData {
  id: string;
  type: OperationType;
  date: string; // ISO 8601 format
  description: string;
  amountCdf: number;
  status: OperationStatus;
  clientId?: string;
  companyId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  relatedPartyId?: string;
  relatedPartyName?: string;
  relatedEntityId?: string;
  reference?: string;
  notes?: string;
}

export interface BusinessOperationCreatedEvent {
  eventType: 'commerce.operation.created';
  data: BusinessOperationEventData;
  metadata: {
    source: 'gestion_commerciale';
    correlationId: string;
    timestamp: string;
    version: string;
  };
}

// Schémas pour Accounting
export interface JournalEntryLine {
  accountCode: string;
  label: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntryData {
  id?: string;
  companyId: string;
  journalType: JournalEntryType;
  date: string;
  reference: string;
  description: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  sourceId: string;
  sourceType: string;
  metadata?: {
    sourceSystem: string;
    originalType: string;
    generatedBy: string;
    relatedPartyId?: string;
    relatedPartyName?: string;
    needsReview: boolean;
  };
}

export interface AccountingJournalEntryEvent {
  eventType: 'accounting.journal.entry';
  data: JournalEntryData;
  metadata: {
    source: 'adha_ai';
    correlationId: string;
    timestamp: string;
    version: string;
  };
}

export interface AccountingStatusData {
  journalEntryId: string;
  sourceId: string;
  success: boolean;
  message?: string;
  timestamp: string;
  processedBy: string;
  errorCode?: string;
  retryCount?: number;
}

export interface AccountingJournalStatusEvent {
  eventType: 'accounting.journal.status';
  data: AccountingStatusData;
  metadata: {
    source: 'accounting_service';
    correlationId: string;
    timestamp: string;
    version: string;
  };
}

// Schémas pour Portfolio
export enum PortfolioAnalysisType {
  FINANCIAL = 'FINANCIAL',
  MARKET = 'MARKET',
  OPERATIONAL = 'OPERATIONAL',
  RISK = 'RISK',
  PERFORMANCE = 'PERFORMANCE',
}

export interface PortfolioAnalysisRequestData {
  id: string;
  portfolioId: string;
  institutionId: string;
  userId: string;
  userRole: string;
  analysisTypes: PortfolioAnalysisType[];
  contextInfo: {
    source: string;
    mode: string;
    portfolioType: string;
    timeframe?: string;
    includeMarketData?: boolean;
  };
}

export interface PortfolioAnalysisRequestEvent {
  eventType: 'portfolio.analysis.request';
  data: PortfolioAnalysisRequestData;
  metadata: {
    source: 'portfolio_institution';
    correlationId: string;
    timestamp: string;
    version: string;
  };
}

export interface PortfolioAnalysisResult {
  analysisType: PortfolioAnalysisType;
  summary: string;
  recommendations: string[];
  metrics: Record<string, number>;
  alerts?: string[];
}

export interface PortfolioAnalysisResponseData {
  requestId: string;
  portfolioId: string;
  institutionId: string;
  results: PortfolioAnalysisResult[];
  processingTimeMs: number;
  confidence: number;
  generatedAt: string;
}

export interface PortfolioAnalysisResponseEvent {
  eventType: 'portfolio.analysis.response';
  data: PortfolioAnalysisResponseData;
  metadata: {
    source: 'adha_ai';
    correlationId: string;
    timestamp: string;
    version: string;
  };
}

// Chat Events
export interface ChatMessageData {
  id: string;
  chatId: string;
  userId: string;
  userRole: string;
  content: string;
  contextInfo: Record<string, any>;
}

export interface ChatResponseData {
  messageId: string;
  chatId: string;
  content: string;
  confidence: number;
  processingTimeMs: number;
  suggestions?: string[];
}

// Dead Letter Queue
export interface DLQMessageData {
  originalTopic: string;
  originalMessage: any;
  error: string;
  retryCount: number;
  firstFailedAt: string;
  lastFailedAt: string;
}

// Utilitaires de validation
export const validateEventData = (eventType: string, data: any): boolean => {
  // Validation de base pour s'assurer que les champs requis sont présents
  if (!data || typeof data !== 'object') {
    return false;
  }

  switch (eventType) {
    case 'commerce.operation.created':
      return !!(data.id && data.type && data.amountCdf && data.companyId);
    
    case 'accounting.journal.entry':
      return !!(data.companyId && data.lines && Array.isArray(data.lines));
    
    case 'portfolio.analysis.request':
      return !!(data.id && data.portfolioId && data.institutionId);
    
    default:
      return true; // Pour les types non définis, on accepte
  }
};

// Convertisseurs pour compatibilité Python
export const convertToPythonFormat = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(convertToPythonFormat);
  }
  
  if (data && typeof data === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Convertir camelCase en snake_case pour Python
      const pythonKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      converted[pythonKey] = convertToPythonFormat(value);
    }
    return converted;
  }
  
  return data;
};

export const convertFromPythonFormat = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(convertFromPythonFormat);
  }
  
  if (data && typeof data === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Convertir snake_case en camelCase pour TypeScript
      const tsKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
      converted[tsKey] = convertFromPythonFormat(value);
    }
    return converted;
  }
  
  return data;
};
