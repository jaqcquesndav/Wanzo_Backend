import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

// Interface pour les métriques de risque temporelles
export interface RiskMetric {
  time: Date;
  entityType: 'SME' | 'INSTITUTION' | 'PORTFOLIO' | 'CREDIT' | 'SECTOR' | 'PROVINCE';
  entityId: string;
  metricName: string;
  metricValue: number;
  country?: string;
  province?: string;
  city?: string;
  commune?: string;
  sectorCode?: string;
  sectorName?: string;
  institutionId?: string;
  institutionType?: string;
  calculationModel?: string;
  confidenceLevel?: number;
  metadata?: Record<string, any>;
}

// Interface pour les alertes temporelles
export interface RiskAlert {
  time: Date;
  alertId: string;
  alertType: 'FRAUD' | 'DEFAULT_RISK' | 'SYSTEMIC' | 'CONCENTRATION' | 'MARKET' | 'OPERATIONAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  entityType: 'SME' | 'INSTITUTION' | 'PORTFOLIO' | 'CREDIT';
  entityId: string;
  entityName?: string;
  score: number;
  threshold: number;
  province?: string;
  city?: string;
  sectorCode?: string;
  description?: string;
  recommendedActions?: string[];
  status?: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledgedBy?: string;
}

// Interface pour les requêtes d'agrégation
export interface TimeSeriesQuery {
  startTime: Date;
  endTime: Date;
  entityTypes?: string[];
  entityIds?: string[];
  metricNames?: string[];
  provinces?: string[];
  sectors?: string[];
  interval?: 'hour' | 'day' | 'week' | 'month';
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
}

@Injectable()
export class TimeseriesRiskService {
  private readonly logger = new Logger(TimeseriesRiskService.name);

  constructor(
    private dataSource: DataSource
  ) {}

