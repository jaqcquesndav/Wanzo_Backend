// Events pour les paiements de financement
import { } from './kafka-config';

// Sujets spécifiques pour les événements de paiement de financement
export enum FinancingPaymentEventTopics {
  DISBURSEMENT_INITIATED = 'financing-payment.disbursement.initiated',
  DISBURSEMENT_COMPLETED = 'financing-payment.disbursement.completed',
  DISBURSEMENT_FAILED = 'financing-payment.disbursement.failed',
  REPAYMENT_INITIATED = 'financing-payment.repayment.initiated',
  REPAYMENT_COMPLETED = 'financing-payment.repayment.completed',
  REPAYMENT_FAILED = 'financing-payment.repayment.failed',
  REPAYMENT_PARTIAL = 'financing-payment.repayment.partial',
  CONTRACT_FULLY_PAID = 'financing-payment.contract.fully-paid',
  PAYMENT_OVERDUE = 'financing-payment.payment.overdue',
}

// Interfaces pour les événements de déboursement
export interface DisbursementInitiatedEvent {
  disbursementId: string;
  contractId: string;
  contractNumber: string;
  portfolioId: string;
  clientId: string;
  companyName: string;
  amount: number;
  currency: string;
  paymentMethod: 'bank_transfer' | 'mobile_money';
  paymentOrderId: string;
  reference: string;
  initiatedBy: string;
  initiatedAt: Date;
  bankInfo?: {
    beneficiaryAccount: {
      accountNumber: string;
      accountName: string;
      bankName: string;
    };
  };
  mobileMoneyInfo?: {
    phoneNumber: string;
    operator: string;
    operatorName: string;
  };
}

export interface DisbursementCompletedEvent extends DisbursementInitiatedEvent {
  disbursementId: string;
  transactionId?: string;
  executedAt: Date;
  fees?: number;
  actualAmount: number;
  status: 'completed';
}

export interface DisbursementFailedEvent extends DisbursementInitiatedEvent {
  disbursementId: string;
  failedAt: Date;
  failureReason: string;
  errorCode?: string;
  status: 'failed';
}

// Interfaces pour les événements de remboursement
export interface RepaymentInitiatedEvent {
  repaymentId: string;
  contractId: string;
  contractNumber: string;
  portfolioId: string;
  clientId: string;
  companyName: string;
  amount: number;
  currency: string;
  paymentMethod: 'bank_transfer' | 'mobile_money' | 'cash' | 'check';
  paymentType: 'standard' | 'partial' | 'advance' | 'early_payoff';
  reference: string;
  scheduleIds?: string[];
  initiatedBy: string;
  initiatedAt: Date;
  dueDate?: Date;
  mobileMoneyInfo?: {
    phoneNumber: string;
    operator: string;
    operatorName: string;
  };
}

export interface RepaymentCompletedEvent extends RepaymentInitiatedEvent {
  repaymentId: string;
  transactionId?: string;
  completedAt: Date;
  fees?: number;
  actualAmount: number;
  allocation: {
    scheduleId: string;
    principalAmount: number;
    interestAmount: number;
    penaltiesAmount: number;
    feesAmount: number;
  }[];
  status: 'completed';
  remainingBalance?: number;
  nextDueDate?: Date;
}

export interface RepaymentFailedEvent extends RepaymentInitiatedEvent {
  repaymentId: string;
  failedAt: Date;
  failureReason: string;
  errorCode?: string;
  status: 'failed';
}

export interface RepaymentPartialEvent extends RepaymentInitiatedEvent {
  repaymentId: string;
  partialAmount: number;
  remainingAmount: number;
  scheduleId: string;
  partialAt: Date;
  status: 'partial';
}

// Événement de contrat entièrement payé
export interface ContractFullyPaidEvent {
  contractId: string;
  contractNumber: string;
  portfolioId: string;
  clientId: string;
  companyName: string;
  originalAmount: number;
  totalPaid: number;
  totalInterest: number;
  totalFees: number;
  finalPaymentDate: Date;
  contractDuration: number;
  startDate: Date;
  endDate: Date;
  currency: string;
  completedBy: string;
  completedAt: Date;
}

// Événement de paiement en retard
export interface PaymentOverdueEvent {
  contractId: string;
  contractNumber: string;
  portfolioId: string;
  clientId: string;
  companyName: string;
  scheduleId: string;
  dueDate: Date;
  daysOverdue: number;
  overdueAmount: number;
  totalOutstanding: number;
  penaltiesApplied: number;
  currency: string;
  overdueAt: Date;
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
}

// Événement agrégé pour les revenus de financement
export interface FinancingRevenueEvent {
  portfolioId: string;
  institutionId: string;
  period: {
    startDate: Date;
    endDate: Date;
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  };
  revenue: {
    totalDisbursed: number;
    totalRepaid: number;
    totalInterest: number;
    totalFees: number;
    totalPenalties: number;
    netRevenue: number;
  };
  contracts: {
    active: number;
    completed: number;
    defaulted: number;
    restructured: number;
  };
  performance: {
    repaymentRate: number;
    defaultRate: number;
    averageLoanSize: number;
    averageDuration: number;
  };
  calculatedAt: Date;
  currency: string;
}