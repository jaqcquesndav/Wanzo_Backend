import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  ForbiddenException,
  UnauthorizedException 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureAccessService } from '../services/feature-access.service';
import { FEATURE_ACCESS_KEY } from '../decorators/feature-access.decorator';
import { FeatureCode } from '../../../config/subscription-pricing.config';

@Injectable()
export class FeatureAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureAccessService: FeatureAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureRequirement = this.reflector.getAllAndOverride<{
      featureCode: FeatureCode;
      tokenCost?: number;
    }>(FEATURE_ACCESS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!featureRequirement) {
      // Pas de restriction de fonctionnalité, accès autorisé
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const customer = request.customer;

    if (!customer) {
      throw new UnauthorizedException('Customer information not found in request');
    }

    try {
      // Récupérer les informations d'abonnement du client
      const customerInfo = await this.featureAccessService.getCustomerSubscriptionInfo(customer.id);
      
      // Vérifier l'accès à la fonctionnalité
      const accessCheck = await this.featureAccessService.checkFeatureAccess(
        customerInfo,
        featureRequirement.featureCode,
        featureRequirement.tokenCost || 1
      );

      if (!accessCheck.hasAccess) {
        throw new ForbiddenException({
          message: accessCheck.reason,
          featureCode: featureRequirement.featureCode,
          remainingUsage: accessCheck.remainingUsage,
          totalLimit: accessCheck.totalLimit,
          upgradeRequired: true
        });
      }

      // Si la fonctionnalité consomme des tokens, les enregistrer
      if (featureRequirement.tokenCost) {
        await this.featureAccessService.consumeTokens(
          customer.id,
          featureRequirement.tokenCost,
          featureRequirement.featureCode,
          {
            endpoint: request.route?.path,
            method: request.method,
            timestamp: new Date()
          }
        );
      }

      // Enregistrer l'usage de la fonctionnalité
      await this.featureAccessService.recordFeatureUsage(
        customer.id,
        featureRequirement.featureCode,
        1,
        {
          endpoint: request.route?.path,
          method: request.method,
          tokenCost: featureRequirement.tokenCost,
          timestamp: new Date()
        }
      );

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new ForbiddenException('Unable to verify feature access');
    }
  }
}
