import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  CreditScoreCalculatedEvent,
  CreditScoreUpdatedEvent,
  CreditScoreExpiredEvent,
  CreditScoreMonitoringAlertEvent,
  CreditScoreResponseEvent,
  CreditScoreEventTopics
} from '@wanzobe/shared/events/credit-score-events';
import { CreditScoreUtils } from '@wanzobe/shared/interfaces/credit-score.interface';
import { FinancingRecord, FinancingRequestStatus } from '../entities/financing-record.entity';

/**
 * Consumer Kafka pour les événements de cote crédit
 * Écoute les événements publiés par accounting-service et met à jour les entités locales
 */
@Injectable()
export class CreditScoreEventConsumerService {
  private readonly logger = new Logger(CreditScoreEventConsumerService.name);

  constructor(
    @InjectRepository(FinancingRecord)
    private financingRecordRepository: Repository<FinancingRecord>,
  ) {}

  /**
   * Traite l'événement de nouveau score crédit calculé
   * Topic: credit-score.calculated
   */
  @EventPattern(CreditScoreEventTopics.CREDIT_SCORE_CALCULATED)
  async handleCreditScoreCalculated(@Payload() event: CreditScoreCalculatedEvent): Promise<void> {
    try {
      this.logger.log(
        `Réception nouveau score crédit pour ${event.companyId}: ${event.score.score}/100 (${event.score.riskLevel})`
      );

      // Trouve tous les enregistrements de financement pour cette entreprise
      const financingRecords = await this.financingRecordRepository.find({
        where: { businessId: event.companyId }
      });

      // Met à jour chaque enregistrement avec le nouveau score
      for (const record of financingRecords) {
        await this.updateFinancingRecordWithCreditScore(record, event);
      }

      this.logger.log(
        `${financingRecords.length} enregistrements de financement mis à jour pour ${event.companyId}`
      );

    } catch (error) {
      this.logger.error(
        `Erreur lors du traitement du score calculé pour ${event.companyId}:`,
        error
      );
    }
  }

  /**
   * Traite l'événement de mise à jour de score crédit
   * Topic: credit-score.updated
   */
  @EventPattern(CreditScoreEventTopics.CREDIT_SCORE_UPDATED)
  async handleCreditScoreUpdated(@Payload() event: CreditScoreUpdatedEvent): Promise<void> {
    try {
      this.logger.log(
        `Score crédit mis à jour pour ${event.companyId}: ${event.previousScore.score} → ${event.newScore.score}`
      );

      // Trouve tous les dossiers de financement pour cette entreprise
      const financingRecords = await this.financingRecordRepository.find({
        where: { businessId: event.companyId }
      });

      // Met à jour avec le nouveau score
      for (const record of financingRecords) {
        const mockCalculatedEvent = {
          ...event,
          score: event.newScore,
          metadata: {
            source: 'xgboost_ml_service' as const,
            trigger: 'data_change' as const
          }
        };
        await this.updateFinancingRecordWithCreditScore(record, mockCalculatedEvent);
      }

      this.logger.log(
        `${financingRecords.length} enregistrements mis à jour suite au changement de score pour ${event.companyId}`
      );

    } catch (error) {
      this.logger.error(
        `Erreur lors du traitement de la mise à jour de score pour ${event.companyId}:`,
        error
      );
    }
  }

  /**
   * Traite l'événement d'expiration de score crédit
   * Topic: credit-score.expired
   */
  @EventPattern(CreditScoreEventTopics.CREDIT_SCORE_EXPIRED)
  async handleCreditScoreExpired(@Payload() event: CreditScoreExpiredEvent): Promise<void> {
    try {
      this.logger.warn(
        `Score crédit expiré pour ${event.companyId}: score ${event.expiredScore.score} (calculé le ${event.expiredScore.calculatedAt})`
      );

      // Marque les enregistrements comme ayant un score expiré
      await this.financingRecordRepository.update(
        { businessId: event.companyId },
        {
          // Note : le score reste mais on peut ajouter un flag d'expiration si nécessaire
          // Pour l'instant, on log simplement l'expiration
        }
      );

      // Si un recalcul automatique est prévu, on le note
      if (event.autoRecalculationScheduled && event.nextCalculationDate) {
        this.logger.log(
          `Recalcul automatique prévu pour ${event.companyId} le ${event.nextCalculationDate}`
        );
      }

    } catch (error) {
      this.logger.error(
        `Erreur lors du traitement de l'expiration de score pour ${event.companyId}:`,
        error
      );
    }
  }

