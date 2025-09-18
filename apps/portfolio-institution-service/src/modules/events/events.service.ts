import { Injectable, Inject, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { 
  UserEventTopics, 
  UserCreatedEvent,
  UserStatusChangedEvent, 
  UserRoleChangedEvent
} from '@wanzobe/shared';
import { TokenEventTopics, TokenTransactionEvent } from '@wanzobe/shared';
import { SubscriptionChangedEvent, SubscriptionEventTopics } from '@wanzobe/shared';
import {
  PortfolioEventTopics,
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
} from '@wanzobe/shared';
import { PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE } from './kafka-client.module';

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @Inject(PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE) private readonly eventsClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Wait for connection to Kafka
    await this.eventsClient.connect();
    this.logger.log('Connected to Kafka event bus');
  }

  async onModuleDestroy() {
    await this.eventsClient.close();
  }

  async publishUserCreated(event: UserCreatedEvent): Promise<void> {
    this.logger.log(`Publishing user created event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(UserEventTopics.USER_CREATED, event);
  }

  async publishUserStatusChanged(event: UserStatusChangedEvent): Promise<void> {
    this.logger.log(`Publishing user status changed event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(UserEventTopics.USER_STATUS_CHANGED, event);
  }

  async publishUserRoleChanged(event: UserRoleChangedEvent): Promise<void> {
    this.logger.log(`Publishing user role changed event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(UserEventTopics.USER_ROLE_CHANGED, event);
  }

  async publishSubscriptionChanged(event: SubscriptionChangedEvent): Promise<void> {
    this.logger.log(`Publishing subscription changed event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(SubscriptionEventTopics.SUBSCRIPTION_STATUS_CHANGED, event);
  }

  async publishSubscriptionExpired(event: SubscriptionChangedEvent): Promise<void> {
    this.logger.log(`Publishing subscription expired event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(SubscriptionEventTopics.SUBSCRIPTION_EXPIRED, event);
  }

  async publishTokenPurchase(event: TokenTransactionEvent): Promise<void> {
    this.logger.log(`Publishing token purchase event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(TokenEventTopics.TOKEN_PURCHASE, event);
  }

  // Événements du portfolio
  async publishFundingRequestStatusChanged(event: FundingRequestStatusChangedEvent): Promise<void> {
    this.logger.log(`Publishing funding request status changed event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(PortfolioEventTopics.FUNDING_REQUEST_STATUS_CHANGED, event);
  }

  async publishContractCreated(event: ContractCreatedEvent): Promise<void> {
    this.logger.log(`Publishing contract created event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(PortfolioEventTopics.CONTRACT_CREATED, event);
  }

  async publishContractStatusChanged(event: ContractStatusChangedEvent): Promise<void> {
    this.logger.log(`Publishing contract status changed event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(PortfolioEventTopics.CONTRACT_STATUS_CHANGED, event);
  }

  async publishContractRestructured(event: ContractRestructuredEvent): Promise<void> {
    this.logger.log(`Publishing contract restructured event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(PortfolioEventTopics.CONTRACT_RESTRUCTURED, event);
  }

  async publishDisbursementCompleted(event: DisbursementCompletedEvent): Promise<void> {
    this.logger.log(`Publishing disbursement completed event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(PortfolioEventTopics.DISBURSEMENT_COMPLETED, event);
  }

  async publishRepaymentReceived(event: RepaymentReceivedEvent): Promise<void> {
    this.logger.log(`Publishing repayment received event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(PortfolioEventTopics.REPAYMENT_RECEIVED, event);
  }

  async publishPaymentScheduleUpdated(event: PaymentScheduleUpdatedEvent): Promise<void> {
    this.logger.log(`Publishing payment schedule updated event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(PortfolioEventTopics.PAYMENT_SCHEDULE_UPDATED, event);
  }
  
  // Événements de documents
  async publishDocumentUploaded(event: DocumentUploadedEvent): Promise<void> {
    this.logger.log(`Publishing document uploaded event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(PortfolioEventTopics.DOCUMENT_UPLOADED, event);
  }

  async publishDocumentUpdated(event: DocumentUpdatedEvent): Promise<void> {
    this.logger.log(`Publishing document updated event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(PortfolioEventTopics.DOCUMENT_UPDATED, event);
  }

  async publishDocumentStatusChanged(event: DocumentStatusChangedEvent): Promise<void> {
    this.logger.log(`Publishing document status changed event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(PortfolioEventTopics.DOCUMENT_STATUS_CHANGED, event);
  }
  
  async publishTokenUsage(event: TokenTransactionEvent): Promise<void> {
    this.logger.log(`Publishing token usage event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(TokenEventTopics.TOKEN_USAGE, event);
  }
  
  async publishTokenAlert(event: TokenTransactionEvent): Promise<void> {
    this.logger.log(`Publishing token alert event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(TokenEventTopics.TOKEN_ALERT, event);
  }
}
