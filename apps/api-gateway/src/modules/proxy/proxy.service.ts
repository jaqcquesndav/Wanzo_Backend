import { Injectable } from '@nestjs/common';
import { IncomingHttpHeaders } from 'http';
import { AxiosResponse } from 'axios';
import { PrometheusService } from '../../monitoring/prometheus.service';

@Injectable()
export class ProxyService {
  constructor(private readonly prometheusService: PrometheusService) {}

  /**
   * Méthode pour transférer la requête vers le service approprié.
   * Vous pouvez, par exemple, utiliser Axios pour envoyer la requête.
   */
  async forwardRequest(
    path: string,
    method: string,
    headers: IncomingHttpHeaders,
    body: any
  ): Promise<AxiosResponse<any>> {
    // Implémentez ici la logique de forwarding
    throw new Error('Méthode non implémentée.');
  }

  /**
   * Enregistre une requête dans Prometheus.
   *
   * @param service - Nom du service appelé
   * @param method - Méthode HTTP utilisée
   * @param path - Chemin de la requête
   * @param status - Code de réponse HTTP
   * @param duration - Durée de la requête en millisecondes
   */
  async handleRequest(
    service: string,
    method: string,
    path: string,
    status: number,
    duration: number,
  ): Promise<void> {
    this.prometheusService.recordRequest(service, method, path, status, duration);
  }

  /**
   * Enregistre une erreur survenue lors d'une requête dans Prometheus.
   *
   * @param service - Nom du service appelé
   * @param method - Méthode HTTP utilisée
   * @param path - Chemin de la requête
   * @param error - Description ou type de l'erreur
   */
  async handleError(
    service: string,
    method: string,
    path: string,
    error: string,
  ): Promise<void> {
    this.prometheusService.recordError(service, method, path, error);
  }

  /**
   * Récupère les métriques enregistrées par Prometheus.
   *
   * @returns Une chaîne de caractères contenant les métriques
   */
  async getMetrics(): Promise<string> {
    return this.prometheusService.getMetrics();
  }
}
