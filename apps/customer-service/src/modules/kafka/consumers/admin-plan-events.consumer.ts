import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SubscriptionPlan } from '../../subscriptions/entities/subscription.entity';

export interface PlanCreatedEvent {
  eventId: string;
  timestamp: string;
  eventType: 'subscription.plan.created';
  data: {
    planId: string;
    name: string;
    description?: string;
    planType: 'basic' | 'standard' | 'premium' | 'enterprise' | 'custom';
    customerType: 'pme' | 'financial';
    status: 'draft' | 'deployed' | 'archived';
    pricing: {
      amount: number;
      currency: string;
      billingCycle: 'monthly' | 'annually' | 'quarterly' | 'biennially' | 'one_time';
    };
    tokens: {
      baseAllocation: number;
      overageRate: number;
      maxOverage: number;
    };
    features: string[];
    version: number;
    effectiveDate?: string;
    expiryDate?: string;
  };
}

export interface PlanUpdatedEvent {
  eventId: string;
  timestamp: string;
  eventType: 'subscription.plan.updated';
  data: {
    planId: string;
    version: number;
    previousVersion: number;
    changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
    }>;
    updatedFields: string[];
    changeReason?: string;
  };
}

export interface PlanDeployedEvent {
  eventId: string;
  timestamp: string;
  eventType: 'subscription.plan.deployed';
  data: {
    planId: string;
    name: string;
    version: number;
    deployedAt: string;
    effectiveDate: string;
    previousStatus: 'draft' | 'archived';
    migrationRequired: boolean;
    affectedCustomers?: number;
  };
}

export interface PlanArchivedEvent {
  eventId: string;
  timestamp: string;
  eventType: 'subscription.plan.archived';
  data: {
    planId: string;
    name: string;
    version: number;
    archivedAt: string;
    reason: string;
    activeSubscriptions: number;
    migrationPlanId?: string;
    gracePeriodEnd?: string;
  };
}

export interface PlanRestoredEvent {
  eventId: string;
  timestamp: string;
  eventType: 'subscription.plan.restored';
  data: {
    planId: string;
    name: string;
    version: number;
    restoredAt: string;
    reason: string;
    newStatus: 'draft' | 'deployed';
    restoredBy: string;
  };
}

