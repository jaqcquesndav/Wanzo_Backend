import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { TokenTransactionEvent } from '@wanzo/shared/events/kafka-config';
import { EntityType } from '@wanzo/shared/events/subscription-types';
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
      operation: 'purchase',
      currentBalance,
      timestamp: new Date(),
      metadata
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
      operation: 'use',
      currentBalance,
      timestamp: new Date(),
      metadata: { operation }
    };

    await this.eventsService.publishTokenUsage(event);
  }
}
