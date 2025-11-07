import { AccountingStandard } from '../../../common/enums/accounting.enum';

export interface AISingleAccountDto {
  code: string;
  name: string;
  type: string;
}

export interface AISingleRecentJournalDto {
  type: string; // Corresponds to JournalType enum, but as string for AI
  description: string;
  amount: number; // Simplified representation for AI
}

export interface AISingleAttachmentDto {
  id: string;
  type: string; // e.g., 'pdf', 'png', 'txt'
  fileName: string;
  content: string; // base64 encoded content or extracted text
}

export interface MobileTransactionContextDto {
    transactionId: string;
    userId: string; // User who initiated the transaction on mobile
    amount: number;
    currency: string;
    date: string; // ISO 8601 date string
    type?: string; // e.g., 'expense', 'income' - maps to 'category' from MobileTransactionPayloadDto
    category?: string;
    merchant?: string; // Optional: if available from mobile payload metadata
    notes?: string;    // Optional: if available from mobile payload metadata
    // any other relevant fields from MobileTransactionPayloadDto.metadata can be added here
}

export interface AIContextDataDto {
  companyId: string;
  fiscalYear: string;
  accountingStandard: AccountingStandard;
  userId?: string; // Optional, depending on whether AI needs user context directly
  accounts: AISingleAccountDto[];
  recentJournals: AISingleRecentJournalDto[];
  attachments?: AISingleAttachmentDto[]; // Optional
  source?: string; // To indicate the origin of the data, e.g., 'chat', 'mobile_transaction'
  transactionDetails?: MobileTransactionContextDto; // Specific details for mobile transactions
}

export interface AccountingAIRequestDto {
  message: string;
  contextData: AIContextDataDto;
}

export interface AISuggestedJournalLineDto {
  accountCode: string; // AI suggests account code, system resolves to accountId
  description: string; // Standardisé sur 'description'
  debit: number;       // Obligatoire, 0 si pas de débit
  credit: number;      // Obligatoire, 0 si pas de crédit
}

export interface SingleAISuggestion {
  description: string;
  date: string; // ISO date string
  journalType: string; // e.g., 'general', 'sales', 'purchases'
  lines: AISuggestedJournalLineDto[];
  confidenceScore?: number; // AI's confidence in this specific suggestion
  explanation?: string; // AI's reasoning
}

export interface AccountingAIResponseDto {
  reply: string; // Textual reply from AI
  confidence: number; // Overall confidence of the AI
  needsReview: boolean; // Indicates if human review is recommended
  suggestions?: SingleAISuggestion[]; // Array of suggested journal entries
  error?: {
    message: string;
    service?: string; // e.g., 'ExternalAICommunicationError', 'AIProcessingError'
    details?: any;
  };
  // Any other relevant fields from the AI service
}
