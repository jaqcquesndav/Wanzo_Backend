import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from 'eventemitter2';
import { 
  BusinessFeature, 
  BusinessFeaturesMetadata,
  FeatureAccessRequestEvent, 
  FeatureAccessResponseEvent, 
  FeatureConsumptionEvent,
  FeatureLimitAlertEvent,
  KafkaTopics,
  EventFactory 
} from '@wanzobe/shared';
import { 
  BusinessFeatureUsage, 
  CustomerFeatureLimit, 
  FeatureConsumptionLog, 
  FeatureLimitAlert,
  SubscriptionPlanCache 
} from '../entities/business-feature-tracking.entity';
import { Subscription } from '../entities/subscription.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';

export interface AccessCheckResult {
  allowed: boolean;
  feature: BusinessFeature;
  currentUsage: number;
  limitValue: number;
  remainingUsage: number;
  usagePercentage: number;
  resetDate?: Date;
  
  // En cas de refus
  denialReason?: string;
  suggestedPlanId?: string;
  upgradeUrl?: string;
  
  // Token pour confirmer la consommation
  consumptionToken?: string;
}

export interface ConsumptionRequest {
  customerId: string;
  userId?: string;
  feature: BusinessFeature;
  amount: number;
  serviceName: string;
  actionType: string;
  resourceId?: string;
  context?: Record<string, any>;
  consumptionToken?: string; // Pour vérifier l'autorisation préalable
}

export interface ConsumptionResult {
  success: boolean;
  consumptionId?: string;
  errorMessage?: string;
  newUsage: number;
  remainingUsage: number;
}

/**
 * Service centralisé pour le contrôle d'accès aux fonctionnalités métier
 * Point unique de vérification et de consommation des limites d'abonnement
 */
@Injectable()
export class AccessControlService {
  private readonly logger = new Logger(AccessControlService.name);
  private readonly consumptionTokens = new Map<string, { customerId: string; feature: BusinessFeature; amount: number; expiresAt: Date }>();

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    
    @InjectRepository(BusinessFeatureUsage)
    private readonly usageRepository: Repository<BusinessFeatureUsage>,
    
    @InjectRepository(CustomerFeatureLimit)
    private readonly featureLimitRepository: Repository<CustomerFeatureLimit>,
    
    @InjectRepository(FeatureConsumptionLog)
    private readonly consumptionLogRepository: Repository<FeatureConsumptionLog>,
    
    @InjectRepository(FeatureLimitAlert)
    private readonly alertRepository: Repository<FeatureLimitAlert>,
    
