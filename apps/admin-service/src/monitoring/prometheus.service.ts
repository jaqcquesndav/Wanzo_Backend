import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as client from 'prom-client';
import * as http from 'http';

@Injectable()
export class PrometheusService implements OnModuleInit {
  private server: http.Server;
  private prefix = 'admin_service_';
  
  // Définition des métriques
  public httpRequestsTotal: client.Counter<string>;
  public httpRequestDuration: client.Histogram<string>;
  public activeUsers: client.Gauge<string>;
  public databaseQueryDuration: client.Histogram<string>;
  
  constructor(private configService: ConfigService) {
    // Configuration des métriques par défaut
    client.collectDefaultMetrics({ prefix: this.prefix });
    
    // Compteur de requêtes HTTP
    this.httpRequestsTotal = new client.Counter({
      name: `${this.prefix}http_requests_total`,
      help: 'Total des requêtes HTTP',
      labelNames: ['method', 'path', 'status'],
    });
    
    // Durée des requêtes HTTP
    this.httpRequestDuration = new client.Histogram({
      name: `${this.prefix}http_request_duration_seconds`,
      help: 'Durée des requêtes HTTP en secondes',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    });
    
    // Utilisateurs actifs
    this.activeUsers = new client.Gauge({
      name: `${this.prefix}active_users`,
      help: 'Nombre d\'utilisateurs actuellement connectés',
    });
    
    // Durée des requêtes à la base de données
    this.databaseQueryDuration = new client.Histogram({
      name: `${this.prefix}database_query_duration_seconds`,
      help: 'Durée des requêtes à la base de données en secondes',
      labelNames: ['query', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    });
  }
  
  onModuleInit() {
    // Démarrage du serveur Prometheus sur un port séparé
    const port = this.configService.get<number>('PROMETHEUS_PORT', 9464);
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
      console.log(`Prometheus metrics server running on port ${port}`);
    });
  }
  
  // Méthode pour mesurer la durée d'une requête HTTP
  measureHttpRequest(method: string, path: string, status: number, duration: number) {
    this.httpRequestsTotal.inc({ method, path, status });
    this.httpRequestDuration.observe({ method, path, status }, duration);
  }
  
  // Méthode pour mesurer la durée d'une requête à la base de données
  measureDatabaseQuery(query: string, table: string, duration: number) {
    this.databaseQueryDuration.observe({ query, table }, duration);
  }
  
  // Méthode pour mettre à jour le nombre d'utilisateurs actifs
  setActiveUsers(count: number) {
    this.activeUsers.set(count);
  }
}
