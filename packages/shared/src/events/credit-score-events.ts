/**
 * Événements Kafka pour la diffusion des cotes crédit XGBoost
 * Communication inter-services : Accounting → Gestion Commerciale, Portfolio
 */

import { StandardCreditScore, DetailedCreditScore } from '../interfaces/credit-score.interface';

/**
 * Topics Kafka pour les événements de cote crédit
 */
export enum CreditScoreEventTopics {
  // Événements principaux
  CREDIT_SCORE_CALCULATED = 'credit-score.calculated',
  CREDIT_SCORE_UPDATED = 'credit-score.updated',
  CREDIT_SCORE_EXPIRED = 'credit-score.expired',
  
  // Monitoring temps réel
  CREDIT_SCORE_MONITORING_ALERT = 'credit-score.monitoring.alert',
  CREDIT_SCORE_HEALTH_CHANGED = 'credit-score.health.changed',
  
  // Demandes entre services
  CREDIT_SCORE_REQUEST = 'credit-score.request',
  CREDIT_SCORE_RESPONSE = 'credit-score.response'
}

/**
 * Événement principal : Nouvelle cote crédit calculée
 * Publié par : accounting-service
 * Consommé par : gestion_commerciale_service, portfolio-institution-service
 */
export interface CreditScoreCalculatedEvent {
  eventId: string;
  companyId: string;
  timestamp: string;
  
  // Score standardisé
  score: StandardCreditScore;
  
  // Détails complets (optionnel pour services externes)
  details?: DetailedCreditScore;
  
  // Métadonnées de l'événement
  metadata: {
    source: 'xgboost_ml_service';
    trigger: 'api_request' | 'scheduled_calculation' | 'data_change';
    requestedBy?: string;
    calculationDuration?: number;
  };
}

/**
 * Événement : Cote crédit mise à jour
 * Publié par : accounting-service
 * Consommé par : gestion_commerciale_service, portfolio-institution-service
 */
export interface CreditScoreUpdatedEvent {
  eventId: string;
  companyId: string;
  timestamp: string;
  
  // Ancienne et nouvelle cote
  previousScore: {
    score: number;
    riskLevel: string;
    calculatedAt: string;
  };
  
  newScore: StandardCreditScore;
  
  // Raison du changement
  updateReason: 'scheduled_recalculation' | 'data_update' | 'manual_recalculation';
  
  metadata: {
    source: 'xgboost_ml_service';
    changedBy?: string;
  };
}

/**
 * Événement : Cote crédit expirée
 * Publié par : accounting-service (tâche automatique)
 * Consommé par : gestion_commerciale_service, portfolio-institution-service
 */
export interface CreditScoreExpiredEvent {
  eventId: string;
  companyId: string;
  timestamp: string;
  
  // Score expiré
  expiredScore: {
    score: number;
    calculatedAt: string;
    validUntil: string;
  };
  
  // Indication si recalcul automatique prévu
  autoRecalculationScheduled: boolean;
  nextCalculationDate?: string;
  
  metadata: {
    source: 'automated_expiry_check';
  };
}

/**
 * Événement : Alerte de monitoring temps réel
 * Publié par : accounting-service (monitoring service)
 * Consommé par : gestion_commerciale_service, portfolio-institution-service, analytics-service
 */
export interface CreditScoreMonitoringAlertEvent {
  eventId: string;
  companyId: string;
  timestamp: string;
  
  // Type d'alerte
  alertType: 'score_drop' | 'health_deterioration' | 'volatility_high' | 'trend_negative';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Données de l'alerte
  alertData: {
    currentScore: number;
    previousScore: number;
    scoreDifference: number;
    threshold: number;
    interval: 'daily' | 'weekly' | 'monthly';
  };
  
  // Recommandations
  recommendations: string[];
  
  metadata: {
    source: 'real_time_monitoring';
    monitoringConfigId: string;
  };
}

/**
 * Événement : Changement de santé financière
 * Publié par : accounting-service (monitoring service)
 * Consommé par : gestion_commerciale_service, portfolio-institution-service
 */
export interface CreditScoreHealthChangedEvent {
  eventId: string;
  companyId: string;
  timestamp: string;
  
  // Changement de statut
  previousHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  newHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  
  // Données associées
  healthData: {
    currentScore: number;
    trend: 'improving' | 'stable' | 'declining';
    confidenceLevel: number;
    factorsInfluencing: string[];
  };
  
  metadata: {
    source: 'health_monitoring';
    interval: 'daily' | 'weekly' | 'monthly';
  };
}

/**
 * Événement de demande : Demande de cote crédit entre services
 * Publié par : gestion_commerciale_service, portfolio-institution-service
 * Consommé par : accounting-service
 */