    @InjectRepository(SubscriptionPlanCache)
    private readonly planCacheRepository: Repository<SubscriptionPlanCache>,
    
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    
    private readonly customerEventsProducer: CustomerEventsProducer,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Nettoyage périodique des tokens expirés
    setInterval(() => this.cleanupExpiredTokens(), 60000); // Chaque minute
  }

  /**
   * Vérifie si un client a accès à une fonctionnalité
   * Point d'entrée principal pour les vérifications d'accès
   */
  async checkAccess(
    customerId: string,
    feature: BusinessFeature,
    requestedAmount: number = 1,
    userId?: string
  ): Promise<AccessCheckResult> {
    try {
      this.logger.debug(`Checking access for customer ${customerId}, feature ${feature}, amount ${requestedAmount}`);

      // 1. Récupérer les limites actuelles du client
      const featureLimit = await this.getCustomerFeatureLimit(customerId, feature);
      
      if (!featureLimit) {
        return this.createDeniedResult(
          feature, 
          0, 
          0, 
          'No active subscription or feature not available in current plan'
        );
      }

      // 2. Vérifier si la fonctionnalité est activée
      if (!featureLimit.isActive) {
        return this.createDeniedResult(
          feature,
          featureLimit.currentUsage,
          featureLimit.limitValue,
          'Feature is disabled in current plan'
        );
      }

      // 3. Vérifier les limites (sauf si illimité)
      if (featureLimit.limitValue !== -1) {
        const projectedUsage = featureLimit.currentUsage + requestedAmount;
        
        if (projectedUsage > featureLimit.limitValue) {
          // Déclencher une alerte si nécessaire
          await this.handleLimitExceeded(customerId, feature, featureLimit);
          
          return this.createDeniedResult(
            feature,
            featureLimit.currentUsage,
            featureLimit.limitValue,
            `Feature limit exceeded. Requested: ${requestedAmount}, Available: ${featureLimit.remainingUsage}`,
            await this.suggestUpgrade(customerId, feature)
          );
        }

        // 4. Vérifier les seuils d'alerte
        const newUsagePercentage = (projectedUsage / featureLimit.limitValue) * 100;
        if (newUsagePercentage >= featureLimit.warningThreshold && !featureLimit.warningSent) {
          await this.handleWarningThreshold(customerId, feature, featureLimit, newUsagePercentage);
        }
      }

      // 5. Générer un token de consommation
      const consumptionToken = this.generateConsumptionToken(customerId, feature, requestedAmount);

      return {
        allowed: true,
        feature,
        currentUsage: featureLimit.currentUsage,
        limitValue: featureLimit.limitValue,
        remainingUsage: featureLimit.remainingUsage - requestedAmount,
        usagePercentage: featureLimit.limitValue === -1 ? 0 : 
          ((featureLimit.currentUsage + requestedAmount) / featureLimit.limitValue) * 100,
        resetDate: featureLimit.resetAt,
        consumptionToken
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(`Error checking access: ${errorMessage}`, errorStack);
      return this.createDeniedResult(feature, 0, 0, 'Internal error during access check');
    }
  }

  /**
   * Consomme effectivement une fonctionnalité après vérification
   */
  async consumeFeature(request: ConsumptionRequest): Promise<ConsumptionResult> {
    try {
      this.logger.debug(`Consuming feature ${request.feature} for customer ${request.customerId}`);

      // 1. Vérifier le token de consommation si fourni
      if (request.consumptionToken) {
        const tokenData = this.consumptionTokens.get(request.consumptionToken);
        if (!tokenData || 
            tokenData.customerId !== request.customerId || 
            tokenData.feature !== request.feature ||
            tokenData.amount !== request.amount ||
            tokenData.expiresAt < new Date()) {
          return {
            success: false,
            errorMessage: 'Invalid or expired consumption token',
            newUsage: 0,
            remainingUsage: 0
          };
        }
        // Consommer le token
        this.consumptionTokens.delete(request.consumptionToken);
      } else {
        // Si pas de token, faire une nouvelle vérification
        const accessCheck = await this.checkAccess(request.customerId, request.feature, request.amount, request.userId);
        if (!accessCheck.allowed) {
          return {
            success: false,
            errorMessage: accessCheck.denialReason || 'Access denied',
            newUsage: accessCheck.currentUsage,
            remainingUsage: accessCheck.remainingUsage
          };
        }
      }

      // 2. Mettre à jour les compteurs de manière atomique
      const result = await this.updateFeatureUsage(request.customerId, request.feature, request.amount);

      // 3. Enregistrer dans le log de consommation
      const consumptionLog = await this.logConsumption(request, result.success);

      // 4. Publier l'événement de consommation
      await this.publishConsumptionEvent(request, consumptionLog, result.success);

      return {
        success: result.success,
        consumptionId: consumptionLog.id,
        newUsage: result.newUsage,
        remainingUsage: result.remainingUsage,
        errorMessage: result.success ? undefined : 'Failed to update usage counters'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(`Error consuming feature: ${errorMessage}`, errorStack);
      
      // Enregistrer l'échec
      await this.logConsumption(request, false, errorMessage);

      return {
        success: false,
        errorMessage: 'Internal error during feature consumption',
        newUsage: 0,
        remainingUsage: 0
      };
    }
  }

  /**
   * Met à jour les limites d'un client lors d'un changement d'abonnement
   */
  async updateCustomerFeatureLimits(customerId: string, subscriptionId: string, planId: string): Promise<void> {
    try {
      this.logger.log(`Updating feature limits for customer ${customerId}, plan ${planId}`);

      // 1. Récupérer la configuration du plan
      const planCache = await this.planCacheRepository.findOne({ where: { planId } });
      if (!planCache) {
        throw new Error(`Plan cache not found for plan ${planId}`);
      }

      // 2. Désactiver les anciennes limites
      await this.featureLimitRepository.update(
        { customerId, isActive: true },
        { isActive: false }
      );

      // 3. Créer les nouvelles limites
      const featureLimits: CustomerFeatureLimit[] = [];
      const currentPeriod = this.getCurrentPeriod('monthly');

      for (const [feature, config] of Object.entries(planCache.featureLimits)) {
        if (config.enabled) {
          const resetAt = this.calculateResetDate(config.periodType);
          
          const featureLimit = this.featureLimitRepository.create({
            customerId,
            subscriptionId,
            feature: feature as BusinessFeature,
            limitValue: config.limit,
            currentUsage: 0, // Réinitialiser l'usage
            usagePeriod: currentPeriod,
            periodType: config.periodType,
            resetAt,
            isActive: true,
            warningThreshold: 80, // 80% par défaut
            warningSent: false
          });

          featureLimits.push(featureLimit);
        }
      }

      await this.featureLimitRepository.save(featureLimits);

      this.logger.log(`Updated ${featureLimits.length} feature limits for customer ${customerId}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(`Error updating customer feature limits: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Récupère les statistiques d'usage pour un client
   */
  async getUsageStatistics(customerId: string, period?: string): Promise<any> {
    const usagePeriod = period || this.getCurrentPeriod('monthly');
    
    const usage = await this.usageRepository.find({
      where: { customerId, usagePeriod }
    });

    const limits = await this.featureLimitRepository.find({
      where: { customerId, isActive: true }
    });

    return {
      period: usagePeriod,
      features: limits.map(limit => ({
        feature: limit.feature,
        displayName: BusinessFeaturesMetadata[limit.feature]?.displayName || limit.feature,
        currentUsage: limit.currentUsage,
        limitValue: limit.limitValue,
        remainingUsage: limit.remainingUsage,
        usagePercentage: limit.usagePercentage,
        resetDate: limit.resetAt,
        isNearLimit: limit.isNearLimit,
        isOverLimit: limit.isOverLimit
      }))
    };
  }

  // === MÉTHODES PRIVÉES ===

  private async getCustomerFeatureLimit(customerId: string, feature: BusinessFeature): Promise<CustomerFeatureLimit | null> {
    return this.featureLimitRepository.findOne({
      where: { 
        customerId, 
        feature, 
        isActive: true 
      }
    });
  }

  private createDeniedResult(
    feature: BusinessFeature, 
    currentUsage: number, 
    limitValue: number, 
    reason: string,
    suggestedPlanId?: string
  ): AccessCheckResult {
    return {
      allowed: false,
      feature,
      currentUsage,
      limitValue,
      remainingUsage: Math.max(0, limitValue - currentUsage),
      usagePercentage: limitValue === 0 ? 100 : (currentUsage / limitValue) * 100,
      denialReason: reason,
      suggestedPlanId
    };
  }

  private generateConsumptionToken(customerId: string, feature: BusinessFeature, amount: number): string {
    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 300000); // 5 minutes

    this.consumptionTokens.set(token, {
      customerId,
      feature,
      amount,
      expiresAt
    });

    return token;
  }

  private cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [token, data] of this.consumptionTokens.entries()) {
      if (data.expiresAt < now) {
        this.consumptionTokens.delete(token);
      }
    }
  }

  private async updateFeatureUsage(customerId: string, feature: BusinessFeature, amount: number): Promise<{ success: boolean; newUsage: number; remainingUsage: number }> {
    // Utiliser une transaction pour assurer la cohérence
    return this.featureLimitRepository.manager.transaction(async manager => {
      const featureLimit = await manager.findOne(CustomerFeatureLimit, {
        where: { customerId, feature, isActive: true },
        lock: { mode: 'pessimistic_write' }
      });

      if (!featureLimit) {
        throw new Error('Feature limit not found');
      }

      // Mettre à jour l'usage
      featureLimit.currentUsage += amount;
      featureLimit.lastUsedAt = new Date();

      await manager.save(featureLimit);

      // Mettre à jour également l'usage périodique
      const currentPeriod = this.getCurrentPeriod(featureLimit.periodType);
      let featureUsage = await manager.findOne(BusinessFeatureUsage, {
        where: { customerId, feature, usagePeriod: currentPeriod }
      });

      if (!featureUsage) {
        featureUsage = manager.create(BusinessFeatureUsage, {
          customerId,
          feature,
          usageCount: amount,
          usagePeriod: currentPeriod,
          periodType: featureLimit.periodType,
          limitValue: featureLimit.limitValue,
          lastUsedAt: new Date()
        });
      } else {
        featureUsage.usageCount += amount;
        featureUsage.lastUsedAt = new Date();
      }

      await manager.save(featureUsage);

      return {
        success: true,
        newUsage: featureLimit.currentUsage,
        remainingUsage: featureLimit.remainingUsage
      };
    });
  }

  private async logConsumption(request: ConsumptionRequest, success: boolean, errorMessage?: string): Promise<FeatureConsumptionLog> {
    const log = this.consumptionLogRepository.create({
      customerId: request.customerId,
      userId: request.userId,
      feature: request.feature,
      consumptionAmount: request.amount,
      serviceName: request.serviceName,
      actionType: request.actionType,
      resourceId: request.resourceId,
      success,
      errorMessage,
      context: request.context,
      consumedAt: new Date()
    });

    return this.consumptionLogRepository.save(log);
  }

  private async publishConsumptionEvent(request: ConsumptionRequest, log: FeatureConsumptionLog, success: boolean): Promise<void> {
    const event = EventFactory.createFeatureConsumption(
      request.customerId,
      request.feature,
      request.amount,
      request.serviceName,
      request.actionType,
      success,
      request.context || {},
      request.resourceId
    );

    // Publier l'événement via EventEmitter local pour l'instant
    this.eventEmitter.emit('feature.consumption', event);
  }

  private getCurrentPeriod(periodType: string): string {
    const now = new Date();
    switch (periodType) {
      case 'daily':
        return now.toISOString().substring(0, 10); // YYYY-MM-DD
      case 'monthly':
        return now.toISOString().substring(0, 7); // YYYY-MM
      case 'yearly':
        return now.getFullYear().toString(); // YYYY
      default:
        return now.toISOString().substring(0, 7); // Par défaut mensuel
    }
  }

  private calculateResetDate(periodType: string): Date {
    const now = new Date();
    switch (periodType) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
      case 'yearly':
        return new Date(now.getFullYear() + 1, 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth() + 1, 1); // Par défaut mensuel
    }
  }

  private async handleLimitExceeded(customerId: string, feature: BusinessFeature, featureLimit: CustomerFeatureLimit): Promise<void> {
    // Créer une alerte
    const alert = this.alertRepository.create({
      customerId,
      feature,
      alertType: 'limit_exceeded',
      currentUsage: featureLimit.currentUsage,
      limitValue: featureLimit.limitValue,
      usagePercentage: featureLimit.usagePercentage,
      message: `Feature ${feature} limit exceeded`,
      suggestedPlanId: await this.suggestUpgrade(customerId, feature)
    });

    await this.alertRepository.save(alert);

    // Publier l'événement d'alerte
    const alertEvent: FeatureLimitAlertEvent = {
      alertId: alert.id,
      customerId,
      feature,
      alertType: 'limit_exceeded',
      limits: {
        currentUsage: featureLimit.currentUsage,
        limitValue: featureLimit.limitValue,
        usagePercentage: featureLimit.usagePercentage,
        warningThreshold: featureLimit.warningThreshold
      },
      message: alert.message,
      suggestedPlanId: alert.suggestedPlanId,
      actions: {
        notificationSent: false,
        upgradePromptShown: false,
        serviceRestricted: true
      },
      timestamp: new Date().toISOString(),
      metadata: {
        correlationId: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        severity: 'critical'
      }
    };

    // Publier l'événement via EventEmitter local pour l'instant
    this.eventEmitter.emit('feature.limit.alert', alertEvent);
  }

  private async handleWarningThreshold(customerId: string, feature: BusinessFeature, featureLimit: CustomerFeatureLimit, usagePercentage: number): Promise<void> {
    // Marquer l'alerte comme envoyée
    featureLimit.warningSent = true;
    await this.featureLimitRepository.save(featureLimit);

    // Créer une alerte de warning
    const alert = this.alertRepository.create({
      customerId,
      feature,
      alertType: 'warning',
      currentUsage: featureLimit.currentUsage,
      limitValue: featureLimit.limitValue,
      usagePercentage,
      message: `Feature ${feature} usage at ${Math.round(usagePercentage)}%`,
      suggestedPlanId: await this.suggestUpgrade(customerId, feature)
    });

    await this.alertRepository.save(alert);

    // Publier l'événement d'alerte
    const alertEvent: FeatureLimitAlertEvent = {
      alertId: alert.id,
      customerId,
      feature,
      alertType: 'warning',
      limits: {
        currentUsage: featureLimit.currentUsage,
        limitValue: featureLimit.limitValue,
        usagePercentage,
        warningThreshold: featureLimit.warningThreshold
      },
      message: alert.message,
      suggestedPlanId: alert.suggestedPlanId,
      actions: {
        notificationSent: true,
        upgradePromptShown: true,
        serviceRestricted: false
      },
      timestamp: new Date().toISOString(),
      metadata: {
        correlationId: `warning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        severity: 'warning'
      }
    };

    // Publier l'événement via EventEmitter local pour l'instant
    this.eventEmitter.emit('feature.limit.alert', alertEvent);
  }

  private async suggestUpgrade(customerId: string, feature: BusinessFeature): Promise<string | undefined> {
    // Logique pour suggérer un plan d'upgrade basé sur la fonctionnalité dépassée
    // Pour l'instant, on retourne null, mais on peut implémenter une logique plus sophistiquée
    return undefined;
  }

  /**
   * Réinitialise les compteurs de fonctionnalités pour un client
   */
  async resetFeatureCounters(
    customerId: string, 
    resetType: 'monthly' | 'manual' | 'upgrade',
    features?: BusinessFeature[]
  ): Promise<void> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
        relations: ['subscriptions']
      });

      if (!customer) {
        throw new Error(`Customer not found: ${customerId}`);
      }

      // Si aucune fonctionnalité spécifiée, réinitialiser toutes les fonctionnalités actives
      const featuresToReset = features || Object.values(BusinessFeature);

      // Réinitialiser les compteurs dans CustomerFeatureLimit
      for (const feature of featuresToReset) {
        const featureLimit = await this.featureLimitRepository.findOne({
          where: { customerId, feature }
        });
        
        if (featureLimit) {
          featureLimit.currentUsage = 0;
          featureLimit.lastUsedAt = new Date();
          await this.featureLimitRepository.save(featureLimit);
        }
      }

      this.logger.log(`Feature counters reset successfully`, {
        customerId,
        resetType,
        featuresCount: featuresToReset.length
      });

    } catch (error) {
      this.logger.error(`Error resetting feature counters for customer ${customerId}`, error);
      throw error;
    }
  }
}