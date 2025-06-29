import { Injectable, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution, SubscriptionStatus, SubscriptionPlan } from '../entities/institution.entity';
import { TokenEventHandler } from './token-event.handler';
import { EntityType, SubscriptionStatusType, SubscriptionPlanType } from '@wanzo/shared/events/subscription-types';
import { EventsService } from '../../events/events.service';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(Institution)
    private institutionRepository: Repository<Institution>,
    private readonly tokenEventHandler: TokenEventHandler,
    @Inject(forwardRef(() => EventsService))
    private readonly eventsService: EventsService,
  ) {}

  async checkSubscriptionStatus(institutionId: string): Promise<boolean> {
    const institution = await this.institutionRepository.findOne({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new BadRequestException('Institution not found');
    }

    // Vérifier si l'abonnement est actif
    if (institution.subscriptionStatus !== SubscriptionStatus.ACTIVE) {
      return false;
    }

    // Vérifier si l'abonnement n'est pas expiré
    if (institution.subscriptionExpiresAt && institution.subscriptionExpiresAt < new Date()) {
      institution.subscriptionStatus = SubscriptionStatus.EXPIRED;
      await this.institutionRepository.save(institution);
      return false;
    }

    return true;
  }

  async updateSubscription(
    institutionId: string,
    plan: SubscriptionPlan,
    expiresAt: Date,
    userId: string
  ): Promise<Institution> {
    const institution = await this.institutionRepository.findOne({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new BadRequestException('Institution not found');
    }

    const previousPlan = institution.subscriptionPlan;
    institution.subscriptionPlan = plan;
    institution.subscriptionStatus = SubscriptionStatus.ACTIVE;
    institution.subscriptionExpiresAt = expiresAt;

    const updatedInstitution = await this.institutionRepository.save(institution);
    
    // Publish subscription changed event
    await this.eventsService.publishSubscriptionChanged({
      subscriptionId: institution.id, // Use institution id as subscriptionId for event
      userId,
      entityId: institutionId,
      entityType: EntityType.INSTITUTION,
      previousPlan: previousPlan as unknown as SubscriptionPlanType, // Cast to SubscriptionPlanType
      newPlan: plan as unknown as SubscriptionPlanType, // Cast to SubscriptionPlanType
      newStatus: SubscriptionStatusType.ACTIVE,
      startDate: (institution.lastSubscriptionChangeAt ?? new Date()).toISOString(),
      endDate: expiresAt.toISOString(),
      changedBy: userId,
      timestamp: new Date().toISOString(),
    });
    
    this.logger.log(`Institution ${institutionId} subscription updated to ${plan}`);
    return updatedInstitution;
  }

  async addTokens(institutionId: string, amount: number, userId: string): Promise<Institution> {
    const institution = await this.institutionRepository.findOne({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new BadRequestException('Institution not found');
    }

    institution.tokenBalance += amount;
    institution.tokenUsageHistory.push({
      date: new Date(),
      amount,
      operation: 'purchase',
      balance: institution.tokenBalance,
    });

    const savedInstitution = await this.institutionRepository.save(institution);
    
    // Publish token purchase event
    await this.tokenEventHandler.handleTokenPurchase(
      userId,
      institutionId,
      amount,
      institution.tokenBalance
    );
    
    this.logger.log(`Institution ${institutionId} purchased ${amount} tokens. New balance: ${institution.tokenBalance}`);
    return savedInstitution;
  }

  async useTokens(institutionId: string, amount: number, operation: string, userId?: string): Promise<boolean> {
    const institution = await this.institutionRepository.findOne({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new BadRequestException('Institution not found');
    }

    // Vérifier si l'institution a assez de tokens
    if (institution.tokenBalance < amount) {
      return false;
    }

    // Déduire les tokens
    institution.tokenBalance -= amount;
    institution.tokensUsed += amount;
    institution.tokenUsageHistory.push({
      date: new Date(),
      amount: -amount,
      operation,
      balance: institution.tokenBalance,
    });

    await this.institutionRepository.save(institution);
    
    // Publish token usage event if userId is provided
    if (userId) {
      await this.tokenEventHandler.handleTokenUsage(
        userId,
        institutionId,
        amount,
        institution.tokenBalance,
        operation
      );
      
      this.logger.log(`Institution ${institutionId} used ${amount} tokens for ${operation}. Remaining balance: ${institution.tokenBalance}`);
    }
    
    return true;
  }

  async getTokenBalance(institutionId: string): Promise<{
    balance: number;
    used: number;
    history: any[];
  }> {
    const institution = await this.institutionRepository.findOne({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new BadRequestException('Institution not found');
    }

    return {
      balance: institution.tokenBalance,
      used: institution.tokensUsed,
      history: institution.tokenUsageHistory,
    };
  }
}