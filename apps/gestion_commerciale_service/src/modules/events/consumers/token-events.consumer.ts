import { Injectable } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TokenEventTopics, TokenTransactionEvent } from '@wanzo/shared/events/kafka-config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSubscription, SubscriptionStatus } from '../../subscriptions/entities/user-subscription.entity';
import { Logger } from '@nestjs/common';

@Controller()
@Injectable()
export class TokenEventsConsumer {
  private readonly logger = new Logger(TokenEventsConsumer.name);

  constructor(
    @InjectRepository(UserSubscription)
    private readonly userSubscriptionRepository: Repository<UserSubscription>,
  ) {}

  @MessagePattern(TokenEventTopics.TOKEN_PURCHASE)
  async handleTokenPurchase(@Payload() event: TokenTransactionEvent): Promise<void> {
    this.logger.log(`Received token purchase event: ${JSON.stringify(event)}`);
    
    try {
      // Only process events for PME entities in this service
      if (event.entityType !== 'pme') {
        this.logger.log(`Ignoring non-PME token event for entity type: ${event.entityType}`);
        return;
      }

      // Find the active subscription for the user
      const subscription = await this.userSubscriptionRepository.findOne({
        where: { 
          userId: event.userId,
          status: SubscriptionStatus.ACTIVE
        }
      });
      
      if (!subscription) {
        this.logger.warn(`No active subscription found for user ${event.userId}`);
        return;
      }

      // Update token balance
      subscription.remainingAdhaTokens += event.amount;
      
      await this.userSubscriptionRepository.save(subscription);
      this.logger.log(`Successfully updated token balance for user ${event.userId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error handling token purchase';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error handling token purchase: ${errorMessage}`, errorStack);
    }
  }

  @MessagePattern(TokenEventTopics.TOKEN_USAGE)
  async handleTokenUsage(@Payload() event: TokenTransactionEvent): Promise<void> {
    this.logger.log(`Received token usage event: ${JSON.stringify(event)}`);
    
    try {
      // Only process events for PME entities in this service
      if (event.entityType !== 'pme') {
        this.logger.log(`Ignoring non-PME token event for entity type: ${event.entityType}`);
        return;
      }

      // Find the active subscription for the user
      const subscription = await this.userSubscriptionRepository.findOne({
        where: { 
          userId: event.userId,
          status: SubscriptionStatus.ACTIVE
        }
      });
      
      if (!subscription) {
        this.logger.warn(`No active subscription found for user ${event.userId}`);
        return;
      }

      // Ensure there's enough balance
      if (subscription.remainingAdhaTokens < event.amount) {
        this.logger.warn(`Insufficient token balance for user ${event.userId}`);
        return;
      }

      // Update token balance
      subscription.remainingAdhaTokens -= event.amount;
      
      await this.userSubscriptionRepository.save(subscription);
      this.logger.log(`Successfully updated token usage for user ${event.userId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error handling token usage';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error handling token usage: ${errorMessage}`, errorStack);
    }
  }
}
