export interface ServiceRoute {
    service: string;
    baseUrl: string;
    prefix: string;
    healthCheck: string;
    scopes: string[];
    roles: string[];
  }
  
  export interface ServiceMetrics {
    baseUrl: string;
    prefix: string;
    scopes: string[];
    roles: string[];
    status?: string;
    latency?: number;
    successRate?: number;
  }