  /**
   * Initialisation des hypertables TimescaleDB
   */
  async initializeHypertables(): Promise<void> {
    try {
      this.logger.log('Initializing TimescaleDB hypertables for risk metrics...');

      // Création de la table des métriques de risque
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS risk_metrics (
          time TIMESTAMPTZ NOT NULL,
          entity_type VARCHAR(20) NOT NULL,
          entity_id UUID NOT NULL,
          metric_name VARCHAR(50) NOT NULL,
          metric_value DOUBLE PRECISION NOT NULL,
          
          -- Dimensions géographiques
          country VARCHAR(10) DEFAULT 'RDC',
          province VARCHAR(50),
          city VARCHAR(100),
          commune VARCHAR(100),
          
          -- Dimensions sectorielles
          sector_code VARCHAR(10),
          sector_name VARCHAR(100),
          
          -- Dimensions institutionnelles
          institution_id UUID,
          institution_type VARCHAR(50),
          
          -- Métadonnées de calcul
          calculation_model VARCHAR(50),
          confidence_level DOUBLE PRECISION,
          metadata JSONB,
          
          -- Contraintes
          CONSTRAINT risk_metrics_pk PRIMARY KEY (time, entity_type, entity_id, metric_name)
        );
      `);

      // Création de l'hypertable
      await this.dataSource.query(`
        SELECT create_hypertable('risk_metrics', 'time', if_not_exists => TRUE);
      `);

      // Création de la table des alertes
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS risk_alerts (
          time TIMESTAMPTZ NOT NULL,
          alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          alert_type VARCHAR(50) NOT NULL,
          severity VARCHAR(10) NOT NULL,
          
          entity_type VARCHAR(20) NOT NULL,
          entity_id UUID NOT NULL,
          entity_name VARCHAR(200),
          
          score DOUBLE PRECISION NOT NULL,
          threshold DOUBLE PRECISION NOT NULL,
          
          -- Contexte géographique
          province VARCHAR(50),
          city VARCHAR(100),
          sector_code VARCHAR(10),
          
          -- Détails de l'alerte
          description TEXT,
          recommended_actions JSONB,
          
          -- Statut et traçabilité
          status VARCHAR(20) DEFAULT 'ACTIVE',
          acknowledged_by UUID,
          acknowledged_at TIMESTAMPTZ,
          resolved_at TIMESTAMPTZ,
          resolution_notes TEXT
        );
      `);

      // Hypertable pour les alertes
      await this.dataSource.query(`
        SELECT create_hypertable('risk_alerts', 'time', if_not_exists => TRUE);
      `);

      // Index pour optimiser les requêtes
      await this.createOptimizationIndexes();

      // Politiques de rétention automatique
      await this.setupRetentionPolicies();

      this.logger.log('TimescaleDB hypertables initialized successfully');

    } catch (error) {
      this.logger.error('Error initializing TimescaleDB hypertables:', error);
      throw error;
    }
  }

  /**
   * Enregistrement d'une métrique de risque
   */
  async recordRiskMetric(metric: RiskMetric): Promise<void> {
    try {
      const query = `
        INSERT INTO risk_metrics (
          time, entity_type, entity_id, metric_name, metric_value,
          country, province, city, commune,
          sector_code, sector_name,
          institution_id, institution_type,
          calculation_model, confidence_level, metadata
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11,
          $12, $13,
          $14, $15, $16
        )
        ON CONFLICT (time, entity_type, entity_id, metric_name)
        DO UPDATE SET
          metric_value = EXCLUDED.metric_value,
          confidence_level = EXCLUDED.confidence_level,
          metadata = EXCLUDED.metadata
      `;

      await this.dataSource.query(query, [
        metric.time,
        metric.entityType,
        metric.entityId,
        metric.metricName,
        metric.metricValue,
        metric.country || 'RDC',
        metric.province,
        metric.city,
        metric.commune,
        metric.sectorCode,
        metric.sectorName,
        metric.institutionId,
        metric.institutionType,
        metric.calculationModel,
        metric.confidenceLevel,
        JSON.stringify(metric.metadata || {})
      ]);

    } catch (error) {
      this.logger.error('Error recording risk metric:', error);
      throw error;
    }
  }

  /**
   * Enregistrement d'une alerte de risque
   */
  async recordRiskAlert(alert: RiskAlert): Promise<string> {
    try {
      const query = `
        INSERT INTO risk_alerts (
          time, alert_id, alert_type, severity,
          entity_type, entity_id, entity_name,
          score, threshold,
          province, city, sector_code,
          description, recommended_actions,
          status
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9,
          $10, $11, $12,
          $13, $14,
          $15
        ) RETURNING alert_id
      `;

      const result = await this.dataSource.query(query, [
        alert.time,
        alert.alertId,
        alert.alertType,
        alert.severity,
        alert.entityType,
        alert.entityId,
        alert.entityName,
        alert.score,
        alert.threshold,
        alert.province,
        alert.city,
        alert.sectorCode,
        alert.description,
        JSON.stringify(alert.recommendedActions || []),
        alert.status || 'ACTIVE'
      ]);

      return result[0].alert_id;

    } catch (error) {
      this.logger.error('Error recording risk alert:', error);
      throw error;
    }
  }

  /**
   * Requête de métriques de risque avec agrégation temporelle
   */
  async getRiskMetricsTimeSeries(query: TimeSeriesQuery): Promise<any[]> {
    try {
      let sql = `
        SELECT 
          time_bucket($1, time) as time_bucket,
          entity_type,
          metric_name,
          ${this.getAggregationFunction(query.aggregation || 'avg')}(metric_value) as value,
          province,
          sector_code,
          count(*) as data_points
        FROM risk_metrics
        WHERE time >= $2 AND time <= $3
      `;

      const params: any[] = [
        this.getIntervalString(query.interval || 'day'),
        query.startTime,
        query.endTime
      ];

      let paramIndex = 4;

      // Filtres optionnels
      if (query.entityTypes && query.entityTypes.length > 0) {
        sql += ` AND entity_type = ANY($${paramIndex})`;
        params.push(query.entityTypes);
        paramIndex++;
      }

      if (query.entityIds && query.entityIds.length > 0) {
        sql += ` AND entity_id = ANY($${paramIndex})`;
        params.push(query.entityIds);
        paramIndex++;
      }

      if (query.metricNames && query.metricNames.length > 0) {
        sql += ` AND metric_name = ANY($${paramIndex})`;
        params.push(query.metricNames);
        paramIndex++;
      }

      if (query.provinces && query.provinces.length > 0) {
        sql += ` AND province = ANY($${paramIndex})`;
        params.push(query.provinces);
        paramIndex++;
      }

      if (query.sectors && query.sectors.length > 0) {
        sql += ` AND sector_code = ANY($${paramIndex})`;
        params.push(query.sectors);
        paramIndex++;
      }

      sql += `
        GROUP BY time_bucket, entity_type, metric_name, province, sector_code
        ORDER BY time_bucket ASC
      `;

      const result = await this.dataSource.query(sql, params);
      return result;

    } catch (error) {
      this.logger.error('Error querying risk metrics time series:', error);
      throw error;
    }
  }

  /**
   * Analyse des tendances de risque
   */
  async getRiskTrends(
    entityId: string,
    metricName: string,
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<any> {
    try {
      const intervalDays = period === 'week' ? 7 : period === 'month' ? 30 : 90;
      
      const query = `
        WITH trend_data AS (
          SELECT 
            time_bucket('1 day', time) as day,
            avg(metric_value) as daily_avg
          FROM risk_metrics
          WHERE entity_id = $1 
            AND metric_name = $2
            AND time >= NOW() - INTERVAL '${intervalDays} days'
          GROUP BY day
          ORDER BY day
        ),
        regression AS (
          SELECT 
            regr_slope(daily_avg, extract(epoch from day)) as slope,
            regr_intercept(daily_avg, extract(epoch from day)) as intercept,
            corr(daily_avg, extract(epoch from day)) as correlation
          FROM trend_data
        )
        SELECT 
          slope,
          intercept,
          correlation,
          CASE 
            WHEN slope > 0.1 THEN 'DETERIORATING'
            WHEN slope < -0.1 THEN 'IMPROVING'
            ELSE 'STABLE'
          END as trend_direction,
          count(*) as data_points
        FROM regression
      `;

      const result = await this.dataSource.query(query, [entityId, metricName]);
      return result[0];

    } catch (error) {
      this.logger.error('Error analyzing risk trends:', error);
      throw error;
    }
  }

  /**
   * Détection d'anomalies statistiques
   */
  async detectRiskAnomalies(
    entityType: string,
    metricName: string,
    lookbackDays: number = 30
  ): Promise<any[]> {
    try {
      const query = `
        WITH stats AS (
          SELECT 
            entity_id,
            avg(metric_value) as mean_value,
            stddev(metric_value) as std_dev,
            count(*) as sample_size
          FROM risk_metrics
          WHERE entity_type = $1 
            AND metric_name = $2
            AND time >= NOW() - INTERVAL '${lookbackDays} days'
          GROUP BY entity_id
          HAVING count(*) >= 5  -- Minimum de points pour calcul fiable
        ),
        recent_values AS (
          SELECT DISTINCT ON (entity_id)
            entity_id,
            metric_value as current_value,
            time as last_update
          FROM risk_metrics
          WHERE entity_type = $1 
            AND metric_name = $2
            AND time >= NOW() - INTERVAL '1 day'
          ORDER BY entity_id, time DESC
        )
        SELECT 
          r.entity_id,
          r.current_value,
          s.mean_value,
          s.std_dev,
          ABS(r.current_value - s.mean_value) / s.std_dev as z_score,
          CASE 
            WHEN ABS(r.current_value - s.mean_value) / s.std_dev > 3 THEN 'EXTREME'
            WHEN ABS(r.current_value - s.mean_value) / s.std_dev > 2 THEN 'HIGH'
            WHEN ABS(r.current_value - s.mean_value) / s.std_dev > 1.5 THEN 'MODERATE'
            ELSE 'NORMAL'
          END as anomaly_level,
          r.last_update
        FROM recent_values r
        JOIN stats s ON r.entity_id = s.entity_id
        WHERE ABS(r.current_value - s.mean_value) / s.std_dev > 1.5
        ORDER BY z_score DESC
      `;

      const result = await this.dataSource.query(query, [entityType, metricName]);
      return result;

    } catch (error) {
      this.logger.error('Error detecting risk anomalies:', error);
      throw error;
    }
  }

  /**
   * Tableau de bord des métriques temporelles
   */
  async getTimeseriesDashboard(): Promise<any> {
    try {
      // Métriques des dernières 24h
      const recentMetrics = await this.dataSource.query(`
        SELECT 
          COUNT(*) as total_metrics,
          COUNT(DISTINCT entity_id) as unique_entities,
          AVG(metric_value) as avg_risk_score
        FROM risk_metrics
        WHERE time >= NOW() - INTERVAL '24 hours'
          AND metric_name = 'risk_score'
      `);

      // Alertes actives
      const activeAlerts = await this.dataSource.query(`
        SELECT 
          severity,
          COUNT(*) as count
        FROM risk_alerts
        WHERE status = 'ACTIVE'
          AND time >= NOW() - INTERVAL '7 days'
        GROUP BY severity
        ORDER BY 
          CASE severity
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
            WHEN 'LOW' THEN 4
          END
      `);

      // Tendances par province
      const provinceTrends = await this.dataSource.query(`
        SELECT 
          province,
          AVG(metric_value) as avg_risk,
          COUNT(*) as metric_count
        FROM risk_metrics
        WHERE time >= NOW() - INTERVAL '7 days'
          AND metric_name = 'risk_score'
          AND province IS NOT NULL
        GROUP BY province
        ORDER BY avg_risk DESC
        LIMIT 10
      `);

      // Performance du système
      const systemMetrics = await this.dataSource.query(`
        SELECT 
          COUNT(*) as total_records,
          MAX(time) as last_update,
          COUNT(DISTINCT metric_name) as metric_types
        FROM risk_metrics
      `);

      return {
        summary: recentMetrics[0],
        alerts: activeAlerts,
        provinceTrends,
        system: systemMetrics[0],
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Error generating timeseries dashboard:', error);
      throw error;
    }
  }

  // Méthodes utilitaires privées

  private async createOptimizationIndexes(): Promise<void> {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_risk_metrics_entity ON risk_metrics (entity_type, entity_id, time DESC)',
      'CREATE INDEX IF NOT EXISTS idx_risk_metrics_geo ON risk_metrics (province, city, time DESC)',
      'CREATE INDEX IF NOT EXISTS idx_risk_metrics_sector ON risk_metrics (sector_code, time DESC)',
      'CREATE INDEX IF NOT EXISTS idx_risk_metrics_metric ON risk_metrics (metric_name, time DESC)',
      'CREATE INDEX IF NOT EXISTS idx_risk_alerts_status ON risk_alerts (status, severity, time DESC)',
      'CREATE INDEX IF NOT EXISTS idx_risk_alerts_entity ON risk_alerts (entity_type, entity_id, time DESC)'
    ];

    for (const indexQuery of indexes) {
      await this.dataSource.query(indexQuery);
    }
  }

  private async setupRetentionPolicies(): Promise<void> {
    // Politique de rétention : garder 2 ans de données détaillées
    await this.dataSource.query(`
      SELECT add_retention_policy('risk_metrics', INTERVAL '2 years', if_not_exists => TRUE);
    `);

    // Politique de rétention pour les alertes : 5 ans
    await this.dataSource.query(`
      SELECT add_retention_policy('risk_alerts', INTERVAL '5 years', if_not_exists => TRUE);
    `);

    // Agrégations continues pour performance
    await this.dataSource.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS risk_metrics_daily
      WITH (timescaledb.continuous) AS
      SELECT 
        time_bucket('1 day', time) AS day,
        entity_type,
        metric_name,
        province,
        sector_code,
        AVG(metric_value) as avg_value,
        MIN(metric_value) as min_value,
        MAX(metric_value) as max_value,
        COUNT(*) as data_points
      FROM risk_metrics
      GROUP BY day, entity_type, metric_name, province, sector_code;
    `);
  }

  private getIntervalString(interval: string): string {
    switch (interval) {
      case 'hour': return '1 hour';
      case 'day': return '1 day';
      case 'week': return '1 week';
      case 'month': return '1 month';
      default: return '1 day';
    }
  }

  private getAggregationFunction(aggregation: string): string {
    switch (aggregation) {
      case 'sum': return 'SUM';
      case 'min': return 'MIN';
      case 'max': return 'MAX';
      case 'count': return 'COUNT';
      case 'avg':
      default: return 'AVG';
    }
  }
}
