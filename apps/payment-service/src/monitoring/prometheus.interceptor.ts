import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Registry, Histogram, Counter } from 'prom-client';
import { Observable, tap } from 'rxjs';

@Injectable()
export class PrometheusInterceptor implements NestInterceptor {
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestErrors: Counter<string>;

  constructor(private readonly register: Registry) {
    this.httpRequestDuration = new Histogram({
      name: 'payment_http_request_duration_ms',
      help: 'HTTP request duration in milliseconds for Payment Service',
      labelNames: ['method', 'path', 'status'],
      registers: [register],
    });

    this.httpRequestErrors = new Counter({
      name: 'payment_http_request_errors_total',
      help: 'Total number of HTTP request errors for Payment Service',
      labelNames: ['method', 'path', 'error'],
      registers: [register],
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request & { path?: string; method?: string }>();
    const method = (req.method || 'GET').toUpperCase();
    const path = req.path || 'unknown';
    const end = this.httpRequestDuration.startTimer({ method, path, status: 'pending' });

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          end({ method, path, status: '200' });
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          this.httpRequestErrors.inc({ method, path, error: err?.name || 'Error' });
          end({ method, path, status: String(err?.status || 500) });
        },
      })
    );
  }
}
