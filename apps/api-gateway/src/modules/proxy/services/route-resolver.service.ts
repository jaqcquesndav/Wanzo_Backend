import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ServiceRoute {
  service: string;
  baseUrl: string;
  prefix: string;
  healthCheck: string;
  scopes: string[];
  roles: string[];
}

@Injectable()
export class RouteResolverService {
  getRoutes() {
    throw new Error('Method not implemented.');
  }
  private readonly logger = new Logger(RouteResolverService.name);
  private readonly routes: ServiceRoute[];  constructor(private configService: ConfigService) {
    const envGet = (key: string, defaultValue: string) => {
      const cfg: any = this.configService as any;
      if (cfg && typeof cfg.get === 'function') return cfg.get(key, defaultValue);
      return (process.env as any)[key] ?? defaultValue;
    };

    this.routes = [
      {
        service: 'admin',
        baseUrl: envGet('ADMIN_SERVICE_URL', 'http://localhost:3001'),
        prefix: 'admin',
        healthCheck: '/health',
        scopes: ['admin:full', 'users:manage', 'settings:manage'],
        roles: ['admin', 'superadmin'],
      },
      {
        service: 'app_mobile',
        baseUrl: envGet('APP_MOBILE_SERVICE_URL', 'http://localhost:3006'),
        prefix: 'mobile',
        healthCheck: '/health',
        scopes: ['mobile:read', 'mobile:write'],
        roles: ['user', 'admin'],
      },
      {
        service: 'analytics',
        baseUrl: envGet('ANALYTICS_SERVICE_URL', 'http://localhost:3002'),
        prefix: 'analytics',
        healthCheck: '/health',
        scopes: ['analytics:read', 'analytics:write'],
        roles: ['admin', 'analyst'],
      },
      {
        service: 'accounting',
        baseUrl: envGet('ACCOUNTING_SERVICE_URL', 'http://localhost:3003'),
        prefix: 'accounting',
        healthCheck: '/health',
        scopes: ['accounting:read', 'accounting:write'],
        roles: ['admin', 'accountant'],
      },
      {
        service: 'portfolio-institution',
        baseUrl: envGet('PORTFOLIO_INSTITUTION_SERVICE_URL', 'http://localhost:3005'),
        prefix: 'portfolio/institution',
        healthCheck: '/health',
        scopes: ['portfolio:read', 'portfolio:write', 'institution:manage'],
        roles: ['admin', 'manager'],
      },
      {
        service: 'customer',
        baseUrl: envGet('CUSTOMER_SERVICE_URL', 'http://localhost:3011'),
        prefix: 'customers',
        healthCheck: '/health',
        scopes: ['customers:read', 'customers:write', 'users:read', 'users:write', 'subscriptions:read', 'subscriptions:write'],
        roles: ['admin', 'superadmin', 'service'],
      },
      {
        service: 'adha-ai',
        baseUrl: envGet('ADHA_AI_SERVICE_URL', 'http://localhost:3010'),
        prefix: 'adha-ai',
        healthCheck: '/health',
        scopes: ['ai:use', 'ai:read', 'ai:write'],
        roles: ['admin', 'user', 'analyst', 'accountant', 'manager'],
      },
      {
        service: 'gestion_commerciale',
        baseUrl: envGet('GESTION_COMMERCIALE_SERVICE_URL', 'http://localhost:3006'),
        prefix: 'commerce',
        healthCheck: '/health',
        scopes: ['commerce:read', 'commerce:write', 'operations:manage', 'inventory:manage'],
        roles: ['admin', 'user', 'manager', 'accountant'],
      },
        {
          service: 'payment',
          baseUrl: envGet('PAYMENT_SERVICE_URL', 'http://localhost:3007'),
          prefix: 'payments',
          healthCheck: '/health',
          scopes: ['payments:read', 'payments:write'],
          roles: ['admin', 'service', 'accountant'],
        },
    ];
  }

  resolveRoute(path: string): ServiceRoute | null {
    // Remove leading slash
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;

    // 1. Cas spécial : adha-ai en sous-préfixe (ex: /accounting/adha-ai/..., /mobile/adha-ai/...)
    if (normalizedPath.includes('/adha-ai/')) {
      const adhaRoute = this.routes.find(r => r.service === 'adha-ai');
      if (adhaRoute) {
        this.logger.debug(`Resolved path ${path} to service adha-ai (sub-prefix match)`);
        return adhaRoute;
      }
    }

    // 2. Cas classique : préfixe direct
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

  getServiceScopes(service: string): string[] {
    const route = this.routes.find(r => r.service === service);
    return route ? route.scopes : [];
  }

  getServiceRoles(service: string): string[] {
    const route = this.routes.find(r => r.service === service);
    return route ? route.roles : [];
  }

  getServiceHealthCheck(service: string): string | null {
    const route = this.routes.find(r => r.service === service);
    return route ? route.healthCheck : null;
  }

  stripPrefix(path: string, prefix: string): string {
    if (path.startsWith(`/${prefix}`)) {
      return path.substring(prefix.length + 1);
    }
    return path;
  }

  getAllServices(): ServiceRoute[] {
    return this.routes;
  }

  validateAccess(service: string, userScopes: string[], userRole: string): boolean {
    const route = this.routes.find(r => r.service === service);
    if (!route) return false;

    // Check if user has required role
    const hasRole = route.roles.includes('*') || route.roles.includes(userRole);
    if (!hasRole) return false;

    // Check if user has required scopes
    const hasScopes = route.scopes.every(scope => userScopes.includes(scope));
    if (!hasScopes) return false;

    return true;
  }

  getServiceMetrics(): Record<string, any> {
    return this.routes.reduce((metrics, route) => {
      metrics[route.service] = {
        baseUrl: route.baseUrl,
        prefix: route.prefix,
        scopes: route.scopes,
        roles: route.roles,
      };
      return metrics;
    }, {} as Record<string, any>);
  }
}