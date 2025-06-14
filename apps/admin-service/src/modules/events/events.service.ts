import { Injectable, Inject, Logger, OnModuleInit, OnModuleDestroy, Optional } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { 
  UserEventTopics, 
  UserStatusChangedEvent, 
  UserRoleChangedEvent,
  SubscriptionChangedEvent
} from '@wanzo/shared/events/kafka-config';

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);
  private kafkaEnabled = false;

  constructor(
    @Optional() @Inject('EVENTS_SERVICE') private readonly eventsClient: ClientKafka,
    private readonly configService: ConfigService,
  ) {
    this.kafkaEnabled = this.configService.get<string>('USE_KAFKA', 'false') === 'true';
    // Safety check to ensure we have a client if Kafka is enabled
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
      // Wait for connection to Kafka
      await this.eventsClient.connect();
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

  async publishUserStatusChanged(event: UserStatusChangedEvent): Promise<void> {
    if (!this.kafkaEnabled) {
      this.logger.debug(`[DISABLED] Would publish user status changed event: ${JSON.stringify(event)}`);
      return;
    }
    
    this.logger.log(`Publishing user status changed event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(UserEventTopics.USER_STATUS_CHANGED, event);
  }

  async publishUserRoleChanged(event: UserRoleChangedEvent): Promise<void> {
    if (!this.kafkaEnabled) {
      this.logger.debug(`[DISABLED] Would publish user role changed event: ${JSON.stringify(event)}`);
      return;
    }
    
    this.logger.log(`Publishing user role changed event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(UserEventTopics.USER_ROLE_CHANGED, event);
  }
  async publishSubscriptionChanged(event: SubscriptionChangedEvent): Promise<void> {
    if (!this.kafkaEnabled) {
      this.logger.debug(`[DISABLED] Would publish subscription changed event: ${JSON.stringify(event)}`);
      return;
    }
    
    this.logger.log(`Publishing subscription changed event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(UserEventTopics.SUBSCRIPTION_CHANGED, event);
  }
}