  /**
   * Traite les alertes de monitoring temps réel
   * Topic: credit-score.monitoring.alert
   */
  @EventPattern(CreditScoreEventTopics.CREDIT_SCORE_MONITORING_ALERT)
  async handleMonitoringAlert(@Payload() event: CreditScoreMonitoringAlertEvent): Promise<void> {
    try {
      this.logger.warn(
        `Alerte monitoring ${event.severity} pour ${event.companyId}: ${event.alertType} ` +
        `(score: ${event.alertData.currentScore}, diff: ${event.alertData.scoreDifference})`
      );

      // Pour les alertes critiques, on peut déclencher des actions spécifiques
      if (event.severity === 'critical') {
        // Trouve les demandes de financement en cours
        const activeFinancingRecords = await this.financingRecordRepository.find({
          where: { 
            businessId: event.companyId,
            status: FinancingRequestStatus.UNDER_REVIEW // ou autre statut actif
          }
        });

        // Ajouter des recommandations aux enregistrements
        for (const record of activeFinancingRecords) {
          const updatedRecommendations = [
            ...(record.creditScoreRecommendations || []),
            `[ALERTE ${event.severity.toUpperCase()}] ${event.alertType}: ${event.recommendations.join(', ')}`
          ];

          await this.financingRecordRepository.update(record.id, {
            creditScoreRecommendations: updatedRecommendations
          });
        }

        this.logger.warn(
          `${activeFinancingRecords.length} demandes de financement marquées avec alerte critique pour ${event.companyId}`
        );
      }

    } catch (error) {
      this.logger.error(
        `Erreur lors du traitement de l'alerte monitoring pour ${event.companyId}:`,
        error
      );
    }
  }

  /**
   * Traite les réponses aux demandes de score crédit
   * Topic: credit-score.response
   */
  @EventPattern(CreditScoreEventTopics.CREDIT_SCORE_RESPONSE)
  async handleCreditScoreResponse(@Payload() event: CreditScoreResponseEvent): Promise<void> {
    try {
      this.logger.log(
        `Réponse reçue pour la demande ${event.requestId} (${event.companyId}): ${event.status}`
      );

      if (event.status === 'success' && event.data?.score) {
        const mockCalculatedEvent = {
          eventId: event.responseId,
          companyId: event.companyId,
          timestamp: event.timestamp,
          score: event.data.score,
          details: event.data.details,
          metadata: {
            source: event.metadata.source,
            trigger: 'api_request' as const
          }
        };

        // Trouve tous les enregistrements de financement pour cette entreprise
        const financingRecords = await this.financingRecordRepository.find({
          where: { businessId: event.companyId }
        });

        // Met à jour avec le score reçu
        for (const record of financingRecords) {
          await this.updateFinancingRecordWithCreditScore(record, mockCalculatedEvent);
        }

        this.logger.log(
          `${financingRecords.length} enregistrements mis à jour suite à la réponse pour ${event.companyId}`
        );
      }

    } catch (error) {
      this.logger.error(
        `Erreur lors du traitement de la réponse de score pour ${event.companyId}:`,
        error
      );
    }
  }

  /**
   * Met à jour un enregistrement de financement avec les données de score crédit
   */
  private async updateFinancingRecordWithCreditScore(
    record: FinancingRecord,
    event: CreditScoreCalculatedEvent
  ): Promise<void> {
    const updateData: Partial<FinancingRecord> = {
      creditScore: event.score.score,
      creditScoreCalculatedAt: new Date(event.score.calculatedAt),
      creditScoreValidUntil: new Date(event.score.validUntil),
      creditScoreModelVersion: event.score.modelVersion,
      riskLevel: event.score.riskLevel,
      confidenceScore: event.score.confidenceScore,
      creditScoreDataSource: event.score.dataSource
    };

    // Ajouter les composants détaillés si disponibles
    if (event.details?.components) {
      updateData.creditScoreComponents = {
        cashFlowQuality: event.details.components.cashFlowQuality,
        businessStability: event.details.components.businessStability,
        financialHealth: event.details.components.financialHealth,
        paymentBehavior: event.details.components.paymentBehavior,
        growthTrend: event.details.components.growthTrend
      };
    }

    // Ajouter les explications si disponibles
    if (event.details?.explanation) {
      updateData.creditScoreExplanation = event.details.explanation;
    }

    // Ajouter les recommandations si disponibles
    if (event.details?.recommendations) {
      updateData.creditScoreRecommendations = event.details.recommendations;
    }

    await this.financingRecordRepository.update(record.id, updateData);

    this.logger.debug(
      `Enregistrement ${record.id} mis à jour avec score ${event.score.score} pour ${event.companyId}`
    );
  }
}