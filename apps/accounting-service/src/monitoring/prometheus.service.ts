import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as client from 'prom-client';
import * as http from 'http';

@Injectable()
export class PrometheusService implements OnModuleInit {
  private server!: http.Server; // Added definite assignment assertion
  private readonly register = new client.Registry();
  private prefix = 'accounting_service_';
  
  // Métriques standard
  public httpRequestsTotal: client.Counter<string>;
  public httpRequestDuration: client.Histogram<string>;
  public activeUsers: client.Gauge<string>;
  public databaseQueryDuration: client.Histogram<string>;
  
  // Métriques spécifiques au domaine comptable
  public journalEntriesCreated: client.Counter<string>;
  public transactionValue: client.Histogram<string>;
  public accountBalanceGauge: client.Gauge<string>;
  public reconciliationDuration: client.Histogram<string>;
  public monthlyCloseDuration: client.Histogram<string>;
  
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
    
    // Compteur d'entrées de journal comptable créées
    this.journalEntriesCreated = new client.Counter({
      name: `${this.prefix}journal_entries_created_total`,
      help: 'Nombre total d\'entrées de journal comptable créées',
      labelNames: ['journal_type', 'status', 'user_type'],
    });
    
    // Histogramme des valeurs de transactions
    this.transactionValue = new client.Histogram({
      name: `${this.prefix}transaction_value`,
      help: 'Valeur des transactions en unités monétaires',
      labelNames: ['transaction_type', 'currency'],
      buckets: [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
    });
    
    // Jauge des soldes des comptes
    this.accountBalanceGauge = new client.Gauge({
      name: `${this.prefix}account_balance`,
      help: 'Solde actuel des comptes en unités monétaires',
      labelNames: ['account_type', 'currency', 'account_id'],
    });
    
    // Durée des réconciliations
    this.reconciliationDuration = new client.Histogram({
      name: `${this.prefix}reconciliation_duration_seconds`,
      help: 'Durée des opérations de réconciliation en secondes',
      labelNames: ['account_type', 'reconciliation_type'],
      buckets: [1, 5, 10, 30, 60, 300, 600, 1800, 3600],
    });
    
    // Durée des clôtures mensuelles
    this.monthlyCloseDuration = new client.Histogram({
      name: `${this.prefix}monthly_close_duration_seconds`,
      help: 'Durée des opérations de clôture mensuelle en secondes',
      labelNames: ['year', 'month'],
      buckets: [60, 300, 600, 1800, 3600, 7200, 14400, 28800],
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
  
  // Méthodes spécifiques au domaine comptable
  recordJournalEntry(journalType: string, status: string, userType: string) {
    this.journalEntriesCreated.inc({ journal_type: journalType, status, user_type: userType });
  }
  
  recordTransactionValue(transactionType: string, currency: string, value: number) {
    this.transactionValue.observe({ transaction_type: transactionType, currency }, value);
  }
  
  updateAccountBalance(accountType: string, currency: string, accountId: string, balance: number) {
    this.accountBalanceGauge.set({ account_type: accountType, currency, account_id: accountId }, balance);
  }
  
  measureReconciliationDuration(accountType: string, reconciliationType: string, duration: number) {
    this.reconciliationDuration.observe({ account_type: accountType, reconciliation_type: reconciliationType }, duration);
  }
  
  measureMonthlyCloseDuration(year: string, month: string, duration: number) {
    this.monthlyCloseDuration.observe({ year, month }, duration);
  }
}
