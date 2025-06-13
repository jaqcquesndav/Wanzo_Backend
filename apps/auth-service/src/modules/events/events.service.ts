import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { UserEventTopics, UserStatusChangedEvent, UserRoleChangedEvent, SubscriptionChangedEvent, TokenTransactionEvent, UserCreatedEventData } from '@wanzo/shared/events/kafka-config'; // Import event topics and interfaces

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);

  constructor(@Inject('AUTH_KAFKA_PRODUCER_SERVICE') private readonly kafkaClient: ClientKafka) {}
  async onModuleInit() {
    try {
      await this.kafkaClient.connect();
      this.logger.log('Kafka client (AUTH_KAFKA_PRODUCER_SERVICE) connected successfully for EventsService in auth-service.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error connecting Kafka client';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to connect Kafka client (AUTH_KAFKA_PRODUCER_SERVICE) for EventsService in auth-service: ${errorMessage}`, errorStack);
    }
  }

  async onModuleDestroy() {
    try {
      await this.kafkaClient.close();
      this.logger.log('Kafka client (AUTH_KAFKA_PRODUCER_SERVICE) closed successfully for EventsService in auth-service.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error closing Kafka client';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to close Kafka client (AUTH_KAFKA_PRODUCER_SERVICE) for EventsService in auth-service: ${errorMessage}`, errorStack);
    }
  }

  private async publishEvent(topic: string, payload: any) {
    try {
      // Using send which returns an Observable, converting to Promise for async/await.
      // emit is fire-and-forget, send can be used for request-response patterns or just to ensure message is sent.
      await this.kafkaClient.send(topic, JSON.stringify(payload)).toPromise();
      this.logger.log(`Published event to ${topic}: ${JSON.stringify(payload)}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error publishing event';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to publish event to ${topic}: ${errorMessage}`, errorStack);
      // Optionally rethrow or handle more gracefully depending on requirements
      throw error;
    }
  }

  async publishUserCreatedEvent(payload: UserCreatedEventData) { // Updated payload type
    await this.publishEvent(UserEventTopics.USER_CREATED, payload);
  }

  async publishUserUpdatedEvent(payload: { userId: string; changes: Record<string, any>; timestamp: Date }) {
    await this.publishEvent(UserEventTopics.USER_UPDATED, payload);
  }

  async publishUserStatusChangedEvent(payload: UserStatusChangedEvent) {
    await this.publishEvent(UserEventTopics.USER_STATUS_CHANGED, payload);
  }

  async publishUserRoleChangedEvent(payload: UserRoleChangedEvent) {
    await this.publishEvent(UserEventTopics.USER_ROLE_CHANGED, payload);
  }

  async publishUserDeletedEvent(payload: { userId: string; timestamp: Date; deletedBy: string }) {
    await this.publishEvent(UserEventTopics.USER_DELETED, payload);
  }

  async publishSubscriptionChangedEvent(payload: SubscriptionChangedEvent) {
    await this.publishEvent(UserEventTopics.SUBSCRIPTION_CHANGED, payload);
  }

  async publishSubscriptionExpiredEvent(payload: { userId: string; entityId: string; plan: string; timestamp: Date }) {
    await this.publishEvent(UserEventTopics.SUBSCRIPTION_EXPIRED, payload);
  }

  async publishTokenPurchaseEvent(payload: TokenTransactionEvent) {
    await this.publishEvent(UserEventTopics.TOKEN_PURCHASE, payload);
  }

  async publishTokenUsageEvent(payload: TokenTransactionEvent) {
    await this.publishEvent(UserEventTopics.TOKEN_USAGE, payload);
  }
  
  async publishTokenAlertEvent(payload: TokenTransactionEvent) {
    await this.publishEvent(UserEventTopics.TOKEN_ALERT, payload);
  }

  async publishUserEvent(topic: UserEventTopics, payload: any): Promise<void> {
    try {
      await this.kafkaClient.emit(topic, JSON.stringify(payload)).toPromise();
      this.logger.log(`Published event to ${topic}: ${JSON.stringify(payload)}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error publishing event';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to publish event to ${topic}: ${errorMessage}`, errorStack);
      // Optionally, rethrow the error or handle it based on application needs
      // throw error; 
    }
  }

  // Example of a specific event publishing method using the generic one
  // async publishUserLoggedInEvent(payload: { userId: string; timestamp: Date }) {
  //   await this.publishUserEvent(UserEventTopics.USER_LOGGED_IN, payload); // Assuming USER_LOGGED_IN is a defined topic
  // }
}
