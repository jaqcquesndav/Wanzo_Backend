import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ExtendedUser } from '../../../types/user.types';

@Injectable()
export class AnalyticsRouteGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const path = request.path;
    
    // Check if the path is an analytics route
    if (path.startsWith('/analytics')) {
      // Check if user is authenticated
      if (!request.user) {
        throw new ForbiddenException('Authentication required for analytics access');
      }
      
      const user = request.user as ExtendedUser;
      
      // Check if user has the appropriate role
      const userType = user.userType;
      const hasInstitutionAccess = 
        userType === 'PORTFOLIO_INSTITUTION' || 
        userType === 'ADMIN' || 
        (user.permissions && user.permissions.includes('ANALYTICS_ACCESS'));
      
      if (!hasInstitutionAccess) {
        throw new ForbiddenException('Only portfolio institution users can access analytics service');
      }
    }
    
    return true;
  }
}
