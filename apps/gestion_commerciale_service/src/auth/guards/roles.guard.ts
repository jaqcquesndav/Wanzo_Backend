import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Pas de rôle requis pour cette route
    }
    
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      this.logger.warn('No user found in request for roles check');
      throw new ForbiddenException('Authentification requise');
    }
    
    // Compatibilité avec l'ancienne et la nouvelle structure
    const userRoles = Array.isArray(user.roles) ? user.roles : [user.role];
    
    // Vérifier si l'utilisateur a au moins un des rôles requis
    const hasRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      this.logger.warn(`Access denied for user ${user.email || user.sub}: missing required roles ${requiredRoles.join(', ')}`);
      throw new ForbiddenException(`Vous n'avez pas les permissions nécessaires (${requiredRoles.join(', ')})`);
    }
    
    return true;
  }
}
