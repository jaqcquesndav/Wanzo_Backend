import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as client from 'prom-client';
import * as http from 'http';

@Injectable()
export class PrometheusService implements OnModuleInit {
  private server!: http.Server; // Added definite assignment assertion
  private readonly register = new client.Registry();
  private prefix = 'auth_service_';

  // Métriques standard
  public httpRequestsTotal: client.Counter<string>;
  public httpRequestDuration: client.Histogram<string>;
  public activeUsers: client.Gauge<string>;
  public databaseQueryDuration: client.Histogram<string>;

  // Métriques spécifiques à l'authentification
  public loginAttemptsTotal: client.Counter<string>;
  public tokenGenerationTotal: client.Counter<string>;
  public tokenValidationTotal: client.Counter<string>;
  public authFailuresTotal: client.Counter<string>;
  public passwordResetRequestsTotal: client.Counter<string>;
  public userRegistrationsTotal: client.Counter<string>;

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
      help: "Nombre d'utilisateurs actuellement connectés",
    });

    // Durée des requêtes à la base de données
    this.databaseQueryDuration = new client.Histogram({
      name: `${this.prefix}database_query_duration_seconds`,
      help: 'Durée des requêtes à la base de données en secondes',
      labelNames: ['query', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    });

    // Compteur de tentatives de connexion
    this.loginAttemptsTotal = new client.Counter({
      name: `${this.prefix}login_attempts_total`,
      help: 'Nombre total de tentatives de connexion',
      labelNames: ['status', 'user_type', 'auth_method'],
    });

    // Compteur de générations de token
    this.tokenGenerationTotal = new client.Counter({
      name: `${this.prefix}token_generation_total`,
      help: 'Nombre total de tokens générés',
      labelNames: ['token_type', 'user_type'],
    });

    // Compteur de validations de token
    this.tokenValidationTotal = new client.Counter({
      name: `${this.prefix}token_validation_total`,
      help: 'Nombre total de validations de token',
      labelNames: ['token_type', 'status'],
    });

    // Compteur d'échecs d'authentification
    this.authFailuresTotal = new client.Counter({
      name: `${this.prefix}auth_failures_total`,
      help: 'Nombre total d\'échecs d\'authentification',
      labelNames: ['reason', 'auth_method'],
    });

    // Compteur de demandes de réinitialisation de mot de passe
    this.passwordResetRequestsTotal = new client.Counter({
      name: `${this.prefix}password_reset_requests_total`,
      help: 'Nombre total de demandes de réinitialisation de mot de passe',
      labelNames: ['status'],
    });

    // Compteur d'inscriptions d'utilisateurs
    this.userRegistrationsTotal = new client.Counter({
      name: `${this.prefix}user_registrations_total`,
      help: 'Nombre total d\'inscriptions d\'utilisateurs',
      labelNames: ['user_type', 'status'],
    });
  }

  onModuleInit() {
    // Démarrage du serveur Prometheus sur un port séparé
    const port = this.configService.get<number>('PROMETHEUS_PORT', 9467);
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

  // Méthodes spécifiques à l'authentification
  recordLoginAttempt(status: string, userType: string, authMethod: string) {
    this.loginAttemptsTotal.inc({ status, user_type: userType, auth_method: authMethod });
  }

  recordTokenGeneration(tokenType: string, userType: string) {
    this.tokenGenerationTotal.inc({ token_type: tokenType, user_type: userType });
  }

  recordTokenValidation(tokenType: string, status: string) {
    this.tokenValidationTotal.inc({ token_type: tokenType, status });
  }

  recordAuthFailure(reason: string, authMethod: string) {
    this.authFailuresTotal.inc({ reason, auth_method: authMethod });
  }

  recordPasswordResetRequest(status: string) {
    this.passwordResetRequestsTotal.inc({ status });
  }

  recordUserRegistration(userType: string, status: string) {
    this.userRegistrationsTotal.inc({ user_type: userType, status });
  }
}
