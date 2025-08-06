import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(LoggerMiddleware.name);

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { method, originalUrl, ip } = req;

      if (req.user?.id) {
        // Log to console instead of activity service
        this.logger.log(
          `${req.user.id} - ${method} ${originalUrl} - ${res.statusCode} - ${duration}ms`
        );
      }
    });

    next();
  }
}