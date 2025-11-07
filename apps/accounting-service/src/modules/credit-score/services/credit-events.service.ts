import { Injectable, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { 
  CreditScoreEventTopics,
  CreditScoreCalculatedEvent,
  CreditScoreUpdatedEvent,
  CreditScoreExpiredEvent,
  CreditScoreMonitoringAlertEvent,
  CreditScoreRequestEvent,
  CreditScoreResponseEvent
} from '@wanzobe/shared/events/credit-score-events';

import { 
  StandardCreditScore,
  DetailedCreditScore
} from '@wanzobe/shared/interfaces/credit-score.interface';

import { CompanyCreditScore } from '../entities/company-score.entity';

export interface CreditEventPublishOptions {
  companyId: string;
  score: StandardCreditScore;
  trigger: 'api_request' | 'scheduled_calculation' | 'data_change';
  previousScore?: StandardCreditScore;
  metadata?: Record<string, any>;
}

export interface CreditEventDistributionResult {
  success: boolean;
  publishedTopics: string[];
  errors: string[];
  metadata: {
    timestamp: string;
    eventId: string;
    totalServices: number;
    successfulDeliveries: number;
  };
}

@Injectable()
export class CreditEventsService {
  private readonly logger = new Logger(CreditEventsService.name);

  constructor(
    @InjectRepository(CompanyCreditScore)
    private readonly companyCreditScoreRepository: Repository<CompanyCreditScore>,
  ) {}

  /**
   * Publication d'un événement de score calculé
   */
  async publishCreditScoreCalculated(options: CreditEventPublishOptions): Promise<void> {
    const eventId = this.generateEventId();
    
    const event: CreditScoreCalculatedEvent = {
      eventId,
      companyId: options.companyId,
      score: options.score,
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'xgboost_ml_service' as any,
        trigger: options.trigger,
        requestedBy: options.metadata?.requestedBy,
        calculationDuration: options.metadata?.calculationDuration
      }
    };

    await this.publishEvent(CreditScoreEventTopics.CREDIT_SCORE_CALCULATED, event);
    
    this.logger.log(
      `Événement CreditScoreCalculated publié pour ${options.companyId} - Score: ${options.score.score}/100`
    );
  }

  /**
   * Publication d'un événement de score mis à jour
   */
  async publishCreditScoreUpdated(options: CreditEventPublishOptions): Promise<void> {
    if (!options.previousScore) {
      throw new Error('previousScore est requis pour un événement de mise à jour');
    }

    const eventId = this.generateEventId();
    
    const event: CreditScoreUpdatedEvent = {
      eventId,
      companyId: options.companyId,
      timestamp: new Date().toISOString(),
      previousScore: this.formatScoreForKafka(options.previousScore),
      newScore: options.score,
      updateReason: this.determineUpdateReason(options.trigger),
      metadata: {
        source: 'xgboost_ml_service' as any
      }
    };

    await this.publishEvent(CreditScoreEventTopics.CREDIT_SCORE_UPDATED, event);
    
    this.logger.log(
      `Événement CreditScoreUpdated publié pour ${options.companyId} - ${options.previousScore.score} → ${options.score.score}`
    );
  }

  /**
   * Publication d'un événement de score expiré
   */
  async publishCreditScoreExpired(companyId: string, expiredScore: StandardCreditScore): Promise<void> {
    const eventId = this.generateEventId();
    
    const event: CreditScoreExpiredEvent = {
      eventId,
      companyId,
      timestamp: new Date().toISOString(),
      expiredScore: this.formatExpiredScoreForKafka(expiredScore),
      autoRecalculationScheduled: true,
      metadata: {
        source: 'automated_expiry_check' as any
      }
    };

    await this.publishEvent(CreditScoreEventTopics.CREDIT_SCORE_EXPIRED, event);
    
    this.logger.warn(
      `Événement CreditScoreExpired publié pour ${companyId} - Score expiré: ${expiredScore.score}/100`
    );
  }

  /**
   * Publication d'une alerte de monitoring
   */
  async publishMonitoringAlert(
    companyId: string,
    alertType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    context?: Record<string, any>
  ): Promise<void> {
    const eventId = this.generateEventId();
    
    const event: any = {
      eventId,
      companyId,
      timestamp: new Date().toISOString(),
      alertType: alertType as any,
      severity,
      context: context || {},
      requiresAction: severity === 'high' || severity === 'critical',
      metadata: {
        source: 'real_time_monitoring' as any,
        monitoringConfigId: 'default'
      }
    };

    await this.publishEvent(CreditScoreEventTopics.CREDIT_SCORE_MONITORING_ALERT, event);
    
    this.logger.warn(
      `Alerte monitoring ${severity} publiée pour ${companyId}: ${alertType} - ${message}`
    );
  }

  /**
   * Publication d'une réponse à une demande de score
   */
  async publishScoreResponse(
    requestId: string,
    companyId: string,
    status: 'success' | 'error' | 'not_found',
    score?: StandardCreditScore | DetailedCreditScore,
    error?: string
  ): Promise<void> {
    const eventId = this.generateEventId();
    
    const event: any = {
      eventId,
      requestId,
      companyId,
      timestamp: new Date().toISOString(),
      status,
      score,
      error: error ? { code: 'CALCULATION_ERROR', message: String(error) } : undefined,
      metadata: {
        correlationId: 'auto-generated',
        processingTime: 100,
        source: 'xgboost_ml_service' as any
      }
    };

    await this.publishEvent(CreditScoreEventTopics.CREDIT_SCORE_RESPONSE, event);
    
    this.logger.log(
      `Réponse de score publiée pour demande ${requestId} (${companyId}): ${status}`
    );
  }

  /**
   * Distribution complète d'un score vers tous les services
   */
  async distributeCreditScore(
    companyId: string,
    score: StandardCreditScore,
    trigger: 'api_request' | 'scheduled_calculation' | 'data_change',
    previousScore?: StandardCreditScore
  ): Promise<CreditEventDistributionResult> {
    const startTime = Date.now();
    const eventId = this.generateEventId();
    const publishedTopics: string[] = [];
    const errors: string[] = [];

    this.logger.log(`Distribution score crédit pour ${companyId} - Score: ${score.score}/100`);

    try {
      // 1. Publication événement principal (calculé ou mis à jour)
      if (previousScore) {
        await this.publishCreditScoreUpdated({ companyId, score, trigger, previousScore });
        publishedTopics.push(CreditScoreEventTopics.CREDIT_SCORE_UPDATED);
      } else {
        await this.publishCreditScoreCalculated({ companyId, score, trigger });
        publishedTopics.push(CreditScoreEventTopics.CREDIT_SCORE_CALCULATED);
      }

      // 2. Vérification des seuils d'alerte
      await this.checkAndPublishAlerts(companyId, score, previousScore);

      // 3. Mise à jour du statut en base
      await this.updateScoreDistributionStatus(companyId, 'distributed');

      const result: CreditEventDistributionResult = {
        success: true,
        publishedTopics,
        errors,
        metadata: {
          timestamp: new Date().toISOString(),
          eventId,
          totalServices: this.getTargetServicesCount(),
          successfulDeliveries: publishedTopics.length
        }
      };

      this.logger.log(
        `Distribution terminée pour ${companyId} - ${publishedTopics.length} événements publiés en ${Date.now() - startTime}ms`
      );

      return result;

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Distribution error');
      
      this.logger.error(`Erreur distribution score pour ${companyId}:`, error);

      return {
        success: false,
        publishedTopics,
        errors,
        metadata: {
          timestamp: new Date().toISOString(),
          eventId,
          totalServices: this.getTargetServicesCount(),
          successfulDeliveries: publishedTopics.length
        }
      };
    }
  }

  /**
   * Vérification et publication d'alertes basées sur les seuils
   */
  private async checkAndPublishAlerts(
    companyId: string,
    currentScore: StandardCreditScore,
    previousScore?: StandardCreditScore
  ): Promise<void> {
    // Alerte score critique
    if (currentScore.score < 30) {
      await this.publishMonitoringAlert(
        companyId,
        'critical_score',
        'critical',
        `Score crédit critique: ${currentScore.score}/100`,
        { currentScore, previousScore }
      );
    }

    // Alerte dégradation importante
    if (previousScore && (previousScore.score - currentScore.score) > 20) {
      await this.publishMonitoringAlert(
        companyId,
        'score_degradation',
        'high',
        `Dégradation importante du score: ${previousScore.score} → ${currentScore.score}`,
        { scoreDrop: previousScore.score - currentScore.score }
      );
    }

    // Alerte changement de niveau de risque
    if (previousScore && previousScore.riskLevel !== currentScore.riskLevel) {
      const severity = this.getRiskChangeSeverity(previousScore.riskLevel, currentScore.riskLevel);
      await this.publishMonitoringAlert(
        companyId,
        'risk_level_change',
        severity,
        `Changement niveau de risque: ${previousScore.riskLevel} → ${currentScore.riskLevel}`,
        { previousRisk: previousScore.riskLevel, newRisk: currentScore.riskLevel }
      );
    }

    // Alerte score expirant bientôt
    const daysUntilExpiration = this.getDaysUntilExpiration(currentScore.validUntil.toISOString());
    if (daysUntilExpiration <= 7) {
      await this.publishMonitoringAlert(
        companyId,
        'score_expiring_soon',
        'medium',
        `Score expirant dans ${daysUntilExpiration} jour(s)`,
        { expirationDate: currentScore.validUntil, daysRemaining: daysUntilExpiration }
      );
    }
  }

  /**
   * Publication d'un événement Kafka
   */
  private async publishEvent(topic: string, event: any): Promise<void> {
    try {
      // Ici on utiliserait le client Kafka réel
      // Pour l'instant, on simule la publication
      this.logger.debug(`Publication événement sur topic ${topic}:`, event);
      
      // TODO: Implémenter la publication Kafka réelle
      // await this.kafkaClient.emit(topic, event);
      
    } catch (error) {
      this.logger.error(`Erreur publication sur topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Mise à jour du statut de distribution en base
   */
  private async updateScoreDistributionStatus(companyId: string, status: string): Promise<void> {
    await this.companyCreditScoreRepository.update(
      { companyId },
      { 

 
      }
    );
  }

  /**
   * Détermine la raison de la mise à jour
   */
  private determineUpdateReason(trigger: string): 'scheduled_recalculation' | 'data_update' | 'manual_recalculation' {
    switch (trigger) {
      case 'api_request':
        return 'manual_recalculation';
      case 'scheduled_calculation':
        return 'scheduled_recalculation';
      case 'data_change':
        return 'data_update';
      default:
        return 'manual_recalculation';
    }
  }

  /**
   * Calcul du pourcentage de changement
   */
  private calculatePercentageChange(oldScore: number, newScore: number): number {
    if (oldScore === 0) return 0;
    return Math.round(((newScore - oldScore) / oldScore) * 100 * 100) / 100;
  }

  /**
   * Détermine la sévérité d'un changement de niveau de risque
   */
  private getRiskChangeSeverity(
    oldRisk: string,
    newRisk: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const riskLevels = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3 };
    const oldLevel = riskLevels[oldRisk] || 2;
    const newLevel = riskLevels[newRisk] || 2;
    
    if (newLevel > oldLevel && newLevel === 3) return 'critical';
    if (newLevel > oldLevel) return 'high';
    if (newLevel < oldLevel) return 'medium';
    return 'low';
  }

  /**
   * Calcul des jours jusqu'à expiration
   */
  private getDaysUntilExpiration(validUntil: string): number {
    const expiration = new Date(validUntil);
    const now = new Date();
    const diffTime = expiration.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Génération d'un ID d'événement unique
   */
  private generateEventId(): string {
    return `credit-score-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Compte du nombre de services cibles
   */
  private getTargetServicesCount(): number {
    // Services qui consomment les événements de crédit score
    return 3; // gestion-commerciale, portfolio-institution, analytics
  }

  /**
   * Gestionnaire d'événements de demande de score (consommateur)
   */
  @EventPattern(CreditScoreEventTopics.CREDIT_SCORE_REQUEST)
  async handleCreditScoreRequest(event: CreditScoreRequestEvent): Promise<void> {
    this.logger.log(`Demande de score reçue: ${event.requestId} pour ${event.companyId}`);

    try {
      // Récupération du score existant
      const existingScore = await this.companyCreditScoreRepository.findOne({
        where: { companyId: event.companyId }
      });

      if (existingScore && this.isScoreValid(existingScore)) {
        // Score valide trouvé
        const standardScore: StandardCreditScore = {
          score: existingScore.score,
          riskLevel: existingScore.riskLevel as any,
          scoreClass: existingScore.scoreClass as any,
          calculatedAt: existingScore.calculatedAt,
          validUntil: existingScore.validUntil,
          modelVersion: existingScore.modelVersion,
          dataSource: existingScore.dataSource,
          confidenceScore: existingScore.confidenceScore
        };

        await this.publishScoreResponse(
          event.requestId,
          event.companyId,
          'success',
          standardScore
        );

      } else {
        // Score non trouvé ou expiré
        await this.publishScoreResponse(
          event.requestId,
          event.companyId,
          'not_found',
          undefined,
          'Score not found or expired'
        );
      }

    } catch (error) {
      this.logger.error(`Erreur traitement demande ${event.requestId}:`, error);
      
      await this.publishScoreResponse(
        event.requestId,
        event.companyId,
        'error',
        undefined,
        error instanceof Error ? error.message : 'Internal error'
      );
    }
  }

  /**
   * Formate un score pour Kafka
   */
  private formatScoreForKafka(score: StandardCreditScore): { score: number; riskLevel: string; calculatedAt: string } {
    return {
      score: score.score,
      riskLevel: score.riskLevel,
      calculatedAt: score.calculatedAt.toISOString()
    };
  }

  /**
   * Formate un score expiré pour Kafka
   */
  private formatExpiredScoreForKafka(score: StandardCreditScore): { score: number; calculatedAt: string; validUntil: string } {
    return {
      score: score.score,
      calculatedAt: score.calculatedAt.toISOString(),
      validUntil: score.validUntil.toISOString()
    };
  }

  /**
   * Vérification de validité d'un score
   */
  private isScoreValid(score: CompanyCreditScore): boolean {
    return score.validUntil > new Date();
  }
}