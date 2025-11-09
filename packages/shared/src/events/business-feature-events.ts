import { BusinessFeature } from '../enums/business-features.enum';

/**
 * Événements Kafka pour la communication inter-services
 * concernant les fonctionnalités métier et leurs restrictions
 */

// === ÉVÉNEMENTS DE CONSOMMATION ===

/**
 * Événement publié par un service métier avant de consommer une fonctionnalité
 * Permet la vérification centralisée des limites
 */
export interface FeatureAccessRequestEvent {
  requestId: string;
  customerId: string;
  userId?: string;
  feature: BusinessFeature;
  requestedAmount: number;
  serviceName: string; // accounting-service, gestion-commerciale-service, etc.
  actionType: string; // create, update, calculate, export, etc.
  resourceType?: string; // journal-entry, invoice, credit-score, etc.
  timestamp: string;
  
  // Contexte spécifique à la demande
  context?: {
    [key: string]: any;
  };
  
  // Topic de réponse pour la décision
  responseTopicSuffix?: string;
  
  metadata: {
    correlationId: string;
    timeout: number; // en millisecondes
    priority: 'low' | 'normal' | 'high';
  };
}

/**
 * Réponse à une demande d'accès à une fonctionnalité
 */
export interface FeatureAccessResponseEvent {
  requestId: string;
  customerId: string;
  feature: BusinessFeature;
  decision: 'approved' | 'denied' | 'upgrade_required';
  
  // Informations sur les limites
  limits: {
    currentUsage: number;
    limitValue: number; // -1 pour illimité
    remainingUsage: number;
    usagePercentage: number;
    resetDate?: string;
  };
  
  // En cas de refus
  denialReason?: string;
  suggestedPlanId?: string;
  upgradeUrl?: string;
  
  // En cas d'approbation
  consumptionToken?: string; // Token pour confirmer la consommation
  
  timestamp: string;
  
  metadata: {
    correlationId: string;
    processingTimeMs: number;
  };
}

/**
 * Événement pour confirmer la consommation effective d'une fonctionnalité
 * Publié par le service métier après l'action réussie
 */
export interface FeatureConsumptionEvent {
  consumptionId: string;
  requestId?: string; // Lien avec la demande initiale
  customerId: string;
  userId?: string;
  feature: BusinessFeature;
  consumedAmount: number;
  serviceName: string;
  actionType: string;
  resourceId?: string; // ID de la ressource créée/modifiée
  
  success: boolean;
  errorMessage?: string;
  
  // Détails de la consommation
  consumptionDetails: {
    [key: string]: any;
  };
  
  timestamp: string;
  
  metadata: {
    correlationId: string;
    consumptionToken?: string;
  };
}

// === ÉVÉNEMENTS DE GESTION DES ABONNEMENTS ===

/**
 * Événement publié lors du changement de plan d'un client
 */
export interface SubscriptionPlanChangedEvent {
  customerId: string;
  subscriptionId: string;
  
  previousPlan: {
    planId: string;
    planName: string;
    featureLimits: Record<BusinessFeature, number>;
  };
  
  newPlan: {
    planId: string;
    planName: string;
    featureLimits: Record<BusinessFeature, number>;
  };
  
  changeType: 'upgrade' | 'downgrade' | 'lateral';
  changeReason: 'user_request' | 'auto_upgrade' | 'admin_action' | 'payment_failed';
  
  effectiveDate: string;
  
  // Réinitialisation des compteurs ?
  resetUsageCounters: boolean;
  
  timestamp: string;
  
  metadata: {
    correlationId: string;
    triggeredBy: string; // userId ou 'system'
  };
}

/**
 * Événement publié lors de l'approche ou dépassement d'une limite
 */
export interface FeatureLimitAlertEvent {
  alertId: string;
  customerId: string;
  feature: BusinessFeature;
  alertType: 'warning' | 'limit_reached' | 'limit_exceeded' | 'upgrade_suggested';
  
  limits: {
    currentUsage: number;
    limitValue: number;
    usagePercentage: number;
    warningThreshold: number;
  };
  
  message: string;
  suggestedPlanId?: string;
  
  // Actions automatiques déclenchées
  actions: {
    notificationSent: boolean;
    upgradePromptShown: boolean;
    serviceRestricted: boolean;
  };
  
  timestamp: string;
  
  metadata: {
    correlationId: string;
    severity: 'info' | 'warning' | 'critical';
  };
}

// === ÉVÉNEMENTS D'ADMINISTRATION ===

/**
 * Événement pour synchroniser les plans entre Admin et Customer Service
 */
export interface SubscriptionPlanSyncEvent {
  planId: string;
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate';
  
  planData?: {
    name: string;
    description: string;
    customerType: 'sme' | 'financial_institution';
    monthlyPriceUSD: number;
    annualPriceUSD: number;
    featureLimits: {
      [key in BusinessFeature]?: {
        enabled: boolean;
        limit: number;
        periodType: 'daily' | 'monthly' | 'yearly';
        description?: string;
      };
    };
    isActive: boolean;
    metadata?: Record<string, any>;
  };
  
  timestamp: string;
  
  metadata: {
    correlationId: string;
    triggeredBy: string; // Admin user ID
    version: number;
  };
}

/**
 * Événement pour les ajustements manuels par les admins
 */
export interface FeatureLimitAdjustmentEvent {
  adjustmentId: string;
  customerId: string;
  feature: BusinessFeature;
  adjustmentType: 'increase_limit' | 'reset_usage' | 'add_bonus' | 'temporary_unlock';
  
