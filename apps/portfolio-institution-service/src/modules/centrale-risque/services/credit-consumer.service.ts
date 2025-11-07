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
import { CreditRisk } from '../entities/credit-risk.entity';
import { CreditScoreHistory } from '../entities/score-history.entity';

/**
 * Consumer Kafka pour les événements de cote crédit dans Portfolio Institution
 * Écoute les événements publiés par accounting-service et met à jour les entités locales
 */
@Injectable()
export class PortfolioCreditScoreEventConsumerService {
  private readonly logger = new Logger(PortfolioCreditScoreEventConsumerService.name);

  constructor(
    @InjectRepository(CreditRisk)
    private creditRiskRepository: Repository<CreditRisk>,
    @InjectRepository(CreditScoreHistory)
    private creditScoreHistoryRepository: Repository<CreditScoreHistory>,
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

      // Met à jour ou crée l'entrée CreditRisk
      await this.updateOrCreateCreditRisk(event);

      // Ajoute une entrée dans l'historique
      await this.addCreditScoreHistory(event);

      this.logger.log(
        `Données de risque crédit mises à jour pour ${event.companyId} dans le portfolio`
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

      // Convertit l'événement de mise à jour en événement calculé pour réutiliser la logique
      const mockCalculatedEvent: CreditScoreCalculatedEvent = {
        eventId: event.eventId,
        companyId: event.companyId,
        timestamp: event.timestamp,
        score: event.newScore,
        metadata: {
          source: event.metadata.source,
          trigger: 'data_change'
        }
      };

      // Met à jour les données de risque
      await this.updateOrCreateCreditRisk(mockCalculatedEvent);

      // Ajoute une entrée dans l'historique avec l'indication de mise à jour
      await this.addCreditScoreHistory(mockCalculatedEvent, `Mise à jour: ${event.updateReason}`);

      this.logger.log(
        `Données de risque mises à jour suite au changement de score pour ${event.companyId}`
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

      // Trouve l'entrée CreditRisk correspondante
      const creditRisk = await this.creditRiskRepository.findOne({
        where: { companyId: event.companyId }
      });

      if (creditRisk) {
        // Marque comme expiré mais garde les données historiques
        creditRisk.lastUpdated = new Date();
        // Note : on peut ajouter un champ "expired" si nécessaire dans l'entité
        
        await this.creditRiskRepository.save(creditRisk);
        
        this.logger.log(`Entrée CreditRisk marquée comme expirée pour ${event.companyId}`);
      }

      // Ajoute une entrée d'historique pour l'expiration
      await this.creditScoreHistoryRepository.save({
        companyId: event.companyId,
        companyName: creditRisk?.companyName || 'N/A',
        scoreValue: event.expiredScore.score,
        scoreDate: new Date(event.expiredScore.calculatedAt),
        scoreDetails: `Score expiré - Calculé le ${event.expiredScore.calculatedAt}, valide jusqu'au ${event.expiredScore.validUntil}`,
        coteCredit: this.mapScoreToCoteCredit(event.expiredScore.score),
        createdBy: 'system'
      });

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

      // Met à jour l'entrée CreditRisk avec les dernières données
      const creditRisk = await this.creditRiskRepository.findOne({
        where: { companyId: event.companyId }
      });

      if (creditRisk) {
        // Met à jour le score et les détails
        creditRisk.creditScore = event.alertData.currentScore;
        creditRisk.coteCredit = this.mapScoreToCoteCredit(event.alertData.currentScore);
        creditRisk.lastUpdated = new Date();

        await this.creditRiskRepository.save(creditRisk);
      }

      // Ajoute une entrée d'historique pour l'alerte
      await this.creditScoreHistoryRepository.save({
        companyId: event.companyId,
        companyName: creditRisk?.companyName || 'N/A',
        scoreValue: event.alertData.currentScore,
        scoreDate: new Date(event.timestamp),
        scoreDetails: `Alerte ${event.severity}: ${event.alertType} - ${event.recommendations.join(', ')}`,
        coteCredit: this.mapScoreToCoteCredit(event.alertData.currentScore),
        createdBy: 'monitoring_system'
      });

      this.logger.log(
        `Alerte enregistrée dans l'historique pour ${event.companyId}`
      );

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
        const mockCalculatedEvent: CreditScoreCalculatedEvent = {
          eventId: event.responseId,
          companyId: event.companyId,
          timestamp: event.timestamp,
          score: event.data.score,
          details: event.data.details,
          metadata: {
            source: event.metadata.source,
            trigger: 'api_request'
          }
        };

        // Met à jour les données de risque avec le score reçu
        await this.updateOrCreateCreditRisk(mockCalculatedEvent);

        // Ajoute à l'historique
        await this.addCreditScoreHistory(mockCalculatedEvent, `Réponse à la demande ${event.requestId}`);

        this.logger.log(
          `Données de risque mises à jour suite à la réponse pour ${event.companyId}`
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
   * Met à jour ou crée une entrée CreditRisk avec les données de score crédit
   */
  private async updateOrCreateCreditRisk(event: CreditScoreCalculatedEvent): Promise<void> {
    const existingRisk = await this.creditRiskRepository.findOne({
      where: { companyId: event.companyId }
    });

    const updateData = {
      creditScore: event.score.score,
      coteCredit: this.mapScoreToCoteCredit(event.score.score),
      statut: this.mapRiskLevelToStatut(event.score.riskLevel),
      // Garder les autres champs existants ou utiliser des valeurs par défaut
      encours: existingRisk?.encours || 0,
      incidents: existingRisk?.incidents || 0,
      debtRatio: existingRisk?.debtRatio || 0,
      lastUpdated: new Date()
    };

    if (existingRisk) {
      // Met à jour l'entrée existante
      await this.creditRiskRepository.update(existingRisk.id, updateData);
      this.logger.debug(`CreditRisk mis à jour pour ${event.companyId}`);
    } else {
      // Crée une nouvelle entrée
      const newRisk = this.creditRiskRepository.create({
        companyId: event.companyId,
        companyName: event.details?.context?.companyName || 'N/A',
        sector: event.details?.context?.sector || 'N/A',
        institution: 'N/A', // À remplir si disponible
        institutionId: undefined, // À remplir si disponible
        ...updateData,
        createdBy: 'kafka_event_consumer'
      });

      await this.creditRiskRepository.save(newRisk);
      this.logger.debug(`Nouveau CreditRisk créé pour ${event.companyId}`);
    }
  }

  /**
   * Ajoute une entrée dans l'historique des scores crédit
   */
  private async addCreditScoreHistory(
    event: CreditScoreCalculatedEvent, 
    additionalDetails?: string
  ): Promise<void> {
    const scoreDetails = [
      `Source: ${event.metadata.source}`,
      `Trigger: ${event.metadata.trigger}`,
      additionalDetails
    ].filter(Boolean).join(' | ');

    const historyEntry = this.creditScoreHistoryRepository.create({
      companyId: event.companyId,
      companyName: event.details?.context?.companyName || 'N/A',
      scoreValue: event.score.score,
      scoreDate: new Date(event.score.calculatedAt),
      scoreDetails,
      coteCredit: this.mapScoreToCoteCredit(event.score.score),
      createdBy: 'kafka_event_consumer'
    });

    await this.creditScoreHistoryRepository.save(historyEntry);
    this.logger.debug(`Entrée d'historique ajoutée pour ${event.companyId}`);
  }

  /**
   * Mappe un score (1-100) vers une cote crédit (format string court)
   */
  private mapScoreToCoteCredit(score: number): string {
    if (score >= 91) return 'AAA';
    if (score >= 81) return 'AA';
    if (score >= 71) return 'A';
    if (score >= 61) return 'BBB';
    if (score >= 51) return 'BB';
    if (score >= 41) return 'B';
    if (score >= 31) return 'C';
    if (score >= 21) return 'D';
    return 'E';
  }

  /**
   * Mappe un niveau de risque vers un statut
   */
  private mapRiskLevelToStatut(riskLevel: string): string {
    switch (riskLevel) {
      case 'LOW': return 'SAIN';
      case 'MEDIUM': return 'SURVEILLE';
      case 'HIGH': return 'RISQUE';
      default: return 'INCONNU';
    }
  }
}