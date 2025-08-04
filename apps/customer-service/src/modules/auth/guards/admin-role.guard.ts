import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../system-users/entities/user.entity';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Récupérer les rôles autorisés depuis les métadonnées
    const adminRoles = [UserRole.ADMIN, UserRole.SUPERADMIN];
    
    // Récupérer la requête
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Vérifier si l'utilisateur existe et a un rôle admin
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Vérifier si l'utilisateur a un rôle administrateur
    const hasAdminRole = adminRoles.includes(user.role);
    
    if (!hasAdminRole) {
      throw new UnauthorizedException('Insufficient permissions: admin role required');
    }

    return true;
  }
}
