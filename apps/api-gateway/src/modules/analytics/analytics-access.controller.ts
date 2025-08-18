import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { ExtendedUser } from '../../types/user.types';

@Controller('analytics-access')
export class AnalyticsAccessController {
  @Get('check')
  checkAccess(@Req() req: Request): {
    hasAccess: boolean;
    userType: string;
    message: string;
  } {
    // This endpoint will only be accessible if the AnalyticsAccessMiddleware passes
    // If we reach here, it means the user has access to the analytics service
    const user = req['user'] as ExtendedUser;
    
    return {
      hasAccess: true,
      userType: user.userType || 'unknown',
      message: 'You have access to the analytics service'
    };
  }
}
