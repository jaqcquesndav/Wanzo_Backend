/**
 * Service de monitoring centralisé pour les flux Kafka
 * Collecte les métriques, surveille les performances et génère des alertes
 */

import { Injectable, Logger } from '@nestjs/common';
import { StandardKafkaTopics } from '../events/standard-kafka-topics';

export interface KafkaMetrics {
  messagesSent: number;
  messagesReceived: number;
  messagesFailed: number;
  averageProcessingTime: number;
  errorRate: number;
  lastActivity: Date;
  topicMetrics: Map<string, TopicMetrics>;
}

export interface TopicMetrics {
  topic: string;
  messageCount: number;
  errorCount: number;
  averageLatency: number;
  lastMessageTime: Date;
  producerCount: number;
  consumerCount: number;
}

export interface AlertConfig {
  errorRateThreshold: number; // Pourcentage
  latencyThreshold: number; // Millisecondes
  messageVolumeThreshold: number; // Messages par minute
  enableAlerts: boolean;
}

export interface KafkaAlert {
  id: string;
  type: 'ERROR_RATE' | 'HIGH_LATENCY' | 'LOW_VOLUME' | 'HIGH_VOLUME' | 'CONSUMER_LAG';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  topic: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, any>;
}

@Injectable()
export class KafkaMonitoringService {
  private readonly logger = new Logger(KafkaMonitoringService.name);
  private metrics: KafkaMetrics;
  private alerts: KafkaAlert[] = [];
  private alertConfig: AlertConfig;
  private metricsHistory: KafkaMetrics[] = [];
  private readonly maxHistorySize = 1000;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.alertConfig = {
      errorRateThreshold: 5, // 5%
      latencyThreshold: 5000, // 5 secondes
      messageVolumeThreshold: 100, // 100 messages/minute
      enableAlerts: true,
    };
    
