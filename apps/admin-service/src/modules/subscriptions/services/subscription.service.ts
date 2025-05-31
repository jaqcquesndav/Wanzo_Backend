import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { UpdateSubscriptionDto } from '../dtos/subscription.dto';
import { NotificationService } from '../../notifications/services/notification.service';
import { ActivityService } from '../../activities/services/activity.service';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private notificationService: NotificationService,
    private activityService: ActivityService,
  ) {}

  async findByCompanyId(companyId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { companyId },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return subscription;
  }

  async update(companyId: string, updateSubscriptionDto: UpdateSubscriptionDto): Promise<Subscription> {
    const subscription = await this.findByCompanyId(companyId);
    
    const previousPlan = subscription.plan;
    Object.assign(subscription, updateSubscriptionDto);
    
    const updatedSubscription = await this.subscriptionRepository.save(subscription);

    // Log activity
    await this.activityService.logUserActivity(
      companyId, // Using companyId instead of userId
      'SUBSCRIPTION_UPDATED',
      `Subscription updated from ${previousPlan} to ${subscription.plan}`,
      { subscriptionId: subscription.id }
    );

    // Send notification
    await this.notificationService.createSubscriptionNotification(
      companyId, // Using companyId instead of userId
      subscription.plan,
      'updated'
    );

    return updatedSubscription;
  }

  async getTokens(companyId: string): Promise<{
    remaining: number;
    used: number;
  }> {
    const subscription = await this.findByCompanyId(companyId);
    return subscription.tokens;
  }

  async useTokens({ companyId, amount, description }: { companyId: string; amount: number; tokenAmount: number; description: string; }): Promise<boolean> {
    const subscription = await this.findByCompanyId(companyId);
    
    if (subscription.tokens.remaining < amount) {
      return false;
    }

    subscription.tokens.remaining -= amount;
    subscription.tokens.used += amount;

    await this.subscriptionRepository.save(subscription);

    // Log activity
    await this.activityService.logUserActivity(
      companyId,
      'TOKENS_USED',
      `Used ${amount} tokens for: ${description}`,
      { 
        subscriptionId: subscription.id,
        tokensUsed: amount,
        remaining: subscription.tokens.remaining
      }
    );

    // Send notification if tokens are running low
    if (subscription.tokens.remaining < 100) {
      await this.notificationService.createSystemNotification(
        companyId,
        'Low Token Balance',
        `Your token balance is running low. Only ${subscription.tokens.remaining} tokens remaining.`
      );
    }

    return true;
  }

  async addTokens(companyId: string, amount: number, type: 'purchase' | 'bonus'): Promise<void> {
    const subscription = await this.findByCompanyId(companyId);

    subscription.tokens.remaining += amount;

    await this.subscriptionRepository.save(subscription);

    // Log activity
    await this.activityService.logUserActivity(
      companyId,
      'TOKENS_ADDED',
      `${type === 'purchase' ? 'Purchased' : 'Received'} ${amount} tokens`,
      { 
        subscriptionId: subscription.id,
        tokensAdded: amount,
        type
      }
    );

    // Send notification
    await this.notificationService.createSystemNotification(
      companyId,
      'Tokens Added',
      `${amount} tokens have been ${type === 'purchase' ? 'purchased' : 'added'} to your account.`
    );
  }

  async getTokenTransactions(
    _companyId: string,
    page = 1,
    perPage = 10
  ): Promise<{
    transactions: any[];
    total: number;
    page: number;
    perPage: number;
  }> {
    
    // For now, return empty transactions since we don't have a separate transactions table
    return {
      transactions: [],
      total: 0,
      page,
      perPage
    };
  }

  async checkSubscriptionStatus(companyId: string): Promise<boolean> {
    const subscription = await this.findByCompanyId(companyId);
    
    if (subscription.validUntil < new Date()) {
      subscription.status = 'expired';
      await this.subscriptionRepository.save(subscription);
      
      // Send expiration notification
      await this.notificationService.createSubscriptionNotification(
        companyId,
        subscription.plan,
        'expired'
      );
      
      return false;
    }
    
    return subscription.status === 'active';
  }
}