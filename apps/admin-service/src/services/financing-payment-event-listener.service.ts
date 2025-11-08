import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Types d'événements (copiés depuis portfolio-institution-service)
interface FinancingPaymentEvent {
  eventId: string;
  eventType: 'disbursement_completed' | 'repayment_completed' | 'contract_completed' | 'payment_overdue';
  timestamp: Date;
  portfolioId: string;
  contractId: string;
  amount: number;
  currency: string;
  paymentMethod: 'bank' | 'mobile_money';
  metadata: {
    institutionId: string;
    managerId: string;
    clientId?: string;
    reference: string;
    description?: string;
  };
}

interface DisbursementCompletedEvent extends FinancingPaymentEvent {
  eventType: 'disbursement_completed';
  disbursementData: {
    disbursementId: string;
    totalAmount: number;
    actualAmount: number;
    fees: number;
    description: string;
  };
}

interface RepaymentCompletedEvent extends FinancingPaymentEvent {
  eventType: 'repayment_completed';
  repaymentData: {
    repaymentId: string;
    principalAmount: number;
    interestAmount: number;
    fees: number;
    remainingBalance: number;
    nextDueDate?: Date;
  };
}

interface ContractCompletedEvent extends FinancingPaymentEvent {
  eventType: 'contract_completed';
  contractData: {
    totalAmount: number;
    totalInterest: number;
    totalFees: number;
    duration: number;
    completionDate: Date;
  };
}

interface PaymentOverdueEvent extends FinancingPaymentEvent {
  eventType: 'payment_overdue';
  overdueData: {
    dueDate: Date;
    overdueDays: number;
    penalties: number;
    totalDue: number;
  };
}

// Entity pour le tracking des revenus (exemple simplifié)
class RevenueTracking {
  id: string;
  portfolioId: string;
  contractId: string;
  eventType: string;
  amount: number;
  fees: number;
  currency: string;
  timestamp: Date;
  metadata: any;
}

@Injectable()
export class FinancingPaymentEventListener {
  private readonly logger = new Logger(FinancingPaymentEventListener.name);

