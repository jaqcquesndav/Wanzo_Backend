import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserEventTopics, SubscriptionChangedEvent } from '@wanzo/shared/events/kafka-config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { UserSubscription, SubscriptionStatus } from '../../subscriptions/entities/user-subscription.entity';
import { Logger } from '@nestjs/common';

@Controller()
@Injectable()
export class SubscriptionEventsConsumer {
  private readonly logger = new Logger(SubscriptionEventsConsumer.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSubscription)
    private readonly userSubscriptionRepository: Repository<UserSubscription>,
  ) {}

  @MessagePattern(UserEventTopics.SUBSCRIPTION_CHANGED)
  async handleSubscriptionChanged(@Payload() event: SubscriptionChangedEvent): Promise<void> {
    this.logger.log(`Received subscription changed event: ${JSON.stringify(event)}`);
    
    try {
      // Only process events for PME entities in this service
      if (event.entityType !== 'pme') {
        this.logger.log(`Ignoring non-PME subscription event for entity type: ${event.entityType}`);
        return;
      }

      const user = await this.userRepository.findOne({ where: { id: event.userId } });
      
      if (!user) {
        this.logger.warn(`User with ID ${event.userId} not found in app_mobile_service`);
        return;
      }

      // Find active subscriptions
      const activeSubscriptions = await this.userSubscriptionRepository.find({
        where: { userId: event.userId, status: SubscriptionStatus.ACTIVE }
      });

      // Deactivate all current active subscriptions
      for (const sub of activeSubscriptions) {
        sub.status = SubscriptionStatus.INACTIVE;
        sub.endDate = new Date();
        await this.userSubscriptionRepository.save(sub);
      }

      // Only create a new subscription if the status is ACTIVE
      if (event.status === 'active') {
        // Create new subscription based on the event
        const newSubscription = this.userSubscriptionRepository.create({
          userId: event.userId,
          // tierId will need to be set based on the plan name mapping
          // This would require a lookup or mapping service
          status: SubscriptionStatus.ACTIVE,
          startDate: event.timestamp,
          endDate: event.expiresAt,
        });

        await this.userSubscriptionRepository.save(newSubscription);
        this.logger.log(`Successfully created new subscription for user ${event.userId}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error handling subscription change';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error handling subscription change: ${errorMessage}`, errorStack);
    }
  }

  @MessagePattern(UserEventTopics.SUBSCRIPTION_EXPIRED)
  async handleSubscriptionExpired(@Payload() event: SubscriptionChangedEvent): Promise<void> {
    this.logger.log(`Received subscription expired event: ${JSON.stringify(event)}`);
    
    try {
      // Only process events for PME entities in this service
      if (event.entityType !== 'pme') {
        return;
      }

      // Find active subscriptions
      const activeSubscriptions = await this.userSubscriptionRepository.find({
        where: { userId: event.userId, status: SubscriptionStatus.ACTIVE }
      });

      // Mark subscriptions as expired
      for (const sub of activeSubscriptions) {
        sub.status = SubscriptionStatus.INACTIVE;
        sub.endDate = new Date();
        await this.userSubscriptionRepository.save(sub);
      }

      this.logger.log(`Successfully marked subscriptions as expired for user ${event.userId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error handling subscription expiration';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error handling subscription expiration: ${errorMessage}`, errorStack);
    }
  }
}
