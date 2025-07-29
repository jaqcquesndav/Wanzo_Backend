import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ServiceRoute {
  service: string;
  baseUrl: string;
  prefix: string;
  
}

@Injectable()
export class RouteResolverService {
  private readonly logger = new Logger(RouteResolverService.name);
  private readonly routes: ServiceRoute[];

  constructor(private configService: ConfigService) {
    this.routes = [
      {
        service: 'auth',
        baseUrl: this.configService.get('AUTH_SERVICE_URL', 'http://localhost:3000'),
        prefix: 'auth',
      },
      {
        service: 'admin',
        baseUrl: this.configService.get('ADMIN_SERVICE_URL', 'http://localhost:3001'),
        prefix: 'admin',
      },
      {
        service: 'analytics',
        baseUrl: this.configService.get('ANALYTICS_SERVICE_URL', 'http://localhost:3002'),
        prefix: 'analytics',
      },
      {
        service: 'accounting',
        baseUrl: this.configService.get('ACCOUNTING_SERVICE_URL', 'http://localhost:3003'),
        prefix: 'accounting',
      },
      {
        service: 'portfolio-institution',
        baseUrl: this.configService.get('PORTFOLIO_INSTITUTION_SERVICE_URL', 'http://localhost:3005'),
        prefix: 'portfolio/institution',
      },
      {
        service: 'customer',
        baseUrl: this.configService.get('CUSTOMER_SERVICE_URL', 'http://localhost:3006'),
        prefix: 'land/api/v1',
      },
    ];
  }

  resolveRoute(path: string): ServiceRoute | null {
    // Remove leading slash
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Find matching route
    const route = this.routes.find(r => normalizedPath.startsWith(r.prefix));
    
    if (route) {
      this.logger.debug(`Resolved path ${path} to service ${route.service}`);
      return route;
    }

    this.logger.warn(`No service found for path ${path}`);
    return null;
  }

  getServiceUrl(service: string): string | null {
    const route = this.routes.find(r => r.service === service);
    return route ? route.baseUrl : null;
  }

  getServicePrefix(service: string): string | null {
    const route = this.routes.find(r => r.service === service);
    return route ? route.prefix : null;
  }

  stripPrefix(path: string, prefix: string): string {
    if (path.startsWith(`/${prefix}`)) {
      return path.substring(prefix.length + 1);
    }
    return path;
  }
}