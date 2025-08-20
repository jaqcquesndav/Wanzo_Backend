import { Injectable } from '@nestjs/common';
import * as prometheus from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly register: prometheus.Registry;
  private readonly prefix: string = 'customer_service_';
  
  // Définir les métriques spécifiques au service
  private readonly userCreationCounter: prometheus.Counter<string>;
  private readonly customerCreationCounter: prometheus.Counter<string>;
  private readonly fileUploadCounter: prometheus.Counter<string>;
  private readonly userLoginCounter: prometheus.Counter<string>;
  private readonly documentUploadDuration: prometheus.Histogram<string>;
  private readonly apiRequestDuration: prometheus.Histogram<string>;
  private readonly userCountGauge: prometheus.Gauge<string>;
  private readonly smeCountGauge: prometheus.Gauge<string>;
  private readonly institutionCountGauge: prometheus.Gauge<string>;
  private readonly activeUsersGauge: prometheus.Gauge<string>;

  constructor() {
    // Créer un nouveau registre
    this.register = new prometheus.Registry();
    
    // Collecter les métriques par défaut (mémoire, CPU, etc)
    prometheus.collectDefaultMetrics({
      register: this.register,
      prefix: this.prefix,
    });

    // Définir les compteurs
    this.userCreationCounter = new prometheus.Counter({
      name: `${this.prefix}user_creations_total`,
      help: 'Total number of user creations',
      labelNames: ['userType', 'role'],
      registers: [this.register],
    });

    this.customerCreationCounter = new prometheus.Counter({
      name: `${this.prefix}customer_creations_total`,
      help: 'Total number of customer creations',
      labelNames: ['customerType'],
      registers: [this.register],
    });

    this.fileUploadCounter = new prometheus.Counter({
      name: `${this.prefix}file_uploads_total`,
      help: 'Total number of file uploads',
      labelNames: ['fileType', 'customerType'],
      registers: [this.register],
    });

    this.userLoginCounter = new prometheus.Counter({
      name: `${this.prefix}user_logins_total`,
      help: 'Total number of user logins',
      labelNames: ['userType', 'role'],
      registers: [this.register],
    });

    // Définir les histogrammes pour mesurer la durée
    this.documentUploadDuration = new prometheus.Histogram({
      name: `${this.prefix}document_upload_duration_seconds`,
      help: 'Duration of document uploads in seconds',
      labelNames: ['documentType'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 20],
      registers: [this.register],
    });

    this.apiRequestDuration = new prometheus.Histogram({
      name: `${this.prefix}api_request_duration_seconds`,
      help: 'Duration of API requests in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.register],
    });

    // Définir les jauges pour mesurer les valeurs actuelles
    this.userCountGauge = new prometheus.Gauge({
      name: `${this.prefix}user_count`,
      help: 'Current number of users',
      labelNames: ['status'],
      registers: [this.register],
    });

    this.smeCountGauge = new prometheus.Gauge({
      name: `${this.prefix}sme_count`,
      help: 'Current number of SMEs',
      labelNames: ['status'],
      registers: [this.register],
    });

    this.institutionCountGauge = new prometheus.Gauge({
      name: `${this.prefix}institution_count`,
      help: 'Current number of financial institutions',
      labelNames: ['status'],
      registers: [this.register],
    });

    this.activeUsersGauge = new prometheus.Gauge({
      name: `${this.prefix}active_users`,
      help: 'Current number of active users',
      labelNames: ['userType'],
      registers: [this.register],
    });

    // Enregistrer toutes les métriques
    this.register.registerMetric(this.userCreationCounter);
    this.register.registerMetric(this.customerCreationCounter);
    this.register.registerMetric(this.fileUploadCounter);
    this.register.registerMetric(this.userLoginCounter);
    this.register.registerMetric(this.documentUploadDuration);
    this.register.registerMetric(this.apiRequestDuration);
    this.register.registerMetric(this.userCountGauge);
    this.register.registerMetric(this.smeCountGauge);
    this.register.registerMetric(this.institutionCountGauge);
    this.register.registerMetric(this.activeUsersGauge);
  }

  // Méthode pour obtenir le registre
  getRegister(): prometheus.Registry {
    return this.register;
  }
  
  // Méthode pour définir le registre externe
  setRegister(register: prometheus.Registry): void {
    // This is a workaround to allow setting a custom registry
    (this as any).register = register;
  }

  // Méthode pour incrémenter le compteur de créations d'utilisateurs
  incrementUserCreation(userType: string, role: string): void {
    this.userCreationCounter.inc({ userType, role });
  }

  // Méthode pour incrémenter le compteur de créations de clients
  incrementCustomerCreation(customerType: string): void {
    this.customerCreationCounter.inc({ customerType });
  }

  // Méthode pour incrémenter le compteur d'upload de fichiers
  incrementFileUpload(fileType: string, customerType: string): void {
    this.fileUploadCounter.inc({ fileType, customerType });
  }

  // Méthode pour incrémenter le compteur de connexions utilisateur
  incrementUserLogin(userType: string, role: string): void {
    this.userLoginCounter.inc({ userType, role });
  }

  // Méthode pour observer la durée d'upload de documents
  observeDocumentUploadDuration(documentType: string, durationInSeconds: number): void {
    this.documentUploadDuration.observe({ documentType }, durationInSeconds);
  }

  // Méthode pour observer la durée des requêtes API
  observeApiRequestDuration(method: string, route: string, status: string, durationInSeconds: number): void {
    this.apiRequestDuration.observe({ method, route, status }, durationInSeconds);
  }

  // Méthode pour mettre à jour le nombre d'utilisateurs
  setUserCount(status: string, count: number): void {
    this.userCountGauge.set({ status }, count);
  }

  // Méthode pour mettre à jour le nombre de PME
  setSmeCount(status: string, count: number): void {
    this.smeCountGauge.set({ status }, count);
  }

  // Méthode pour mettre à jour le nombre d'institutions financières
  setInstitutionCount(status: string, count: number): void {
    this.institutionCountGauge.set({ status }, count);
  }

  // Méthode pour mettre à jour le nombre d'utilisateurs actifs
  setActiveUsers(userType: string, count: number): void {
    this.activeUsersGauge.set({ userType }, count);
  }
}
