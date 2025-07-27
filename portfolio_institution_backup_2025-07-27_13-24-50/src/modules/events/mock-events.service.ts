import { Injectable, Logger } from '@nestjs/common';
import { 
  UserStatusChangedEvent, 
  UserRoleChangedEvent,
  SubscriptionChangedEvent,
  TokenTransactionEvent
} from '@wanzo/shared/events/kafka-config';

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
}
