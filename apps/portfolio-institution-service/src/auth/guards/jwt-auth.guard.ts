import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * Guard JWT pour l'authentification dans portfolio-institution-service
 * Mock implementation pour le développement
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Mock authentication - en développement, on simule un utilisateur authentifié
    if (process.env.NODE_ENV === 'development') {
      request.user = {
        sub: 'mock-user-id',
        email: 'test@example.com',
        customerId: 'mock-customer-id',
        institutionId: 'mock-institution-id',
        roles: ['institution_user'],
        permissions: ['portfolio:read', 'portfolio:write', 'users:manage']
      };
      return true;
    }

    // En production, utiliser la vraie authentification JWT
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token JWT invalide ou manquant');
    }
    return user;
  }
}