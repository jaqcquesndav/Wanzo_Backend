import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { AccessControlService } from '../modules/subscriptions/services/access-control.service';
import { 
  FeatureAccessRequestEvent,
  FeatureAccessResponseEvent,
  FeatureConsumptionEvent,
  FeatureLimitAlertEvent,
  EventFactory
} from '@wanzobe/shared';
import { ConsumptionRequest } from '../interfaces/consumption-request.interface';

/**
 * Contrôleur Kafka pour gérer les événements de contrôle d'accès aux fonctionnalités
 * Traite les demandes d'accès et les événements de consommation des autres services
 */
@Controller()
export class FeatureAccessKafkaController {
  private readonly logger = new Logger(FeatureAccessKafkaController.name);

  constructor(private readonly accessControlService: AccessControlService) {}

  /**
   * Traite les demandes d'accès aux fonctionnalités métier
   * Pattern synchrone avec réponse
   */
  @MessagePattern('business-feature.access-request')
  async handleAccessRequest(
    @Payload() request: FeatureAccessRequestEvent,
    @Ctx() context: KafkaContext
  ): Promise<FeatureAccessResponseEvent> {
    const startTime = Date.now();
    
    this.logger.log(`Demande d'accès reçue`, {
      requestId: request.requestId,
      customerId: request.customerId,
      feature: request.feature,
      amount: request.requestedAmount,
      partition: context.getPartition(),
      offset: context.getMessage().offset
    });

    try {
      // Vérifier l'accès via le service de contrôle d'accès
      const accessResult = await this.accessControlService.checkAccess(
        request.customerId,
        request.feature,
        request.requestedAmount,
        request.userId
      );

      const response: FeatureAccessResponseEvent = {
        requestId: request.requestId,
        customerId: request.customerId,
        feature: request.feature,
        decision: accessResult.allowed ? 'approved' : 'denied',
        limits: {
          currentUsage: accessResult.currentUsage || 0,
          limitValue: accessResult.limitValue || 0,
          remainingUsage: accessResult.remainingUsage || 0,
          usagePercentage: accessResult.usagePercentage || 0,
          resetDate: accessResult.resetDate?.toISOString()
        },
        denialReason: accessResult.denialReason,
        suggestedPlanId: accessResult.suggestedPlanId,
        consumptionToken: accessResult.consumptionToken,
        timestamp: new Date().toISOString(),
        metadata: {
          correlationId: request.requestId,
          processingTimeMs: Date.now() - startTime
        }
      };

      this.logger.log(`Réponse d'accès envoyée`, {
        requestId: request.requestId,
        decision: response.decision,
        processingTime: response.metadata.processingTimeMs
      });

      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(`Erreur lors du traitement de la demande d'accès`, {
        requestId: request.requestId,
        error: errorMessage,
        stack: errorStack
      });

      // Réponse d'erreur
      return {
        requestId: request.requestId,
        customerId: request.customerId,
        feature: request.feature,
        decision: 'denied',
        limits: {
          currentUsage: 0,
          limitValue: 0,
          remainingUsage: 0,
          usagePercentage: 0
        },
        denialReason: 'Erreur interne lors de la vérification d\'accès',
        timestamp: new Date().toISOString(),
        metadata: {
          correlationId: request.requestId,
          processingTimeMs: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Traite les événements de consommation de fonctionnalités
   * Pattern asynchrone sans réponse
   */
  @EventPattern('business-feature.consumption')
  async handleFeatureConsumption(
    @Payload() consumption: FeatureConsumptionEvent,
    @Ctx() context: KafkaContext
  ): Promise<void> {
    this.logger.log(`Consommation de fonctionnalité reçue`, {
      consumptionId: consumption.consumptionId,
      customerId: consumption.customerId,
      feature: consumption.feature,
      amount: consumption.consumedAmount,
      partition: context.getPartition(),
      offset: context.getMessage().offset
    });

    try {
      // Consommer la fonctionnalité via le service de contrôle d'accès
      const consumptionRequest: ConsumptionRequest = {
        customerId: consumption.customerId,
        userId: consumption.userId,
        feature: consumption.feature,
        amount: consumption.consumedAmount,
        serviceName: consumption.serviceName,
        actionType: consumption.actionType,
        resourceId: consumption.resourceId,
        context: consumption.consumptionDetails
      };
      
      await this.accessControlService.consumeFeature(consumptionRequest);

      this.logger.log(`Fonctionnalité consommée avec succès`, {
        consumptionId: consumption.consumptionId,
        customerId: consumption.customerId,
        feature: consumption.feature,
        amount: consumption.consumedAmount
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Erreur lors de la consommation de fonctionnalité`, {
        consumptionId: consumption.consumptionId,
        error: errorMessage,
        customerId: consumption.customerId,
        feature: consumption.feature
      });

      // En cas d'erreur, on peut envoyer un événement d'alerte
      await this.sendConsumptionErrorAlert(consumption, errorMessage);
    }
  }

  /**
   * Traite les événements de mise à jour des limites client
   * Utilisé quand un client change d'abonnement
   */
  @EventPattern('business-feature.limits-updated')
  async handleLimitsUpdate(
    @Payload() updateEvent: any,
    @Ctx() context: KafkaContext
  ): Promise<void> {
    this.logger.log(`Mise à jour des limites reçue`, {
      customerId: updateEvent.customerId,
      subscriptionPlan: updateEvent.subscriptionPlan
    });

    try {
      await this.accessControlService.updateCustomerFeatureLimits(
        updateEvent.customerId,
        updateEvent.featureLimits,
        updateEvent.subscriptionPlan
      );

      this.logger.log(`Limites mises à jour avec succès`, {
        customerId: updateEvent.customerId
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Erreur lors de la mise à jour des limites`, {
        customerId: updateEvent.customerId,
        error: errorMessage
      });
    }
  }

  /**
   * Traite les demandes de réinitialisation des compteurs
   * Utilisé pour les limites mensuelles/quotidiennes
   */
  @EventPattern('business-feature.reset-counters')
  async handleResetCounters(
    @Payload() resetEvent: any,
    @Ctx() context: KafkaContext
  ): Promise<void> {
    this.logger.log(`Réinitialisation des compteurs demandée`, {
      customerId: resetEvent.customerId,
      resetType: resetEvent.resetType,
      features: resetEvent.features
    });

    try {
      await this.accessControlService.resetFeatureCounters(
        resetEvent.customerId,
        resetEvent.resetType,
        resetEvent.features
      );

      this.logger.log(`Compteurs réinitialisés avec succès`, {
        customerId: resetEvent.customerId,
        resetType: resetEvent.resetType
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Erreur lors de la réinitialisation des compteurs`, {
        customerId: resetEvent.customerId,
        error: errorMessage
      });
    }
  }

  /**
   * Envoie une alerte en cas d'erreur de consommation
   */
  private async sendConsumptionErrorAlert(
    consumption: FeatureConsumptionEvent,
    errorMessage: string
  ): Promise<void> {
    try {
      const alertEvent: FeatureLimitAlertEvent = {
        alertId: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerId: consumption.customerId,
        feature: consumption.feature,
        alertType: 'limit_exceeded',
        limits: {
          currentUsage: 0,
          limitValue: 0,
          usagePercentage: 100,
          warningThreshold: 80
        },
        message: `Erreur lors de la consommation: ${errorMessage}`,
        actions: {
          notificationSent: false,
          upgradePromptShown: false,
          serviceRestricted: true
        },
        timestamp: new Date().toISOString(),
        metadata: {
          correlationId: consumption.consumptionId,
          severity: 'critical'
        }
      };

      // Émettre l'alerte (implémentation Kafka à ajouter)
      this.logger.warn(`Alerte d'erreur de consommation générée`, {
        customerId: consumption.customerId,
        feature: consumption.feature,
        error: errorMessage
      });

    } catch (alertError) {
      const alertErrorMessage = alertError instanceof Error ? alertError.message : 'Unknown alert error';
      this.logger.error(`Impossible d'envoyer l'alerte d'erreur`, {
        originalError: errorMessage,
        alertError: alertErrorMessage
      });
    }
  }
}