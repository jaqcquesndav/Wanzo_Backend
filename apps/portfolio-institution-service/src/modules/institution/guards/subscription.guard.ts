import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const institutionId = request.user?.institutionId;

    if (!institutionId) {
      throw new UnauthorizedException('Institution ID not found');
    }

    const isSubscriptionActive = await this.subscriptionService.checkSubscriptionStatus(institutionId);
    
    if (!isSubscriptionActive) {
      throw new UnauthorizedException('Active subscription required to access this resource');
    }

    return true;
  }
}