import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution, SubscriptionStatus, SubscriptionPlan } from '../entities/institution.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Institution)
    private institutionRepository: Repository<Institution>,
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
  ): Promise<Institution> {
    const institution = await this.institutionRepository.findOne({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new BadRequestException('Institution not found');
    }

    institution.subscriptionPlan = plan;
    institution.subscriptionStatus = SubscriptionStatus.ACTIVE;
    institution.subscriptionExpiresAt = expiresAt;

    return await this.institutionRepository.save(institution);
  }

  async addTokens(institutionId: string, amount: number): Promise<Institution> {
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

    return await this.institutionRepository.save(institution);
  }

  async useTokens(institutionId: string, amount: number, operation: string): Promise<boolean> {
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