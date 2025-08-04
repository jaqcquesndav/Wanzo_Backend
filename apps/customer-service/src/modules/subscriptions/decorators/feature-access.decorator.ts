import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FeatureCode } from '../../../config/subscription-pricing.config';

export const FEATURE_ACCESS_KEY = 'feature_access';

/**
 * Décorateur pour spécifier qu'une route nécessite l'accès à une fonctionnalité spécifique
 */
export const RequireFeature = (featureCode: FeatureCode, tokenCost?: number) => 
  SetMetadata(FEATURE_ACCESS_KEY, { featureCode, tokenCost });

/**
 * Décorateur pour injecter les informations du client dans un contrôleur
 */
export const CurrentCustomer = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.customer;
  },
);

/**
 * Interface pour les informations du client dans la requête
 */
export interface RequestCustomer {
  id: string;
  type: 'sme' | 'financial_institution';
  subscriptionId: string;
  planId: string;
}

/**
 * Exemples d'utilisation dans les contrôleurs :
 * 
 * @Controller('commercial')
 * export class CommercialController {
 *   
 *   @Get('customers')
 *   @RequireFeature(FeatureCode.CUSTOMER_MANAGEMENT)
 *   async getCustomers(@CurrentCustomer() customer: RequestCustomer) {
 *     // Code du contrôleur
 *   }
 *   
 *   @Post('ai-analysis')
 *   @RequireFeature(FeatureCode.AI_CHAT_ASSISTANCE, 1000) // Coûte 1000 tokens
 *   async performAIAnalysis(@CurrentCustomer() customer: RequestCustomer) {
 *     // Code du contrôleur
 *   }
 * }
 */