  previousValue: number;
  newValue: number;
  reason: string;
  
  // Pour les ajustements temporaires
  expiresAt?: string;
  
  timestamp: string;
  
  metadata: {
    correlationId: string;
    adminUserId: string;
    approved: boolean;
  };
}

// === ÉVÉNEMENTS ANALYTIQUES ===

/**
 * Événement agrégé pour l'analyse des usages
 */
export interface FeatureUsageAnalyticsEvent {
  customerId: string;
  feature: BusinessFeature;
  period: string; // YYYY-MM-DD ou YYYY-MM
  periodType: 'daily' | 'monthly';
  
  usage: {
    totalConsumption: number;
    uniqueUsers: number;
    averagePerUser: number;
    peakUsage: number;
    peakTime: string;
  };
  
  limits: {
    limitValue: number;
    usagePercentage: number;
    daysUntilReset: number;
  };
  
  trends: {
    vsLastPeriod: number; // % de changement
    trendDirection: 'increasing' | 'decreasing' | 'stable';
  };
  
  timestamp: string;
  
  metadata: {
    correlationId: string;
    generatedBy: 'analytics-service';
  };
}

// === TOPICS KAFKA ===

export const KafkaTopics = {
  // Demandes d'accès aux fonctionnalités
  FEATURE_ACCESS_REQUEST: 'wanzo.feature.access.request',
  FEATURE_ACCESS_RESPONSE: 'wanzo.feature.access.response',
  
  // Consommation effective
  FEATURE_CONSUMPTION: 'wanzo.feature.consumption',
  
  // Gestion des abonnements
  SUBSCRIPTION_PLAN_CHANGED: 'wanzo.subscription.plan.changed',
  SUBSCRIPTION_PLAN_SYNC: 'wanzo.subscription.plan.sync',
  
  // Alertes et notifications
  FEATURE_LIMIT_ALERT: 'wanzo.feature.limit.alert',
  FEATURE_LIMIT_ADJUSTMENT: 'wanzo.feature.limit.adjustment',
  
  // Analytics
  FEATURE_USAGE_ANALYTICS: 'wanzo.feature.usage.analytics',
  
  // Topics spécialisés par service
  ACCOUNTING_FEATURE_REQUEST: 'wanzo.accounting.feature.request',
  GESTION_COMMERCIALE_FEATURE_REQUEST: 'wanzo.gestion-commerciale.feature.request',
  PORTFOLIO_FEATURE_REQUEST: 'wanzo.portfolio.feature.request',
  
} as const;

// === ROUTING KEYS ===

export const RoutingKeys = {
  // Par type de client
  SME: 'sme',
  FINANCIAL_INSTITUTION: 'financial_institution',
  
  // Par priorité
  HIGH_PRIORITY: 'high',
  NORMAL_PRIORITY: 'normal',
  LOW_PRIORITY: 'low',
  
  // Par type d'action
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  CALCULATE: 'calculate',
  EXPORT: 'export',
  
  // Par service
  ACCOUNTING: 'accounting',
  GESTION_COMMERCIALE: 'gestion-commerciale',
  PORTFOLIO: 'portfolio',
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  
} as const;

// === UTILITAIRES ===

/**
 * Helper pour créer des événements avec métadonnées standardisées
 */
export class EventFactory {
  static createFeatureAccessRequest(
    customerId: string,
    feature: BusinessFeature,
    requestedAmount: number,
    serviceName: string,
    actionType: string,
    context?: any
  ): FeatureAccessRequestEvent {
    return {
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      feature,
      requestedAmount,
      serviceName,
      actionType,
      timestamp: new Date().toISOString(),
      context,
      metadata: {
        correlationId: `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timeout: 30000, // 30 secondes par défaut
        priority: 'normal'
      }
    };
  }
  
  static createFeatureConsumption(
    customerId: string,
    feature: BusinessFeature,
    consumedAmount: number,
    serviceName: string,
    actionType: string,
    success: boolean,
    consumptionDetails: any,
    resourceId?: string
  ): FeatureConsumptionEvent {
    return {
      consumptionId: `cons_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      feature,
      consumedAmount,
      serviceName,
      actionType,
      resourceId,
      success,
      consumptionDetails,
      timestamp: new Date().toISOString(),
      metadata: {
        correlationId: `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    };
  }
}

// === VALIDATION SCHEMAS ===

/**
 * Schémas de validation pour les événements Kafka
 */
export const EventSchemas = {
  FEATURE_ACCESS_REQUEST: {
    type: 'object',
    required: ['requestId', 'customerId', 'feature', 'requestedAmount', 'serviceName'],
    properties: {
      requestId: { type: 'string' },
      customerId: { type: 'string' },
      feature: { type: 'string', enum: Object.values(BusinessFeature) },
      requestedAmount: { type: 'number', minimum: 1 },
      serviceName: { type: 'string' },
      actionType: { type: 'string' },
      timestamp: { type: 'string', format: 'date-time' }
    }
  },
  
  FEATURE_CONSUMPTION: {
    type: 'object',
    required: ['consumptionId', 'customerId', 'feature', 'consumedAmount', 'serviceName', 'success'],
    properties: {
      consumptionId: { type: 'string' },
      customerId: { type: 'string' },
      feature: { type: 'string', enum: Object.values(BusinessFeature) },
      consumedAmount: { type: 'number', minimum: 0 },
      serviceName: { type: 'string' },
      success: { type: 'boolean' },
      timestamp: { type: 'string', format: 'date-time' }
    }
  }
  
  // Autres schémas selon les besoins...
} as const;