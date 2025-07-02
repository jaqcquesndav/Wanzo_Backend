import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

/**
 * Guard pour protéger les routes réservées aux administrateurs
 * Vérifie que l'utilisateur a bien un rôle d'administrateur
 */
@Injectable()
export class AdminRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Vérifier que l'utilisateur est authentifié
    if (!user) {
      throw new UnauthorizedException('Authentification requise');
    }

    // Vérifier que l'utilisateur a un rôle d'administrateur
    const hasAdminRole = user.roles && 
      (user.roles.includes('admin') || user.roles.includes('superadmin'));

    if (!hasAdminRole) {
      throw new UnauthorizedException('Accès réservé aux administrateurs');
    }

    return true;
  }
}
