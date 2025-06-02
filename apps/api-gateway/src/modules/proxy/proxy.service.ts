import { Injectable } from '@nestjs/common';
import { IncomingHttpHeaders } from 'http';
import { AxiosResponse } from 'axios';
import { PrometheusService } from '../../monitoring/prometheus.service';

@Injectable()
export class ProxyService {
  constructor(private readonly prometheusService: PrometheusService) {}
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
    const HttpService = require('@nestjs/axios').HttpService;
    const RouteResolverService = require('./services/route-resolver.service').RouteResolverService;
    const CircuitBreakerService = require('./services/circuit-breaker.service').CircuitBreakerService;
    const LoadBalancerService = require('./services/load-balancer.service').LoadBalancerService;
    const RequestTrackerService = require('./services/request-tracker.service').RequestTrackerService;
    
    // Injection des services
    const httpService = new HttpService();
    const routeResolverService = new RouteResolverService(process.env);
    const circuitBreakerService = new CircuitBreakerService();
    const loadBalancerService = new LoadBalancerService();
    const requestTrackerService = new RequestTrackerService();
    
    // 1. Résoudre la route
    const route = routeResolverService.resolveRoute(path);
    if (!route) {
      throw new Error(`No service found for path: ${path}`);
    }
    
    // 2. Construire l'URL cible
    const targetPath = routeResolverService.stripPrefix(path, route.prefix);
    const targetUrl = `${route.baseUrl}${targetPath}`;
    
    // 3. Préparer les en-têtes
    const forwardHeaders = { ...headers };
    delete forwardHeaders.host; // Supprime l'en-tête host qui peut causer des problèmes
    
    // 4. Vérifier si le circuit breaker est ouvert
    if (circuitBreakerService.isOpen(route.service)) {
      throw new Error(`Circuit breaker open for service: ${route.service}`);
    }
    
    // 5. Obtenir l'instance du service via le load balancer
    const serviceInstance = loadBalancerService.getServiceInstance(route.service);
    
    // 6. Commencer à suivre la requête
    const requestId = requestTrackerService.startRequest(route.service, method, targetPath);
    
    try {
      // 7. Envoyer la requête
      const startTime = Date.now();
      const response = await httpService.request({
        method,
        url: targetUrl,
        headers: forwardHeaders,
        data: body,
        timeout: 30000, // 30 secondes de timeout
      }).toPromise();
      
      // 8. Enregistrer la requête réussie
      const duration = Date.now() - startTime;
      this.handleRequest(route.service, method, targetPath, response.status, duration);
      requestTrackerService.endRequest(requestId, response.status);
      
      return response;
    } catch (error: any) {
      // 9. Gérer l'erreur
      const status = error.response?.status || 500;
      const errorMessage = error.message || 'Unknown error';
      
      this.handleError(route.service, method, targetPath, errorMessage);
      requestTrackerService.endRequest(requestId, status, errorMessage);
      circuitBreakerService.recordError(route.service);
      
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
