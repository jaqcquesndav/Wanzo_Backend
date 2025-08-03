import { Controller, Get, Logger, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { KafkaConsumerService } from '../services/kafka-consumer.service';

/**
 * Contrôleur pour le monitoring du traitement d'événements
 * Fournit des informations sur l'état des consumers Kafka et les statistiques
 */
@ApiTags('Event Processing')
@Controller('api/v1/event-processing')
export class EventProcessingController {
  private readonly logger = new Logger(EventProcessingController.name);

  constructor(
    private readonly kafkaConsumerService: KafkaConsumerService
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Obtenir le statut du traitement d\'événements' })
  @ApiResponse({ status: 200, description: 'Statut du consumer Kafka et des topics' })
  getEventProcessingStatus() {
    try {
      const stats = this.kafkaConsumerService.getConsumerStats();
      
      return {
        status: 'success',
        data: {
          ...stats,
          timestamp: new Date().toISOString(),
          service: 'analytics-event-processing'
        },
        message: 'Statut du traitement d\'événements récupéré avec succès'
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération du statut:', error);
      throw new HttpException(
        'Erreur lors de la récupération du statut du traitement d\'événements',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Vérifier la santé de la connexion Kafka' })
  @ApiResponse({ status: 200, description: 'Connexion Kafka opérationnelle' })
  @ApiResponse({ status: 503, description: 'Connexion Kafka indisponible' })
  async checkKafkaHealth() {
    try {
      const isHealthy = await this.kafkaConsumerService.testConnection();
      
      if (!isHealthy) {
        throw new HttpException(
          'Connexion Kafka indisponible',
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      return {
        status: 'success',
        data: {
          kafka: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        },
        message: 'Connexion Kafka opérationnelle'
      };
    } catch (error) {
      this.logger.error('Erreur lors de la vérification de santé Kafka:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Erreur lors de la vérification de santé Kafka',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('topics')
  @ApiOperation({ summary: 'Lister les topics Kafka écoutés' })
  @ApiResponse({ status: 200, description: 'Liste des topics Kafka configurés' })
  getKafkaTopics() {
    try {
      const stats = this.kafkaConsumerService.getConsumerStats();
      
      return {
        status: 'success',
        data: {
          topics: stats.topics,
          groupId: stats.groupId,
          totalTopics: stats.topics.length,
          timestamp: new Date().toISOString()
        },
        message: 'Topics Kafka récupérés avec succès'
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des topics:', error);
      throw new HttpException(
        'Erreur lors de la récupération des topics Kafka',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Obtenir les métriques de traitement d\'événements' })
  @ApiResponse({ status: 200, description: 'Métriques de performance du traitement' })
  getProcessingMetrics() {
    try {
      // Métriques simulées - dans un vrai système, ces données viendraient
      // d'un système de monitoring comme Prometheus ou d'une base de données
      const metrics = {
        eventsProcessed: {
          total: 45821,
          lastHour: 1247,
          lastMinute: 23
        },
        eventTypes: {
          TRANSACTION: 28745,
          RISK_ASSESSMENT: 8932,
          FRAUD_ALERT: 1247,
          PORTFOLIO_UPDATE: 4821,
          CREDIT_EVENT: 2076
        },
        performance: {
          avgProcessingTime: '45ms',
          successRate: 99.7,
          errorRate: 0.3,
          lastProcessedAt: new Date().toISOString()
        },
        kafka: {
          consumerLag: 12,
          connectionUptime: process.uptime(),
          lastRebalance: new Date(Date.now() - 3600000).toISOString()
        }
      };

      return {
        status: 'success',
        data: metrics,
        message: 'Métriques de traitement récupérées avec succès'
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des métriques:', error);
      throw new HttpException(
        'Erreur lors de la récupération des métriques',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('events/summary')
  @ApiOperation({ summary: 'Résumé des événements traités récemment' })
  @ApiResponse({ status: 200, description: 'Résumé des derniers événements traités' })
  getRecentEventsSummary() {
    try {
      // Données simulées - dans un vrai système, ces données viendraient
      // d'une base de données ou d'un cache Redis
      const summary = {
        recentEvents: [
          {
            id: 'evt-001',
            type: 'FRAUD_ALERT',
            entityId: 'sme-12345',
            severity: 'HIGH',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            processed: true
          },
          {
            id: 'evt-002', 
            type: 'TRANSACTION',
            entityId: 'sme-67890',
            amount: 150000,
            currency: 'CDF',
            timestamp: new Date(Date.now() - 180000).toISOString(),
            processed: true
          },
          {
            id: 'evt-003',
            type: 'RISK_ASSESSMENT',
            entityId: 'sme-54321',
            riskScore: 7.2,
            timestamp: new Date(Date.now() - 120000).toISOString(),
            processed: true
          }
        ],
        alertsToday: {
          fraud: 8,
          highRisk: 15,
          critical: 2
        },
        processingStatus: {
          healthy: true,
          queueLength: 5,
          avgLatency: '32ms'
        }
      };

      return {
        status: 'success',
        data: summary,
        message: 'Résumé des événements récupéré avec succès'
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération du résumé:', error);
      throw new HttpException(
        'Erreur lors de la récupération du résumé des événements',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
