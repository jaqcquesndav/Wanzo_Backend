import { Injectable } from '@nestjs/common';
import { HttpHealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(
    private http: HttpHealthIndicator,
    private configService: ConfigService,
  ) {}

  async checkAuthService(): Promise<HealthIndicatorResult> {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL', 'http://localhost:3001');
    return this.http.pingCheck('auth_service', `${authServiceUrl}/health`);
  }

  async checkAnalyticsService(): Promise<HealthIndicatorResult> {
    const analyticsServiceUrl = this.configService.get<string>('ANALYTICS_SERVICE_URL', 'http://localhost:3002');
    return this.http.pingCheck('analytics_service', `${analyticsServiceUrl}/health`);
  }

  async checkAdminService(): Promise<HealthIndicatorResult> {
    const adminServiceUrl = this.configService.get<string>('ADMIN_SERVICE_URL', 'http://localhost:3003');
    return this.http.pingCheck('admin_service', `${adminServiceUrl}/health`);
  }
}
