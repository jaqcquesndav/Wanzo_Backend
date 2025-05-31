import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RequestMetrics {
  total: number;
  success: number;
  failed: number;
  latencies: number[];
  lastRequest: number;
}

@Injectable()
export class RequestTrackerService {
  private readonly logger = new Logger(RequestTrackerService.name);
  private readonly metrics: Map<string, RequestMetrics> = new Map();
  private readonly retentionPeriod: number;

  constructor(private configService: ConfigService) {
    this.retentionPeriod = this.configService.get('METRICS_RETENTION_PERIOD', 3600000);
    this.startCleanupInterval();
  }

  trackRequest(service: string, startTime: number, success: boolean): void {
    const metrics = this.getMetrics(service);
    const duration = Date.now() - startTime;

    metrics.total++;
    if (success) {
      metrics.success++;
    } else {
      metrics.failed++;
    }

    metrics.latencies.push(duration);
    metrics.lastRequest = Date.now();

    // Keep only last 100 latencies
    if (metrics.latencies.length > 100) {
      metrics.latencies.shift();
    }
  }

  getServiceMetrics(service: string): {
    total: number;
    success: number;
    failed: number;
    averageLatency: number;
    successRate: number;
  } {
    const metrics = this.getMetrics(service);
    const averageLatency = metrics.latencies.length > 0
      ? metrics.latencies.reduce((a, b) => a + b, 0) / metrics.latencies.length
      : 0;

    return {
      total: metrics.total,
      success: metrics.success,
      failed: metrics.failed,
      averageLatency,
      successRate: metrics.total > 0 ? (metrics.success / metrics.total) * 100 : 100,
    };
  }

  private getMetrics(service: string): RequestMetrics {
    if (!this.metrics.has(service)) {
      this.metrics.set(service, {
        total: 0,
        success: 0,
        failed: 0,
        latencies: [],
        lastRequest: Date.now(),
      });
    }
    return this.metrics.get(service)!;
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [service, metrics] of this.metrics.entries()) {
        if (now - metrics.lastRequest > this.retentionPeriod) {
          this.metrics.delete(service);
          this.logger.debug(`Cleaned up metrics for inactive service: ${service}`);
        }
      }
    }, this.retentionPeriod);
  }
}