import { Injectable, Logger } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly logger = new Logger(PrometheusService.name);
  private readonly registry: Registry;
  private readonly requestCounter: Counter<string>;
  private readonly requestDurationHistogram: Histogram<string>;
  private readonly errorCounter: Counter<string>;
  private readonly memoryGauge: Gauge<string>;

  constructor() {
    // Création d'un registre dédié pour nos métriques
    this.registry = new Registry();

    // Définition d'un compteur pour le nombre total de requêtes HTTP
    this.requestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Nombre total de requêtes HTTP reçues',
      labelNames: ['service', 'method', 'path', 'status'],
      registers: [this.registry],
    });

    // Définition d'un histogramme pour mesurer la durée des requêtes HTTP
    this.requestDurationHistogram = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Durée des requêtes HTTP en secondes',
      labelNames: ['service', 'method', 'path'],
      buckets: [0.1, 0.5, 1, 2, 5], // Ajustez les buckets selon vos besoins
      registers: [this.registry],
    });

    // Définition d'un compteur pour enregistrer le nombre d'erreurs lors des requêtes HTTP
    this.errorCounter = new Counter({
      name: 'http_request_errors_total',
      help: 'Nombre total d\'erreurs lors des requêtes HTTP',
      labelNames: ['service', 'method', 'path', 'error'],
      registers: [this.registry],
    });

    // Définition d'une jauge pour mesurer l'utilisation mémoire du processus Node.js
    this.memoryGauge = new Gauge({
      name: 'node_process_memory_usage_bytes',
      help: 'Utilisation de la mémoire par le processus Node.js en octets',
      labelNames: ['type'], // Exemples de types : rss, heapTotal, heapUsed, external, arrayBuffers
      registers: [this.registry],
    });
  }

  /**
   * Enregistre une requête HTTP
   *
   * @param service Nom du service appelé
   * @param method Méthode HTTP utilisée (GET, POST, etc.)
   * @param path Chemin de la requête
   * @param status Code de réponse HTTP
   * @param duration Durée de la requête en millisecondes
   */
  recordRequest(service: string, method: string, path: string, status: number, duration: number): void {
    this.requestCounter.labels(service, method, path, status.toString()).inc();
    this.requestDurationHistogram.labels(service, method, path).observe(duration / 1000);
    this.logger.debug(`Requête enregistrée : ${method} ${path} - ${status} - ${duration}ms`);
  }

  /**
   * Enregistre une erreur survenue lors d'une requête
   *
   * @param service Nom du service appelé
   * @param method Méthode HTTP utilisée
   * @param path Chemin de la requête
   * @param error Description ou type de l'erreur
   */
  recordError(service: string, method: string, path: string, error: string): void {
    this.errorCounter.labels(service, method, path, error).inc();
    this.logger.error(`Erreur enregistrée : ${method} ${path} - ${error}`);
  }

  /**
   * Met à jour la jauge de l'utilisation de la mémoire du processus Node.js.
   * Cette méthode récupère l'utilisation actuelle de la mémoire et met à jour la jauge pour chaque type.
   */
  updateMemoryUsage(): void {
    const memoryUsage = process.memoryUsage();
    this.memoryGauge.labels('rss').set(memoryUsage.rss);
    this.memoryGauge.labels('heapTotal').set(memoryUsage.heapTotal);
    this.memoryGauge.labels('heapUsed').set(memoryUsage.heapUsed);
    this.memoryGauge.labels('external').set(memoryUsage.external);
    if (memoryUsage.arrayBuffers !== undefined) {
      this.memoryGauge.labels('arrayBuffers').set(memoryUsage.arrayBuffers);
    }
  }

  /**
   * Retourne l'ensemble des métriques au format texte, compatible avec Prometheus.
   * Avant de renvoyer les métriques, on met à jour la jauge mémoire.
   *
   * @returns Promise<string>
   */
  async getMetrics(): Promise<string> {
    this.updateMemoryUsage();
    return this.registry.metrics();
  }
}
