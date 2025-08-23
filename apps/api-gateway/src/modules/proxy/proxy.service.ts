import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IncomingHttpHeaders } from 'http';
import { AxiosResponse } from 'axios';
import { PrometheusService } from '../../monitoring/prometheus.service';
import { RouteResolverService } from './services/route-resolver.service';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(
    private readonly prometheusService: PrometheusService,
    private readonly httpService: HttpService,
    private readonly routeResolverService: RouteResolverService,
  ) {}

  /**
   * Méthode pour transférer la requête vers le service approprié.
   * Utilise le RouteResolverService pour trouver le service approprié
   * et transmet la requête via Axios.
   */
  async forwardRequest(
    path: string,
    method: string,
    headers: IncomingHttpHeaders,
    body: any
  ): Promise<AxiosResponse<any>> {
    this.logger.debug(`Forwarding request: ${method} ${path}`);
    
    // 1. Résoudre la route
    const route = this.routeResolverService.resolveRoute(path);
    if (!route) {
      this.logger.error(`No service found for path: ${path}`);
      throw new Error(`No service found for path: ${path}`);
    }
    
    this.logger.debug(`Route resolved to service: ${route.service}, baseUrl: ${route.baseUrl}, prefix: ${route.prefix}`);
    
    // 2. Construire l'URL cible
    const targetPath = this.routeResolverService.stripPrefix(path, route.prefix);
    const targetUrl = `${route.baseUrl}${targetPath}`;
    
    this.logger.debug(`Original path: ${path}, Prefix: ${route.prefix}, Target path: ${targetPath}, Target URL: ${targetUrl}`);
    
    // 3. Préparer les en-têtes
    const forwardHeaders = { ...headers };
    delete forwardHeaders.host; // Supprime l'en-tête host qui peut causer des problèmes
    
    // Log pour vérifier la transmission de l'Authorization header
    const authHeader = forwardHeaders.authorization || forwardHeaders.Authorization;
    if (authHeader) {
      const authValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
      this.logger.debug(`Authorization header found and will be forwarded: ${authValue.substring(0, 20)}...`);
    } else {
      this.logger.warn(`No Authorization header found in request to ${targetUrl}`);
    }
    
    this.logger.debug(`Headers being forwarded: ${JSON.stringify(Object.keys(forwardHeaders))}`);
    
    try {
      // 4. Envoyer la requête
      const startTime = Date.now();
      this.logger.debug(`Sending request to: ${targetUrl} with method: ${method}`);
      const response = await this.httpService.axiosRef.request({
        method,
        url: targetUrl,
        headers: forwardHeaders,
        data: body,
        timeout: 30000, // 30 secondes de timeout
      });
      
      // 5. Enregistrer la requête réussie
      const duration = Date.now() - startTime;
      this.logger.debug(`Request successful: ${response.status} in ${duration}ms`);
      this.handleRequest(route.service, method, targetPath, response.status, duration);
      
      return response;
    } catch (error: any) {
      // 6. Gérer l'erreur
      const status = error.response?.status || 500;
      const errorMessage = error.message || 'Unknown error';
      
      this.logger.error(`Request failed to ${targetUrl}: ${status} - ${errorMessage}`);
      this.handleError(route.service, method, targetPath, errorMessage);
      
      throw error;
    }
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