export interface CreditScoreRequestEvent {
  requestId: string;
  companyId: string;
  timestamp: string;
  
  // Service demandeur
  requestingService: 'gestion_commerciale_service' | 'portfolio-institution-service' | 'analytics-service';
  requestingUser?: string;
  
  // Paramètres de la demande
  requestParams: {
    forceRecalculation?: boolean;
    includeDetails?: boolean;
    includeHistory?: boolean;
    priority?: 'low' | 'normal' | 'high';
  };
  
  // Topic de réponse
  responseTopicSuffix?: string;
  
  metadata: {
    correlationId: string;
    timeout: number; // en secondes
  };
}

/**
 * Événement de réponse : Réponse à une demande de cote crédit
 * Publié par : accounting-service
 * Consommé par : service demandeur (via corrélation)
 */
export interface CreditScoreResponseEvent {
  responseId: string;
  requestId: string; // Corrélation avec la demande
  companyId: string;
  timestamp: string;
  
  // Statut de la réponse
  status: 'success' | 'error' | 'not_found' | 'expired';
  
  // Données (si succès)
  data?: {
    score: StandardCreditScore;
    details?: DetailedCreditScore;
    history?: Array<{
      score: number;
      calculatedAt: string;
      riskLevel: string;
    }>;
  };
  
  // Erreur (si échec)
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  
  metadata: {
    correlationId: string;
    processingTime: number; // en ms
    source: 'xgboost_ml_service';
  };
}

/**
 * Interface pour les handlers d'événements de cote crédit
 */
export interface CreditScoreEventHandler {
  handleCreditScoreCalculated(event: CreditScoreCalculatedEvent): Promise<void>;
  handleCreditScoreUpdated(event: CreditScoreUpdatedEvent): Promise<void>;
  handleCreditScoreExpired(event: CreditScoreExpiredEvent): Promise<void>;
  handleMonitoringAlert(event: CreditScoreMonitoringAlertEvent): Promise<void>;
  handleHealthChanged(event: CreditScoreHealthChangedEvent): Promise<void>;
}

/**
 * Configuration des topics par service
 */
export const CREDIT_SCORE_SERVICE_TOPICS = {
  // Service Accounting (producteur principal)
  ACCOUNTING_SERVICE: {
    produces: [
      CreditScoreEventTopics.CREDIT_SCORE_CALCULATED,
      CreditScoreEventTopics.CREDIT_SCORE_UPDATED,
      CreditScoreEventTopics.CREDIT_SCORE_EXPIRED,
      CreditScoreEventTopics.CREDIT_SCORE_MONITORING_ALERT,
      CreditScoreEventTopics.CREDIT_SCORE_HEALTH_CHANGED,
      CreditScoreEventTopics.CREDIT_SCORE_RESPONSE
    ],
    consumes: [
      CreditScoreEventTopics.CREDIT_SCORE_REQUEST
    ]
  },
  
  // Service Gestion Commerciale (consommateur principal)
  GESTION_COMMERCIALE_SERVICE: {
    produces: [
      CreditScoreEventTopics.CREDIT_SCORE_REQUEST
    ],
    consumes: [
      CreditScoreEventTopics.CREDIT_SCORE_CALCULATED,
      CreditScoreEventTopics.CREDIT_SCORE_UPDATED,
      CreditScoreEventTopics.CREDIT_SCORE_EXPIRED,
      CreditScoreEventTopics.CREDIT_SCORE_MONITORING_ALERT,
      CreditScoreEventTopics.CREDIT_SCORE_RESPONSE
    ]
  },
  
  // Service Portfolio Institution (consommateur)
  PORTFOLIO_INSTITUTION_SERVICE: {
    produces: [
      CreditScoreEventTopics.CREDIT_SCORE_REQUEST
    ],
    consumes: [
      CreditScoreEventTopics.CREDIT_SCORE_CALCULATED,
      CreditScoreEventTopics.CREDIT_SCORE_UPDATED,
      CreditScoreEventTopics.CREDIT_SCORE_EXPIRED,
      CreditScoreEventTopics.CREDIT_SCORE_MONITORING_ALERT,
      CreditScoreEventTopics.CREDIT_SCORE_RESPONSE
    ]
  },
  
  // Service Analytics (consommateur pour analyses)
  ANALYTICS_SERVICE: {
    produces: [],
    consumes: [
      CreditScoreEventTopics.CREDIT_SCORE_CALCULATED,
      CreditScoreEventTopics.CREDIT_SCORE_UPDATED,
      CreditScoreEventTopics.CREDIT_SCORE_MONITORING_ALERT,
      CreditScoreEventTopics.CREDIT_SCORE_HEALTH_CHANGED
    ]
  }
} as const;