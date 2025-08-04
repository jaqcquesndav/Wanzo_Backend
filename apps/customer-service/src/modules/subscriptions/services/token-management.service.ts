import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { 
  FeatureUsageTracking, 
  CustomerFeatureLimit, 
  CustomerTokenBalance, 
  TokenTransaction 
} from '../entities/pricing-entities';
import { Customer } from '../../customers/entities/customer.entity';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { 
  PricingConfigService, 
  FeatureCode, 
  CustomerType,
  SUBSCRIPTION_PLANS 
} from '../../../config/subscription-pricing.config';

export interface TokenConsumptionResult {
  success: boolean;
  tokensConsumed: number;
  remainingTokens: number;
  transactionId?: string;
  error?: string;
}

export interface FeatureUsageResult {
  success: boolean;
  usageRecorded: number;
  remainingUsage?: number;
  limitExceeded: boolean;
  error?: string;
}

@Injectable()
export class TokenManagementService {
  private readonly logger = new Logger(TokenManagementService.name);

  constructor(
    @InjectRepository(FeatureUsageTracking)
    private featureUsageRepository: Repository<FeatureUsageTracking>,
    @InjectRepository(CustomerFeatureLimit)
    private featureLimitRepository: Repository<CustomerFeatureLimit>,
    @InjectRepository(CustomerTokenBalance)
    private tokenBalanceRepository: Repository<CustomerTokenBalance>,
    @InjectRepository(TokenTransaction)
    private tokenTransactionRepository: Repository<TokenTransaction>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private dataSource: DataSource,
  ) {}

  /**
   * Récupère ou crée le solde de tokens pour un client
   */
  async getOrCreateTokenBalance(customerId: string): Promise<CustomerTokenBalance> {
    const currentPeriod = this.getCurrentPeriod();
    
    let tokenBalance = await this.tokenBalanceRepository.findOne({
      where: { 
        customerId, 
        currentPeriod 
      }
    });

    if (!tokenBalance) {
      // Récupérer les informations du client et de son abonnement
      const customer = await this.customerRepository.findOne({
        where: { id: customerId }
      });

      if (!customer) {
        throw new Error(`Customer ${customerId} not found`);
      }

      const subscription = await this.subscriptionRepository.findOne({
        where: { 
          customerId,
          status: SubscriptionStatus.ACTIVE
        },
        relations: ['plan']
      });

      let monthlyAllocation = 0;
      if (subscription?.plan) {
        const configPlan = PricingConfigService.getPlanById(subscription.plan.id);
        monthlyAllocation = configPlan?.tokenAllocation.monthlyTokens || 0;
      }

      // Créer un nouveau solde pour la période actuelle
      tokenBalance = this.tokenBalanceRepository.create({
        customerId,
        totalTokens: monthlyAllocation,
        usedTokens: 0,
        remainingTokens: monthlyAllocation,
        monthlyAllocation,
        rolledOverTokens: 0,
        purchasedTokens: 0,
        bonusTokens: 0,
        currentPeriod,
        periodStartDate: this.getPeriodStartDate(),
        periodEndDate: this.getPeriodEndDate(),
        rolloverHistory: []
      });

      await this.tokenBalanceRepository.save(tokenBalance);
    }

    return tokenBalance;
  }

  /**
   * Consomme des tokens pour un client
   */
  async consumeTokens(
    customerId: string,
    tokenAmount: number,
    featureCode?: FeatureCode,
    metadata?: Record<string, any>
  ): Promise<TokenConsumptionResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tokenBalance = await this.getOrCreateTokenBalance(customerId);

      if (tokenBalance.remainingTokens < tokenAmount) {
        await queryRunner.rollbackTransaction();
        return {
          success: false,
          tokensConsumed: 0,
          remainingTokens: tokenBalance.remainingTokens,
          error: `Insufficient tokens. Required: ${tokenAmount}, Available: ${tokenBalance.remainingTokens}`
        };
      }

      // Mettre à jour le solde
      const balanceBefore = tokenBalance.remainingTokens;
      tokenBalance.usedTokens += tokenAmount;
      tokenBalance.remainingTokens -= tokenAmount;

      await queryRunner.manager.save(tokenBalance);

