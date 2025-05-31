import { Injectable } from '@nestjs/common';
import { Registry, Counter, Histogram } from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly registry: Registry;
  private readonly requestCounter: Counter;
  private readonly requestDuration: Histogram;
  private readonly errorCounter: Counter;

  constructor() {
    this.registry = new Registry();

    this.requestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['service', 'method', 'path', 'status'],
      registers: [this.registry],
    });

    this.requestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['service', 'method', 'path'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.errorCounter = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['service', 'method', 'path', 'error'],
      registers: [this.registry],
    });
  }

  recordRequest(service: string, method: string, path: string, status: number, duration: number): void {
    this.requestCounter.labels(service, method, path, status.toString()).inc();
    this.requestDuration.labels(service, method, path).observe(duration / 1000);
  }

  recordError(service: string, method: string, path: string, error: string): void {
    this.errorCounter.labels(service, method, path, error).inc();
  }

  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }
}