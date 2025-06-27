import { Injectable, Inject, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { SME_KAFKA_PRODUCER_SERVICE } from './kafka-producer.module';
import { 
  UserEventTopics, 
  UserStatusChangedEvent, 
  UserRoleChangedEvent,
  SubscriptionChangedEvent,
  TokenPurchaseEvent,
  SubscriptionEventTopics,
  TokenEventTopics
} from '../../../../../packages/shared/events/kafka-config';

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @Inject(SME_KAFKA_PRODUCER_SERVICE) private readonly eventsClient: ClientKafka,
  ) {}

  async onModuleInit() {
    try {
      // Wait for connection to Kafka
      await this.eventsClient.connect();
      this.logger.log('Connected to Kafka event bus');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error connecting to Kafka';
      this.logger.error(`Failed to connect to Kafka: ${errorMessage}`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.eventsClient.close();
      this.logger.log('Disconnected from Kafka event bus');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to disconnect from Kafka: ${errorMessage}`);
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
    this.eventsClient.emit(SubscriptionEventTopics.SUBSCRIPTION_PLAN_CHANGED, event);
  }

  async publishTokenPurchase(event: TokenPurchaseEvent): Promise<void> {
    this.logger.log(`Publishing token purchase event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(TokenEventTopics.TOKEN_PURCHASE, event);
  }
}
