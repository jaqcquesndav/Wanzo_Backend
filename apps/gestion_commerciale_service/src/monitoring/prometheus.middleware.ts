import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrometheusService } from './prometheus.service';

@Injectable()
export class PrometheusMiddleware implements NestMiddleware {
  constructor(private readonly prometheusService: PrometheusService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Enregistrement du temps de début
    const startTime = Date.now();
    
    // Capture du statut de la réponse et de la durée après la fin du traitement
    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000; // En secondes
      const path = req.path;
      const method = req.method;
      const status = res.statusCode;
      
      // Enregistrement de la métrique
      this.prometheusService.measureHttpRequest(method, path, status, duration);
    });
    
    next();
  }
}
