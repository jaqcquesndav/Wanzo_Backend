import { Injectable, Logger } from '@nestjs/common';
import { 
  UserStatusChangedEvent, 
  UserRoleChangedEvent,
} from '../../../../../packages/shared/events/kafka-config';
import { SubscriptionChangedEvent } from '../../../../../packages/shared/events/subscription-events';
import { TokenTransactionEvent } from '../../../../../packages/shared/events/token-events';
import {
  FundingRequestStatusChangedEvent,
  ContractCreatedEvent,
  ContractStatusChangedEvent,
  ContractRestructuredEvent,
  DisbursementCompletedEvent,
  RepaymentReceivedEvent,
  PaymentScheduleUpdatedEvent,
  DocumentUploadedEvent,
  DocumentUpdatedEvent,
  DocumentStatusChangedEvent
} from '../../../../../packages/shared/events/portfolio-events';

/**
 * Mock implementation of EventsService for when Kafka is disabled.
 * This allows the application to run without errors even when Kafka is not available.
 */
@Injectable()
export class MockEventsService {
  private readonly logger = new Logger(MockEventsService.name);

  constructor() {
    this.logger.log('Using MockEventsService: Events will be logged but not published to Kafka.');
  }

  async onModuleInit() {
    // Nothing to do
  }

  async onModuleDestroy() {
    // Nothing to do
  }

  async publishUserStatusChanged(event: UserStatusChangedEvent): Promise<void> {
    this.logger.log(`[MOCK] Would publish user status changed event: ${JSON.stringify(event)}`);
  }

  async publishUserRoleChanged(event: UserRoleChangedEvent): Promise<void> {
    this.logger.log(`[MOCK] Would publish user role changed event: ${JSON.stringify(event)}`);
  }

  async publishSubscriptionChanged(event: SubscriptionChangedEvent): Promise<void> {
    this.logger.log(`[MOCK] Would publish subscription changed event: ${JSON.stringify(event)}`);
  }

  async publishSubscriptionExpired(event: SubscriptionChangedEvent): Promise<void> {
    this.logger.log(`[MOCK] Would publish subscription expired event: ${JSON.stringify(event)}`);
  }

  async publishTokenPurchase(event: TokenTransactionEvent): Promise<void> {
    this.logger.log(`[MOCK] Would publish token purchase event: ${JSON.stringify(event)}`);
  }

  async publishTokenUsage(event: TokenTransactionEvent): Promise<void> {
    this.logger.log(`[MOCK] Would publish token usage event: ${JSON.stringify(event)}`);
  }

  async publishTokenAlert(event: any): Promise<void> {
    this.logger.log(`[MOCK] Would publish token alert event: ${JSON.stringify(event)}`);
  }

  // Portfolio events
  async publishFundingRequestStatusChanged(event: FundingRequestStatusChangedEvent): Promise<void> {
    this.logger.log(`[MOCK] Would publish funding request status changed event: ${JSON.stringify(event)}`);
  }

  async publishContractCreated(event: ContractCreatedEvent): Promise<void> {
    this.logger.log(`[MOCK] Would publish contract created event: ${JSON.stringify(event)}`);
  }

  async publishContractStatusChanged(event: ContractStatusChangedEvent): Promise<void> {
    this.logger.log(`[MOCK] Would publish contract status changed event: ${JSON.stringify(event)}`);
  }

  async publishContractRestructured(event: ContractRestructuredEvent): Promise<void> {
    this.logger.log(`[MOCK] Would publish contract restructured event: ${JSON.stringify(event)}`);
  }

  async publishDisbursementCompleted(event: DisbursementCompletedEvent): Promise<void> {
    this.logger.log(`[MOCK] Would publish disbursement completed event: ${JSON.stringify(event)}`);
  }

  async publishRepaymentReceived(event: RepaymentReceivedEvent): Promise<void> {
    this.logger.log(`[MOCK] Would publish repayment received event: ${JSON.stringify(event)}`);
  }

  async publishPaymentScheduleUpdated(event: PaymentScheduleUpdatedEvent): Promise<void> {
    this.logger.log(`[MOCK] Would publish payment schedule updated event: ${JSON.stringify(event)}`);
  }

  // Document events
  async publishDocumentUploaded(event: DocumentUploadedEvent): Promise<void> {
    this.logger.log(`[MOCK] Would publish document uploaded event: ${JSON.stringify(event)}`);
  }

  async publishDocumentUpdated(event: DocumentUpdatedEvent): Promise<void> {
    this.logger.log(`[MOCK] Would publish document updated event: ${JSON.stringify(event)}`);
  }

  async publishDocumentStatusChanged(event: DocumentStatusChangedEvent): Promise<void> {
    this.logger.log(`[MOCK] Would publish document status changed event: ${JSON.stringify(event)}`);
  }
}
