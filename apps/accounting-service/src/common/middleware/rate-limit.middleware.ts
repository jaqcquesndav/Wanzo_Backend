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
      windowMs: 1 * 60 * 1000, // 1 minute (au lieu de 15)
      max: this.configService.get('RATE_LIMIT_MAX', 1000), // 1000 requêtes par minute (au lieu de 100 par 15 min)
      message: {
        statusCode: 429,
        message: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true, // Ajouter les headers standard de rate limiting
      legacyHeaders: false, // Désactiver les anciens headers
    });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Utiliser le limiter pré-créé
    this.limiter(req, res, next);
  }
}
