import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  PortfolioEventTopics,
  FundingRequestStatusChangedEvent,
  ContractCreatedEvent,
  ContractStatusChangedEvent,
  ContractRestructuredEvent,
  DisbursementCompletedEvent,
  RepaymentReceivedEvent,
  PaymentScheduleUpdatedEvent
} from '@wanzobe/shared';

@Injectable()
export class PortfolioEventsConsumer {
  private readonly logger = new Logger(PortfolioEventsConsumer.name);

  // Handler pour les changements de statut des demandes de financement
  @OnEvent(PortfolioEventTopics.FUNDING_REQUEST_STATUS_CHANGED)
  async handleFundingRequestStatusChanged(event: FundingRequestStatusChangedEvent): Promise<void> {
    this.logger.log(`Handling funding request status changed event: ${JSON.stringify(event)}`);
    
    // Logique pour traiter l'événement de changement de statut
    // Par exemple: notifications, mises à jour du tableau de bord, etc.
  }

  // Handler pour la création de contrats
  @OnEvent(PortfolioEventTopics.CONTRACT_CREATED)
  async handleContractCreated(event: ContractCreatedEvent): Promise<void> {
    this.logger.log(`Handling contract created event: ${JSON.stringify(event)}`);
    
    // Logique pour traiter l'événement de création de contrat
    // Par exemple: mettre à jour des statistiques, notifier des utilisateurs, etc.
  }

  // Handler pour les changements de statut des contrats
  @OnEvent(PortfolioEventTopics.CONTRACT_STATUS_CHANGED)
  async handleContractStatusChanged(event: ContractStatusChangedEvent): Promise<void> {
    this.logger.log(`Handling contract status changed event: ${JSON.stringify(event)}`);
    
    // Logique pour traiter l'événement de changement de statut de contrat
    // Par exemple: notifications, mises à jour des tableaux de bord, etc.
  }

  // Handler pour les restructurations de contrats
  @OnEvent(PortfolioEventTopics.CONTRACT_RESTRUCTURED)
  async handleContractRestructured(event: ContractRestructuredEvent): Promise<void> {
    this.logger.log(`Handling contract restructured event: ${JSON.stringify(event)}`);
    
    // Logique pour traiter l'événement de restructuration de contrat
    // Par exemple: mettre à jour les statistiques, notifier, etc.
  }

  // Handler pour les déboursements complétés
  @OnEvent(PortfolioEventTopics.DISBURSEMENT_COMPLETED)
  async handleDisbursementCompleted(event: DisbursementCompletedEvent): Promise<void> {
    this.logger.log(`Handling disbursement completed event: ${JSON.stringify(event)}`);
    
    // Logique pour traiter l'événement de déboursement complété
    // Par exemple: mettre à jour des statistiques, déclencher des processus comptables, etc.
  }

  // Handler pour les remboursements reçus
  @OnEvent(PortfolioEventTopics.REPAYMENT_RECEIVED)
  async handleRepaymentReceived(event: RepaymentReceivedEvent): Promise<void> {
    this.logger.log(`Handling repayment received event: ${JSON.stringify(event)}`);
    
    // Logique pour traiter l'événement de remboursement reçu
    // Par exemple: mettre à jour des statistiques, déclencher des processus comptables, etc.
  }

  // Handler pour les mises à jour d'échéancier
  @OnEvent(PortfolioEventTopics.PAYMENT_SCHEDULE_UPDATED)
  async handlePaymentScheduleUpdated(event: PaymentScheduleUpdatedEvent): Promise<void> {
    this.logger.log(`Handling payment schedule updated event: ${JSON.stringify(event)}`);
    
    // Logique pour traiter l'événement de mise à jour d'échéancier
    // Par exemple: recalculer des indicateurs, notifier, etc.
  }
}