      // Créer la transaction
      const transaction = queryRunner.manager.create(TokenTransaction, {
        customerId,
        transactionType: 'usage',
        tokenAmount: -tokenAmount, // Négatif pour la consommation
        balanceBefore,
        balanceAfter: tokenBalance.remainingTokens,
        featureCode,
        description: `Token consumption for ${featureCode || 'general usage'}`,
        metadata
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      this.logger.log(`Consumed ${tokenAmount} tokens for customer ${customerId}`);

      return {
        success: true,
        tokensConsumed: tokenAmount,
        remainingTokens: tokenBalance.remainingTokens,
        transactionId: savedTransaction.id
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error consuming tokens for customer ${customerId}`, error);
      return {
        success: false,
        tokensConsumed: 0,
        remainingTokens: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Enregistre l'usage d'une fonctionnalité
   */
  async recordFeatureUsage(
    customerId: string,
    featureCode: FeatureCode,
    usage: number = 1,
    tokensCost?: number,
    metadata?: Record<string, any>
  ): Promise<FeatureUsageResult> {
    try {
      const currentPeriod = this.getCurrentPeriod();
      const today = new Date();

      // Vérifier les limites de la fonctionnalité
      const limit = await this.getOrCreateFeatureLimit(customerId, featureCode);
      
      if (limit.limitValue !== undefined && limit.limitValue !== null) {
        if (limit.currentUsage + usage > limit.limitValue) {
          return {
            success: false,
            usageRecorded: 0,
            remainingUsage: Math.max(0, limit.limitValue - limit.currentUsage),
            limitExceeded: true,
            error: `Feature limit exceeded. Limit: ${limit.limitValue}, Current: ${limit.currentUsage}, Requested: ${usage}`
          };
        }
      }

      // Enregistrer l'usage
      const usageTracking = this.featureUsageRepository.create({
        customerId,
        featureCode,
        usageCount: usage,
        tokensCost,
        usageDate: today,
        usagePeriod: currentPeriod,
        metadata
      });

      await this.featureUsageRepository.save(usageTracking);

      // Mettre à jour la limite
      limit.currentUsage += usage;
      limit.lastUsedAt = today;
      await this.featureLimitRepository.save(limit);

      const remainingUsage = limit.limitValue !== undefined 
        ? Math.max(0, limit.limitValue - limit.currentUsage)
        : undefined;

      this.logger.log(`Recorded ${usage} usage for feature ${featureCode} for customer ${customerId}`);

      return {
        success: true,
        usageRecorded: usage,
        remainingUsage,
        limitExceeded: false
      };

    } catch (error) {
      this.logger.error(`Error recording feature usage for customer ${customerId}`, error);
      return {
        success: false,
        usageRecorded: 0,
        limitExceeded: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Récupère ou crée une limite de fonctionnalité pour un client
   */
  private async getOrCreateFeatureLimit(
    customerId: string,
    featureCode: FeatureCode
  ): Promise<CustomerFeatureLimit> {
    const currentPeriod = this.getCurrentPeriod();

    let limit = await this.featureLimitRepository.findOne({
      where: {
        customerId,
        featureCode,
        period: currentPeriod
      }
    });

    if (!limit) {
      // Récupérer la configuration du plan actuel
      const subscription = await this.subscriptionRepository.findOne({
        where: { 
          customerId,
          status: SubscriptionStatus.ACTIVE
        },
        relations: ['plan']
      });

      let limitValue: number | undefined;
      if (subscription?.plan) {
        limitValue = PricingConfigService.getFeatureLimit(subscription.plan.id, featureCode);
      }

      limit = this.featureLimitRepository.create({
        customerId,
        planId: subscription?.plan?.id || 'unknown',
        featureCode,
        period: currentPeriod,
        limitValue,
        currentUsage: 0,
        isActive: true
      });

      await this.featureLimitRepository.save(limit);
    }

    return limit;
  }

  /**
   * Ajoute des tokens à un client (achat, bonus, etc.)
   */
  async addTokens(
    customerId: string,
    tokenAmount: number,
    transactionType: 'purchase' | 'bonus' | 'allocation' | 'rollover',
    relatedEntityId?: string,
    costUSD?: number,
    metadata?: Record<string, any>
  ): Promise<TokenConsumptionResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tokenBalance = await this.getOrCreateTokenBalance(customerId);
      const balanceBefore = tokenBalance.remainingTokens;

      // Mettre à jour le solde selon le type de transaction
      tokenBalance.remainingTokens += tokenAmount;
      tokenBalance.totalTokens += tokenAmount;

      switch (transactionType) {
        case 'purchase':
          tokenBalance.purchasedTokens += tokenAmount;
          break;
        case 'bonus':
          tokenBalance.bonusTokens += tokenAmount;
          break;
        case 'rollover':
          tokenBalance.rolledOverTokens += tokenAmount;
          break;
      }

      await queryRunner.manager.save(tokenBalance);

      // Créer la transaction
      const transaction = queryRunner.manager.create(TokenTransaction, {
        customerId,
        transactionType,
        tokenAmount,
        balanceBefore,
        balanceAfter: tokenBalance.remainingTokens,
        relatedEntityId,
        costUSD,
        description: `Token ${transactionType}: ${tokenAmount} tokens`,
        metadata
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      this.logger.log(`Added ${tokenAmount} tokens (${transactionType}) for customer ${customerId}`);

      return {
        success: true,
        tokensConsumed: -tokenAmount, // Négatif car c'est un ajout
        remainingTokens: tokenBalance.remainingTokens,
        transactionId: savedTransaction.id
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error adding tokens for customer ${customerId}`, error);
      return {
        success: false,
        tokensConsumed: 0,
        remainingTokens: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Récupère l'historique des transactions de tokens
   */
  async getTokenTransactionHistory(
    customerId: string,
    limit: number = 50,
    transactionType?: string
  ): Promise<TokenTransaction[]> {
    const query = this.tokenTransactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.customerId = :customerId', { customerId })
      .orderBy('transaction.transactionDate', 'DESC')
      .limit(limit);

    if (transactionType) {
      query.andWhere('transaction.transactionType = :transactionType', { transactionType });
    }

    return await query.getMany();
  }

  /**
   * Récupère les statistiques d'usage des fonctionnalités
   */
  async getFeatureUsageStats(
    customerId: string,
    period?: string
  ): Promise<Record<string, { usage: number; limit?: number; percentage?: number }>> {
    const currentPeriod = period || this.getCurrentPeriod();

    const usageData = await this.featureUsageRepository
      .createQueryBuilder('usage')
      .select('usage.featureCode', 'featureCode')
      .addSelect('SUM(usage.usageCount)', 'totalUsage')
      .where('usage.customerId = :customerId', { customerId })
      .andWhere('usage.usagePeriod = :period', { period: currentPeriod })
      .groupBy('usage.featureCode')
      .getRawMany();

    const limits = await this.featureLimitRepository.find({
      where: {
        customerId,
        period: currentPeriod,
        isActive: true
      }
    });

    const stats: Record<string, { usage: number; limit?: number; percentage?: number }> = {};

    // Ajouter les données d'usage
    usageData.forEach(item => {
      stats[item.featureCode] = {
        usage: parseInt(item.totalUsage)
      };
    });

    // Ajouter les limites et calculer les pourcentages
    limits.forEach(limit => {
      if (!stats[limit.featureCode]) {
        stats[limit.featureCode] = { usage: 0 };
      }

      stats[limit.featureCode].limit = limit.limitValue || undefined;
      
      if (limit.limitValue && limit.limitValue > 0) {
        stats[limit.featureCode].percentage = 
          (stats[limit.featureCode].usage / limit.limitValue) * 100;
      }
    });

    return stats;
  }

  /**
   * Réinitialise les limites pour une nouvelle période
   */
  async resetPeriodLimits(customerId: string): Promise<void> {
    const currentPeriod = this.getCurrentPeriod();

    // Désactiver les anciennes limites
    await this.featureLimitRepository.update(
      { customerId, isActive: true },
      { isActive: false }
    );

    // Les nouvelles limites seront créées automatiquement lors du prochain usage
    this.logger.log(`Reset period limits for customer ${customerId} for period ${currentPeriod}`);
  }

  /**
   * Utilitaires pour la gestion des périodes
   */
  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private getPeriodStartDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private getPeriodEndDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }
}
