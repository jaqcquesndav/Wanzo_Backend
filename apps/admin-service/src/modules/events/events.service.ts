import { Injectable, Inject, Logger, OnModuleInit, OnModuleDestroy, Optional } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { 
  UserEventTopics, 
  UserStatusChangedEvent, 
  UserRoleChangedEvent,
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
  UserPasswordResetEvent,
  CustomerEventTopics,
  CustomerCreatedEvent,
  CustomerUpdatedEvent,
  CustomerDeletedEvent,
  CustomerStatusChangedEvent,
  CustomerValidatedEvent,
  CustomerSuspendedEvent,
  CustomerReactivatedEvent,
  FinanceEventTopics,
  InvoiceCreatedEvent,
  InvoiceStatusChangedEvent,
  PaymentReceivedEvent,
  TokenEventTopics,
  TokenPurchaseEvent,
  TokenUsageEvent,
  TokenAllocatedEvent,
  TokenAlertEvent,
  DocumentEventTopics,
  DocumentUploadedEvent,
  DocumentDeletedEvent,
  DocumentAnalysisCompletedEvent,
  InstitutionEventTopics,
  InstitutionCreatedEvent,
  InstitutionProfileUpdatedEvent,
  InstitutionStatusChangedEvent,
} from '@wanzo/shared/events/kafka-config';

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);
  private kafkaEnabled = false;

  constructor(
    @Optional() @Inject('KAFKA_PRODUCER_SERVICE') private readonly eventsClient: ClientKafka,
    private readonly configService: ConfigService,
  ) {
    this.kafkaEnabled = this.configService.get<string>('USE_KAFKA', 'false') === 'true';
    if (this.kafkaEnabled && !this.eventsClient) {
      this.logger.warn('Kafka is enabled but no client was injected. Disabling Kafka.');
      this.kafkaEnabled = false;
    }
  }

  async onModuleInit() {
    if (!this.kafkaEnabled) {
      this.logger.log('Kafka is disabled. Events will not be published.');
      return;
    }
    try {
      const connectPromise = this.eventsClient.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Kafka connection timeout after 5000ms')), 5000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      this.logger.log('Connected to Kafka event bus');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error connecting to Kafka';
      this.logger.warn(`Failed to connect to Kafka: ${errorMessage}. Events will be disabled.`);
      this.kafkaEnabled = false;
    }
  }

  async onModuleDestroy() {
    if (this.kafkaEnabled && this.eventsClient) {
      try {
        await this.eventsClient.close();
        this.logger.log('Disconnected from Kafka event bus');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Failed to disconnect from Kafka: ${errorMessage}`);
      }
    }
  }

  public async emit<T>(topic: string, event: T): Promise<void> {
    if (!this.kafkaEnabled) {
      this.logger.debug(`[DISABLED] Would publish to topic ${topic}: ${JSON.stringify(event)}`);
      return;
    }
    
    this.logger.log(`Publishing to topic ${topic}: ${JSON.stringify(event)}`);
    this.eventsClient.emit(topic, event);
  }

  // #region User Events
  async publishUserCreated(event: UserCreatedEvent): Promise<void> {
    await this.emit(UserEventTopics.USER_CREATED, event);
  }

  async publishUserUpdated(event: UserUpdatedEvent): Promise<void> {
    await this.emit(UserEventTopics.USER_UPDATED, event);
  }

  async publishUserDeleted(event: UserDeletedEvent): Promise<void> {
    await this.emit(UserEventTopics.USER_DELETED, event);
  }

  async publishUserStatusChanged(event: UserStatusChangedEvent): Promise<void> {
    await this.emit(UserEventTopics.USER_STATUS_CHANGED, event);
  }

  async publishUserRoleChanged(event: UserRoleChangedEvent): Promise<void> {
    await this.emit(UserEventTopics.USER_ROLE_CHANGED, event);
  }

  async publishUserPasswordReset(event: UserPasswordResetEvent): Promise<void> {
    await this.emit(UserEventTopics.USER_PASSWORD_RESET, event);
  }
  // #endregion

  // #region Customer Events
  async publishCustomerCreated(event: CustomerCreatedEvent): Promise<void> {
    await this.emit(CustomerEventTopics.CUSTOMER_CREATED, event);
  }

  async publishCustomerUpdated(event: CustomerUpdatedEvent): Promise<void> {
    await this.emit(CustomerEventTopics.CUSTOMER_UPDATED, event);
  }

  async publishCustomerDeleted(event: CustomerDeletedEvent): Promise<void> {
    await this.emit(CustomerEventTopics.CUSTOMER_DELETED, event);
  }

  async publishCustomerStatusChanged(event: CustomerStatusChangedEvent): Promise<void> {
    await this.emit(CustomerEventTopics.CUSTOMER_STATUS_CHANGED, event);
  }

  async publishCustomerValidated(event: CustomerValidatedEvent): Promise<void> {
    await this.emit(CustomerEventTopics.CUSTOMER_VALIDATED, event);
  }

  async publishCustomerSuspended(event: CustomerSuspendedEvent): Promise<void> {
    await this.emit(CustomerEventTopics.CUSTOMER_SUSPENDED, event);
  }

  async publishCustomerReactivated(event: CustomerReactivatedEvent): Promise<void> {
    await this.emit(CustomerEventTopics.CUSTOMER_REACTIVATED, event);
  }
  // #endregion

  // #region Finance Events
  async publishInvoiceCreated(event: InvoiceCreatedEvent): Promise<void> {
    await this.emit(FinanceEventTopics.INVOICE_CREATED, event);
  }

  async publishInvoiceStatusChanged(event: InvoiceStatusChangedEvent): Promise<void> {
    await this.emit(FinanceEventTopics.INVOICE_STATUS_CHANGED, event);
  }

  async publishPaymentReceived(event: PaymentReceivedEvent): Promise<void> {
    await this.emit(FinanceEventTopics.PAYMENT_RECEIVED, event);
  }
  // #endregion

  // #region Token Events
  async publishTokenPurchase(event: TokenPurchaseEvent): Promise<void> {
    await this.emit(TokenEventTopics.TOKEN_PURCHASE, event);
  }

  async publishTokenUsage(event: TokenUsageEvent): Promise<void> {
    await this.emit(TokenEventTopics.TOKEN_USAGE, event);
  }

  async publishTokenAllocated(event: TokenAllocatedEvent): Promise<void> {
    await this.emit(TokenEventTopics.TOKEN_ALLOCATED, event);
  }

  async publishTokenAlert(event: TokenAlertEvent): Promise<void> {
    await this.emit(TokenEventTopics.TOKEN_ALERT, event);
  }
  // #endregion

  // #region Document Events
  async publishDocumentUploaded(event: DocumentUploadedEvent): Promise<void> {
    await this.emit(DocumentEventTopics.DOCUMENT_UPLOADED, event);
  }

  async publishDocumentDeleted(event: DocumentDeletedEvent): Promise<void> {
    await this.emit(DocumentEventTopics.DOCUMENT_DELETED, event);
  }

  async publishDocumentAnalysisCompleted(event: DocumentAnalysisCompletedEvent): Promise<void> {
    await this.emit(DocumentEventTopics.DOCUMENT_ANALYSIS_COMPLETED, event);
  }
  // #endregion

  // #region Institution Events
  async publishInstitutionCreated(event: InstitutionCreatedEvent): Promise<void> {
    await this.emit(InstitutionEventTopics.INSTITUTION_CREATED, event);
  }

  async publishInstitutionProfileUpdated(event: InstitutionProfileUpdatedEvent): Promise<void> {
    await this.emit(InstitutionEventTopics.INSTITUTION_PROFILE_UPDATED, event);
  }

  async publishInstitutionStatusChanged(event: InstitutionStatusChangedEvent): Promise<void> {
    await this.emit(InstitutionEventTopics.INSTITUTION_STATUS_CHANGED, event);
  }
  // #endregion
}
