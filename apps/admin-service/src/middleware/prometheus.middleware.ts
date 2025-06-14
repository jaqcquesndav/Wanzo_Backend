import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrometheusService } from '../monitoring/prometheus.service';

@Injectable()
export class PrometheusMiddleware implements NestMiddleware {
  constructor(private readonly prometheusService: PrometheusService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Récupération de la méthode et du chemin
    const method = req.method;
    const path = req.route ? req.route.path : req.path;
    
    // Enregistrement du temps de début
    const startTime = Date.now();
    
    // Traitement de la réponse
    res.on('finish', () => {
      // Calcul de la durée
      const duration = (Date.now() - startTime) / 1000; // En secondes
      
      // Enregistrement de la métrique
      this.prometheusService.measureHttpRequest(
        method,
        path,
        res.statusCode,
        duration
      );
    });
    
    next();
  }
}
