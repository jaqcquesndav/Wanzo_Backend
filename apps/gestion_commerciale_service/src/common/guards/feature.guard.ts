import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { SubscriptionService } from '../services/subscription.service';

export const FEATURES_KEY = 'required_features';

// Décorateur pour définir les fonctionnalités requises pour accéder à une route
export const RequireFeatures = (...features: string[]) => {
  return SetMetadata(FEATURES_KEY, features);
};

@Injectable()
export class FeatureGuard implements CanActivate {
  private readonly logger = new Logger(FeatureGuard.name);
  
  constructor(
    private reflector: Reflector,
    private subscriptionService: SubscriptionService,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const requiredFeatures = this.reflector.getAllAndOverride<string[]>(FEATURES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredFeatures || requiredFeatures.length === 0) {
      return true; // Pas de fonctionnalité spécifique requise
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || !user.platformClientId) {
      this.logger.warn('Tentative d\'accès à une fonctionnalité sans identifiant client valide');
      throw new ForbiddenException('Accès refusé: client non identifié');
    }

    return this.validateFeatures(user.platformClientId, requiredFeatures);
  }

  private async validateFeatures(platformClientId: string, requiredFeatures: string[]): Promise<boolean> {
    try {
      // Valider d'abord l'accès général au service de gestion commerciale
      const accessValidation = await this.subscriptionService.validateCommercialAccess(platformClientId);
      
      if (!accessValidation.hasAccess) {
        this.logger.warn(`Accès refusé au client ${platformClientId}: abonnement inactif ou inexistant`);
        throw new ForbiddenException('Votre abonnement ne permet pas d\'accéder à cette fonctionnalité');
      }
      
      // Ensuite, vérifier les fonctionnalités spécifiques requises
      for (const feature of requiredFeatures) {
        const hasFeature = await this.subscriptionService.hasFeature(platformClientId, feature);
        if (!hasFeature) {
          this.logger.warn(`Accès refusé au client ${platformClientId}: fonctionnalité ${feature} non disponible`);
          throw new ForbiddenException(`La fonctionnalité "${feature}" n'est pas incluse dans votre abonnement`);
        }
      }
      
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error; // Relancer les erreurs d'autorisation
      }
      
      this.logger.error(`Erreur lors de la validation des fonctionnalités: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}
