import { Injectable, Inject, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { 
  UserEventTopics, 
  UserCreatedEvent,
  UserStatusChangedEvent, 
  UserRoleChangedEvent
} from '@wanzobe/shared';
import { StandardKafkaTopics } from '@wanzobe/shared/events/standard-kafka-topics';
import { MessageVersionManager } from '@wanzobe/shared/events/message-versioning';
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
import { kafkaMonitoring } from '@wanzobe/shared/monitoring';
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

  /**
   * Méthode utilitaire pour publier des événements avec monitoring et versioning
   */
  private async publishEvent<T>(topic: string, eventData: T, eventDescription: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Vérifier si le topic fait partie des topics standardisés
      const standardTopic = StandardKafkaTopics.isValidTopic(topic) ? topic : this.getStandardTopic(topic);
      
      // Créer un message standardisé avec versioning
      const standardMessage = MessageVersionManager.createStandardMessage(
        standardTopic,
        eventData,
        'portfolio-institution-service'
      );

      this.eventsClient.emit(standardTopic, standardMessage);
      
      const processingTime = Date.now() - startTime;
      kafkaMonitoring.recordMessageSent(standardTopic, processingTime, true);
      
      this.logger.log(`${eventDescription} in ${processingTime}ms`);
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;
      const err = error as Error;
      
      kafkaMonitoring.recordMessageSent(topic, processingTime, false);
      
      this.logger.error(`Failed to publish ${eventDescription}: ${err.message} (failed after ${processingTime}ms)`, err.stack);
      throw error;
    }
  }

  /**
   * Mappe les anciens topics vers les nouveaux topics standardisés
   */
  private getStandardTopic(oldTopic: string): string {
    const topicMapping: Record<string, string> = {
      [UserEventTopics.USER_CREATED]: StandardKafkaTopics.USER_CREATED,
      [UserEventTopics.USER_STATUS_CHANGED]: StandardKafkaTopics.USER_STATUS_CHANGED,
      [UserEventTopics.USER_ROLE_CHANGED]: StandardKafkaTopics.USER_UPDATED,
      [TokenEventTopics.TOKEN_PURCHASE]: StandardKafkaTopics.TOKEN_PURCHASE,
      [TokenEventTopics.TOKEN_USAGE]: StandardKafkaTopics.TOKEN_USAGE,
      [TokenEventTopics.TOKEN_ALERT]: StandardKafkaTopics.TOKEN_ALERT,
      [SubscriptionEventTopics.SUBSCRIPTION_STATUS_CHANGED]: StandardKafkaTopics.SUBSCRIPTION_STATUS_CHANGED,
      [SubscriptionEventTopics.SUBSCRIPTION_EXPIRED]: StandardKafkaTopics.SUBSCRIPTION_EXPIRED,
      [PortfolioEventTopics.FUNDING_REQUEST_STATUS_CHANGED]: StandardKafkaTopics.FUNDING_REQUEST_STATUS_CHANGED,
      [PortfolioEventTopics.CONTRACT_CREATED]: StandardKafkaTopics.CONTRACT_CREATED,
      [PortfolioEventTopics.CONTRACT_STATUS_CHANGED]: StandardKafkaTopics.CONTRACT_STATUS_CHANGED,
      [PortfolioEventTopics.CONTRACT_RESTRUCTURED]: StandardKafkaTopics.CONTRACT_RESTRUCTURED,
      [PortfolioEventTopics.DISBURSEMENT_COMPLETED]: StandardKafkaTopics.DISBURSEMENT_COMPLETED,
      [PortfolioEventTopics.REPAYMENT_RECEIVED]: StandardKafkaTopics.REPAYMENT_RECEIVED,
      [PortfolioEventTopics.PAYMENT_SCHEDULE_UPDATED]: StandardKafkaTopics.PAYMENT_SCHEDULE_UPDATED,
      [PortfolioEventTopics.DOCUMENT_UPLOADED]: StandardKafkaTopics.DOCUMENT_UPLOADED,
      [PortfolioEventTopics.DOCUMENT_UPDATED]: StandardKafkaTopics.DOCUMENT_UPDATED,
      [PortfolioEventTopics.DOCUMENT_STATUS_CHANGED]: StandardKafkaTopics.DOCUMENT_STATUS_CHANGED,
    };

    return topicMapping[oldTopic] || oldTopic;
  }

  async publishUserCreated(event: UserCreatedEvent): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.USER_CREATED,
      event,
      `Publishing user created event: ${JSON.stringify(event)}`
    );
  }

  async publishUserStatusChanged(event: UserStatusChangedEvent): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.USER_STATUS_CHANGED,
      event,
      `Publishing user status changed event: ${JSON.stringify(event)}`
    );
  }

  async publishUserRoleChanged(event: UserRoleChangedEvent): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.USER_UPDATED,
      event,
      `Publishing user role changed event: ${JSON.stringify(event)}`
    );
  }

  async publishSubscriptionChanged(event: SubscriptionChangedEvent): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.SUBSCRIPTION_STATUS_CHANGED,
      event,
      `Publishing subscription changed event: ${JSON.stringify(event)}`
    );
  }

  async publishSubscriptionExpired(event: SubscriptionChangedEvent): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.SUBSCRIPTION_EXPIRED,
      event,
      `Publishing subscription expired event: ${JSON.stringify(event)}`
    );
  }

  async publishTokenPurchase(event: TokenTransactionEvent): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.TOKEN_PURCHASE,
      event,
      `Publishing token purchase event: ${JSON.stringify(event)}`
    );
  }

  // Événements du portfolio
  async publishFundingRequestStatusChanged(event: FundingRequestStatusChangedEvent): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.FUNDING_REQUEST_STATUS_CHANGED,
      event,
      `Publishing funding request status changed event: ${JSON.stringify(event)}`
    );
  }

  async publishContractCreated(event: ContractCreatedEvent): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.CONTRACT_CREATED,
      event,
      `Publishing contract created event: ${JSON.stringify(event)}`
    );
  }

  async publishContractStatusChanged(event: ContractStatusChangedEvent): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.CONTRACT_STATUS_CHANGED,
      event,
      `Publishing contract status changed event: ${JSON.stringify(event)}`
    );
  }

  async publishContractRestructured(event: ContractRestructuredEvent): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.CONTRACT_RESTRUCTURED,
      event,
      `Publishing contract restructured event: ${JSON.stringify(event)}`
    );
  }

  async publishDisbursementCompleted(event: DisbursementCompletedEvent): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.DISBURSEMENT_COMPLETED,
      event,
      `Publishing disbursement completed event: ${JSON.stringify(event)}`
    );
  }

  async publishRepaymentReceived(event: RepaymentReceivedEvent): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.REPAYMENT_RECEIVED,
      event,
      `Publishing repayment received event: ${JSON.stringify(event)}`
    );
  }

  async publishPaymentScheduleUpdated(event: PaymentScheduleUpdatedEvent): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.PAYMENT_SCHEDULE_UPDATED,
      event,
      `Publishing payment schedule updated event: ${JSON.stringify(event)}`
    );
  }
  
  // Événements de documents
  async publishDocumentUploaded(event: DocumentUploadedEvent): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.DOCUMENT_UPLOADED,
      event,
      `Publishing document uploaded event: ${JSON.stringify(event)}`
    );
  }

  async publishDocumentUpdated(event: DocumentUpdatedEvent): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.DOCUMENT_UPDATED,
      event,
      `Publishing document updated event: ${JSON.stringify(event)}`
    );
  }

  async publishDocumentStatusChanged(event: DocumentStatusChangedEvent): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.DOCUMENT_STATUS_CHANGED,
      event,
      `Publishing document status changed event: ${JSON.stringify(event)}`
    );
  }
  
  async publishTokenUsage(event: TokenTransactionEvent): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.TOKEN_USAGE,
      event,
      `Publishing token usage event: ${JSON.stringify(event)}`
    );
  }
  
  async publishTokenAlert(event: TokenTransactionEvent): Promise<void> {
    await this.publishEvent(
      StandardKafkaTopics.TOKEN_ALERT,
      event,
      `Publishing token alert event: ${JSON.stringify(event)}`
    );
  }
}
