import { 
  Controller, 
  Get, 
  Put, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Req, 
  Query 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiQuery, 
  ApiParam, 
  ApiBody 
} from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { TraditionalDashboardService } from '../services/traditional-dashboard.service';
import { OHADAMetricsService } from '../services/ohada-metrics.service';
import { DashboardPreferencesService } from '../services/dashboard-preferences.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { DashboardData, TraditionalDashboardMetrics } from '../interfaces/dashboard.interface';
import { 
  OHADAMetricsResponseDto, 
  SingleOHADAMetricsResponseDto 
} from '../dtos/ohada-metrics.dto';
import { 
  DashboardPreferencesResponseDto, 
  UpdateWidgetPreferenceDto, 
  UpdateWidgetResponseDto,
  ResetPreferencesResponseDto
} from '../dtos/dashboard-preferences.dto';
import { ComplianceSummaryResponseDto } from '../dtos/compliance.dto';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly traditionalDashboardService: TraditionalDashboardService,
    private readonly ohadaMetricsService: OHADAMetricsService,
    private readonly preferencesService: DashboardPreferencesService
  ) {}

  // ======= ENDPOINTS LEGACY (maintenues pour compatibilité) =======

  @Get()
  @ApiOperation({ summary: 'Get dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboard(@Req() req: any): Promise<{ success: boolean; data: DashboardData }> {
    const data = await this.dashboardService.getDashboardData(req.user.institutionId);
    return {
      success: true,
      data,
    };
  }

  @Get('traditional')
  @ApiOperation({ summary: 'Get traditional portfolio dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Traditional portfolio metrics retrieved successfully' })
  @ApiQuery({ name: 'portfolio_id', required: false, description: 'Filter by portfolio ID' })
  @ApiQuery({ name: 'period', required: false, description: 'Period for metrics (daily, weekly, monthly, quarterly, yearly)', enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] })
  @ApiQuery({ name: 'start_date', required: false, description: 'Start date for metrics (YYYY-MM-DD)' })
  @ApiQuery({ name: 'end_date', required: false, description: 'End date for metrics (YYYY-MM-DD)' })
  async getTraditionalDashboard(
    @Req() req: any,
    @Query('portfolio_id') portfolioId?: string,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly',
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ): Promise<{ success: boolean; data: TraditionalDashboardMetrics }> {
    const data = await this.traditionalDashboardService.getTraditionalDashboardMetrics(
      req.user.institutionId,
      portfolioId,
      period,
      startDate,
      endDate,
    );
    return {
      success: true,
      data,
    };
  }

  // ======= NOUVEAUX ENDPOINTS OHADA CONFORMES À LA DOCUMENTATION =======

  @Get('metrics/ohada')
  @ApiOperation({ 
    summary: 'Récupère toutes les métriques OHADA des portefeuilles traditionnels',
    description: 'Endpoint conforme à la documentation frontend pour récupérer les métriques OHADA/BCEAO'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Métriques OHADA récupérées avec succès',
    type: OHADAMetricsResponseDto
  })
  async getOHADAMetrics(@Req() req: any): Promise<OHADAMetricsResponseDto> {
    return await this.ohadaMetricsService.getOHADAMetrics(req.user.institutionId);
  }

  @Get('metrics/portfolio/:portfolioId')
  @ApiOperation({ 
    summary: 'Récupère les métriques OHADA pour un portefeuille spécifique',
    description: 'Métriques détaillées d\'un portefeuille selon les standards OHADA/BCEAO'
  })
  @ApiParam({ name: 'portfolioId', description: 'ID du portefeuille', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Métriques du portefeuille récupérées avec succès',
    type: SingleOHADAMetricsResponseDto
  })
  async getPortfolioOHADAMetrics(
    @Param('portfolioId') portfolioId: string
  ): Promise<SingleOHADAMetricsResponseDto> {
    const data = await this.ohadaMetricsService.getPortfolioOHADAMetrics(portfolioId);
    return {
      success: true,
      data
    };
  }

  @Get('metrics/global')
  @ApiOperation({ 
    summary: 'Récupère les métriques globales agrégées de tous les portefeuilles',
    description: 'Vue d\'ensemble consolidée des métriques OHADA'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Métriques globales récupérées avec succès',
    type: SingleOHADAMetricsResponseDto
  })
  async getGlobalOHADAMetrics(@Req() req: any): Promise<SingleOHADAMetricsResponseDto> {
    const data = await this.ohadaMetricsService.getGlobalOHADAMetrics(req.user.institutionId);
    return {
      success: true,
      data
    };
  }

  @Get('compliance/summary')
  @ApiOperation({ 
    summary: 'Récupère un résumé de la conformité réglementaire',
    description: 'Statut de conformité OHADA/BCEAO pour tous les portefeuilles'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Résumé de conformité récupéré avec succès',
    type: ComplianceSummaryResponseDto
  })
  async getComplianceSummary(@Req() req: any): Promise<ComplianceSummaryResponseDto> {
    const data = await this.ohadaMetricsService.getComplianceSummary(req.user.institutionId);
    return {
      success: true,
      data
    };
  }

  // ======= ENDPOINTS CUSTOMISATION DASHBOARD =======

  @Get('preferences/:userId')
  @ApiOperation({ 
    summary: 'Récupère les préférences de customisation du dashboard pour un utilisateur',
    description: 'Configuration des widgets et personnalisation du tableau de bord'
  })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Préférences récupérées avec succès',
    type: DashboardPreferencesResponseDto
  })
  async getUserPreferences(
    @Param('userId') userId: string
  ): Promise<DashboardPreferencesResponseDto> {
    const data = await this.preferencesService.getUserPreferences(userId);
    return {
      success: true,
      data
    };
  }

  @Put('preferences/:userId/widget/:widgetId')
  @ApiOperation({ 
    summary: 'Met à jour la visibilité d\'un widget spécifique',
    description: 'Permet de modifier l\'affichage et la position d\'un widget'
  })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur', type: 'string' })
  @ApiParam({ name: 'widgetId', description: 'ID du widget', type: 'string' })
  @ApiBody({ type: UpdateWidgetPreferenceDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Widget mis à jour avec succès',
    type: UpdateWidgetResponseDto
  })
  async updateWidgetPreference(
    @Param('userId') userId: string,
    @Param('widgetId') widgetId: string,
    @Body() updateData: UpdateWidgetPreferenceDto
  ): Promise<UpdateWidgetResponseDto> {
    await this.preferencesService.updateWidgetVisibility(
      userId, 
      widgetId as any, 
      updateData.visible, 
      updateData.position
    );

    return {
      success: true,
      message: 'Widget mis à jour avec succès',
      data: {
        userId,
        widgetId,
        visible: updateData.visible,
        position: updateData.position,
        updatedAt: new Date().toISOString()
      }
    };
  }

  @Post('preferences/:userId/reset')
  @ApiOperation({ 
    summary: 'Remet les préférences aux valeurs par défaut',
    description: 'Restaure la configuration par défaut du dashboard'
  })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Préférences remises à zéro avec succès',
    type: ResetPreferencesResponseDto
  })
  async resetPreferences(
    @Param('userId') userId: string
  ): Promise<ResetPreferencesResponseDto> {
    const data = await this.preferencesService.resetToDefault(userId);
    return {
      success: true,
      message: 'Préférences remises aux valeurs par défaut',
      data
    };
  }

  @Get('widgets/available')
  @ApiOperation({ 
    summary: 'Récupère la liste des widgets disponibles',
    description: 'Liste complète des widgets configurables avec leurs métadonnées'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des widgets disponibles'
  })
  async getAvailableWidgets() {
    return {
      success: true,
      data: this.preferencesService.getAvailableWidgets()
    };
  }
}
