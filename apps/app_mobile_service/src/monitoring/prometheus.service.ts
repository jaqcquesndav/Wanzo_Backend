import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as client from 'prom-client';
import * as http from 'http';

@Injectable()
export class PrometheusService implements OnModuleInit {
  private server: http.Server;
  private prefix = 'mobile_service_';
  
  // Métriques standard
  public httpRequestsTotal: client.Counter<string>;
  public httpRequestDuration: client.Histogram<string>;
  public activeUsers: client.Gauge<string>;
  public databaseQueryDuration: client.Histogram<string>;
  
  // Métriques spécifiques à l'application mobile
  public appSessions: client.Counter<string>;
  public mobileApiCalls: client.Counter<string>;
  public pushNotificationsSent: client.Counter<string>;
  public syncOperationsTotal: client.Counter<string>;
  public deviceConnections: client.Gauge<string>;
  public operationLatency: client.Histogram<string>;
  
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
    
    // Sessions d'application mobile
    this.appSessions = new client.Counter({
      name: `${this.prefix}app_sessions_total`,
      help: 'Nombre total de sessions d\'application mobile',
      labelNames: ['os_type', 'app_version', 'user_type'],
    });
    
    // Appels API mobile
    this.mobileApiCalls = new client.Counter({
      name: `${this.prefix}mobile_api_calls_total`,
      help: 'Nombre total d\'appels API depuis l\'application mobile',
      labelNames: ['api_name', 'app_version', 'os_type'],
    });
    
    // Notifications push envoyées
    this.pushNotificationsSent = new client.Counter({
      name: `${this.prefix}push_notifications_sent_total`,
      help: 'Nombre total de notifications push envoyées',
      labelNames: ['notification_type', 'priority', 'result'],
    });
    
    // Opérations de synchronisation
    this.syncOperationsTotal = new client.Counter({
      name: `${this.prefix}sync_operations_total`,
      help: 'Nombre total d\'opérations de synchronisation de données',
      labelNames: ['sync_type', 'status', 'data_type'],
    });
    
    // Connexions de dispositifs
    this.deviceConnections = new client.Gauge({
      name: `${this.prefix}device_connections`,
      help: 'Nombre de dispositifs mobiles actuellement connectés',
      labelNames: ['os_type', 'app_version'],
    });
    
    // Latence des opérations
    this.operationLatency = new client.Histogram({
      name: `${this.prefix}operation_latency_seconds`,
      help: 'Latence des opérations mobiles en secondes',
      labelNames: ['operation_type', 'network_type'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30],
    });
  }
  
  onModuleInit() {
    // Démarrage du serveur Prometheus sur un port séparé
    const port = this.configService.get<number>('PROMETHEUS_PORT', 9466);
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
  
  // Méthodes standard
  measureHttpRequest(method: string, path: string, status: number, duration: number) {
    this.httpRequestsTotal.inc({ method, path, status });
    this.httpRequestDuration.observe({ method, path, status }, duration);
  }
  
  measureDatabaseQuery(query: string, table: string, duration: number) {
    this.databaseQueryDuration.observe({ query, table }, duration);
  }
  
  setActiveUsers(count: number) {
    this.activeUsers.set(count);
  }
  
  // Méthodes spécifiques à l'application mobile
  recordAppSession(osType: string, appVersion: string, userType: string) {
    this.appSessions.inc({ os_type: osType, app_version: appVersion, user_type: userType });
  }
  
  recordMobileApiCall(apiName: string, appVersion: string, osType: string) {
    this.mobileApiCalls.inc({ api_name: apiName, app_version: appVersion, os_type: osType });
  }
  
  recordPushNotification(notificationType: string, priority: string, result: string) {
    this.pushNotificationsSent.inc({ notification_type: notificationType, priority, result });
  }
  
  recordSyncOperation(syncType: string, status: string, dataType: string) {
    this.syncOperationsTotal.inc({ sync_type: syncType, status, data_type: dataType });
  }
  
  updateDeviceConnections(osType: string, appVersion: string, count: number) {
    this.deviceConnections.set({ os_type: osType, app_version: appVersion }, count);
  }
  
  measureOperationLatency(operationType: string, networkType: string, duration: number) {
    this.operationLatency.observe({ operation_type: operationType, network_type: networkType }, duration);
  }
}
