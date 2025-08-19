import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(private subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const institutionId = request.user?.institutionId;

    if (!institutionId) {
      throw new UnauthorizedException('Institution ID not found');
    }

    // Calculer le coût en tokens de l'opération
    const tokenCost = this.calculateTokenCost(request);

    // Vérifier si l'institution a assez de tokens
    const hasEnoughTokens = await this.subscriptionService.useTokens(
      institutionId,
      tokenCost,
      request.route.path,
    );

    if (!hasEnoughTokens) {
      throw new UnauthorizedException('Insufficient tokens to perform this operation');
    }

    return true;
  }

  private calculateTokenCost(request: any): number {
    // Exemple de calcul basé sur le type d'opération
    const path = request.route.path;

    const costs: Record<string, number> = {
      '/chat/message': 1, // 1 token par message
      '/operations': 2, // 2 tokens par opération
      '/prospects/analysis': 5, // 5 tokens par analyse
    };

    return costs[path] || 1; // 1 token par défaut
  }
}
