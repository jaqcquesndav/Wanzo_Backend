import { Controller, Get, Post, Put, Param, Body, Query, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { FraudDetectionService, TransactionData } from '../services/fraud-detection.service';
import { FraudAlert, AlertStatus, AlertSeverity, FraudType } from '../entities/fraud-alert.entity';

@ApiTags('fraud-detection')
@Controller('fraud-detection')
export class FraudDetectionController {
  private readonly logger = new Logger(FraudDetectionController.name);

  constructor(
    private readonly fraudDetectionService: FraudDetectionService
  ) {}

  @Post('analyze-transaction')
  @ApiOperation({ 
    summary: 'Analyse une transaction pour détecter la fraude',
    description: 'Effectue une analyse complète de fraude sur une transaction en temps réel'
  })
  @ApiBody({ 
    description: 'Données de la transaction à analyser',
    schema: {
      type: 'object',
      required: ['id', 'entityId', 'entityType', 'amount', 'timestamp'],
      properties: {
        id: { type: 'string', description: 'Identifiant unique de la transaction' },
        entityId: { type: 'string', description: 'Identifiant de l\'entité (PME, client, etc.)' },
        entityType: { type: 'string', description: 'Type d\'entité' },
        entityName: { type: 'string', description: 'Nom de l\'entité' },
        amount: { type: 'number', description: 'Montant de la transaction' },
        timestamp: { type: 'string', format: 'date-time', description: 'Date et heure de la transaction' },
        paymentMethod: { type: 'string', description: 'Méthode de paiement' },
        location: {
          type: 'object',
          properties: {
            province: { type: 'string' },
            city: { type: 'string' }
          }
        },
        counterpart: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Analyse complétée, alertes générées si nécessaire',
    type: [FraudAlert]
  })
  @ApiResponse({ status: 400, description: 'Données de transaction invalides' })
  async analyzeTransaction(@Body() transactionData: TransactionData): Promise<FraudAlert[]> {
    try {
      this.logger.log(`Analyzing transaction ${transactionData.id} for fraud`);

      // Validation des données minimales
      if (!transactionData.id || !transactionData.entityId || !transactionData.amount) {
        throw new HttpException(
          'Les champs id, entityId et amount sont obligatoires',
          HttpStatus.BAD_REQUEST
        );
      }

      const alerts = await this.fraudDetectionService.analyzeTransaction(transactionData);
      
      this.logger.log(`Fraud analysis completed for transaction ${transactionData.id}. ${alerts.length} alerts generated.`);
      return alerts;

    } catch (error: any) {
      this.logger.error(`Error analyzing transaction ${transactionData.id}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Erreur lors de l\'analyse de fraude',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('alerts')
  @ApiOperation({ 
    summary: 'Récupère les alertes de fraude actives',
    description: 'Retourne la liste des alertes de fraude avec filtres optionnels'
  })
  @ApiQuery({ name: 'status', required: false, enum: AlertStatus, description: 'Filtrer par statut' })
  @ApiQuery({ name: 'severity', required: false, enum: AlertSeverity, description: 'Filtrer par sévérité' })
  @ApiQuery({ name: 'fraudType', required: false, enum: FraudType, description: 'Filtrer par type de fraude' })
  @ApiQuery({ name: 'province', required: false, description: 'Filtrer par province' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre maximum d\'alertes à retourner' })
  @ApiQuery({ name: 'entityId', required: false, description: 'Filtrer par entité spécifique' })
  @ApiResponse({ 
    status: 200, 
    description: 'Alertes récupérées avec succès',
    type: [FraudAlert]
  })
  async getAlerts(
    @Query('status') status?: AlertStatus,
    @Query('severity') severity?: AlertSeverity,
    @Query('fraudType') fraudType?: FraudType,
    @Query('province') province?: string,
    @Query('limit') limit?: string,
    @Query('entityId') entityId?: string
  ): Promise<FraudAlert[]> {
    try {
      const limitNum = limit ? parseInt(limit) : 50;
      
      // Pour l'instant, on utilise getActiveAlerts, mais on peut étendre avec des filtres
      let alerts = await this.fraudDetectionService.getActiveAlerts(limitNum);

      // Application des filtres côté application (à optimiser avec des requêtes SQL)
      if (status && status !== AlertStatus.ACTIVE) {
        // Pour les autres statuts, il faudrait une méthode séparée
        alerts = [];
      }

      if (severity) {
        alerts = alerts.filter(alert => alert.severity === severity);
      }

      if (fraudType) {
        alerts = alerts.filter(alert => alert.fraudType === fraudType);
      }

      if (province) {
        alerts = alerts.filter(alert => alert.province === province);
      }

      if (entityId) {
        alerts = alerts.filter(alert => alert.entityId === entityId);
      }

      return alerts;

    } catch (error: any) {
      this.logger.error('Error retrieving fraud alerts:', error);
      
      throw new HttpException(
        'Erreur lors de la récupération des alertes',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('alerts/:id')
  @ApiOperation({ 
    summary: 'Récupère une alerte spécifique',
    description: 'Retourne les détails complets d\'une alerte de fraude'
  })
  @ApiParam({ name: 'id', description: 'Identifiant de l\'alerte' })
  @ApiResponse({ 
    status: 200, 
    description: 'Alerte récupérée avec succès',
    type: FraudAlert
  })
  @ApiResponse({ status: 404, description: 'Alerte non trouvée' })
  async getAlert(@Param('id') alertId: string): Promise<FraudAlert> {
    try {
      // Implementation à ajouter dans le service
      throw new HttpException(
        'Méthode non encore implémentée',
        HttpStatus.NOT_IMPLEMENTED
      );

    } catch (error: any) {
      this.logger.error(`Error retrieving alert ${alertId}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Erreur lors de la récupération de l\'alerte',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('alerts/:id/status')
  @ApiOperation({ 
    summary: 'Met à jour le statut d\'une alerte',
    description: 'Change le statut d\'une alerte de fraude (investigating, resolved, false_positive, etc.)'
  })
  @ApiParam({ name: 'id', description: 'Identifiant de l\'alerte' })
  @ApiBody({
    description: 'Nouveau statut de l\'alerte',
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { 
          type: 'string', 
          enum: Object.values(AlertStatus),
          description: 'Nouveau statut de l\'alerte'
        },
        userId: { 
          type: 'string', 
          description: 'Identifiant de l\'utilisateur qui effectue l\'action'
        },
        notes: { 
          type: 'string', 
          description: 'Notes sur l\'action effectuée'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statut mis à jour avec succès',
    type: FraudAlert
  })
  @ApiResponse({ status: 404, description: 'Alerte non trouvée' })
  async updateAlertStatus(
    @Param('id') alertId: string,
    @Body() updateData: { status: AlertStatus; userId?: string; notes?: string }
  ): Promise<FraudAlert> {
    try {
      this.logger.log(`Updating alert ${alertId} status to ${updateData.status}`);

      const updatedAlert = await this.fraudDetectionService.updateAlertStatus(
        alertId, 
        updateData.status, 
        updateData.userId
      );

      this.logger.log(`Alert ${alertId} status updated successfully`);
      return updatedAlert;

    } catch (error: any) {
      this.logger.error(`Error updating alert ${alertId} status:`, error);
      
      if (error.message.includes('not found')) {
        throw new HttpException(
          `Alerte ${alertId} non trouvée`,
          HttpStatus.NOT_FOUND
        );
      }
      
      throw new HttpException(
        'Erreur lors de la mise à jour du statut',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('statistics/dashboard')
  @ApiOperation({ 
    summary: 'Tableau de bord des statistiques de fraude',
    description: 'Fournit des métriques agrégées sur les alertes de fraude'
  })
  @ApiQuery({ name: 'period', required: false, description: 'Période d\'analyse (24h, 7d, 30d)', enum: ['24h', '7d', '30d'] })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistiques récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'object',
          properties: {
            totalAlerts: { type: 'number' },
            activeAlerts: { type: 'number' },
            criticalAlerts: { type: 'number' },
            resolvedAlerts: { type: 'number' },
            falsePositives: { type: 'number' }
          }
        },
        distributionBySeverity: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        distributionByType: {
          type: 'object'
        },
        distributionByProvince: {
          type: 'object'
        },
        trends: {
          type: 'object',
          properties: {
            dailyAlerts: { type: 'array' },
            detectionRate: { type: 'number' },
            avgResolutionTime: { type: 'number' }
          }
        }
      }
    }
  })
  async getFraudStatistics(@Query('period') period: string = '24h'): Promise<any> {
    try {
      this.logger.log(`Generating fraud statistics for period: ${period}`);

      // Pour l'instant, des données simulées - à implémenter avec de vraies requêtes
      const alerts = await this.fraudDetectionService.getActiveAlerts(1000);

      const summary = {
        totalAlerts: alerts.length,
        activeAlerts: alerts.filter(a => a.status === AlertStatus.ACTIVE).length,
        criticalAlerts: alerts.filter(a => a.severity === AlertSeverity.CRITICAL).length,
        resolvedAlerts: 0, // À calculer avec les alertes résolues
        falsePositives: 0  // À calculer avec les faux positifs
      };

      const distributionBySeverity = {
        critical: alerts.filter(a => a.severity === AlertSeverity.CRITICAL).length,
        high: alerts.filter(a => a.severity === AlertSeverity.HIGH).length,
        medium: alerts.filter(a => a.severity === AlertSeverity.MEDIUM).length,
        low: alerts.filter(a => a.severity === AlertSeverity.LOW).length
      };

      const distributionByType = alerts.reduce((acc, alert) => {
        acc[alert.fraudType] = (acc[alert.fraudType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const distributionByProvince = alerts.reduce((acc, alert) => {
        if (alert.province) {
          acc[alert.province] = (acc[alert.province] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return {
        summary,
        distributionBySeverity,
        distributionByType,
        distributionByProvince,
        trends: {
          dailyAlerts: [], // À implémenter avec données historiques
          detectionRate: 0.95, // Simulation
          avgResolutionTime: 4.2 // heures, simulation
        },
        period,
        generatedAt: new Date().toISOString()
      };

    } catch (error: any) {
      this.logger.error('Error generating fraud statistics:', error);
      
      throw new HttpException(
        'Erreur lors de la génération des statistiques',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('risk-score/:entityId')
  @ApiOperation({ 
    summary: 'Score de risque de fraude d\'une entité',
    description: 'Calcule et retourne le score de risque de fraude global d\'une entité'
  })
  @ApiParam({ name: 'entityId', description: 'Identifiant de l\'entité' })
  @ApiResponse({ 
    status: 200, 
    description: 'Score de risque calculé',
    schema: {
      type: 'object',
      properties: {
        entityId: { type: 'string' },
        overallRiskScore: { type: 'number', description: 'Score global de 0 à 1' },
        riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
        factors: {
          type: 'object',
          properties: {
            transactionPatterns: { type: 'number' },
            historicalBehavior: { type: 'number' },
            networkRisk: { type: 'number' },
            geographicRisk: { type: 'number' }
          }
        },
        recentAlerts: { type: 'number' },
        lastUpdate: { type: 'string', format: 'date-time' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  async getEntityRiskScore(@Param('entityId') entityId: string): Promise<any> {
    try {
      this.logger.log(`Calculating fraud risk score for entity: ${entityId}`);

      // Récupération des alertes récentes pour cette entité
      const recentAlerts = await this.fraudDetectionService.getActiveAlerts(100);
      const entityAlerts = recentAlerts.filter(alert => alert.entityId === entityId);

      // Calcul simplifié du score de risque (à améliorer avec ML)
      let riskScore = 0.2; // Score de base

      // Facteur basé sur le nombre d'alertes récentes
      const alertFactor = Math.min(entityAlerts.length * 0.1, 0.4);
      riskScore += alertFactor;

      // Facteur basé sur la sévérité des alertes
      const criticalAlerts = entityAlerts.filter(a => a.severity === AlertSeverity.CRITICAL).length;
      const highAlerts = entityAlerts.filter(a => a.severity === AlertSeverity.HIGH).length;
      const severityFactor = (criticalAlerts * 0.2) + (highAlerts * 0.1);
      riskScore += severityFactor;

      // Borner le score entre 0 et 1
      riskScore = Math.min(Math.max(riskScore, 0), 1);

      // Déterminer le niveau de risque
      let riskLevel = 'LOW';
      if (riskScore >= 0.8) riskLevel = 'CRITICAL';
      else if (riskScore >= 0.6) riskLevel = 'HIGH';
      else if (riskScore >= 0.4) riskLevel = 'MEDIUM';

      // Génération de recommandations
      const recommendations: string[] = [];
      if (riskScore > 0.6) {
        recommendations.push('Surveillance renforcée recommandée');
        recommendations.push('Validation manuelle des transactions importantes');
      }
      if (criticalAlerts > 0) {
        recommendations.push('Investigation immédiate requise');
      }
      if (entityAlerts.length > 5) {
        recommendations.push('Révision du profil de risque client');
      }

      return {
        entityId,
        overallRiskScore: Math.round(riskScore * 1000) / 1000,
        riskLevel,
        factors: {
          transactionPatterns: Math.round(alertFactor * 1000) / 1000,
          historicalBehavior: 0.1, // Simulation
          networkRisk: 0.05, // Simulation
          geographicRisk: 0.1 // Simulation
        },
        recentAlerts: entityAlerts.length,
        lastUpdate: new Date().toISOString(),
        recommendations
      };

    } catch (error: any) {
      this.logger.error(`Error calculating risk score for entity ${entityId}:`, error);
      
      throw new HttpException(
        'Erreur lors du calcul du score de risque',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
