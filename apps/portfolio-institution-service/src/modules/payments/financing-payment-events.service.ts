import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import {
  PortfolioEventTopics,
  DisbursementCompletedEvent,
  RepaymentReceivedEvent
} from '@wanzobe/shared';

// Types d'événements de financement étendus
export interface DisbursementInitiatedEvent {
  disbursementId: string;
  reference: string;
  contractId: string;
  contractNumber: string;
  portfolioId: string;
  clientId: string;
  amount: number;
  currency: string;
  initiatedDate: Date;
  disbursementType: string;
  paymentMethod: string;
  initiatedBy?: string;
}

export interface DisbursementFailedEvent {
  disbursementId: string;
  reference: string;
  contractId: string;
  contractNumber: string;
  portfolioId: string;
  clientId: string;
  amount: number;
  currency: string;
  failedDate: Date;
  failureReason: string;
  paymentMethod: string;
  errorDetails?: any;
}

export interface RepaymentInitiatedEvent {
  repaymentId: string;
  reference: string;
  contractId: string;
  contractNumber: string;
  portfolioId: string;
  clientId: string;
  amount: number;
  currency: string;
  initiatedDate: Date;
  paymentType: string;
  paymentMethod: string;
  initiatedBy?: string;
}

export interface RepaymentCompletedEvent {
  repaymentId: string;
  reference: string;
  contractId: string;
  contractNumber: string;
  portfolioId: string;
  clientId: string;
  amount: number;
  currency: string;
  completedDate: Date;
  paymentType: string;
  paymentMethod: string;
  principalAmount: number;
  interestAmount: number;
  remainingBalance: number;
  transactionId?: string;
  processedBy?: string;
}

export interface RepaymentFailedEvent {
  repaymentId: string;
  reference: string;
  contractId: string;
  contractNumber: string;
  portfolioId: string;
  clientId: string;
  amount: number;
  currency: string;
  failedDate: Date;
  failureReason: string;
  paymentMethod: string;
  errorDetails?: any;
}

export interface RepaymentPartialEvent {
  repaymentId: string;
  reference: string;
  contractId: string;
  contractNumber: string;
  portfolioId: string;
  clientId: string;
  requestedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  partialDate: Date;
  paymentMethod: string;
  reason?: string;
}

export interface ContractFullyPaidEvent {
  contractId: string;
  contractNumber: string;
  portfolioId: string;
  clientId: string;
  totalAmount: number;
  totalInterest: number;
  totalFees: number;
  currency: string;
  completionDate: Date;
  lastPaymentId: string;
  durationDays: number;
}

export interface PaymentOverdueEvent {
  scheduleId: string;
  contractId: string;
  contractNumber: string;
  portfolioId: string;
  clientId: string;
  scheduledPaymentId: string;
  dueDate: Date;
  overdueDate: Date;
  overdueDays: number;
  overdueAmount: number;
  penalties: number;
  currency: string;
}

export interface FinancingRevenueEvent {
  portfolioId: string;
  contractId: string;
  eventType: string;
  amount: number;
  fees: number;
  interest?: number;
  currency: string;
  eventDate: Date;
  metadata?: any;
}

// Topics étendus pour les événements de financement
export enum FinancingPaymentEventTopics {
  DISBURSEMENT_INITIATED = 'financing.disbursement.initiated',
  DISBURSEMENT_COMPLETED = 'financing.disbursement.completed',
  DISBURSEMENT_FAILED = 'financing.disbursement.failed',
  REPAYMENT_INITIATED = 'financing.repayment.initiated',
  REPAYMENT_COMPLETED = 'financing.repayment.completed',
  REPAYMENT_FAILED = 'financing.repayment.failed',
  REPAYMENT_PARTIAL = 'financing.repayment.partial',
  CONTRACT_FULLY_PAID = 'financing.contract.fully_paid',
  PAYMENT_OVERDUE = 'financing.payment.overdue',
  FINANCING_REVENUE = 'financing.revenue.tracked'
}

