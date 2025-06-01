import { Injectable, NestMiddleware, Logger } from '@nestjs/common'; // Added Logger
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedUser {
  id: string;
  [key: string]: any;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  // Removed: constructor(private activityService: ActivityService) {}
  constructor() {} // Added empty constructor

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { method, originalUrl, ip } = req;

      // Log basic request details using NestJS Logger
      const userId = req.user?.id;
      const userString = userId ? ` (User: ${userId})` : '';
      Logger.log(
        `${method} ${originalUrl} ${res.statusCode} - ${duration}ms - IP: ${ip || 'N/A'}${userString}`,
        'HTTP',
      );
    });

    next();
  }
}