import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientKafka } from '@nestjs/microservices';
import { Request } from 'express';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { 
  FEATURE_ACCESS_KEY, 
  FeatureAccessMetadata 
} from '../decorators/feature-access.decorator';
import { BusinessFeature } from '../enums/business-features.enum';
import { 
  FeatureAccessRequestEvent,
  FeatureAccessResponseEvent,
  EventFactory 
} from '../events/business-feature-events';

/**
 * Interface pour l'utilisateur authentifié
 */
interface AuthenticatedUser {
  id: string;
  sub: string;
  organizationId: string;
  email: string;
  roles: string[];
  customerId?: string;
  customerType?: string;
}

/**
 * Interface pour la requête Express avec utilisateur authentifié
 */
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/**
 * Guard pour contrôler l'accès aux fonctionnalités métier
 * Vérifie les limites d'abonnement via Kafka avec le Customer Service
 * 
 * Ce guard intercepte toutes les requêtes marquées avec @FeatureAccess
 * pour vérifier si l'utilisateur/organisation a les droits nécessaires
 */
@Injectable()
export class FeatureAccessGuard implements CanActivate {
  private readonly logger = new Logger(FeatureAccessGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Récupérer les métadonnées du décorateur
    const featureMetadata = this.reflector.getAllAndOverride<FeatureAccessMetadata>(
      FEATURE_ACCESS_KEY,
      [context.getHandler(), context.getClass()]
    );

    // Si pas de métadonnées, autoriser l'accès
    if (!featureMetadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // Vérifier que l'utilisateur est authentifié
    if (!user) {
      throw new BadRequestException('Utilisateur non authentifié');
    }

    // Vérifier si c'est un admin et si le bypass est activé
    if (featureMetadata.bypassForAdmin && this.isAdmin(user)) {
      this.logger.log(`Admin bypass activé pour ${user.email} sur ${featureMetadata.feature}`);
      return true;
    }

    try {
      // Construire l'événement de demande d'accès
      const accessRequest: FeatureAccessRequestEvent = EventFactory.createFeatureAccessRequest(
        user.customerId || user.organizationId,
        featureMetadata.feature,
        featureMetadata.amount || 1, // Default à 1 si undefined
        'shared-guard', // serviceName
        (featureMetadata.actionType || 'access') as string, // Default actionType
        { 
          userId: user.sub,
          endpoint: request.url,
          method: request.method,
          userAgent: request.headers['user-agent'],
          ip: request.ip
        } // context
      );

      // Envoyer la demande via Kafka et attendre la réponse
      const response = await this.checkFeatureAccess(accessRequest);

      if (response.decision !== 'approved') {
        const errorMessage = featureMetadata.customErrorMessage || 
          response.denialReason || 
          `Accès refusé pour la fonctionnalité ${featureMetadata.feature}`;
        
        this.logger.warn(`Accès refusé: ${errorMessage}`, {
          user: user.email,
          feature: featureMetadata.feature,
          reason: response.denialReason
        });

        throw new ForbiddenException({
          message: errorMessage,
          feature: featureMetadata.feature,
          currentUsage: response.limits.currentUsage,
          limit: response.limits.limitValue,
          resetDate: response.limits.resetDate,
          upgradeRequired: response.decision === 'upgrade_required'
        });
      }

      // Log de l'accès autorisé
      this.logger.log(`Accès autorisé pour ${user.email} sur ${featureMetadata.feature}`, {
        amount: featureMetadata.amount,
        remainingQuota: response.limits.remainingUsage
      });

      return true;

    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(`Erreur lors de la vérification d'accès`, {
        error: error instanceof Error ? error.message : String(error),
        user: user.email,
        feature: featureMetadata.feature
      });

      // En cas d'erreur de communication, on peut soit:
      // 1. Refuser l'accès (sécurisé)
      // 2. Autoriser l'accès (disponibilité)
      // Ici on choisit de refuser pour la sécurité
      throw new ForbiddenException(
        'Service de vérification d\'accès temporairement indisponible'
      );
    }
  }

  /**
   * Vérifie l'accès à une fonctionnalité via Kafka
   */
  private async checkFeatureAccess(
    request: FeatureAccessRequestEvent
  ): Promise<FeatureAccessResponseEvent> {
    try {
      const response = await firstValueFrom(
        this.kafkaClient
          .send('business-feature.access-request', request)
          .pipe(
            timeout(5000), // Timeout de 5 secondes
            catchError((error) => {
              this.logger.error('Erreur Kafka lors de la vérification d\'accès', error);
              return of({
                requestId: request.requestId,
                customerId: request.customerId,
                feature: request.feature,
                decision: 'denied',
                limits: {
                  currentUsage: 0,
                  limitValue: 0,
                  remainingUsage: 0,
                  usagePercentage: 100
                },
                denialReason: 'Service de vérification temporairement indisponible',
                timestamp: new Date().toISOString(),
                metadata: {
                  correlationId: request.metadata.correlationId,
                  processingTimeMs: 0
                }
              } as FeatureAccessResponseEvent);
            })
          )
      );

      return response;
    } catch (error) {
      this.logger.error('Timeout ou erreur lors de la communication Kafka', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Vérifie si l'utilisateur est administrateur
   */
  private isAdmin(user: AuthenticatedUser): boolean {
    return user.roles.includes('admin') || 
           user.roles.includes('super-admin') ||
           user.roles.includes('system-admin');
  }

  /**
   * Génère un ID unique pour la demande
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Intercepteur pour consommer les fonctionnalités après succès
 * Utilisé avec @FeatureAccessWithPostConsumption
 */
@Injectable()
export class FeatureConsumptionInterceptor {
  private readonly logger = new Logger(FeatureConsumptionInterceptor.name);

  constructor(
    private reflector: Reflector,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka
  ) {}

  async intercept(context: ExecutionContext, next: any) {
    const postConsumptionMetadata = this.reflector.getAllAndOverride(
      'feature_access_post_consumption',
      [context.getHandler(), context.getClass()]
    );

    if (!postConsumptionMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    try {
      // Exécuter la méthode originale
      const result = await next.handle().toPromise();

      // Si succès, consommer la fonctionnalité
      await this.consumeFeature(user, postConsumptionMetadata);

      return result;
    } catch (error) {
      // En cas d'erreur, ne pas consommer
      this.logger.warn(`Opération échouée, consommation annulée`, {
        user: user.email,
        feature: postConsumptionMetadata.feature,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async consumeFeature(user: AuthenticatedUser, metadata: any) {
    try {
      const consumptionEvent = EventFactory.createFeatureConsumption(
        user.customerId || user.organizationId,
        metadata.feature,
        metadata.amount,
        'shared-guard', // serviceName
        metadata.actionType,
        true, // success
        { 
          userId: user.sub,
          consumedAt: new Date().toISOString(),
          source: 'post_consumption_interceptor'
        } // consumptionDetails
      );

      // Envoyer l'événement de consommation
      await firstValueFrom(
        this.kafkaClient
          .emit('business-feature.consumption', consumptionEvent)
          .pipe(timeout(3000))
      );

      this.logger.log(`Fonctionnalité consommée après succès`, {
        user: user.email,
        feature: metadata.feature,
        amount: metadata.amount
      });

    } catch (error) {
      this.logger.error(`Erreur lors de la consommation post-succès`, {
        error: error instanceof Error ? error.message : String(error),
        user: user.email,
        feature: metadata.feature
      });
      // Ne pas faire échouer la requête pour une erreur de consommation
    }
  }

  private generateConsumptionId(): string {
    return `cons_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Service utilitaire pour les vérifications manuelles d'accès
 * Peut être injecté dans les services qui ont besoin de vérifications programmatiques
 */
@Injectable()
export class ManualFeatureAccessService {
  private readonly logger = new Logger(ManualFeatureAccessService.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka
  ) {}

  /**
   * Vérifie manuellement l'accès à une fonctionnalité
   */
  async checkAccess(
    customerId: string,
    feature: BusinessFeature,
    amount: number = 1,
    actionType: string = 'use'
  ): Promise<{
    allowed: boolean;
    reason?: string;
    currentUsage?: number;
    limit?: number;
    remainingQuota?: number;
  }> {
    try {
      const request = EventFactory.createFeatureAccessRequest(
        customerId,
        feature,
        amount,
        'shared-guard', // serviceName
        actionType,
        { 
          userId: 'system',
          source: 'manual_check'
        } // context
      );

      const response = await firstValueFrom(
        this.kafkaClient
          .send('business-feature.access-request', request)
          .pipe(timeout(5000))
      );

      return {
        allowed: response.allowed,
        reason: response.reason,
        currentUsage: response.currentUsage,
        limit: response.limit,
        remainingQuota: response.remainingQuota
      };

    } catch (error) {
      this.logger.error('Erreur lors de la vérification manuelle', error);
      return {
        allowed: false,
        reason: 'Erreur de vérification'
      };
    }
  }

  /**
   * Consomme manuellement une fonctionnalité
   */
  async consumeFeature(
    customerId: string,
    feature: BusinessFeature,
    amount: number = 1,
    actionType: string = 'use',
    userId: string = 'system'
  ): Promise<boolean> {
    try {
      const consumptionEvent = EventFactory.createFeatureConsumption(
        customerId,
        feature,
        amount,
        'shared-guard', // serviceName
        actionType,
        true, // success
        {
          userId,
          source: 'manual_consumption',
          consumedAt: new Date().toISOString()
        } // consumptionDetails
      );

      await firstValueFrom(
        this.kafkaClient
          .emit('business-feature.consumption', consumptionEvent)
          .pipe(timeout(3000))
      );

      return true;
    } catch (error) {
      this.logger.error('Erreur lors de la consommation manuelle', error);
      return false;
    }
  }

  private generateRequestId(): string {
    return `manual_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConsumptionId(): string {
    return `manual_cons_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}