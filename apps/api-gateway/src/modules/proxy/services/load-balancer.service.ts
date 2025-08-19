import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ServiceInstance {
  url: string;
  weight: number;
  healthy: boolean;
  lastCheck: number;
}

@Injectable()
export class LoadBalancerService {
  private readonly logger = new Logger(LoadBalancerService.name);
  private readonly instances: Map<string, ServiceInstance[]> = new Map();
  private readonly roundRobinCounters: Map<string, number> = new Map();

  constructor(private configService: ConfigService) {
    // Initialize service instances from config
    this.initializeInstances();
  }

  getNextInstance(service: string): string {
    const instances = this.instances.get(service) || [];
    const healthyInstances = instances.filter(i => i.healthy);

    if (healthyInstances.length === 0) {
      throw new Error(`No healthy instances available for service: ${service}`);
    }

    // Round robin selection
    const counter = (this.roundRobinCounters.get(service) || 0) + 1;
    this.roundRobinCounters.set(service, counter);
    
    const index = counter % healthyInstances.length;
    return healthyInstances[index].url;
  }

  markInstanceUnhealthy(service: string, url: string): void {
    const instances = this.instances.get(service);
    if (!instances) return;

    const instance = instances.find(i => i.url === url);
    if (instance) {
      instance.healthy = false;
      instance.lastCheck = Date.now();
      this.logger.warn(`Marked instance ${url} as unhealthy for service ${service}`);
    }
  }

  markInstanceHealthy(service: string, url: string): void {
    const instances = this.instances.get(service);
    if (!instances) return;

    const instance = instances.find(i => i.url === url);
    if (instance) {
      instance.healthy = true;
      instance.lastCheck = Date.now();
    }
  }
  private initializeInstances(): void {
    const services = [
      'admin',
      'analytics',
      'accounting',
      'portfolio-institution'
    ];

    services.forEach(service => {
      const urls = this.configService.get<string[]>(`${service.toUpperCase()}_SERVICE_URLS`);
      if (!urls) return;

      this.instances.set(service, urls.map(url => ({
        url,
        weight: 1,
        healthy: true,
        lastCheck: Date.now()
      })));
    });
  }
}
