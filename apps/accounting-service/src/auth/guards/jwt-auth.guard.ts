import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Guard JWT temporaire pour l'Accounting Service
 * À remplacer par l'implémentation réelle avec Auth0
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Mock user pour les tests
    if (!request.user) {
      request.user = {
        sub: 'test-user-id',
        email: 'test@wanzo.com',
        organizationId: 'test-org-id',
        customerId: 'test-customer-id',
        roles: ['user'],
        iat: Date.now(),
        exp: Date.now() + 3600000 // 1 heure
      };
    }
    
    return true; // Toujours autoriser pour les tests
  }
}