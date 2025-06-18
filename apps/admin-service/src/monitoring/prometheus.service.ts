import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as client from 'prom-client';
import * as http from 'http';

@Injectable()
export class PrometheusService implements OnModuleInit {
  private server: http.Server;
  private prefix = 'admin_service_';
  private readonly logger = new Logger(PrometheusService.name);
  private static metricsInitialized = false;
  
  // Définition des métriques
  public static httpRequestsTotal: client.Counter<string>;
  public static httpRequestDuration: client.Histogram<string>;
  public static activeUsers: client.Gauge<string>;
  public static databaseQueryDuration: client.Histogram<string>;
  
  constructor(private configService: ConfigService) {
    if (!PrometheusService.metricsInitialized) {
      this.logger.log('Initializing Prometheus metrics...');
      try {
        client.collectDefaultMetrics({ prefix: this.prefix });
        
        // Compteur de requêtes HTTP
        PrometheusService.httpRequestsTotal = new client.Counter({
          name: `${this.prefix}http_requests_total`,
          help: 'Total des requêtes HTTP',
          labelNames: ['method', 'path', 'status'],
        });
        
        // Durée des requêtes HTTP
        PrometheusService.httpRequestDuration = new client.Histogram({
          name: `${this.prefix}http_request_duration_seconds`,
          help: 'Durée des requêtes HTTP en secondes',
          labelNames: ['method', 'path', 'status'],
          buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
        });
        
        // Utilisateurs actifs
        PrometheusService.activeUsers = new client.Gauge({
          name: `${this.prefix}active_users`,
          help: `Nombre d'utilisateurs actuellement connectés`,
        });
        
        // Durée des requêtes à la base de données
        PrometheusService.databaseQueryDuration = new client.Histogram({
          name: `${this.prefix}database_query_duration_seconds`,
          help: 'Durée des requêtes à la base de données en secondes',
          labelNames: ['query', 'table'],
          buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
        });

        PrometheusService.metricsInitialized = true;
        this.logger.log('Prometheus metrics initialized.');
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('already been registered')) {
            this.logger.warn(`Prometheus metrics already registered: ${error.message}`);
          } else {
            this.logger.error(`Error initializing Prometheus metrics: ${error.message}`, error.stack);
          }
        } else {
            this.logger.error('An unknown error occurred during Prometheus metrics initialization', String(error));
        }
      }
    }
  }
  
  onModuleInit() {
    // Démarrage du serveur Prometheus sur un port séparé
    const port = this.configService.get<number>('PROMETHEUS_PORT', 9465);
    this.server = http.createServer(async (req, res) => {
      if (req.url === '/metrics') {
        res.setHeader('Content-Type', client.register.contentType);
        res.end(await client.register.metrics());
      } else {
        res.statusCode = 404;
        res.end('Not found');
      }
    });
    
    this.server.listen(port, () => {
      this.logger.log(`Prometheus metrics server running on port ${port}`);
    });
  }
  
  // Méthode pour mesurer la durée d'une requête HTTP
  measureHttpRequest(method: string, path: string, status: number, duration: number) {
    PrometheusService.httpRequestsTotal.inc({ method, path, status });
    PrometheusService.httpRequestDuration.observe({ method, path, status }, duration);
  }
  
  // Méthode pour mesurer la durée d'une requête à la base de données
  measureDatabaseQuery(query: string, table: string, duration: number) {
    PrometheusService.databaseQueryDuration.observe({ query, table }, duration);
  }
  
  // Méthode pour mettre à jour le nombre d'utilisateurs actifs
  setActiveUsers(count: number) {
    PrometheusService.activeUsers.set(count);
  }
}
