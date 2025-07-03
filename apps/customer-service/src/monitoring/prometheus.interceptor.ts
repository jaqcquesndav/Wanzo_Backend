import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrometheusService } from './prometheus.service';

@Injectable()
export class PrometheusInterceptor implements NestInterceptor {
  constructor(private readonly prometheusService: PrometheusService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const start = Date.now();
    
    return next.handle().pipe(
      tap({
        next: () => {
          const statusCode = context.switchToHttp().getResponse().statusCode.toString();
          const durationInSeconds = (Date.now() - start) / 1000;
          
          // Enregistrer la durée de la requête
          this.prometheusService.observeApiRequestDuration(
            method,
            this.normalizeUrl(url),
            statusCode,
            durationInSeconds
          );
        },
        error: (error) => {
          const statusCode = error.status ? error.status.toString() : '500';
          const durationInSeconds = (Date.now() - start) / 1000;
          
          // Enregistrer la durée de la requête avec erreur
          this.prometheusService.observeApiRequestDuration(
            method,
            this.normalizeUrl(url),
            statusCode,
            durationInSeconds
          );
        }
      })
    );
  }

  // Normalise l'URL pour éviter une cardinalité trop élevée dans Prometheus
  private normalizeUrl(url: string): string {
    // Remplacer les IDs numériques ou UUIDs par des placeholders
    return url
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:uuid')
      .replace(/\/\d+/g, '/:id');
  }
}
