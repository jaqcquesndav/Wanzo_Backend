import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { 
  UserEventTopics,
  TokenTransactionEvent
} from './kafka-config'; // Corrected path
import { EntityType } from './subscription-types'; // Corrected path

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    @Inject('EVENTS_SERVICE') private readonly eventsClient: ClientKafka,
  ) {}

  async publishTokenPurchase(
    userId: string,
    entityId: string,
    entityType: EntityType,
    amount: number,
    currentBalance: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: TokenTransactionEvent = {
      userId,
      entityId,
      entityType,
      amount,
      operation: 'purchase',
      currentBalance,
      timestamp: new Date(),
      metadata
    };

    this.logger.log(`Publishing token purchase event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(UserEventTopics.TOKEN_PURCHASE, event);
  }

  async publishTokenUsage(
    userId: string,
    entityId: string,
    entityType: EntityType,
    amount: number,
    currentBalance: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: TokenTransactionEvent = {
      userId,
      entityId,
      entityType,
      amount,
      operation: 'use',
      currentBalance,
      timestamp: new Date(),
      metadata
    };

    this.logger.log(`Publishing token usage event: ${JSON.stringify(event)}`);
    this.eventsClient.emit(UserEventTopics.TOKEN_USAGE, event);
  }
}
