import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsService } from '../events/events.service';
import { UserSubscription, SubscriptionStatus } from './entities/user-subscription.entity';
import { EntityType, SubscriptionStatusType, SubscriptionPlanType } from '@wanzo/shared/events/subscription-types';

@Injectable()
export class SubscriptionSchedulerService {
  private readonly logger = new Logger(SubscriptionSchedulerService.name);

  constructor(
    @InjectRepository(UserSubscription)
    private readonly userSubscriptionRepository: Repository<UserSubscription>,
    private readonly eventsService: EventsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkForExpiredSubscriptions() {
    this.logger.log('Checking for expired subscriptions');
    
    const now = new Date();
    
    try {
      // Find all active subscriptions that have expired
      const expiredSubscriptions = await this.userSubscriptionRepository.find({
        where: {
          status: SubscriptionStatus.ACTIVE,
          endDate: LessThanOrEqual(now),
        },
        relations: ['user', 'tier'] // Ensure user and tier are loaded
      });

      this.logger.log(`Found ${expiredSubscriptions.length} expired subscriptions`);

      // Process each expired subscription
      for (const subscription of expiredSubscriptions) {
        this.logger.log(`Processing expired subscription for user ${subscription.userId}`);
        
        // Update subscription status
        subscription.status = SubscriptionStatus.INACTIVE;
        await this.userSubscriptionRepository.save(subscription);
        
        // Publish event for subscription expiration
        if (!subscription.user || !subscription.user.companyId) {
          this.logger.warn(`User ${subscription.userId} does not have a companyId or user object is missing. Skipping event publication.`);
          continue;
        }
        if (!subscription.tier) {
            this.logger.warn(`Subscription ${subscription.id} does not have tier information. Skipping event publication.`);
            continue;
        }

        await this.eventsService.publishSubscriptionExpired({
          subscriptionId: subscription.id,
          userId: subscription.userId,
          entityId: subscription.user.companyId, 
          entityType: EntityType.PME,
          previousPlan: subscription.tier.type as unknown as SubscriptionPlanType,
          newPlan: subscription.tier.type as unknown as SubscriptionPlanType, // Cast via unknown
          previousStatus: SubscriptionStatusType.ACTIVE,
          newStatus: SubscriptionStatusType.EXPIRED,
          startDate: subscription.startDate.toISOString(),
          endDate: now.toISOString(),
          changedBy: 'system',
          timestamp: now.toISOString()
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error checking for expired subscriptions';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error checking for expired subscriptions: ${errorMessage}`, errorStack);
    }
  }
}
