import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { 
  FeatureUsageTracking, 
  CustomerFeatureLimit, 
  CustomerTokenBalance, 
  TokenTransaction 
} from '../entities/usage-tracking.entity';
import { SubscriptionPlan } from '../entities/subscription.entity';
import { CustomerSubscriptionInfo } from './feature-access.service';
import { PricingConfigService, FeatureCode } from '../../../config/subscription-pricing.config';

@Injectable()
export class DatabaseFeatureAccessService {
  constructor(
    @InjectRepository(FeatureUsageTracking)
    private featureUsageRepository: Repository<FeatureUsageTracking>,
    @InjectRepository(CustomerFeatureLimit)
    private featureLimitRepository: Repository<CustomerFeatureLimit>,
    @InjectRepository(CustomerTokenBalance)
    private tokenBalanceRepository: Repository<CustomerTokenBalance>,
    @InjectRepository(TokenTransaction)
    private tokenTransactionRepository: Repository<TokenTransaction>,
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlanRepository: Repository<SubscriptionPlan>,
    private dataSource: DataSource,
  ) {}

  /**
   * Récupère l'usage actuel d'une fonctionnalité pour un client dans la période courante
   */
  async getCurrentFeatureUsage(customerId: string, featureCode: FeatureCode): Promise<number> {
    const currentPeriod = this.getCurrentPeriod();
    
    const result = await this.featureUsageRepository
      .createQueryBuilder('usage')
      .select('SUM(usage.usageCount)', 'total')
      .where('usage.customerId = :customerId', { customerId })
      .andWhere('usage.featureCode = :featureCode', { featureCode })
      .andWhere('usage.usagePeriod = :period', { period: currentPeriod })
      .getRawOne();

    return parseInt(result?.total || '0');
  }

  /**
   * Enregistre l'usage d'une fonctionnalité
   */
  async recordFeatureUsage(
    customerId: string,
    featureCode: FeatureCode,
    usage: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const currentDate = new Date();
    const currentPeriod = this.getCurrentPeriod();

    // Créer l'enregistrement d'usage
    const featureUsage = this.featureUsageRepository.create({
      customerId,
      featureCode,
      usageCount: usage,
      usageDate: currentDate,
      usagePeriod: currentPeriod,
      metadata
    });

    await this.featureUsageRepository.save(featureUsage);

    // Mettre à jour les limites du client si elles existent
    await this.updateCustomerFeatureLimit(customerId, featureCode, usage);
  }

  /**
   * Récupère le solde de tokens d'un client
   */
  async getCustomerTokenBalance(customerId: string): Promise<CustomerTokenBalance | null> {
    const currentPeriod = this.getCurrentPeriod();
    
    let balance = await this.tokenBalanceRepository.findOne({
      where: { 
        customerId, 
        currentPeriod 
      }
    });

    // Si pas de balance pour la période courante, initialiser
    if (!balance) {
      balance = await this.initializeTokenBalance(customerId);
    }

    return balance;
  }

  /**
   * Consomme des tokens pour un client
   */
  async consumeTokens(
    customerId: string,
    tokenAmount: number,
    featureCode: FeatureCode,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.dataSource.transaction(async manager => {
      // Récupérer le solde actuel
      const balance = await manager.findOne(CustomerTokenBalance, {
        where: { customerId, currentPeriod: this.getCurrentPeriod() }
      });

      if (!balance) {
        throw new Error('Token balance not found for customer');
      }

      if (balance.remainingTokens < tokenAmount) {
        throw new Error('Insufficient tokens');
      }

      // Mettre à jour le solde
      const balanceBefore = balance.remainingTokens;
      balance.usedTokens += tokenAmount;
      balance.remainingTokens -= tokenAmount;
      balance.updatedAt = new Date();

      await manager.save(CustomerTokenBalance, balance);

      // Enregistrer la transaction
      const transaction = manager.create(TokenTransaction, {
        customerId,
        transactionType: 'usage',
        tokenAmount: -tokenAmount, // Négatif pour une consommation
        balanceBefore,
        balanceAfter: balance.remainingTokens,
        featureCode,
        description: `Token usage for ${featureCode}`,
        metadata,
        transactionDate: new Date()
      });

      await manager.save(TokenTransaction, transaction);

      // Enregistrer l'usage de la fonctionnalité
      const featureUsage = manager.create(FeatureUsageTracking, {
        customerId,
        featureCode,
        usageCount: 1,
        tokensCost: tokenAmount,
        usageDate: new Date(),
        usagePeriod: this.getCurrentPeriod(),
        metadata
      });

      await manager.save(FeatureUsageTracking, featureUsage);
    });
  }

