import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsService } from '../events/events.service';
import { UserSubscription, SubscriptionStatus } from './entities/user-subscription.entity';
import { EntityType, SubscriptionStatusType } from '@wanzo/shared/events/subscription-types';

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
        relations: ['user']
      });

      this.logger.log(`Found ${expiredSubscriptions.length} expired subscriptions`);

      // Process each expired subscription
      for (const subscription of expiredSubscriptions) {
        this.logger.log(`Processing expired subscription for user ${subscription.userId}`);
        
        // Update subscription status
        subscription.status = SubscriptionStatus.INACTIVE;
        await this.userSubscriptionRepository.save(subscription);
        
        // Publish event for subscription expiration
        await this.eventsService.publishSubscriptionExpired({
          userId: subscription.userId,
          entityId: subscription.user.companyId, // Assuming the company ID is stored on the user
          entityType: EntityType.PME,
          newPlan: subscription.tier.type, // Keep the same plan, just mark as expired
          status: SubscriptionStatusType.EXPIRED,
          timestamp: now,
          changedBy: 'system',
          reason: 'Subscription period ended'
        });
      }
    } catch (error) {
      this.logger.error(`Error checking for expired subscriptions: ${error.message}`, error.stack);
    }
  }
}
