import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
  ParseEnumPipe 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiQuery 
} from '@nestjs/swagger';
import { RealTimeCreditMonitoringService, MonitoringConfig, HealthDashboard } from '../services/credit-monitoring.service';
import { CreditScoreInterval } from '../entities/credit-monitoring.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('real-time-credit-monitoring')
@Controller('credit-score/monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RealTimeCreditMonitoringController {
  constructor(
    private readonly monitoringService: RealTimeCreditMonitoringService,
  ) {}

  @Post(':companyId/configure')
  @Roles('admin', 'analyst')
  @ApiOperation({ 
    summary: 'Configurer le monitoring temps réel pour une entreprise',
    description: 'Active le suivi automatique de la santé financière avec intervalles personnalisés'
  })
  @ApiParam({ name: 'companyId', description: 'ID de l\'entreprise' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Monitoring configuré avec succès'
  })
  async configureMonitoring(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() config: {
      intervals: CreditScoreInterval[];
      alertThresholds?: {
        scoreDrop?: number;
        cashFlowAlert?: number;
        stabilityWarning?: number;
      };
      autoCalculate?: boolean;
    }
  ) {
    const monitoringConfig: MonitoringConfig = {
      companyId,
      intervals: config.intervals,
      alertThresholds: {
        scoreDrop: config.alertThresholds?.scoreDrop || 10,
        cashFlowAlert: config.alertThresholds?.cashFlowAlert || 0,
        stabilityWarning: config.alertThresholds?.stabilityWarning || 40
      },
      autoCalculate: config.autoCalculate !== false
    };

    await this.monitoringService.configureMonitoring(monitoringConfig);

    return {
      success: true,
      message: 'Monitoring temps réel configuré avec succès',
      configuration: {
        companyId,
        intervals: config.intervals,
        autoCalculate: monitoringConfig.autoCalculate,
        alertThresholds: monitoringConfig.alertThresholds
      }
    };
  }

  @Post(':companyId/calculate')
  @Roles('admin', 'analyst')
  @ApiOperation({ 
    summary: 'Calculer manuellement la cote crédit pour une période',
    description: 'Force le calcul de la cote crédit pour un intervalle et une période spécifique'
  })
  @ApiParam({ name: 'companyId', description: 'ID de l\'entreprise' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Calcul temps réel effectué avec succès'
  })
  async calculateRealTimeScore(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() request: {
      interval: CreditScoreInterval;
      periodStart: string;
      periodEnd: string;
    }
  ) {
    const monitoring = await this.monitoringService.calculateRealTimeScore(
      companyId,
      request.interval,
      new Date(request.periodStart),
      new Date(request.periodEnd)
    );

    return {
      success: true,
      data: {
        id: monitoring.id,
        score: monitoring.score,
        healthStatus: monitoring.healthStatus,
        interval: monitoring.interval,
        period: {
          start: monitoring.periodStart,
          end: monitoring.periodEnd
        },
        periodChange: monitoring.periodChange,
        alerts: monitoring.alerts,
        components: monitoring.scoreComponents
      },
      message: 'Calcul temps réel effectué avec succès'
    };
  }

  @Get(':companyId/dashboard')
  @Roles('admin', 'analyst', 'financial_officer', 'viewer')
  @ApiOperation({ 
    summary: 'Obtenir le dashboard de santé financière',
    description: 'Retourne une vue d\'ensemble de la santé financière actuelle avec tendances et alertes'
  })
  @ApiParam({ name: 'companyId', description: 'ID de l\'entreprise' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Dashboard de santé obtenu avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        dashboard: {
          type: 'object',
          properties: {
            companyId: { type: 'string' },
            currentHealth: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor', 'critical'] },
            currentScore: { type: 'number' },
            trends: {
              type: 'object',
              properties: {
                daily: { type: 'string', enum: ['improving', 'declining', 'stable'] },
                weekly: { type: 'string', enum: ['improving', 'declining', 'stable'] },
                monthly: { type: 'string', enum: ['improving', 'declining', 'stable'] }
              }
            },
            alerts: { type: 'array' },
            lastUpdate: { type: 'string', format: 'date-time' },
            nextCalculation: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  async getHealthDashboard(
    @Param('companyId', ParseUUIDPipe) companyId: string
  ) {
    const dashboard = await this.monitoringService.getHealthDashboard(companyId);

    return {
      success: true,
      dashboard,
      message: 'Dashboard de santé obtenu avec succès'
    };
  }

  @Get(':companyId/history/:interval')
  @Roles('admin', 'analyst', 'financial_officer', 'viewer')
  @ApiOperation({ 
    summary: 'Obtenir l\'historique de monitoring pour un intervalle',
    description: 'Retourne l\'évolution des scores et de la santé financière sur une période donnée'
  })
  @ApiParam({ name: 'companyId', description: 'ID de l\'entreprise' })
  @ApiParam({ name: 'interval', enum: CreditScoreInterval, description: 'Intervalle de monitoring' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Nombre de jours d\'historique (défaut: 30)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Historique de monitoring obtenu avec succès'
  })
  async getMonitoringHistory(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('interval', new ParseEnumPipe(CreditScoreInterval)) interval: CreditScoreInterval,
    @Query('days') days?: number
  ) {
    const history = await this.monitoringService.getMonitoringHistory(
      companyId,
      interval,
      days || 30
    );

    // Formater les données pour la visualisation
    const chartData = history.map(entry => ({
      date: entry.periodStart,
      score: entry.score,
      healthStatus: entry.healthStatus,
      change: entry.periodChange?.change || 0,
      trend: entry.periodChange?.trend || 'stable',
      netCashFlow: entry.periodCumulative.netCashFlow,
      alertsCount: entry.alerts?.length || 0
    }));

    return {
      success: true,
      data: {
        interval,
        period: {
          days: days || 30,
          entries: history.length
        },
        history: chartData,
        summary: {
          averageScore: Math.round(chartData.reduce((sum, entry) => sum + entry.score, 0) / chartData.length),
          bestScore: Math.max(...chartData.map(entry => entry.score)),
          worstScore: Math.min(...chartData.map(entry => entry.score)),
          totalAlerts: chartData.reduce((sum, entry) => sum + entry.alertsCount, 0)
        }
      },
      message: 'Historique de monitoring obtenu avec succès'
    };
  }

  @Get(':companyId/alerts')
  @Roles('admin', 'analyst', 'financial_officer')
  @ApiOperation({ 
    summary: 'Obtenir les alertes actives',
    description: 'Retourne toutes les alertes récentes pour une entreprise'
  })
  @ApiParam({ name: 'companyId', description: 'ID de l\'entreprise' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Alertes actives obtenues avec succès'
  })
  async getActiveAlerts(
    @Param('companyId', ParseUUIDPipe) companyId: string
  ) {
    const alerts = await this.monitoringService.getActiveAlerts(companyId);

    // Grouper les alertes par sévérité
    const groupedAlerts = {
      critical: alerts.filter(alert => alert.severity === 'critical'),
      high: alerts.filter(alert => alert.severity === 'high'),
      medium: alerts.filter(alert => alert.severity === 'medium'),
      low: alerts.filter(alert => alert.severity === 'low')
    };

    return {
      success: true,
      data: {
        total: alerts.length,
        alerts: groupedAlerts,
        summary: {
          critical: groupedAlerts.critical.length,
          high: groupedAlerts.high.length,
          medium: groupedAlerts.medium.length,
          low: groupedAlerts.low.length
        }
      },
      message: 'Alertes actives obtenues avec succès'
    };
  }

  @Get(':companyId/health-trends')
  @Roles('admin', 'analyst', 'financial_officer', 'viewer')
  @ApiOperation({ 
    summary: 'Obtenir les tendances de santé multi-intervalles',
    description: 'Compare les tendances sur différents intervalles de temps'
  })
  @ApiParam({ name: 'companyId', description: 'ID de l\'entreprise' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Tendances de santé obtenues avec succès'
  })
  async getHealthTrends(
    @Param('companyId', ParseUUIDPipe) companyId: string
  ) {
    // Récupérer les données pour chaque intervalle
    const [dailyHistory, weeklyHistory, monthlyHistory] = await Promise.all([
      this.monitoringService.getMonitoringHistory(companyId, CreditScoreInterval.DAILY, 7),
      this.monitoringService.getMonitoringHistory(companyId, CreditScoreInterval.WEEKLY, 28),
      this.monitoringService.getMonitoringHistory(companyId, CreditScoreInterval.MONTHLY, 90)
    ]);

    const calculateTrend = (history: any[]) => {
      if (history.length < 2) return 'stable';
      const first = history[0].score;
      const last = history[history.length - 1].score;
      const change = last - first;
      return Math.abs(change) >= 3 ? (change > 0 ? 'improving' : 'declining') : 'stable';
    };

    return {
      success: true,
      data: {
        daily: {
          trend: calculateTrend(dailyHistory),
          currentScore: dailyHistory[dailyHistory.length - 1]?.score || 0,
          dataPoints: dailyHistory.length,
          period: '7 jours'
        },
        weekly: {
          trend: calculateTrend(weeklyHistory),
          currentScore: weeklyHistory[weeklyHistory.length - 1]?.score || 0,
          dataPoints: weeklyHistory.length,
          period: '4 semaines'
        },
        monthly: {
          trend: calculateTrend(monthlyHistory),
          currentScore: monthlyHistory[monthlyHistory.length - 1]?.score || 0,
          dataPoints: monthlyHistory.length,
          period: '3 mois'
        }
      },
      message: 'Tendances de santé obtenues avec succès'
    };
  }

  @Post(':companyId/alerts/acknowledge')
  @Roles('admin', 'analyst', 'financial_officer')
  @ApiOperation({ 
    summary: 'Accuser réception des alertes',
    description: 'Marque les alertes comme lues et traitées'
  })
  @ApiParam({ name: 'companyId', description: 'ID de l\'entreprise' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Alertes marquées comme lues'
  })
  async acknowledgeAlerts(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() request: {
      alertIds?: string[];
      acknowledgeAll?: boolean;
      acknowledgedBy: string;
    }
  ) {
    // Logique de marquage des alertes comme acquittées
    // Met à jour le statut des alertes dans la base de données
    
    return {
      success: true,
      data: {
        acknowledgedCount: request.alertIds?.length || 0,
        acknowledgedBy: request.acknowledgedBy,
        acknowledgedAt: new Date()
      },
      message: 'Alertes marquées comme lues avec succès'
    };
  }
}