  /**
   * Ajoute des tokens au solde d'un client (achat, allocation mensuelle, etc.)
   */
  async addTokens(
    customerId: string,
    tokenAmount: number,
    transactionType: 'allocation' | 'purchase' | 'bonus' | 'rollover',
    relatedEntityId?: string,
    relatedEntityType?: string,
    costUSD?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.dataSource.transaction(async manager => {
      let balance = await manager.findOne(CustomerTokenBalance, {
        where: { customerId, currentPeriod: this.getCurrentPeriod() }
      });

      if (!balance) {
        balance = await this.initializeTokenBalance(customerId, manager);
      }

      const balanceBefore = balance.remainingTokens;
      
      // Mettre à jour selon le type de transaction
      switch (transactionType) {
        case 'allocation':
          balance.monthlyAllocation += tokenAmount;
          break;
        case 'purchase':
          balance.purchasedTokens += tokenAmount;
          break;
        case 'bonus':
          balance.bonusTokens += tokenAmount;
          break;
        case 'rollover':
          balance.rolledOverTokens += tokenAmount;
          break;
      }

      balance.totalTokens += tokenAmount;
      balance.remainingTokens += tokenAmount;
      balance.updatedAt = new Date();

      await manager.save(CustomerTokenBalance, balance);

      // Enregistrer la transaction
      const transaction = manager.create(TokenTransaction, {
        customerId,
        transactionType,
        tokenAmount,
        balanceBefore,
        balanceAfter: balance.remainingTokens,
        relatedEntityId,
        relatedEntityType,
        costUSD,
        description: `Token ${transactionType}`,
        metadata,
        transactionDate: new Date()
      });

      await manager.save(TokenTransaction, transaction);
    });
  }

  /**
   * Récupère les informations d'abonnement d'un client depuis la base de données
   */
  async getCustomerSubscriptionInfo(customerId: string): Promise<CustomerSubscriptionInfo> {
    // Pour l'instant, retourner des données mock
    // TODO: Implémenter la récupération depuis les tables subscription et customer
    const tokenBalance = await this.getCustomerTokenBalance(customerId);
    
    return {
      customerId,
      customerType: 'sme' as any, // TODO: récupérer depuis customer table
      currentPlanId: 'sme-freemium', // TODO: récupérer depuis subscription table
      subscriptionStatus: 'active',
      remainingTokens: tokenBalance?.remainingTokens || 0,
      monthlyTokenAllocation: tokenBalance?.monthlyAllocation || 100000,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }

  /**
   * Synchronise les limites de fonctionnalités pour un client selon son plan
   */
  async syncCustomerFeatureLimits(customerId: string, planId: string): Promise<void> {
    const plan = PricingConfigService.getPlanById(planId);
    if (!plan) return;

    const currentPeriod = this.getCurrentPeriod();

    // Supprimer les anciennes limites pour cette période
    await this.featureLimitRepository.delete({
      customerId,
      period: currentPeriod
    });

    // Créer les nouvelles limites
    for (const [featureCode, featureConfig] of Object.entries(plan.features)) {
      if (featureConfig.enabled) {
        const limit = this.featureLimitRepository.create({
          customerId,
          planId,
          featureCode,
          period: currentPeriod,
          limitValue: featureConfig.limit,
          currentUsage: 0,
          isActive: true
        });

        await this.featureLimitRepository.save(limit);
      }
    }
  }

  /**
   * Initialise ou renouvelle le solde de tokens pour un client
   */
  async renewTokenBalance(customerId: string, monthlyAllocation: number): Promise<void> {
    const currentPeriod = this.getCurrentPeriod();
    const existingBalance = await this.tokenBalanceRepository.findOne({
      where: { customerId, currentPeriod }
    });

    if (existingBalance) {
      // Renouvellement mensuel - gérer le rollover si applicable
      const rolloverAmount = this.calculateRollover(existingBalance);
      
      existingBalance.monthlyAllocation = monthlyAllocation;
      existingBalance.totalTokens = monthlyAllocation + rolloverAmount;
      existingBalance.remainingTokens = monthlyAllocation + rolloverAmount;
      existingBalance.usedTokens = 0;
      existingBalance.rolledOverTokens = rolloverAmount;
      existingBalance.updatedAt = new Date();

      await this.tokenBalanceRepository.save(existingBalance);
    } else {
      // Nouveau solde
      await this.initializeTokenBalance(customerId);
    }
  }

  /**
   * Méthodes privées
   */
  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  private async initializeTokenBalance(
    customerId: string, 
    manager?: any
  ): Promise<CustomerTokenBalance> {
    const repo = manager || this.tokenBalanceRepository;
    const currentPeriod = this.getCurrentPeriod();
    const now = new Date();
    
    // TODO: Récupérer l'allocation mensuelle depuis le plan du client
    const monthlyAllocation = 100000; // Valeur par défaut

    const balance = repo.create({
      customerId,
      totalTokens: monthlyAllocation,
      usedTokens: 0,
      remainingTokens: monthlyAllocation,
      monthlyAllocation,
      rolledOverTokens: 0,
      purchasedTokens: 0,
      bonusTokens: 0,
      currentPeriod,
      periodStartDate: new Date(now.getFullYear(), now.getMonth(), 1),
      periodEndDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      rolloverHistory: []
    });

    return await repo.save(balance);
  }

  private async updateCustomerFeatureLimit(
    customerId: string, 
    featureCode: FeatureCode, 
    usage: number
  ): Promise<void> {
    const currentPeriod = this.getCurrentPeriod();
    
    await this.featureLimitRepository
      .createQueryBuilder()
      .update()
      .set({
        currentUsage: () => 'currentUsage + :usage',
        lastUsedAt: new Date()
      })
      .where('customerId = :customerId', { customerId })
      .andWhere('featureCode = :featureCode', { featureCode })
      .andWhere('period = :period', { period: currentPeriod })
      .setParameters({ usage })
      .execute();
  }

  private calculateRollover(balance: CustomerTokenBalance): number {
    // TODO: Implémenter la logique de rollover selon les règles du plan
    // Pour l'instant, pas de rollover
    return 0;
  }
}
