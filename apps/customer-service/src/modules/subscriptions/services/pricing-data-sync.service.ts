import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from '../entities/subscription.entity';
import { TokenPackage } from '../../tokens/entities/token.entity';
import { 
  SUBSCRIPTION_PLANS, 
  TOKEN_PURCHASE_PACKAGES,
  PricingConfigService,
  SubscriptionPlan as ConfigPlan,
  TokenPurchasePackage as ConfigPackage
} from '../../../config/subscription-pricing.config';

@Injectable()
export class PricingDataSyncService {
  private readonly logger = new Logger(PricingDataSyncService.name);

  constructor(
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlanRepository: Repository<SubscriptionPlan>,
    @InjectRepository(TokenPackage)
    private tokenPackageRepository: Repository<TokenPackage>,
  ) {}

  /**
   * Synchronise les plans d'abonnement depuis la configuration vers la base de données
   */
  async syncSubscriptionPlans(): Promise<void> {
    this.logger.log('Starting subscription plans synchronization...');

    try {
      for (const configPlan of SUBSCRIPTION_PLANS) {
        await this.syncSinglePlan(configPlan);
      }

      // Désactiver les plans qui ne sont plus dans la configuration
      await this.deactivateRemovedPlans();

      this.logger.log('Subscription plans synchronization completed successfully');
    } catch (error) {
      this.logger.error('Error during subscription plans synchronization', error);
      throw error;
    }
  }

  /**
   * Synchronise les packages de tokens depuis la configuration vers la base de données
   */
  async syncTokenPackages(): Promise<void> {
    this.logger.log('Starting token packages synchronization...');

    try {
      for (const configPackage of TOKEN_PURCHASE_PACKAGES) {
        await this.syncSingleTokenPackage(configPackage);
      }

      // Désactiver les packages qui ne sont plus dans la configuration
      await this.deactivateRemovedTokenPackages();

      this.logger.log('Token packages synchronization completed successfully');
    } catch (error) {
      this.logger.error('Error during token packages synchronization', error);
      throw error;
    }
  }

  /**
   * Synchronise toutes les données de tarification
   */
  async syncAllPricingData(): Promise<void> {
    this.logger.log('Starting full pricing data synchronization...');
    
    await this.syncSubscriptionPlans();
    await this.syncTokenPackages();
    
    this.logger.log('Full pricing data synchronization completed');
  }

  /**
   * Synchronise un plan d'abonnement spécifique
   */
  private async syncSinglePlan(configPlan: ConfigPlan): Promise<void> {
    try {
      let existingPlan = await this.subscriptionPlanRepository.findOne({
        where: { id: configPlan.id }
      });

      if (existingPlan) {
        // Mettre à jour le plan existant
        existingPlan.name = configPlan.name;
        existingPlan.description = configPlan.description;
        existingPlan.type = configPlan.billingPeriod as any;
        existingPlan.priceUSD = configPlan.monthlyPriceUSD;
        existingPlan.priceLocal = configPlan.annualPriceUSD;
        existingPlan.currency = 'USD';
        existingPlan.durationDays = configPlan.billingPeriod === 'monthly' ? 30 : 365;
        existingPlan.includedTokens = configPlan.tokenAllocation.monthlyTokens;
        existingPlan.features = {
          ...configPlan.features,
          customerType: configPlan.customerType,
          tokenAllocation: configPlan.tokenAllocation,
          tags: configPlan.tags
        };
        existingPlan.isPopular = configPlan.isPopular;
        existingPlan.discounts = configPlan.annualDiscountPercentage > 0 ? [{
          code: 'ANNUAL',
          percentage: configPlan.annualDiscountPercentage,
          validUntil: new Date('2099-12-31')
        }] : [];

        await this.subscriptionPlanRepository.save(existingPlan);
        this.logger.log(`Updated subscription plan: ${configPlan.id}`);
      } else {
        // Créer un nouveau plan
        const newPlan = this.subscriptionPlanRepository.create({
          id: configPlan.id,
          name: configPlan.name,
          description: configPlan.description,
          type: configPlan.billingPeriod as any,
          priceUSD: configPlan.monthlyPriceUSD,
          priceLocal: configPlan.annualPriceUSD,
          currency: 'USD',
          durationDays: configPlan.billingPeriod === 'monthly' ? 30 : 365,
          includedTokens: configPlan.tokenAllocation.monthlyTokens,
          features: {
            ...configPlan.features,
            customerType: configPlan.customerType,
            tokenAllocation: configPlan.tokenAllocation,
            tags: configPlan.tags
          },
          isPopular: configPlan.isPopular,
          discounts: configPlan.annualDiscountPercentage > 0 ? [{
            code: 'ANNUAL',
            percentage: configPlan.annualDiscountPercentage,
            validUntil: new Date('2099-12-31')
          }] : []
        });

        await this.subscriptionPlanRepository.save(newPlan);
        this.logger.log(`Created new subscription plan: ${configPlan.id}`);
      }
    } catch (error) {
      this.logger.error(`Error syncing plan ${configPlan.id}`, error);
      throw error;
    }
  }

