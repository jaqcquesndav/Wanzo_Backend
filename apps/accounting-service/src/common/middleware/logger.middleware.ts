import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ActivityService } from '../../modules/activities/services/activity.service';

interface AuthenticatedUser {
  id: string;
  [key: string]: any;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private activityService: ActivityService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { method, originalUrl, ip } = req;

      if (req.user?.id) {
        this.activityService.logActivity(
          req.user.id,
          'API_REQUEST',
          'API', // entityType
          originalUrl, // entityId
          `${method} ${originalUrl}`, // description
          {
            duration,
            statusCode: res.statusCode,
            userAgent: req.get('user-agent'),
          },
          ip,
          req.get('user-agent'),
        );
      }
    });

    next();
  }
}