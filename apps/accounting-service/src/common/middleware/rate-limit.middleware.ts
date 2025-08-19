import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import rateLimit from 'express-rate-limit';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: this.configService.get('RATE_LIMIT_MAX', 100),
      message: {
        statusCode: 429,
        message: 'Too many requests from this IP, please try again later.',
      },
    });

    // Cast explicit pour éviter les conflits de types
    (limiter as any)(req as any, res as any, next);
  }
}