@Injectable()
export class FinancingPaymentEventService {
  private readonly logger = new Logger(FinancingPaymentEventService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Publie un événement de déboursement initié
   */
  async publishDisbursementInitiated(event: DisbursementInitiatedEvent): Promise<void> {
    try {
      await this.publishEvent(FinancingPaymentEventTopics.DISBURSEMENT_INITIATED, event);
      this.logger.log(`Published disbursement initiated event: ${event.disbursementId}`);
    } catch (error) {
      this.logger.error(`Failed to publish disbursement initiated event:`, error);
    }
  }

  /**
   * Publie un événement de déboursement complété
   */
  async publishDisbursementCompleted(event: RepaymentCompletedEvent): Promise<void> {
    try {
      await this.publishEvent(FinancingPaymentEventTopics.DISBURSEMENT_COMPLETED, event);
      this.logger.log(`Published disbursement completed event: ${event.repaymentId}`);
    } catch (error) {
      this.logger.error(`Failed to publish disbursement completed event:`, error);
    }
  }

  /**
   * Publie un événement de déboursement échoué
   */
  async publishDisbursementFailed(event: DisbursementFailedEvent): Promise<void> {
    try {
      await this.publishEvent(FinancingPaymentEventTopics.DISBURSEMENT_FAILED, event);
      this.logger.log(`Published disbursement failed event: ${event.disbursementId}`);
    } catch (error) {
      this.logger.error(`Failed to publish disbursement failed event:`, error);
    }
  }

  /**
   * Publie un événement de remboursement initié
   */
  async publishRepaymentInitiated(event: RepaymentInitiatedEvent): Promise<void> {
    try {
      await this.publishEvent(FinancingPaymentEventTopics.REPAYMENT_INITIATED, event);
      this.logger.log(`Published repayment initiated event: ${event.repaymentId}`);
    } catch (error) {
      this.logger.error(`Failed to publish repayment initiated event:`, error);
    }
  }

  /**
   * Publie un événement de remboursement complété
   */
  async publishRepaymentCompleted(event: RepaymentCompletedEvent): Promise<void> {
    try {
      await this.publishEvent(FinancingPaymentEventTopics.REPAYMENT_COMPLETED, event);
      this.logger.log(`Published repayment completed event: ${event.repaymentId}`);
    } catch (error) {
      this.logger.error(`Failed to publish repayment completed event:`, error);
    }
  }

  /**
   * Publie un événement de remboursement échoué
   */
  async publishRepaymentFailed(event: RepaymentFailedEvent): Promise<void> {
    try {
      await this.publishEvent(FinancingPaymentEventTopics.REPAYMENT_FAILED, event);
      this.logger.log(`Published repayment failed event: ${event.repaymentId}`);
    } catch (error) {
      this.logger.error(`Failed to publish repayment failed event:`, error);
    }
  }

  /**
   * Publie un événement de remboursement partiel
   */
  async publishRepaymentPartial(event: RepaymentPartialEvent): Promise<void> {
    try {
      await this.publishEvent(FinancingPaymentEventTopics.REPAYMENT_PARTIAL, event);
      this.logger.log(`Published repayment partial event: ${event.repaymentId}`);
    } catch (error) {
      this.logger.error(`Failed to publish repayment partial event:`, error);
    }
  }

  /**
   * Publie un événement de contrat entièrement payé
   */
  async publishContractFullyPaid(event: ContractFullyPaidEvent): Promise<void> {
    try {
      await this.publishEvent(FinancingPaymentEventTopics.CONTRACT_FULLY_PAID, event);
      this.logger.log(`Published contract fully paid event: ${event.contractId}`);
    } catch (error) {
      this.logger.error(`Failed to publish contract fully paid event:`, error);
    }
  }

  /**
   * Publie un événement de paiement en retard
   */
  async publishPaymentOverdue(event: PaymentOverdueEvent): Promise<void> {
    try {
      await this.publishEvent(FinancingPaymentEventTopics.PAYMENT_OVERDUE, event);
      this.logger.log(`Published payment overdue event: ${event.contractId}`);
    } catch (error) {
      this.logger.error(`Failed to publish payment overdue event:`, error);
    }
  }

  /**
   * Publie un événement de revenus de financement (agrégé)
   */
  async publishFinancingRevenue(event: FinancingRevenueEvent): Promise<void> {
    try {
      // Cet événement sera probablement publié de manière périodique
      await this.publishEvent('financing-payment.revenue.calculated', event);
      this.logger.log(`Published financing revenue event for portfolio: ${event.portfolioId}`);
    } catch (error) {
      this.logger.error(`Failed to publish financing revenue event:`, error);
    }
  }

  /**
   * Méthode générique pour publier des événements
   */
  private async publishEvent(topic: string, eventData: any): Promise<void> {
    try {
      // Ajouter des métadonnées communes
      const enrichedEvent = {
        ...eventData,
        publishedAt: new Date(),
        publishedBy: 'portfolio-institution-service',
        version: this.configService.get('APP_VERSION', '1.0.0'),
        environment: this.configService.get('NODE_ENV', 'development')
      };

      // Publication via EventEmitter pour traitement local
      this.eventEmitter.emit(topic, enrichedEvent);

      // TODO: Publier via Kafka pour communication inter-services
      // await this.kafkaProducer.send({
      //   topic,
      //   messages: [{
      //     key: this.extractEventKey(eventData),
      //     value: JSON.stringify(enrichedEvent),
      //     timestamp: Date.now().toString()
      //   }]
      // });

      this.logger.debug(`Published event to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to publish event to topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Extrait une clé pour l'événement (pour Kafka partitioning)
   */
  private extractEventKey(eventData: any): string {
    return eventData.contractId || eventData.portfolioId || eventData.clientId || 'default';
  }

  /**
   * Utilitaire pour créer un événement de déboursement
   */
  createDisbursementEvent(
    disbursement: any,
    contract: any,
    paymentOrder: any,
    type: 'initiated' | 'completed' | 'failed',
    additionalData?: any
  ): any {
    const baseEvent = {
      disbursementId: disbursement.id,
      contractId: contract.id,
      contractNumber: contract.contract_number,
      portfolioId: contract.portfolio_id,
      clientId: contract.client_id,
      companyName: disbursement.company,
      amount: disbursement.amount,
      currency: 'XOF',
      paymentMethod: disbursement.paymentMethod === 'ELECTRONIC_TRANSFER' ? 'mobile_money' as const : 'bank_transfer' as const,
      paymentOrderId: paymentOrder.id,
      reference: disbursement.transactionReference || paymentOrder.reference,
      initiatedBy: disbursement.createdBy,
      initiatedAt: disbursement.createdAt,
    };

    if (disbursement.beneficiary?.accountNumber?.startsWith('+')) {
      baseEvent['mobileMoneyInfo'] = {
        phoneNumber: disbursement.beneficiary.accountNumber,
        operator: this.extractOperatorFromBankName(disbursement.beneficiary.bankName),
        operatorName: disbursement.beneficiary.bankName,
      };
    } else {
      baseEvent['bankInfo'] = {
        beneficiaryAccount: {
          accountNumber: disbursement.beneficiary.accountNumber,
          accountName: disbursement.beneficiary.accountName,
          bankName: disbursement.beneficiary.bankName,
        }
      };
    }

    switch (type) {
      case 'completed':
        return {
          ...baseEvent,
          transactionId: disbursement.transactionReference,
          executedAt: disbursement.executionDate || new Date(),
          fees: additionalData?.fees || 0,
          actualAmount: disbursement.amount,
          status: 'completed'
        } as unknown as RepaymentCompletedEvent;

      case 'failed':
        return {
          ...baseEvent,
          failedDate: new Date(),
          failureReason: additionalData?.failureReason || 'Unknown error',
          errorDetails: {
            errorCode: additionalData?.errorCode,
            status: 'failed'
          }
        } as unknown as DisbursementFailedEvent;

      default:
        return {
          ...baseEvent,
          initiatedDate: new Date(),
          disbursementType: 'standard'
        } as unknown as DisbursementInitiatedEvent;
    }
  }

  /**
   * Utilitaire pour créer un événement de remboursement
   */
  createRepaymentEvent(
    repayment: any,
    contract: any,
    type: 'initiated' | 'completed' | 'failed' | 'partial',
    additionalData?: any
  ): RepaymentInitiatedEvent | RepaymentCompletedEvent | RepaymentFailedEvent | RepaymentPartialEvent {
    const baseEvent = {
      repaymentId: repayment.id,
      contractId: contract.id,
      contractNumber: contract.contract_number,
      portfolioId: contract.portfolio_id,
      clientId: contract.client_id,
      companyName: additionalData?.companyName || `Client ${contract.client_id}`,
      amount: repayment.amount,
      currency: repayment.currency || 'XOF',
      paymentMethod: this.mapRepaymentMethod(repayment.payment_method),
      paymentType: repayment.payment_type,
      reference: repayment.reference,
      scheduleIds: additionalData?.scheduleIds || [],
      initiatedBy: repayment.processed_by,
      initiatedAt: repayment.created_at,
      dueDate: additionalData?.dueDate,
    };

    if (repayment.payment_method === 'mobile_money') {
      baseEvent['mobileMoneyInfo'] = {
        phoneNumber: additionalData?.phoneNumber || 'Unknown',
        operator: additionalData?.operator || 'Unknown',
        operatorName: additionalData?.operatorName || 'Unknown',
      };
    }

    switch (type) {
      case 'completed':
        return {
          ...baseEvent,
          transactionId: repayment.transaction_id,
          completedDate: repayment.transaction_date || new Date(),
          principalAmount: additionalData?.principalAmount || repayment.amount * 0.8,
          interestAmount: additionalData?.interestAmount || repayment.amount * 0.2,
          remainingBalance: additionalData?.remainingBalance || 0,
          processedBy: additionalData?.processedBy
        } as unknown as RepaymentCompletedEvent;

      case 'failed':
        return {
          ...baseEvent,
          failedDate: new Date(),
          failureReason: additionalData?.failureReason || 'Unknown error',
          errorDetails: {
            errorCode: additionalData?.errorCode,
            status: 'failed'
          }
        } as unknown as RepaymentFailedEvent;

      case 'partial':
        return {
          ...baseEvent,
          requestedAmount: additionalData?.requestedAmount || repayment.amount,
          paidAmount: repayment.amount,
          remainingAmount: additionalData?.remainingAmount || 0,
          partialDate: repayment.transaction_date || new Date(),
          reason: additionalData?.reason
        } as unknown as RepaymentPartialEvent;

      default:
        return {
          ...baseEvent,
          initiatedDate: new Date(),
          paymentType: 'standard'
        } as unknown as RepaymentInitiatedEvent;
    }
  }

  /**
   * Convertit la méthode de paiement du repayment vers le format d'événement
   */
  private mapRepaymentMethod(method: string): 'bank_transfer' | 'mobile_money' | 'cash' | 'check' {
    const mapping = {
      'BANK_TRANSFER': 'bank_transfer',
      'MOBILE_MONEY': 'mobile_money',
      'CASH': 'cash',
      'CHECK': 'check'
    };

    return mapping[method] as any || 'bank_transfer';
  }

  /**
   * Extrait l'opérateur depuis le nom de la banque
   */
  private extractOperatorFromBankName(bankName: string): string {
    if (!bankName) return 'Unknown';
    
    const bankNameLower = bankName.toLowerCase();
    if (bankNameLower.includes('airtel')) return 'AM';
    if (bankNameLower.includes('orange')) return 'OM';
    if (bankNameLower.includes('wave')) return 'WAVE';
    if (bankNameLower.includes('moov')) return 'MP';
    if (bankNameLower.includes('africell')) return 'AF';
    
    return 'Unknown';
  }
}