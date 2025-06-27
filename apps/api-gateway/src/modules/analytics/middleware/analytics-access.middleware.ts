import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ExtendedUser } from '../../../types/user.types';

@Injectable()
export class AnalyticsAccessMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    // Check if user is authenticated and user object is attached to request
    if (!req['user']) {
      throw new ForbiddenException('Authentication required');
    }

    const user = req['user'] as ExtendedUser;
    
    // Check if user has portfolio institution access
    const userType = user.userType;
    const hasInstitutionAccess = 
      userType === 'PORTFOLIO_INSTITUTION' || 
      userType === 'ADMIN' || 
      (user.permissions && user.permissions.includes('ANALYTICS_ACCESS'));

    if (!hasInstitutionAccess) {
      throw new ForbiddenException('Only portfolio institution users can access analytics service');
    }

    next();
  }
}
