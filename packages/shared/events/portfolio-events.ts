// Import des configurations Kafka
import { } from './kafka-config';

// Sujets spécifiques pour les événements liés au portfolio
export enum PortfolioEventTopics {
  FUNDING_REQUEST_STATUS_CHANGED = 'portfolio.funding-request.status-changed',
  CONTRACT_CREATED = 'portfolio.contract.created',
  CONTRACT_STATUS_CHANGED = 'portfolio.contract.status-changed',
  DISBURSEMENT_COMPLETED = 'portfolio.disbursement.completed',
  REPAYMENT_RECEIVED = 'portfolio.repayment.received',
  PAYMENT_SCHEDULE_UPDATED = 'portfolio.payment-schedule.updated',
  CONTRACT_RESTRUCTURED = 'portfolio.contract.restructured',
  DOCUMENT_UPLOADED = 'portfolio.document.uploaded',
  DOCUMENT_UPDATED = 'portfolio.document.updated',
  DOCUMENT_STATUS_CHANGED = 'portfolio.document.status-changed'
}

// Types d'événements de demande de financement
export interface FundingRequestStatusChangedEvent {
  id: string;
  requestNumber: string;
  portfolioId: string;
  clientId: string;
  oldStatus: string;
  newStatus: string;
  changeDate: Date;
  changedBy?: string;
  amount: number;
  currency: string;
}

// Types d'événements de contrat
export interface ContractCreatedEvent {
  id: string;
  contractNumber: string;
  portfolioId: string;
  clientId: string;
  fundingRequestId: string;
  principalAmount: number;
  interestRate: number;
  term: number;
  termUnit: string;
  startDate: Date;
  endDate: Date;
  currency: string;
  createdBy?: string;
}

export interface ContractStatusChangedEvent {
  id: string;
  contractNumber: string;
  portfolioId: string;
  clientId: string;
  oldStatus: string;
  newStatus: string;
  changeDate: Date;
  changedBy?: string;
  reason?: string;
}

export interface ContractRestructuredEvent {
  id: string;
  contractNumber: string;
  portfolioId: string;
  clientId: string;
  oldTerms: {
    principalAmount: number;
    interestRate: number;
    term: number;
    termUnit: string;
    endDate: Date;
  };
  newTerms: {
    principalAmount: number;
    interestRate: number;
    term: number;
    termUnit: string;
    endDate: Date;
  };
  restructureDate: Date;
  restructuredBy?: string;
  reason?: string;
}

// Types d'événements de déboursement
export interface DisbursementCompletedEvent {
  id: string;
  reference: string;
  contractId: string;
  contractNumber: string;
  portfolioId: string;
  clientId: string;
  amount: number;
  currency: string;
  disbursementDate: Date;
  disbursementType: string;
  paymentMethod: string;
  transactionId?: string;
  executedBy?: string;
}

// Types d'événements de remboursement
export interface RepaymentReceivedEvent {
  id: string;
  reference: string;
  contractId: string;
  contractNumber: string;
  portfolioId: string;
  clientId: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentType: string;
  paymentMethod: string;
  scheduleItemsAffected: {
    id: string;
    dueDate: Date;
    amountPaid: number;
    status: string;
  }[];
  transactionId?: string;
  processedBy?: string;
}

// Types d'événements d'échéancier
export interface PaymentScheduleUpdatedEvent {
  contractId: string;
  contractNumber: string;
  portfolioId: string;
  clientId: string;
  updateDate: Date;
  updatedBy?: string;
  reason: string;
  oldSchedule?: any[];
  newSchedule?: any[];
}

// Types d'événements de documents
export interface DocumentUploadedEvent {
  id: string;
  name: string;
  type: string;
  portfolio_id?: string;
  funding_request_id?: string;
  contract_id?: string;
  disbursement_id?: string;
  repayment_id?: string;
  uploaded_by: string;
  upload_date: Date;
  file_size: number;
  mime_type: string;
}

export interface DocumentUpdatedEvent {
  id: string;
  name: string;
  type: string;
  status: string;
  updated_by: string;
  update_date: Date;
  changes: {
    field: string;
    old_value?: any;
    new_value?: any;
  }[];
}

export interface DocumentStatusChangedEvent {
  id: string;
  name: string;
  type: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  change_date: Date;
  reason?: string;
}
