import { Injectable } from '@nestjs/common';
import { HttpHealthIndicator, HealthCheckResult, HealthIndicatorResult } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(
    private http: HttpHealthIndicator,
    private configService: ConfigService,
  ) {}

  async checkAuthService(): Promise<HealthIndicatorResult> {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    return this.http.pingCheck('auth_service', `${authServiceUrl}/health`, {
      timeout: 5000,
      validateStatus: (status: number) => status === 200,
    });
  }

  async checkAnalyticsService(): Promise<HealthIndicatorResult> {
    const analyticsServiceUrl = this.configService.get<string>('ANALYTICS_SERVICE_URL');
    return this.http.pingCheck('analytics_service', `${analyticsServiceUrl}/health`, {
      timeout: 5000,
      validateStatus: (status: number) => status === 200,
    });
  }

  async checkAdminService(): Promise<HealthIndicatorResult> {
    const adminServiceUrl = this.configService.get<string>('ADMIN_SERVICE_URL');
    return this.http.pingCheck('admin_service', `${adminServiceUrl}/health`, {
      timeout: 5000,
      validateStatus: (status: number) => status === 200,
    });
  }
}