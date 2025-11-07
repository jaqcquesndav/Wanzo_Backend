import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { 
  UserEventTopics, 
  UserStatusChangedEvent, 
  UserRoleChangedEvent,
  UserCreatedEventData,
  SubscriptionEventTopics,
  SubscriptionChangedEvent,
  TokenEventTopics,
  TokenTransactionEvent,
  BusinessOperationEventTopics
} from '@wanzobe/shared/events/kafka-config';
import { StandardKafkaTopics } from '@wanzobe/shared/events/standard-kafka-topics';
import { MessageVersionManager } from '@wanzobe/shared/events/message-versioning';
import { kafkaMonitoring } from '@wanzobe/shared/monitoring/kafka-monitoring.service';
import { 
  BusinessOperationCreatedEvent, 
  BusinessOperationUpdatedEvent, 
  BusinessOperationDeletedEvent,
  SharedOperationType,
  SharedOperationStatus
} from '@wanzobe/shared/events/commerce-operations';
import { GESTION_COMMERCIALE_KAFKA_PRODUCER_SERVICE } from './kafka-producer.module';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    // Use the correct injection token for the Kafka client
    @Inject(GESTION_COMMERCIALE_KAFKA_PRODUCER_SERVICE) private readonly eventsClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Wait for connection to Kafka
    try {
      await this.eventsClient.connect();
      this.logger.log('Successfully connected to Kafka event bus for gestion_commerciale_service');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown Kafka connection error';
      this.logger.error(`Failed to connect to Kafka for gestion_commerciale_service: ${errorMessage}`, err instanceof Error ? err.stack : undefined);
    }
  }

  async onModuleDestroy() {
    await this.eventsClient.close();
  }

  // Method to publish UserCreatedEvent
  async publishUserCreated(event: UserCreatedEventData): Promise<void> {
    this.logger.log(`Publishing user created event: ${JSON.stringify(event)}`);
    try {
      this.eventsClient.emit(UserEventTopics.USER_CREATED, event);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error publishing ${UserEventTopics.USER_CREATED}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
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
    this.eventsClient.emit(SubscriptionEventTopics.SUBSCRIPTION_CREATED, event);
  }

  async publishSubscriptionExpired(event: SubscriptionChangedEvent): Promise<void> {
    this.logger.log(`Publishing subscription expired event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(SubscriptionEventTopics.SUBSCRIPTION_EXPIRED, event);
  }
  
  async publishTokenPurchase(event: TokenTransactionEvent): Promise<void> {
    this.logger.log(`Publishing token purchase event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(TokenEventTopics.TOKEN_PURCHASE, event);
  }

  async publishTokenUsage(event: TokenTransactionEvent): Promise<void> {
    this.logger.log(`Publishing token usage event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(TokenEventTopics.TOKEN_USAGE, event);
  }

  /**
   * Publie un événement de création d'opération commerciale
   * @param event Données de l'opération créée
   */
  async publishBusinessOperationCreated(event: BusinessOperationCreatedEvent): Promise<void> {
    const startTime = Date.now();
    
    this.logger.log(`Publishing business operation created event: ${JSON.stringify({
      id: event.id,
      type: event.type,
      clientId: event.clientId,
      companyId: event.companyId,
      amountCdf: event.amountCdf
    })}`);
    
    try {
      // Create standardized message with versioning
      const standardMessage = MessageVersionManager.createStandardMessage(
        StandardKafkaTopics.COMMERCE_OPERATION_CREATED,
        event,
        'gestion_commerciale',
        this.generateCorrelationId()
      );

      this.eventsClient.emit(StandardKafkaTopics.COMMERCE_OPERATION_CREATED, standardMessage);
      
      const processingTime = Date.now() - startTime;
      kafkaMonitoring.recordMessageSent(StandardKafkaTopics.COMMERCE_OPERATION_CREATED, processingTime, true);
      
      this.logger.log(`Successfully published ${StandardKafkaTopics.COMMERCE_OPERATION_CREATED} event in ${processingTime}ms`);
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      kafkaMonitoring.recordMessageSent(StandardKafkaTopics.COMMERCE_OPERATION_CREATED, processingTime, false);
      
      this.logger.error(`Error publishing ${StandardKafkaTopics.COMMERCE_OPERATION_CREATED}: ${errorMessage} (failed after ${processingTime}ms)`, 
        error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  private generateCorrelationId(): string {
    return `gc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Publie un événement de mise à jour d'opération commerciale
   * @param event Données de l'opération mise à jour
   */
  async publishBusinessOperationUpdated(event: BusinessOperationUpdatedEvent): Promise<void> {
    this.logger.log(`Publishing business operation updated event: ${JSON.stringify({
      id: event.id,
      type: event.type,
      clientId: event.clientId,
      companyId: event.companyId
    })}`);
    
    try {
      this.eventsClient.emit(BusinessOperationEventTopics.OPERATION_UPDATED, event);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error publishing ${BusinessOperationEventTopics.OPERATION_UPDATED}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined);
    }
  }

  /**
   * Publie un événement de suppression d'opération commerciale
   * @param event Données de l'opération supprimée
   */
  async publishBusinessOperationDeleted(event: BusinessOperationDeletedEvent): Promise<void> {
    this.logger.log(`Publishing business operation deleted event: ${JSON.stringify({
      id: event.id,
      clientId: event.clientId,
      companyId: event.companyId
    })}`);
    
    try {
      this.eventsClient.emit(BusinessOperationEventTopics.OPERATION_DELETED, event);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error publishing ${BusinessOperationEventTopics.OPERATION_DELETED}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined);
    }
  }

  /**
   * Publie un événement de demande de synchronisation d'organisation
   * @param event Données de la demande de synchronisation
   */
  async publishOrganizationSyncRequest(event: any): Promise<void> {
    this.logger.log(`Publishing organization sync request: ${JSON.stringify(event)}`);
    
    try {
      // Créer message standardisé
      const standardMessage = MessageVersionManager.createStandardMessage(
        StandardKafkaTopics.ORGANIZATION_SYNC_REQUEST,
        event,
        'gestion_commerciale_service'
      );
      
      this.eventsClient.emit(StandardKafkaTopics.ORGANIZATION_SYNC_REQUEST, standardMessage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error publishing organization sync request: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined);
    }
  }
}
