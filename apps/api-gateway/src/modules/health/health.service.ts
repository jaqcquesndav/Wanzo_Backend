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
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    return this.http.pingCheck('auth_service', `${authServiceUrl}/health`);
  }

  async checkAdminService(): Promise<HealthIndicatorResult> {
    const adminServiceUrl = this.configService.get<string>('ADMIN_SERVICE_URL');
    return this.http.pingCheck('admin_service', `${adminServiceUrl}/health`);
  }

  async checkAnalyticsService(): Promise<HealthIndicatorResult> {
    const analyticsServiceUrl = this.configService.get<string>('ANALYTICS_SERVICE_URL');
    return this.http.pingCheck('analytics_service', `${analyticsServiceUrl}/health`);
  }

  async checkAccountingService(): Promise<HealthIndicatorResult> {
    const accountingServiceUrl = this.configService.get<string>('ACCOUNTING_SERVICE_URL');
    return this.http.pingCheck('accounting_service', `${accountingServiceUrl}/health`);
  }

  async checkPortfolioSmeService(): Promise<HealthIndicatorResult> {
    const portfolioSmeServiceUrl = this.configService.get<string>('PORTFOLIO_SME_SERVICE_URL');
    return this.http.pingCheck('portfolio_sme_service', `${portfolioSmeServiceUrl}/health`);
  }

  async checkPortfolioInstitutionService(): Promise<HealthIndicatorResult> {
    const portfolioInstitutionServiceUrl = this.configService.get<string>('PORTFOLIO_INSTITUTION_SERVICE_URL');
    return this.http.pingCheck('portfolio_institution_service', `${portfolioInstitutionServiceUrl}/health`);
  }
}