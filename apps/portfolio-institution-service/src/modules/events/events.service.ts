import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { 
  UserEventTopics, 
  UserStatusChangedEvent, 
  UserRoleChangedEvent,
  SubscriptionChangedEvent,
  TokenTransactionEvent
} from '@wanzo/shared/events/kafka-config';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @Inject('EVENTS_SERVICE') private readonly eventsClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Wait for connection to Kafka
    await this.eventsClient.connect();
    this.logger.log('Connected to Kafka event bus');
  }

  async onModuleDestroy() {
    await this.eventsClient.close();
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
    this.eventsClient.emit(UserEventTopics.SUBSCRIPTION_CHANGED, event);
  }

  async publishSubscriptionExpired(event: SubscriptionChangedEvent): Promise<void> {
    this.logger.log(`Publishing subscription expired event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(UserEventTopics.SUBSCRIPTION_EXPIRED, event);
  }
  
  async publishTokenPurchase(event: TokenTransactionEvent): Promise<void> {
    this.logger.log(`Publishing token purchase event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(UserEventTopics.TOKEN_PURCHASE, event);
  }

  async publishTokenUsage(event: TokenTransactionEvent): Promise<void> {
    this.logger.log(`Publishing token usage event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(UserEventTopics.TOKEN_USAGE, event);
  }
  
  async publishTokenAlert(event: TokenTransactionEvent): Promise<void> {
    this.logger.log(`Publishing token alert event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(UserEventTopics.TOKEN_ALERT, event);
  }
}
