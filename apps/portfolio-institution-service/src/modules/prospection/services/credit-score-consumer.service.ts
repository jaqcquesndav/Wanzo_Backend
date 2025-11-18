import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  CreditScoreCalculatedEvent,
  CreditScoreUpdatedEvent,
  CreditScoreEventTopics
} from '@wanzobe/shared/events/credit-score-events';
import { CreditScoreUtils } from '@wanzobe/shared/interfaces/credit-score.interface';
import { CompanyProfile } from '../../company-profile/entities/company-profile.entity';

/**
 * Consumer Kafka pour les événements de cote crédit dans le module Prospection
 * Met à jour les scores de crédit dans le cache CompanyProfile
 */
@Injectable()
export class ProspectionCreditScoreConsumerService {
  private readonly logger = new Logger(ProspectionCreditScoreConsumerService.name);

  constructor(
    @InjectRepository(CompanyProfile)
    private companyProfileRepository: Repository<CompanyProfile>,
  ) {}

  /**
   * Traite l'événement de nouveau score crédit calculé
   * Met à jour les metrics financières des entreprises dans la prospection
   */
  @EventPattern(CreditScoreEventTopics.CREDIT_SCORE_CALCULATED)
  async handleCreditScoreCalculated(@Payload() event: CreditScoreCalculatedEvent): Promise<void> {
    try {
      this.logger.log(
        `Mise à jour score crédit pour company ${event.companyId}: ${event.score.score}/100`
      );

      // Chercher le profil dans CompanyProfile (cache unifié)
      const profile = await this.companyProfileRepository.findOne({
        where: { id: event.companyId }
      });

      if (profile) {
        // Mettre à jour le score de crédit et le rating
        profile.creditScore = event.score.score;
        profile.financialRating = this.mapScoreToRating(event.score.score);
        profile.updatedAt = new Date();

        await this.companyProfileRepository.save(profile);

        this.logger.log(
          `Score crédit mis à jour: ${event.companyId} → ${event.score.score}/100 (${profile.financialRating})`
        );
      } else {
        this.logger.debug(
          `Company profile ${event.companyId} non trouvé - pas de mise à jour nécessaire`
        );
      }

    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour du score crédit pour ${event.companyId}:`,
        error
      );
    }
  }

  /**
   * Traite l'événement de mise à jour de score crédit
   */
  @EventPattern(CreditScoreEventTopics.CREDIT_SCORE_UPDATED)
  async handleCreditScoreUpdated(@Payload() event: CreditScoreUpdatedEvent): Promise<void> {
    try {
      this.logger.log(
        `Mise à jour score crédit: ${event.companyId} (${event.previousScore.score} → ${event.newScore.score})`
      );

      // Réutiliser la logique du score calculé en créant un événement mock
      const mockCalculatedEvent = {
        eventId: event.eventId,
        companyId: event.companyId,
        timestamp: event.timestamp,
        score: event.newScore,
        metadata: {
          source: 'xgboost_ml_service' as const,
          trigger: 'data_change' as const
        }
      };

      await this.handleCreditScoreCalculated(mockCalculatedEvent);

    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour du score crédit pour ${event.companyId}:`,
        error
      );
    }
  }

  /**
   * Convertit un score 1-100 en rating financier
   */
  private mapScoreToRating(score: number): string {
    if (score >= 90) return "AAA";
    if (score >= 80) return "AA+";
    if (score >= 75) return "AA"; 
    if (score >= 70) return "AA-";
    if (score >= 65) return "A+";
    if (score >= 60) return "A";
    if (score >= 55) return "A-";
    if (score >= 50) return "BBB";
    if (score >= 40) return "BB";
    if (score >= 30) return "B";
    return "C";
  }

  /**
   * Validation que le score est valide (1-100)
   */
  private isValidScore(score: number): boolean {
    return score >= 1 && score <= 100 && Number.isInteger(score);
  }
}