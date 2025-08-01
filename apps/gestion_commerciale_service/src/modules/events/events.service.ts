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
  TokenTransactionEvent
} from '@wanzo/shared/events/kafka-config';
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
}