  /**
   * Synchronise un package de tokens spécifique
   */
  private async syncSingleTokenPackage(configPackage: ConfigPackage): Promise<void> {
    try {
      let existingPackage = await this.tokenPackageRepository.findOne({
        where: { id: configPackage.id }
      });

      if (existingPackage) {
        // Mettre à jour le package existant
        existingPackage.name = configPackage.name;
        existingPackage.description = configPackage.description;
        existingPackage.tokenAmount = configPackage.tokenAmount;
        existingPackage.priceUSD = configPackage.priceUSD;
        // Stocker les métadonnées supplémentaires dans un champ JSON
        (existingPackage as any).metadata = {
          pricePerMillionTokens: configPackage.pricePerMillionTokens,
          bonusPercentage: configPackage.bonusPercentage,
          customerTypes: configPackage.customerTypes,
          sortOrder: configPackage.sortOrder
        };
        (existingPackage as any).isActive = configPackage.isVisible;

        await this.tokenPackageRepository.save(existingPackage);
        this.logger.log(`Updated token package: ${configPackage.id}`);
      } else {
        // Créer un nouveau package
        const newPackage = this.tokenPackageRepository.create({
          id: configPackage.id,
          name: configPackage.name,
          description: configPackage.description,
          tokenAmount: configPackage.tokenAmount,
          priceUSD: configPackage.priceUSD,
          // Stocker les métadonnées supplémentaires
          metadata: {
            pricePerMillionTokens: configPackage.pricePerMillionTokens,
            bonusPercentage: configPackage.bonusPercentage,
            customerTypes: configPackage.customerTypes,
            sortOrder: configPackage.sortOrder
          },
          isActive: configPackage.isVisible
        } as any);

        await this.tokenPackageRepository.save(newPackage);
        this.logger.log(`Created new token package: ${configPackage.id}`);
      }
    } catch (error) {
      this.logger.error(`Error syncing token package ${configPackage.id}`, error);
      throw error;
    }
  }

  /**
   * Désactive les plans qui ne sont plus dans la configuration
   */
  private async deactivateRemovedPlans(): Promise<void> {
    const configPlanIds = SUBSCRIPTION_PLANS.map(plan => plan.id);
    const dbPlans = await this.subscriptionPlanRepository.find();

    for (const dbPlan of dbPlans) {
      if (!configPlanIds.includes(dbPlan.id)) {
        // Plan retiré de la configuration, le marquer comme non visible
        (dbPlan as any).isActive = false;
        await this.subscriptionPlanRepository.save(dbPlan);
        this.logger.log(`Deactivated removed plan: ${dbPlan.id}`);
      }
    }
  }

  /**
   * Désactive les packages qui ne sont plus dans la configuration
   */
  private async deactivateRemovedTokenPackages(): Promise<void> {
    const configPackageIds = TOKEN_PURCHASE_PACKAGES.map(pkg => pkg.id);
    const dbPackages = await this.tokenPackageRepository.find();

    for (const dbPackage of dbPackages) {
      if (!configPackageIds.includes(dbPackage.id)) {
        // Package retiré de la configuration, le marquer comme non visible
        (dbPackage as any).isActive = false;
        await this.tokenPackageRepository.save(dbPackage);
        this.logger.log(`Deactivated removed token package: ${dbPackage.id}`);
      }
    }
  }

