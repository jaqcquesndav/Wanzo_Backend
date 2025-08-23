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
  private readonly logger = new Logger(RouteResolverService.name);
  private readonly routes: ServiceRoute[];

  constructor(private configService: ConfigService) {
    this.routes = [
      {
        service: 'admin',
        baseUrl: this.configService.get('ADMIN_SERVICE_URL', 'http://localhost:3001'),
        prefix: 'admin',
        healthCheck: '/health',
        scopes: ['admin:full', 'users:manage', 'settings:manage'],
        roles: ['admin', 'superadmin'],
      },
      {
        service: 'app_mobile',
        baseUrl: this.configService.get('APP_MOBILE_SERVICE_URL', 'http://localhost:3006'),
        prefix: 'mobile',
        healthCheck: '/health',
        scopes: ['mobile:read', 'mobile:write'],
        roles: ['user', 'admin'],
      },
      {
        service: 'analytics',
        baseUrl: this.configService.get('ANALYTICS_SERVICE_URL', 'http://localhost:3002'),
        prefix: 'analytics',
        healthCheck: '/health',
        scopes: ['analytics:read', 'analytics:write'],
        roles: ['admin', 'analyst'],
      },
      {
        service: 'accounting',
        baseUrl: this.configService.get('ACCOUNTING_SERVICE_URL', 'http://localhost:3003'),
        prefix: 'accounting',
        healthCheck: '/health',
        scopes: ['accounting:read', 'accounting:write'],
        roles: ['admin', 'accountant'],
      },
      {
        service: 'portfolio-institution',
        baseUrl: this.configService.get('PORTFOLIO_INSTITUTION_SERVICE_URL', 'http://localhost:3005'),
        prefix: 'portfolio',
        healthCheck: '/health',
        scopes: ['portfolio:read', 'portfolio:write', 'institution:manage'],
        roles: ['admin', 'manager'],
      },
      {
        service: 'customer',
        baseUrl: this.configService.get('CUSTOMER_SERVICE_URL', 'http://localhost:3011'),
        prefix: 'land/api/v1',
        healthCheck: '/health',
        scopes: ['customers:read', 'customers:write', 'users:read', 'users:write', 'subscriptions:read', 'subscriptions:write'],
        roles: ['admin', 'superadmin', 'service'],
      },
      {
        service: 'adha-ai',
        baseUrl: this.configService.get('ADHA_AI_SERVICE_URL', 'http://localhost:3010'),
        prefix: 'adha-ai',
        healthCheck: '/health',
        scopes: ['ai:use', 'ai:read', 'ai:write'],
        roles: ['admin', 'user', 'analyst', 'accountant', 'manager'],
      },
      {
        service: 'gestion_commerciale',
        baseUrl: this.configService.get('GESTION_COMMERCIALE_SERVICE_URL', 'http://localhost:3006'),
        prefix: 'commerce',
        healthCheck: '/health',
        scopes: ['commerce:read', 'commerce:write', 'operations:manage', 'inventory:manage'],
        roles: ['admin', 'user', 'manager', 'accountant'],
      },
    ];
  }

  resolveRoute(path: string): ServiceRoute | null {
    // Remove leading slash
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    
    this.logger.debug(`Resolving route for path: ${path}, normalized: ${normalizedPath}`);

    // 1. Cas spécial : adha-ai en sous-préfixe (ex: /accounting/adha-ai/..., /mobile/adha-ai/...)
    if (normalizedPath.includes('/adha-ai/')) {
      const adhaRoute = this.routes.find(r => r.service === 'adha-ai');
      if (adhaRoute) {
        this.logger.debug(`Resolved path ${path} to service adha-ai (sub-prefix match)`);
        return adhaRoute;
      }
    }

    // 2. Cas spécial pour admin : gérer à la fois /admin/ et /admin/api/
    if (normalizedPath.startsWith('admin/')) {
      const adminRoute = this.routes.find(r => r.service === 'admin');
      if (adminRoute) {
        // Gérer le cas où le chemin commence par admin/api
        this.logger.debug(`Resolved path ${path} to service admin (special case)`);
        return adminRoute;
      }
    }

    // 3. Cas classique : préfixe direct
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
    // Pour le service admin, traiter de manière spéciale
    if (prefix === 'admin' && path.startsWith('/admin/')) {
      // Si le chemin commence par /admin/api/, supprimer admin/api
      if (path.startsWith('/admin/api/')) {
        return path.substring('/admin/api'.length);
      }
      // Sinon, supprimer simplement admin
      return path.substring('/admin'.length);
    }

    // Comportement normal - s'assurer que le préfixe commence par /
    const normalizedPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`;
    if (path.startsWith(normalizedPrefix)) {
      return path.substring(normalizedPrefix.length);
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

  getRoutes(): ServiceRoute[] {
    return this.routes;
  }
}
