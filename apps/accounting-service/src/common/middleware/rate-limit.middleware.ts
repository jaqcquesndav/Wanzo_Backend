import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import rateLimit from 'express-rate-limit';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private limiter: any;

  constructor(private configService: ConfigService) {
    // Créer le limiter une seule fois au démarrage
    this.limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: this.configService.get('RATE_LIMIT_MAX', 100),
      message: {
        statusCode: 429,
        message: 'Too many requests from this IP, please try again later.',
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Utiliser le limiter pré-créé
    this.limiter(req, res, next);
  }
}