  constructor(
    // @InjectRepository(RevenueTracking)
    // private revenueRepository: Repository<RevenueTracking>,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Traite les événements de décaissement complété
   */
  @OnEvent('financing.disbursement.completed')
  async handleDisbursementCompleted(event: DisbursementCompletedEvent): Promise<void> {
    this.logger.log(`Processing disbursement completed event: ${event.eventId}`);

    try {
      // 1. Enregistrer le décaissement pour le tracking des revenus
      await this.recordRevenueEvent({
        portfolioId: event.portfolioId,
        contractId: event.contractId,
        eventType: 'disbursement',
        amount: event.disbursementData.actualAmount,
        fees: event.disbursementData.fees,
        currency: event.currency,
        timestamp: event.timestamp,
        metadata: {
          ...event.metadata,
          disbursementId: event.disbursementData.disbursementId,
          description: event.disbursementData.description
        }
      });

      // 2. Mettre à jour les métriques du portefeuille
      await this.updatePortfolioMetrics(event.portfolioId, {
        type: 'disbursement',
        amount: event.disbursementData.actualAmount,
        fees: event.disbursementData.fees
      });

      // 3. Notifier les services internes
      await this.notifyInternalServices('disbursement_completed', event);

      this.logger.log(`Disbursement event processed successfully: ${event.eventId}`);
    } catch (error) {
      this.logger.error(`Error processing disbursement event ${event.eventId}:`, error);
      throw error;
    }
  }

  /**
   * Traite les événements de remboursement complété
   */
  @OnEvent('financing.repayment.completed')
  async handleRepaymentCompleted(event: RepaymentCompletedEvent): Promise<void> {
    this.logger.log(`Processing repayment completed event: ${event.eventId}`);

    try {
      // 1. Enregistrer le remboursement pour le tracking des revenus
      await this.recordRevenueEvent({
        portfolioId: event.portfolioId,
        contractId: event.contractId,
        eventType: 'repayment',
        amount: event.repaymentData.principalAmount,
        fees: event.repaymentData.fees,
        currency: event.currency,
        timestamp: event.timestamp,
        metadata: {
          ...event.metadata,
          repaymentId: event.repaymentData.repaymentId,
          interestAmount: event.repaymentData.interestAmount,
          remainingBalance: event.repaymentData.remainingBalance,
          nextDueDate: event.repaymentData.nextDueDate
        }
      });

      // 2. Mettre à jour les métriques du portefeuille
      await this.updatePortfolioMetrics(event.portfolioId, {
        type: 'repayment',
        amount: event.repaymentData.principalAmount,
        interest: event.repaymentData.interestAmount,
        fees: event.repaymentData.fees
      });

      // 3. Vérifier si le contrat est terminé
      if (event.repaymentData.remainingBalance <= 0) {
        await this.handleContractCompletion(event);
      }

      // 4. Notifier les services internes
      await this.notifyInternalServices('repayment_completed', event);

      this.logger.log(`Repayment event processed successfully: ${event.eventId}`);
    } catch (error) {
      this.logger.error(`Error processing repayment event ${event.eventId}:`, error);
      throw error;
    }
  }

  /**
   * Traite les événements de contrat complété
   */
  @OnEvent('financing.contract.completed')
  async handleContractCompleted(event: ContractCompletedEvent): Promise<void> {
    this.logger.log(`Processing contract completed event: ${event.eventId}`);

    try {
      // 1. Enregistrer la completion du contrat
      await this.recordRevenueEvent({
        portfolioId: event.portfolioId,
        contractId: event.contractId,
        eventType: 'contract_completed',
        amount: event.contractData.totalAmount,
        fees: event.contractData.totalFees,
        currency: event.currency,
        timestamp: event.timestamp,
        metadata: {
          ...event.metadata,
          totalInterest: event.contractData.totalInterest,
          duration: event.contractData.duration,
          completionDate: event.contractData.completionDate
        }
      });

      // 2. Calculer et enregistrer la performance finale
      await this.calculateContractPerformance(event);

      // 3. Mettre à jour les statistiques globales
      await this.updateGlobalStatistics(event);

      // 4. Notifier les services internes
      await this.notifyInternalServices('contract_completed', event);

      this.logger.log(`Contract completion event processed successfully: ${event.eventId}`);
    } catch (error) {
      this.logger.error(`Error processing contract completion event ${event.eventId}:`, error);
      throw error;
    }
  }

  /**
   * Traite les événements de paiement en retard
   */
  @OnEvent('financing.payment.overdue')
  async handlePaymentOverdue(event: PaymentOverdueEvent): Promise<void> {
    this.logger.log(`Processing payment overdue event: ${event.eventId}`);

    try {
      // 1. Enregistrer le retard de paiement
      await this.recordRevenueEvent({
        portfolioId: event.portfolioId,
        contractId: event.contractId,
        eventType: 'payment_overdue',
        amount: event.overdueData.totalDue,
        fees: event.overdueData.penalties,
        currency: event.currency,
        timestamp: event.timestamp,
        metadata: {
          ...event.metadata,
          dueDate: event.overdueData.dueDate,
          overdueDays: event.overdueData.overdueDays,
          penalties: event.overdueData.penalties
        }
      });

      // 2. Mettre à jour les métriques de risque
      await this.updateRiskMetrics(event.portfolioId, event.overdueData);

      // 3. Déclencher les alertes automatiques
      await this.triggerOverdueAlerts(event);

      // 4. Notifier les services internes
      await this.notifyInternalServices('payment_overdue', event);

      this.logger.log(`Payment overdue event processed successfully: ${event.eventId}`);
    } catch (error) {
      this.logger.error(`Error processing payment overdue event ${event.eventId}:`, error);
      throw error;
    }
  }

  /**
   * Enregistre un événement de revenu
   */
  private async recordRevenueEvent(data: {
    portfolioId: string;
    contractId: string;
    eventType: string;
    amount: number;
    fees: number;
    currency: string;
    timestamp: Date;
    metadata: any;
  }): Promise<void> {
    // TODO: Implémenter l'enregistrement en base de données
    this.logger.debug(`Recording revenue event: ${data.eventType} - ${data.amount} ${data.currency}`);

    // Exemple d'implémentation :
    // const revenueEvent = this.revenueRepository.create({
    //   id: `REV-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    //   ...data
    // });
    // await this.revenueRepository.save(revenueEvent);
  }

  /**
   * Met à jour les métriques du portefeuille
   */
  private async updatePortfolioMetrics(portfolioId: string, data: {
    type: string;
    amount: number;
    interest?: number;
    fees: number;
  }): Promise<void> {
    this.logger.debug(`Updating portfolio metrics for ${portfolioId}`);
    
    // TODO: Implémenter la mise à jour des métriques
    // - Montant total décaissé/remboursé
    // - Revenus d'intérêts
    // - Frais collectés
    // - Taux de performance
  }

  /**
   * Gère la completion d'un contrat
   */
  private async handleContractCompletion(event: RepaymentCompletedEvent): Promise<void> {
    this.logger.debug(`Handling contract completion for ${event.contractId}`);
    
    // Émettre un événement de contrat complété
    this.eventEmitter.emit('financing.contract.completed', {
      eventId: `COMPLETION-${Date.now()}`,
      eventType: 'contract_completed',
      timestamp: new Date(),
      portfolioId: event.portfolioId,
      contractId: event.contractId,
      amount: event.amount,
      currency: event.currency,
      paymentMethod: event.paymentMethod,
      metadata: event.metadata,
      contractData: {
        totalAmount: event.amount,
        totalInterest: event.repaymentData.interestAmount,
        totalFees: event.repaymentData.fees,
        duration: 0, // TODO: calculer la durée réelle
        completionDate: new Date()
      }
    } as ContractCompletedEvent);
  }

  /**
   * Calcule la performance d'un contrat
   */
  private async calculateContractPerformance(event: ContractCompletedEvent): Promise<void> {
    this.logger.debug(`Calculating contract performance for ${event.contractId}`);
    
    // TODO: Implémenter le calcul de performance
    // - ROI du contrat
    // - Durée effective vs prévue
    // - Taux de défaut
    // - Rentabilité
  }

  /**
   * Met à jour les statistiques globales
   */
  private async updateGlobalStatistics(event: ContractCompletedEvent): Promise<void> {
    this.logger.debug(`Updating global statistics`);
    
    // TODO: Implémenter la mise à jour des statistiques globales
    // - Nombre de contrats complétés
    // - Volume total traité
    // - Revenus totaux
    // - Taux de succès
  }

  /**
   * Met à jour les métriques de risque
   */
  private async updateRiskMetrics(portfolioId: string, overdueData: any): Promise<void> {
    this.logger.debug(`Updating risk metrics for portfolio ${portfolioId}`);
    
    // TODO: Implémenter la mise à jour des métriques de risque
    // - Taux de retard
    // - Provisions nécessaires
    // - Score de risque du portefeuille
  }

  /**
   * Déclenche les alertes de retard
   */
  private async triggerOverdueAlerts(event: PaymentOverdueEvent): Promise<void> {
    this.logger.debug(`Triggering overdue alerts for contract ${event.contractId}`);
    
    // TODO: Implémenter les alertes automatiques
    // - Notifications aux gestionnaires
    // - Emails aux clients
    // - Escalation selon la gravité
  }

  /**
   * Notifie les services internes
   */
  private async notifyInternalServices(eventType: string, event: FinancingPaymentEvent): Promise<void> {
    this.logger.debug(`Notifying internal services for event type: ${eventType}`);
    
    // TODO: Implémenter les notifications aux autres services
    // - Service de reporting
    // - Service de comptabilité
    // - Service de notifications
    // - Service de conformité
  }
}