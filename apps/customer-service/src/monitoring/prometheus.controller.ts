import { Controller, Get, UseInterceptors, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as prometheus from 'prom-client';

export class PrometheusInterceptor implements NestInterceptor {
  private static requestDuration: prometheus.Histogram;
  private static requestTotal: prometheus.Counter;
  private static errorsTotal: prometheus.Counter;
  private readonly register: prometheus.Registry;

  constructor(register: prometheus.Registry) {
    this.register = register;
    
    if (!PrometheusInterceptor.requestDuration) {
      PrometheusInterceptor.requestDuration = new prometheus.Histogram({
        name: 'customer_service_http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status'],
        buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      });
      
      PrometheusInterceptor.requestTotal = new prometheus.Counter({
        name: 'customer_service_http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status'],
      });
      
      PrometheusInterceptor.errorsTotal = new prometheus.Counter({
        name: 'customer_service_http_request_errors_total',
        help: 'Total number of HTTP request errors',
        labelNames: ['method', 'route', 'status'],
      });
      
      this.register.registerMetric(PrometheusInterceptor.requestDuration);
      this.register.registerMetric(PrometheusInterceptor.requestTotal);
      this.register.registerMetric(PrometheusInterceptor.errorsTotal);
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const start = Date.now();
    
    return next.handle().pipe(
      tap({
        next: () => {
          this.recordMetrics(method, url, context.switchToHttp().getResponse().statusCode, start);
        },
        error: (error) => {
          const status = error.status || 500;
          PrometheusInterceptor.errorsTotal.inc({ method, route: url, status });
          this.recordMetrics(method, url, status, start);
        },
      }),
    );
  }

  private recordMetrics(method: string, url: string, status: number, start: number) {
    const duration = (Date.now() - start) / 1000;
    PrometheusInterceptor.requestDuration.observe({ method, route: url, status }, duration);
    PrometheusInterceptor.requestTotal.inc({ method, route: url, status });
  }
}

@Controller('metrics')
export class PrometheusController {
  private static register: prometheus.Registry;

  constructor() {
    if (!PrometheusController.register) {
      PrometheusController.register = new prometheus.Registry();
      prometheus.collectDefaultMetrics({ register: PrometheusController.register });
    }
  }

  @Get()
  getMetrics() {
    return PrometheusController.register.metrics();
  }

  static getPrometheusInterceptor(register: prometheus.Registry) {
    return new PrometheusInterceptor(register);
  }
}
