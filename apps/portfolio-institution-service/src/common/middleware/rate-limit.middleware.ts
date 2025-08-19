import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import rateLimit from 'express-rate-limit';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly limiter: any;
  
  constructor(private configService: ConfigService) {
    // Initialize the limiter during middleware construction
    this.limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: this.configService.get('RATE_LIMIT_MAX', 100),
      message: {
        statusCode: 429,
        message: 'Too many requests from this IP, please try again later.',
      },
      // Using a standardJsRequest instead of Express.Request to avoid type issues
      standardHeaders: true, 
      legacyHeaders: false,
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Pass directly to the handler
    return this.limiter(req, res, next);
  }
}