@Injectable()
export class AdminPlanEventsConsumer {
  private readonly logger = new Logger(AdminPlanEventsConsumer.name);

  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,
  ) {}

  @EventPattern('subscription.plan.created')
  async handlePlanCreated(@Payload() message: any) {
    try {
      this.logger.log('Handling plan created event', message.value);
      const event: PlanCreatedEvent = JSON.parse(message.value);

      // Vérifier si le plan existe déjà
      const existingPlan = await this.subscriptionPlanRepository.findOne({
        where: { configId: event.data.planId }
      });

      if (existingPlan) {
        this.logger.warn(`Plan ${event.data.planId} already exists, skipping creation`);
        return;
      }

      // Créer le nouveau plan
      const newPlan = this.subscriptionPlanRepository.create({
        configId: event.data.planId,
        name: event.data.name,
        description: event.data.description || '',
        customerType: event.data.customerType === 'pme' ? 'sme' : 'financial_institution',
        type: this.mapBillingCycleToType(event.data.pricing.billingCycle),
        tier: this.mapPlanTypeToTier(event.data.planType),
        priceUSD: event.data.pricing.amount,
        currency: event.data.pricing.currency,
        durationDays: this.getDurationDays(event.data.pricing.billingCycle),
        includedTokens: event.data.tokens.baseAllocation,
        tokenConfig: {
          monthlyTokens: event.data.tokens.baseAllocation,
          rolloverAllowed: true,
          maxRolloverMonths: 3,
          rolloverLimit: Math.floor(event.data.tokens.baseAllocation * 0.5),
          tokenRates: {
            creditAnalysis: 100,
            riskAssessment: 150,
            financialReporting: 200,
            complianceCheck: 80,
            marketAnalysis: 120,
            predictiveModeling: 250
          }
        },
        features: this.mapFeaturesToPlanFeatures(event.data.features),
        limits: this.getDefaultLimits(event.data.planType),
        tokenAllocation: {
          monthlyTokens: event.data.tokens.baseAllocation,
          tokenRollover: true,
          maxRolloverMonths: 3
        },
        isActive: event.data.status === 'deployed',
        isVisible: event.data.status === 'deployed',
        sortOrder: this.getSortOrder(event.data.planType),
        tags: this.getTags(event.data.planType, event.data.customerType),
        metadata: {
          adminServicePlanId: event.data.planId,
          version: event.data.version,
          createdFromEvent: true,
          eventId: event.eventId
        }
      });

      await this.subscriptionPlanRepository.save(newPlan);
      this.logger.log(`Successfully created plan ${event.data.planId} from admin service event`);

    } catch (error) {
      this.logger.error('Error handling plan created event', error);
    }
  }

  @EventPattern('subscription.plan.updated')
  async handlePlanUpdated(@Payload() message: any) {
    try {
      this.logger.log('Handling plan updated event', message.value);
      const event: PlanUpdatedEvent = JSON.parse(message.value);

      const plan = await this.subscriptionPlanRepository.findOne({
        where: { configId: event.data.planId }
      });

      if (!plan) {
        this.logger.warn(`Plan ${event.data.planId} not found for update`);
        return;
      }

      // Mettre à jour les métadonnées pour suivre la version
      plan.metadata = {
        ...plan.metadata,
        version: event.data.version,
        previousVersion: event.data.previousVersion,
        lastUpdatedFromEvent: true,
        lastUpdateEventId: event.eventId,
        changes: event.data.changes
      };

      await this.subscriptionPlanRepository.save(plan);
      this.logger.log(`Successfully updated plan ${event.data.planId} metadata`);

    } catch (error) {
      this.logger.error('Error handling plan updated event', error);
    }
  }

  @EventPattern('subscription.plan.deployed')
  async handlePlanDeployed(@Payload() message: any) {
    try {
      this.logger.log('Handling plan deployed event', message.value);
      const event: PlanDeployedEvent = JSON.parse(message.value);

      const plan = await this.subscriptionPlanRepository.findOne({
        where: { configId: event.data.planId }
      });

      if (!plan) {
        this.logger.warn(`Plan ${event.data.planId} not found for deployment`);
        return;
      }

      // Activer le plan pour les clients
      plan.isActive = true;
      plan.isVisible = true;
      plan.metadata = {
        ...plan.metadata,
        deployedAt: event.data.deployedAt,
        effectiveDate: event.data.effectiveDate,
        version: event.data.version
      };

      await this.subscriptionPlanRepository.save(plan);
      this.logger.log(`Successfully deployed plan ${event.data.planId}`);

    } catch (error) {
      this.logger.error('Error handling plan deployed event', error);
    }
  }

  @EventPattern('subscription.plan.archived')
  async handlePlanArchived(@Payload() message: any) {
    try {
      this.logger.log('Handling plan archived event', message.value);
      const event: PlanArchivedEvent = JSON.parse(message.value);

      const plan = await this.subscriptionPlanRepository.findOne({
        where: { configId: event.data.planId }
      });

      if (!plan) {
        this.logger.warn(`Plan ${event.data.planId} not found for archival`);
        return;
      }

      // Désactiver le plan (mais ne pas le supprimer pour préserver les abonnements existants)
      plan.isActive = false;
      plan.isVisible = false;
      plan.metadata = {
        ...plan.metadata,
        archivedAt: event.data.archivedAt,
        archivalReason: event.data.reason,
        activeSubscriptions: event.data.activeSubscriptions,
        migrationPlanId: event.data.migrationPlanId,
        gracePeriodEnd: event.data.gracePeriodEnd
      };

      await this.subscriptionPlanRepository.save(plan);
      this.logger.log(`Successfully archived plan ${event.data.planId}`);

      // TODO: Notifier les clients ayant ce plan qu'il sera bientôt discontinué
      if (event.data.activeSubscriptions > 0) {
        this.logger.log(`Plan ${event.data.planId} has ${event.data.activeSubscriptions} active subscriptions that need migration`);
        // Ici on pourrait émettre un événement pour notifier les clients
      }

    } catch (error) {
      this.logger.error('Error handling plan archived event', error);
    }
  }

  @EventPattern('subscription.plan.restored')
  async handlePlanRestored(@Payload() message: any) {
    try {
      this.logger.log('Handling plan restored event', message.value);
      const event: PlanRestoredEvent = JSON.parse(message.value);

      const plan = await this.subscriptionPlanRepository.findOne({
        where: { configId: event.data.planId }
      });

      if (!plan) {
        this.logger.warn(`Plan ${event.data.planId} not found for restoration`);
        return;
      }

      // Restaurer le plan selon son nouveau statut
      plan.isActive = event.data.newStatus === 'deployed';
      plan.isVisible = event.data.newStatus === 'deployed';
      plan.metadata = {
        ...plan.metadata,
        restoredAt: event.data.restoredAt,
        restorationReason: event.data.reason,
        restoredBy: event.data.restoredBy,
        newStatus: event.data.newStatus,
        version: event.data.version
      };

      await this.subscriptionPlanRepository.save(plan);
      this.logger.log(`Successfully restored plan ${event.data.planId} with status ${event.data.newStatus}`);

    } catch (error) {
      this.logger.error('Error handling plan restored event', error);
    }
  }

  // Méthodes utilitaires privées

  private mapBillingCycleToType(billingCycle: string): any {
    switch (billingCycle) {
      case 'monthly':
        return 'MONTHLY';
      case 'quarterly':
        return 'QUARTERLY';
      case 'annually':
        return 'ANNUAL';
      case 'one_time':
        return 'ONE_TIME';
      default:
        return 'MONTHLY';
    }
  }

  private mapPlanTypeToTier(planType: string): any {
    switch (planType) {
      case 'basic':
        return 'BASIC';
      case 'standard':
        return 'STANDARD';
      case 'premium':
        return 'PREMIUM';
      case 'enterprise':
        return 'ENTERPRISE';
      case 'custom':
        return 'CUSTOM';
      default:
        return 'STANDARD';
    }
  }

  private getDurationDays(billingCycle: string): number {
    switch (billingCycle) {
      case 'monthly':
        return 30;
      case 'quarterly':
        return 90;
      case 'annually':
        return 365;
      case 'biennially':
        return 730;
      case 'one_time':
        return 0;
      default:
        return 30;
    }
  }

  private mapFeaturesToPlanFeatures(features: string[]): any {
    const featureMap = {
      'BASIC_SUPPORT': 'basicSupport',
      'PRIORITY_SUPPORT': 'prioritySupport',
      'DEDICATED_MANAGER': 'dedicatedAccountManager',
      'API_ACCESS': 'apiAccess',
      'BASIC_ANALYTICS': 'basicAnalytics',
      'ADVANCED_ANALYTICS': 'advancedAnalytics',
      'CUSTOM_REPORTS': 'customReporting',
      'REAL_TIME_DASHBOARD': 'realTimeDashboard',
      'DATA_EXPORT': 'dataExport',
      'WEBHOOK_INTEGRATION': 'webhookIntegration',
      'THIRD_PARTY_INTEGRATIONS': 'customIntegrations',
      'AUTOMATED_WORKFLOWS': 'automatedWorkflows',
      'BULK_OPERATIONS': 'bulkOperations',
      'WHITE_LABEL': 'whiteLabeling',
      'MULTI_TENANT': 'multiUserAccess',
      'ADVANCED_SECURITY': 'advancedSecurity',
      'SLA_GUARANTEE': 'slaGuarantee',
      'COMPLIANCE_TOOLS': 'complianceTools',
      'AUDIT_TRAIL': 'auditTrail',
      'AI_INSIGHTS': 'aiInsights',
      'PREDICTIVE_ANALYTICS': 'predictiveAnalytics',
      'RISK_ASSESSMENT': 'riskAssessment',
      'FRAUD_DETECTION': 'fraudDetection',
      'UNLIMITED_USERS': 'unlimitedUsers',
      'CUSTOM_INTEGRATIONS': 'customIntegrations'
    };

    const planFeatures: any = {
      apiAccess: false,
      advancedAnalytics: false,
      customReporting: false,
      prioritySupport: false,
      multiUserAccess: false,
      dataExport: true, // Par défaut activé
      customIntegrations: false,
      whiteLabeling: false,
      dedicatedAccountManager: false
    };

    features.forEach(feature => {
      const mappedFeature = featureMap[feature as keyof typeof featureMap];
      if (mappedFeature) {
        planFeatures[mappedFeature] = true;
      }
    });

    return planFeatures;
  }

  private getDefaultLimits(planType: string): any {
    const baseLimits = {
      maxUsers: 1,
      maxAPICallsPerDay: 1000,
      maxDataStorageGB: 1,
      maxReportsPerMonth: 10,
      maxCustomFields: 5,
      maxIntegrations: 1
    };

    switch (planType) {
      case 'basic':
        return baseLimits;
      case 'standard':
        return {
          ...baseLimits,
          maxUsers: 5,
          maxAPICallsPerDay: 5000,
          maxDataStorageGB: 5,
          maxReportsPerMonth: 50,
          maxCustomFields: 20,
          maxIntegrations: 3
        };
      case 'premium':
        return {
          ...baseLimits,
          maxUsers: 20,
          maxAPICallsPerDay: 20000,
          maxDataStorageGB: 20,
          maxReportsPerMonth: 200,
          maxCustomFields: 100,
          maxIntegrations: 10
        };
      case 'enterprise':
        return {
          ...baseLimits,
          maxUsers: -1, // Illimité
          maxAPICallsPerDay: -1,
          maxDataStorageGB: -1,
          maxReportsPerMonth: -1,
          maxCustomFields: -1,
          maxIntegrations: -1
        };
      default:
        return baseLimits;
    }
  }

  private getSortOrder(planType: string): number {
    switch (planType) {
      case 'basic':
        return 1;
      case 'standard':
        return 2;
      case 'premium':
        return 3;
      case 'enterprise':
        return 4;
      case 'custom':
        return 5;
      default:
        return 0;
    }
  }

  private getTags(planType: string, customerType: string): string[] {
    const tags = [customerType];
    
    switch (planType) {
      case 'basic':
        tags.push('starter', 'économique');
        break;
      case 'standard':
        tags.push('populaire', 'recommandé');
        break;
      case 'premium':
        tags.push('avancé', 'complet');
        break;
      case 'enterprise':
        tags.push('entreprise', 'illimité');
        break;
      case 'custom':
        tags.push('personnalisé', 'sur-mesure');
        break;
    }

    return tags;
  }
}