  /**
   * Valide la cohérence entre la configuration et la base de données
   */
  async validatePricingData(): Promise<{
    isValid: boolean;
    missingPlans: string[];
    missingPackages: string[];
    inconsistencies: Array<{
      type: 'plan' | 'package';
      id: string;
      issue: string;
    }>;
  }> {
    const result = {
      isValid: true,
      missingPlans: [] as string[],
      missingPackages: [] as string[],
      inconsistencies: [] as Array<{
        type: 'plan' | 'package';
        id: string;
        issue: string;
      }>
    };

    // Vérifier les plans
    for (const configPlan of SUBSCRIPTION_PLANS) {
      const dbPlan = await this.subscriptionPlanRepository.findOne({
        where: { id: configPlan.id }
      });

      if (!dbPlan) {
        result.missingPlans.push(configPlan.id);
        result.isValid = false;
      } else {
        // Vérifier la cohérence des prix
        if (Math.abs(dbPlan.priceUSD - configPlan.monthlyPriceUSD) > 0.01) {
          result.inconsistencies.push({
            type: 'plan',
            id: configPlan.id,
            issue: `Price mismatch: DB=${dbPlan.priceUSD}, Config=${configPlan.monthlyPriceUSD}`
          });
          result.isValid = false;
        }
      }
    }

    // Vérifier les packages
    for (const configPackage of TOKEN_PURCHASE_PACKAGES) {
      const dbPackage = await this.tokenPackageRepository.findOne({
        where: { id: configPackage.id }
      });

      if (!dbPackage) {
        result.missingPackages.push(configPackage.id);
        result.isValid = false;
      } else {
        // Vérifier la cohérence des prix
        if (Math.abs(dbPackage.priceUSD - configPackage.priceUSD) > 0.01) {
          result.inconsistencies.push({
            type: 'package',
            id: configPackage.id,
            issue: `Price mismatch: DB=${dbPackage.priceUSD}, Config=${configPackage.priceUSD}`
          });
          result.isValid = false;
        }
      }
    }

    return result;
  }

  /**
   * Génère un rapport de différences entre la configuration et la base de données
   */
  async generateSyncReport(): Promise<{
    plansToUpdate: string[];
    plansToCreate: string[];
    plansToDeactivate: string[];
    packagesToUpdate: string[];
    packagesToCreate: string[];
    packagesToDeactivate: string[];
  }> {
    const report = {
      plansToUpdate: [] as string[],
      plansToCreate: [] as string[],
      plansToDeactivate: [] as string[],
      packagesToUpdate: [] as string[],
      packagesToCreate: [] as string[],
      packagesToDeactivate: [] as string[]
    };

    // Analyser les plans
    const configPlanIds = SUBSCRIPTION_PLANS.map(plan => plan.id);
    const dbPlans = await this.subscriptionPlanRepository.find();
    const dbPlanIds = dbPlans.map(plan => plan.id);

    for (const configPlan of SUBSCRIPTION_PLANS) {
      if (dbPlanIds.includes(configPlan.id)) {
        report.plansToUpdate.push(configPlan.id);
      } else {
        report.plansToCreate.push(configPlan.id);
      }
    }

    for (const dbPlan of dbPlans) {
      if (!configPlanIds.includes(dbPlan.id)) {
        report.plansToDeactivate.push(dbPlan.id);
      }
    }

    // Analyser les packages
    const configPackageIds = TOKEN_PURCHASE_PACKAGES.map(pkg => pkg.id);
    const dbPackages = await this.tokenPackageRepository.find();
    const dbPackageIds = dbPackages.map(pkg => pkg.id);

    for (const configPackage of TOKEN_PURCHASE_PACKAGES) {
      if (dbPackageIds.includes(configPackage.id)) {
        report.packagesToUpdate.push(configPackage.id);
      } else {
        report.packagesToCreate.push(configPackage.id);
      }
    }

    for (const dbPackage of dbPackages) {
      if (!configPackageIds.includes(dbPackage.id)) {
        report.packagesToDeactivate.push(dbPackage.id);
      }
    }

    return report;
  }
}