    // Démarrer la collecte périodique des métriques
    this.startMetricsCollection();
  }

  /**
   * Enregistre l'envoi d'un message
   */
  recordMessageSent(topic: string, processingTime: number, success: boolean): void {
    this.metrics.messagesSent++;
    this.metrics.lastActivity = new Date();
    
    if (!success) {
      this.metrics.messagesFailed++;
    }
    
    this.updateTopicMetrics(topic, {
      messageCount: 1,
      errorCount: success ? 0 : 1,
      latency: processingTime,
    });
    
    this.updateAverageProcessingTime(processingTime);
    this.checkAlerts(topic);
    
    this.logger.debug(
      `Message sent to ${topic}: ${success ? 'SUCCESS' : 'FAILED'} (${processingTime}ms)`
    );
  }

  /**
   * Enregistre la réception d'un message
   */
  recordMessageReceived(topic: string, processingTime: number, success: boolean): void {
    this.metrics.messagesReceived++;
    this.metrics.lastActivity = new Date();
    
    if (!success) {
      this.metrics.messagesFailed++;
    }
    
    this.updateTopicMetrics(topic, {
      messageCount: 1,
      errorCount: success ? 0 : 1,
      latency: processingTime,
    });
    
    this.updateAverageProcessingTime(processingTime);
    this.checkAlerts(topic);
    
    this.logger.debug(
      `Message received from ${topic}: ${success ? 'SUCCESS' : 'FAILED'} (${processingTime}ms)`
    );
  }

  /**
   * Obtient les métriques actuelles
   */
  getMetrics(): KafkaMetrics {
    return { ...this.metrics };
  }

  /**
   * Obtient les métriques pour un topic spécifique
   */
  getTopicMetrics(topic: string): TopicMetrics | undefined {
    return this.metrics.topicMetrics.get(topic);
  }

  /**
   * Obtient toutes les alertes actives
   */
  getActiveAlerts(): KafkaAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Obtient l'historique des métriques
   */
  getMetricsHistory(limit?: number): KafkaMetrics[] {
    const history = [...this.metricsHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Génère un rapport de santé
   */
  getHealthReport(): {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    metrics: KafkaMetrics;
    alerts: KafkaAlert[];
    recommendations: string[];
  } {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'CRITICAL');
    const warningAlerts = activeAlerts.filter(alert => alert.severity === 'HIGH' || alert.severity === 'MEDIUM');
    
    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (criticalAlerts.length > 0) {
      status = 'CRITICAL';
    } else if (warningAlerts.length > 0 || this.metrics.errorRate > 2) {
      status = 'WARNING';
    }
    
    const recommendations = this.generateRecommendations();
    
    return {
      status,
      metrics: this.getMetrics(),
      alerts: activeAlerts,
      recommendations,
    };
  }

  /**
   * Configure les seuils d'alerte
   */
  configureAlerts(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
    this.logger.log(`Alert configuration updated: ${JSON.stringify(this.alertConfig)}`);
  }

  /**
   * Résout une alerte
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.logger.log(`Alert resolved: ${alertId}`);
      return true;
    }
    return false;
  }

  private initializeMetrics(): KafkaMetrics {
    return {
      messagesSent: 0,
      messagesReceived: 0,
      messagesFailed: 0,
      averageProcessingTime: 0,
      errorRate: 0,
      lastActivity: new Date(),
      topicMetrics: new Map<string, TopicMetrics>(),
    };
  }

  private updateTopicMetrics(topic: string, update: {
    messageCount: number;
    errorCount: number;
    latency: number;
  }): void {
    let topicMetrics = this.metrics.topicMetrics.get(topic);
    
    if (!topicMetrics) {
      topicMetrics = {
        topic,
        messageCount: 0,
        errorCount: 0,
        averageLatency: 0,
        lastMessageTime: new Date(),
        producerCount: 0,
        consumerCount: 0,
      };
      this.metrics.topicMetrics.set(topic, topicMetrics);
    }
    
    topicMetrics.messageCount += update.messageCount;
    topicMetrics.errorCount += update.errorCount;
    topicMetrics.lastMessageTime = new Date();
    
    // Mettre à jour la latence moyenne
    topicMetrics.averageLatency = (
      (topicMetrics.averageLatency * (topicMetrics.messageCount - update.messageCount)) +
      (update.latency * update.messageCount)
    ) / topicMetrics.messageCount;
  }

  private updateAverageProcessingTime(processingTime: number): void {
    const totalMessages = this.metrics.messagesSent + this.metrics.messagesReceived;
    if (totalMessages > 0) {
      this.metrics.averageProcessingTime = (
        (this.metrics.averageProcessingTime * (totalMessages - 1)) + processingTime
      ) / totalMessages;
    }
    
    // Calculer le taux d'erreur
    this.metrics.errorRate = (this.metrics.messagesFailed / totalMessages) * 100;
  }

  private checkAlerts(topic: string): void {
    if (!this.alertConfig.enableAlerts) return;
    
    const topicMetrics = this.metrics.topicMetrics.get(topic);
    if (!topicMetrics) return;
    
    // Vérifier le taux d'erreur
    if (topicMetrics.messageCount > 10) {
      const topicErrorRate = (topicMetrics.errorCount / topicMetrics.messageCount) * 100;
      if (topicErrorRate > this.alertConfig.errorRateThreshold) {
        this.createAlert({
          type: 'ERROR_RATE',
          severity: topicErrorRate > 20 ? 'CRITICAL' : 'HIGH',
          topic,
          message: `High error rate detected: ${topicErrorRate.toFixed(2)}%`,
          metadata: { errorRate: topicErrorRate, threshold: this.alertConfig.errorRateThreshold },
        });
      }
    }
    
    // Vérifier la latence
    if (topicMetrics.averageLatency > this.alertConfig.latencyThreshold) {
      this.createAlert({
        type: 'HIGH_LATENCY',
        severity: topicMetrics.averageLatency > this.alertConfig.latencyThreshold * 2 ? 'CRITICAL' : 'MEDIUM',
        topic,
        message: `High latency detected: ${topicMetrics.averageLatency.toFixed(2)}ms`,
        metadata: { latency: topicMetrics.averageLatency, threshold: this.alertConfig.latencyThreshold },
      });
    }
  }

  private createAlert(alertData: Omit<KafkaAlert, 'id' | 'timestamp' | 'resolved'>): void {
    // Éviter les alertes en doublon
    const existingAlert = this.alerts.find(
      alert => 
        !alert.resolved && 
        alert.type === alertData.type && 
        alert.topic === alertData.topic &&
        Date.now() - alert.timestamp.getTime() < 300000 // 5 minutes
    );
    
    if (existingAlert) return;
    
    const alert: KafkaAlert = {
      ...alertData,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
    };
    
    this.alerts.push(alert);
    this.logger.warn(`Kafka Alert: ${alert.type} - ${alert.message} (Topic: ${alert.topic})`);
    
    // Limiter le nombre d'alertes stockées
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-500);
    }
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const activeAlerts = this.getActiveAlerts();
    
    if (this.metrics.errorRate > 5) {
      recommendations.push('Consider investigating the high error rate in message processing');
    }
    
    if (this.metrics.averageProcessingTime > 3000) {
      recommendations.push('Average processing time is high, consider optimizing message handlers');
    }
    
    if (activeAlerts.some(alert => alert.type === 'HIGH_LATENCY')) {
      recommendations.push('High latency detected, check network connectivity and resource usage');
    }
    
    const topicsWithErrors = Array.from(this.metrics.topicMetrics.entries())
      .filter(([_, metrics]) => (metrics.errorCount / metrics.messageCount) > 0.1)
      .map(([topic, _]) => topic);
    
    if (topicsWithErrors.length > 0) {
      recommendations.push(`Review error handling for topics: ${topicsWithErrors.join(', ')}`);
    }
    
    return recommendations;
  }

  private startMetricsCollection(): void {
    // Collecter les métriques toutes les minutes
    setInterval(() => {
      const snapshot = { ...this.metrics };
      this.metricsHistory.push(snapshot);
      
      // Limiter la taille de l'historique
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize / 2);
      }
      
      this.logger.debug(`Metrics snapshot collected: ${JSON.stringify({
        sent: snapshot.messagesSent,
        received: snapshot.messagesReceived,
        failed: snapshot.messagesFailed,
        errorRate: snapshot.errorRate.toFixed(2),
        avgTime: snapshot.averageProcessingTime.toFixed(2),
      })}`);
    }, 60000);
    
    this.logger.log('Kafka monitoring service started');
  }
}

// Instance singleton pour utilisation globale
export const kafkaMonitoring = new KafkaMonitoringService();