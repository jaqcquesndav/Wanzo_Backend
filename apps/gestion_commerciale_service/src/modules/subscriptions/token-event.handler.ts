import { Injectable } from '@nestjs/common';
import { TokenTransactionEvent } from '@wanzo/shared/events/kafka-config';
import { EntityType } from '@wanzo/shared/events/subscription-types';
import { EventsService } from '../events/events.service';

@Injectable()
export class TokenEventHandler {
  constructor(private readonly eventsService: EventsService) {}

  async handleTokenPurchase(
    userId: string,
    companyId: string,
    amount: number,
    currentBalance: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: TokenTransactionEvent = {
      userId,
      entityId: companyId,
      entityType: EntityType.PME,
      amount,
      transactionId: Date.now().toString(),
      reason: 'Purchase',
      service: metadata?.service,
      timestamp: new Date().toISOString()
    };

    await this.eventsService.publishTokenPurchase(event);
  }

  async handleTokenUsage(
    userId: string,
    companyId: string,
    amount: number,
    currentBalance: number,
    feature: string
  ): Promise<void> {
    const event: TokenTransactionEvent = {
      userId,
      entityId: companyId,
      entityType: EntityType.PME,
      amount,
      transactionId: Date.now().toString(),
      reason: feature,
      service: feature,
      timestamp: new Date().toISOString()
    };

    await this.eventsService.publishTokenUsage(event);
  }
}
