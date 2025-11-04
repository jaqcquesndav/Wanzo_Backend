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
        prefix: 'accounting', // Correspond au préfixe utilisé par le frontend dans config.ts
      },
      {
        service: 'portfolio-institution',
        baseUrl: this.configService.get('PORTFOLIO_INSTITUTION_SERVICE_URL', 'http://localhost:3005'),
        prefix: 'portfolio/api/v1',
      },
      {
        service: 'customer',
        baseUrl: this.configService.get('CUSTOMER_SERVICE_URL', 'http://localhost:3011'),
        prefix: 'land/api/v1',
      },
    ];
  }

  resolveRoute(path: string): ServiceRoute | null {
    // Remove leading slash
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    
    this.logger.debug(`Resolving route for path: ${path}, normalized: ${normalizedPath}`);
    
    // Find matching route
    const route = this.routes.find(r => {
      const matches = normalizedPath.startsWith(r.prefix);
      this.logger.debug(`Checking prefix "${r.prefix}" against "${normalizedPath}": ${matches}`);
      return matches;
    });
    
    if (route) {
      this.logger.debug(`Resolved path ${path} to service ${route.service} (prefix: ${route.prefix}, baseUrl: ${route.baseUrl})`);
      return route;
    }

    this.logger.warn(`No service found for path ${path}. Available prefixes: ${this.routes.map(r => r.prefix).join(', ')}`);
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
    // Normalize both path and prefix to remove leading slashes
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    const normalizedPrefix = prefix.startsWith('/') ? prefix.substring(1) : prefix;
    
    this.logger.debug(`stripPrefix - original path: ${path}, prefix: ${prefix}, normalized path: ${normalizedPath}, normalized prefix: ${normalizedPrefix}`);
    
    if (normalizedPath.startsWith(normalizedPrefix)) {
      // Remove the prefix and ensure we have a clean path
      const remainingPath = normalizedPath.substring(normalizedPrefix.length);
      // If the remaining path starts with '/', remove it; otherwise add one
      const result = remainingPath.startsWith('/') ? remainingPath : '/' + remainingPath;
      this.logger.debug(`stripPrefix result: ${result}`);
      return result;
    }
    
    // If path doesn't start with prefix, return the original path with leading slash
    const result = path.startsWith('/') ? path : '/' + path;
    this.logger.debug(`stripPrefix no match, returning: ${result}`);
    return result;
  }
}
