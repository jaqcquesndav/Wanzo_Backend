import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    console.log('🔐 ROLES GUARD - Required roles:', requiredRoles);
    
    if (!requiredRoles) {
      console.log('🔐 ROLES GUARD - No roles required, allowing access');
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    console.log('🔐 ROLES GUARD - User:', user);
    console.log('🔐 ROLES GUARD - User role:', user?.role);
    
    // SUPERADMIN a toujours accès (comme dans admin-service)
    if (user?.role === 'super_admin') {
      console.log('🔐 ROLES GUARD - SUPERADMIN access granted');
      return true;
    }
    
    const hasRole = requiredRoles.includes(user.role);
    console.log('🔐 ROLES GUARD - Has required role:', hasRole);
    
    return hasRole;
  }
}
