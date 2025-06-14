import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrometheusService } from '../../monitoring/prometheus.service';

@Injectable()
export class DatabaseMetricsInterceptor implements NestInterceptor {
  constructor(private readonly prometheusService: PrometheusService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Récupération des informations sur la requête
    const classContext = context.getClass().name;
    const handlerContext = context.getHandler().name;
    
    // Formatage du nom de la requête et de la table
    const query = `${classContext}.${handlerContext}`;
    const table = classContext.replace('Service', '').toLowerCase();
    
    // Enregistrement du temps de début
    const startTime = Date.now();
    
    return next.handle().pipe(
      tap(() => {
        // Calcul de la durée
        const duration = (Date.now() - startTime) / 1000; // En secondes
        
        // Enregistrement de la métrique
        this.prometheusService.measureDatabaseQuery(query, table, duration);
      })
    );
  }
}
