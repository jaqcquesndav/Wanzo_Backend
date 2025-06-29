import { Injectable, Inject, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { 
  UserEventTopics, 
  UserStatusChangedEvent, 
  UserRoleChangedEvent,
  TokenTransactionEvent
} from '../../../../../packages/shared/events/kafka-config';
import { SubscriptionChangedEvent, SubscriptionEventTopics } from '../../../../../packages/shared/events/subscription-events';
import { PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE } from './kafka-producer.module';

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
    this.eventsClient.emit('token.purchase', event);
  }
  async publishTokenUsage(event: TokenTransactionEvent): Promise<void> {
    this.logger.log(`Publishing token usage event: ${JSON.stringify(event)}`);
    this.eventsClient.emit('token.usage', event);
  }
  async publishTokenAlert(event: TokenTransactionEvent): Promise<void> {
    this.logger.log(`Publishing token alert event: ${JSON.stringify(event)}`);
    this.eventsClient.emit('token.alert', event);
  }
}
