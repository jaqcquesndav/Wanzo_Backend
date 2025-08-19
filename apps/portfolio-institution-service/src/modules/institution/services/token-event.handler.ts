import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { TokenTransactionEvent } from '@wanzobe/shared/events/kafka-config';
import { EntityType } from '@wanzobe/shared/events/subscription-types';
import { EventsService } from '../../events/events.service';

@Injectable()
export class TokenEventHandler {
  constructor(
    @Inject(forwardRef(() => EventsService))
    private readonly eventsService: EventsService
  ) {}

  async handleTokenPurchase(
    userId: string,
    institutionId: string,
    amount: number,
    currentBalance: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: TokenTransactionEvent = {
      userId,
      entityId: institutionId,
      entityType: EntityType.INSTITUTION,
      amount,
      transactionId: '', // Provide a transactionId if available
      timestamp: new Date().toISOString(),
      reason: 'purchase',
      ...metadata && { service: metadata.service },
    };

    await this.eventsService.publishTokenPurchase(event);
  }

  async handleTokenUsage(
    userId: string,
    institutionId: string,
    amount: number,
    currentBalance: number,
    operation: string
  ): Promise<void> {
    const event: TokenTransactionEvent = {
      userId,
      entityId: institutionId,
      entityType: EntityType.INSTITUTION,
      amount,
      transactionId: '', // Provide a transactionId if available
      timestamp: new Date().toISOString(),
      reason: operation,
      // service: operation, // Optionally map to service if needed
    };

    await this.eventsService.publishTokenUsage(event);
  }
}
