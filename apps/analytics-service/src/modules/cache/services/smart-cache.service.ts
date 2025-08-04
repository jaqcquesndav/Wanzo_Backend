import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CacheOptions {
  ttl?: number; // Time to live en secondes
  namespace?: string;
  compress?: boolean;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalOperations: number;
  lastReset: Date;
}

@Injectable()
export class SmartCacheService {
  private readonly logger = new Logger(SmartCacheService.name);
  private distributedCache = new Map<string, { value: any; expiry: number }>();
  private localCache = new Map<string, { value: any; expiry: number }>();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalOperations: 0,
    lastReset: new Date()
  };

  // Configuration des TTL par type de données
  private readonly defaultTTLs = {
    'sme_credit_score': 3600, // 1 heure
    'institution_portfolio': 1800, // 30 minutes
    'concentration_risk': 7200, // 2 heures
    'micro_relations': 14400, // 4 heures
    'health_check': 300, // 5 minutes
    'transaction_summary': 600 // 10 minutes
  };

  constructor(private configService: ConfigService) {
    this.initializeCache();
  }

  private initializeCache(): void {
    try {
      // Configuration du cache distribué en mémoire
      this.logger.log('Initializing distributed cache service');
      
      // Nettoyage périodique toutes les 10 minutes
      setInterval(() => {
        this.smartCleanup();
      }, 10 * 60 * 1000);

    } catch (error) {
      this.logger.error('Failed to initialize cache:', error);
    }
  }

  /**
   * Cache stratifié intelligent avec L1 (local) et L2 (Redis)
   */
  async getOrCalculate<T>(
    key: string,
    calculator: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const {
      ttl = this.getDefaultTTL(key),
      namespace = 'analytics',
      compress = false
    } = options;

    const fullKey = `${namespace}:${key}`;
    
    try {
      // L1: Cache mémoire local (très rapide)
      const localResult = this.getFromLocalCache(fullKey);
      if (localResult !== null) {
        this.updateMetrics(true);
        this.logger.debug(`Cache L1 hit for: ${key}`);
        return localResult;
      }

      // L2: Cache distribué (simulation Redis)
      const distributedResult = this.getFromDistributedCache<T>(fullKey);
      if (distributedResult !== null) {
        // Mettre en cache localement avec TTL plus court
        this.setLocalCache(fullKey, distributedResult, Math.min(ttl / 4, 300));
        this.updateMetrics(true);
        this.logger.debug(`Cache L2 hit for: ${key}`);
        return distributedResult;
      }

      // L3: Calcul et mise en cache
      this.updateMetrics(false);
      this.logger.debug(`Cache miss for: ${key}, calculating...`);
      
      const result = await calculator();
      
      // Mise en cache parallèle
      await Promise.allSettled([
        this.setDistributedCache(fullKey, result, ttl, compress),
        this.setLocalCache(fullKey, result, Math.min(ttl / 4, 300))
      ]);

      return result;

    } catch (error) {
      this.logger.error(`Cache operation failed for ${key}:`, error);
      // En cas d'erreur de cache, toujours retourner le calcul
      return await calculator();
    }
  }

  /**
   * Cache spécialisé pour les données SME avec invalidation intelligente
   */
  async cacheSMEData(
    smeId: string,
    data: any,
    triggerEvents: string[] = []
  ): Promise<void> {
    const cacheKey = `sme_data:${smeId}`;
    const metadataKey = `sme_metadata:${smeId}`;
    
    try {
      // Stockage des données avec métadonnées
      const metadata = {
        lastUpdated: new Date().toISOString(),
        version: Date.now(),
        triggerEvents,
        dependencies: this.extractDependencies(data)
      };

      await Promise.all([
        this.setDistributedCache(cacheKey, data, this.defaultTTLs.sme_credit_score),
        this.setDistributedCache(metadataKey, metadata, this.defaultTTLs.sme_credit_score)
      ]);

      this.logger.debug(`SME data cached for ${smeId} with events: ${triggerEvents.join(', ')}`);

    } catch (error) {
      this.logger.error(`Failed to cache SME data for ${smeId}:`, error);
    }
  }

  /**
   * Invalidation cache basée sur les événements Kafka
   */
  async invalidateOnEvent(eventType: string, entityId: string): Promise<void> {
    const invalidationRules = {
      'BusinessOperationCreatedEvent': [`sme_data:${entityId}`, `transaction_summary:${entityId}`],
      'PortfolioUpdatedEvent': [`institution_portfolio:${entityId}`, `concentration_risk:${entityId}`],
      'CreditApprovedEvent': [`sme_data:${entityId}`, `micro_relations:*`],
      'JournalCreatedEvent': [`sme_data:${entityId}`, `institution_portfolio:${entityId}`]
    };

    const keysToInvalidate = invalidationRules[eventType] || [];
    
    if (keysToInvalidate.length === 0) return;

    try {
      // Invalidation avec patterns
      const promises = keysToInvalidate.map(async (pattern) => {
        if (pattern.includes('*')) {
          const keys = this.getKeysMatching(`analytics:${pattern}`);
          keys.forEach(key => {
            this.distributedCache.delete(key);
            this.invalidateLocalCache(key);
          });
        } else {
          this.distributedCache.delete(`analytics:${pattern}`);
          this.invalidateLocalCache(`analytics:${pattern}`);
        }
      });

      await Promise.allSettled(promises);
      
      this.logger.debug(`Cache invalidated for event ${eventType}, entity ${entityId}`);

    } catch (error) {
      this.logger.error(`Cache invalidation failed for ${eventType}:`, error);
    }
  }

  /**
   * Cache des agrégations TimescaleDB avec rafraîchissement périodique
   */
  async cacheAggregation(
    aggregationKey: string,
    sqlQuery: string,
    refreshInterval: number = 3600
  ): Promise<void> {
    // TODO: Intégration avec TimescaleDB pour les agrégations continues
    // Cette méthode servirait à cacher les résultats d'agrégations lourdes
    
    this.logger.debug(`Aggregation caching setup for: ${aggregationKey}`);
  }

  /**
   * Nettoyage intelligent du cache basé sur l'utilisation
   */
  async smartCleanup(): Promise<void> {
    try {
      // Nettoyage du cache local
      const now = Date.now();
      let cleaned = 0;

      for (const [key, item] of this.localCache.entries()) {
        if (item.expiry < now) {
          this.localCache.delete(key);
          cleaned++;
        }
      }

      // Nettoyage Redis des clés expirées (Redis le fait automatiquement)
      // Mais on peut analyser l'utilisation pour optimiser les TTL
      
      if (cleaned > 0) {
        this.logger.debug(`Cleaned ${cleaned} expired entries from local cache`);
      }

    } catch (error) {
      this.logger.error('Smart cleanup failed:', error);
    }
  }

  /**
   * Métriques du cache pour monitoring
   */
  getCacheMetrics(): CacheMetrics & {
    localCacheSize: number;
    distributedCacheSize: number;
    memoryUsage: string;
  } {
    const memoryUsage = process.memoryUsage();
    
    return {
      ...this.metrics,
      localCacheSize: this.localCache.size,
      distributedCacheSize: this.distributedCache.size,
      memoryUsage: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`
    };
  }

  /**
   * Reset des métriques (utile pour les tests et monitoring)
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalOperations: 0,
      lastReset: new Date()
    };
  }

  // Méthodes privées

  private getFromLocalCache(key: string): any | null {
    const item = this.localCache.get(key);
    if (!item) return null;
    
    if (item.expiry < Date.now()) {
      this.localCache.delete(key);
      return null;
    }
    
    return item.value;
  }

  private setLocalCache(key: string, value: any, ttlSeconds: number): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.localCache.set(key, { value, expiry });
  }

  private invalidateLocalCache(key: string): void {
    this.localCache.delete(key);
  }

  private getFromDistributedCache<T>(key: string): T | null {
    const item = this.distributedCache.get(key);
    if (!item) return null;
    
    if (item.expiry < Date.now()) {
      this.distributedCache.delete(key);
      return null;
    }
    
    return item.value;
  }

  private setDistributedCache(key: string, value: any, ttlSeconds: number, compress: boolean = false): Promise<void> {
    try {
      const data = compress ? this.compress(value) : value;
      const expiry = Date.now() + (ttlSeconds * 1000);
      this.distributedCache.set(key, { value: data, expiry });
      return Promise.resolve();
    } catch (error) {
      this.logger.warn(`Distributed cache set failed for ${key}:`, error);
      return Promise.resolve();
    }
  }

  private getKeysMatching(pattern: string): string[] {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.distributedCache.keys()).filter(key => regex.test(key));
  }

  private async getFromRedisCache<T>(key: string, compressed: boolean): Promise<T | null> {
    // Méthode legacy - remplacée par getFromDistributedCache
    return this.getFromDistributedCache<T>(key);
  }

  private async setRedisCache(
    key: string, 
    value: any, 
    ttlSeconds: number, 
    compress: boolean = false
  ): Promise<void> {
    // Méthode legacy - remplacée par setDistributedCache
    return this.setDistributedCache(key, value, ttlSeconds, compress);
  }

  private updateMetrics(hit: boolean): void {
    if (hit) {
      this.metrics.hits++;
    } else {
      this.metrics.misses++;
    }
    
    this.metrics.totalOperations++;
    this.metrics.hitRate = this.metrics.hits / this.metrics.totalOperations;
  }

  private getDefaultTTL(key: string): number {
    for (const [pattern, ttl] of Object.entries(this.defaultTTLs)) {
      if (key.includes(pattern)) {
        return ttl;
      }
    }
    return 3600; // 1 heure par défaut
  }

  private extractDependencies(data: any): string[] {
    // Extraction intelligente des dépendances pour l'invalidation
    const dependencies: string[] = [];
    
    if (data && typeof data === 'object') {
      if (data.customerId) dependencies.push(`customer:${data.customerId}`);
      if (data.institutionId) dependencies.push(`institution:${data.institutionId}`);
      if (data.portfolioId) dependencies.push(`portfolio:${data.portfolioId}`);
    }
    
    return dependencies;
  }

  private compress(data: any): string {
    // Simple compression avec JSON stringify (en production, utiliser gzip)
    return JSON.stringify(data);
  }

  private decompress(data: string): any {
    // Simple décompression (en production, utiliser gzip)
    return JSON.parse(data);
  }
}
