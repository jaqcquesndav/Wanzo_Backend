import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsService } from '../events/events.service';
import { Institution, SubscriptionStatus } from '../institution/entities/institution.entity';
import { EntityType, SubscriptionStatusType, SubscriptionPlanType } from '@wanzo/shared/events/subscription-types';

@Injectable()
export class SubscriptionSchedulerService {
  private readonly logger = new Logger(SubscriptionSchedulerService.name);

  constructor(
    @InjectRepository(Institution)
    private readonly institutionRepository: Repository<Institution>,
    private readonly eventsService: EventsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkForExpiredSubscriptions() {
    this.logger.log('Checking for expired institution subscriptions');
    
    const now = new Date();
    
    try {
      // Find all active institutions with expired subscriptions
      const expiredInstitutions = await this.institutionRepository.find({
        where: {
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionExpiresAt: LessThanOrEqual(now),
        },
        relations: ['users']
      });

      this.logger.log(`Found ${expiredInstitutions.length} expired institution subscriptions`);

      // Process each expired subscription
      for (const institution of expiredInstitutions) {
        this.logger.log(`Processing expired subscription for institution ${institution.id}`);
        
        // Update subscription status
        institution.subscriptionStatus = SubscriptionStatus.EXPIRED;
        await this.institutionRepository.save(institution);
        
        // Find the admin user(s) of this institution
        const adminUsers = institution.users.filter(user => user.role === 'admin');
        
        if (adminUsers.length > 0) {
          const adminUserId = adminUsers[0].id; // Take the first admin
          
          // Publish event for subscription expiration
          await this.eventsService.publishSubscriptionExpired({
            subscriptionId: institution.id, // Using institution.id as subscriptionId
            userId: adminUserId,
            entityId: institution.id,
            entityType: EntityType.INSTITUTION,
            newPlan: institution.subscriptionPlan as unknown as SubscriptionPlanType,
            newStatus: SubscriptionStatusType.EXPIRED,
            startDate: '', // Required by interface but not relevant for expiration
            endDate: now.toISOString(), // Using current time as end date
            timestamp: now.toISOString(),
            changedBy: 'system'
          });
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error checking for expired institution subscriptions: ${error.message}`, error.stack);
      } else {
        this.logger.error(`Error checking for expired institution subscriptions: An unknown error occurred`, error);
      }
    }
  }
}
