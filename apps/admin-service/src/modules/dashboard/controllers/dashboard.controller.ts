import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  UseGuards
} from '@nestjs/common';
import { DashboardService } from '../services';
import {
  DashboardQueryParamsDto,
  DashboardResponseDto,
  WidgetQueryParamsDto,
  WidgetResponseDto,
  CreateWidgetDto,
  UpdateWidgetDto,
  UpdateDashboardLayoutDto,
  WidgetsResponseDto,
  CreateActivityLogDto,
  ActivityLogQueryDto,
  ActivityLogListResponseDto
} from '../dtos';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtBlacklistGuard } from '@/modules/auth/guards/jwt-blacklist.guard';

@ApiTags('dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtBlacklistGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Récupérer les données du tableau de bord', 
    description: 'Récupère les données consolidées pour afficher sur le tableau de bord administrateur'
  })
  @ApiQuery({ 
    name: 'dateRange', 
    required: false, 
    type: String, 
    enum: ['day', 'week', 'month', 'year', 'custom'], 
    description: 'Plage de dates pour filtrer les données' 
  })
  @ApiQuery({ 
    name: 'startDate', 
    required: false, 
    type: String, 
    description: 'Date de début au format ISO pour une plage personnalisée' 
  })
  @ApiQuery({ 
    name: 'endDate', 
    required: false, 
    type: String, 
    description: 'Date de fin au format ISO pour une plage personnalisée' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Données du tableau de bord récupérées avec succès',
    type: DashboardResponseDto
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getDashboard(
    @Query() queryParams: DashboardQueryParamsDto
  ): Promise<DashboardResponseDto> {
    const data = await this.dashboardService.getDashboardData(queryParams);
    return { data };
  }
  @Get('widgets/:widgetId')
  @ApiOperation({ 
    summary: 'Récupérer les données d\'un widget spécifique', 
    description: 'Récupère les données pour afficher un widget spécifique du tableau de bord'
  })
  @ApiParam({ 
    name: 'widgetId', 
    required: true, 
    description: 'Identifiant unique du widget'
  })
  @ApiQuery({ 
    name: 'dateRange', 
    required: false, 
    enum: ['day', 'week', 'month', 'year', 'custom'], 
    description: 'Plage de dates pour filtrer les données' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Données du widget récupérées avec succès',
    type: WidgetResponseDto
  })
  @ApiResponse({ status: 404, description: 'Widget non trouvé' })
  async getWidget(
    @Param('widgetId') widgetId: string,
    @Query() queryParams: WidgetQueryParamsDto
  ): Promise<WidgetResponseDto> {
    const data = await this.dashboardService.getWidgetData(widgetId, queryParams);
    return { data };
  }

  @Get('widgets')
  @ApiOperation({ 
    summary: 'Récupérer tous les widgets d\'un utilisateur', 
    description: 'Récupère la liste des widgets configurés pour un utilisateur spécifique ou l\'utilisateur courant'
  })
  @ApiQuery({ 
    name: 'userId', 
    required: false, 
    description: 'Identifiant de l\'utilisateur. Si non fourni, utilisera l\'utilisateur courant.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Widgets récupérés avec succès',
    type: WidgetsResponseDto
  })
  async getUserWidgets(
    @Query('userId') userId?: string
  ): Promise<WidgetsResponseDto> {
    const widgets = await this.dashboardService.getUserWidgets(userId);
    return { widgets };
  }
  @Post('widgets')
  @ApiOperation({ 
    summary: 'Créer un nouveau widget', 
    description: 'Crée un nouveau widget personnalisé pour le tableau de bord'
  })
  @ApiBody({ 
    type: CreateWidgetDto,
    description: 'Données du widget à créer'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Widget créé avec succès',
    type: WidgetResponseDto
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async createWidget(
    @Body() createDto: CreateWidgetDto
  ): Promise<WidgetResponseDto> {
    const widget = await this.dashboardService.createWidget(createDto);
    const data = await this.dashboardService.getWidgetData(widget.id, {});
    return { data };
  }

  @Put('widgets/:widgetId')
  @ApiOperation({ 
    summary: 'Mettre à jour un widget existant', 
    description: 'Modifie la configuration d\'un widget existant'
  })
  @ApiParam({ 
    name: 'widgetId', 
    required: true, 
    description: 'Identifiant unique du widget à mettre à jour'
  })
  @ApiBody({ 
    type: UpdateWidgetDto,
    description: 'Données de mise à jour du widget'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Widget mis à jour avec succès',
    type: WidgetResponseDto
  })
  @ApiResponse({ status: 404, description: 'Widget non trouvé' })
  async updateWidget(
    @Param('widgetId', ParseUUIDPipe) widgetId: string,
    @Body() updateDto: UpdateWidgetDto
  ): Promise<WidgetResponseDto> {
    const widget = await this.dashboardService.updateWidget(widgetId, updateDto);
    const data = await this.dashboardService.getWidgetData(widget.id, {});
    return { data };
  }
  @Delete('widgets/:widgetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Supprimer un widget', 
    description: 'Supprime un widget du tableau de bord'
  })
  @ApiParam({ 
    name: 'widgetId', 
    required: true, 
    description: 'Identifiant unique du widget à supprimer'
  })
  @ApiResponse({ status: 204, description: 'Widget supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Widget non trouvé' })
  async deleteWidget(
    @Param('widgetId', ParseUUIDPipe) widgetId: string
  ): Promise<void> {
    await this.dashboardService.deleteWidget(widgetId);
  }

  @Get('layout')
  @ApiOperation({ 
    summary: 'Récupérer la disposition du tableau de bord', 
    description: 'Récupère la configuration de disposition des widgets sur le tableau de bord'
  })
  @ApiQuery({ 
    name: 'userId', 
    required: false, 
    description: 'Identifiant de l\'utilisateur. Si non fourni, utilisera l\'utilisateur courant.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Disposition récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        layout: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              i: { type: 'string', example: 'widget-1' },
              x: { type: 'number', example: 0 },
              y: { type: 'number', example: 0 },
              w: { type: 'number', example: 6 },
              h: { type: 'number', example: 4 }
            }
          }
        }
      }
    }
  })
  async getDashboardLayout(
    @Query('userId') userId?: string
  ) {
    return this.dashboardService.getDashboardLayout(userId);
  }
  @Put('layout')
  @ApiOperation({ 
    summary: 'Mettre à jour la disposition du tableau de bord', 
    description: 'Enregistre une nouvelle configuration de disposition des widgets sur le tableau de bord'
  })
  @ApiQuery({ 
    name: 'userId', 
    required: true, 
    description: 'Identifiant de l\'utilisateur dont la disposition doit être mise à jour' 
  })
  @ApiBody({ 
    type: UpdateDashboardLayoutDto,
    description: 'Nouvelle configuration de disposition'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Disposition mise à jour avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        layout: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              i: { type: 'string' },
              x: { type: 'number' },
              y: { type: 'number' },
              w: { type: 'number' },
              h: { type: 'number' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async updateDashboardLayout(
    @Query('userId') userId: string,
    @Body() updateDto: UpdateDashboardLayoutDto
  ) {
    return this.dashboardService.updateDashboardLayout(userId, updateDto);
  }

  @Post('activity')
  @ApiOperation({ 
    summary: 'Enregistrer une activité utilisateur', 
    description: 'Crée une nouvelle entrée dans le journal d\'activité'
  })
  @ApiBody({ 
    type: CreateActivityLogDto,
    description: 'Détails de l\'activité à enregistrer'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Activité enregistrée avec succès',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
        userId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440001' },
        action: { type: 'string', example: 'create' },
        resourceType: { type: 'string', example: 'user' },
        resourceId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440002' },
        details: { type: 'object' },
        createdAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  async createActivityLog(
    @Body() createDto: CreateActivityLogDto
  ) {
    return this.dashboardService.createActivityLog(createDto);
  }

  @Get('activity')
  @ApiOperation({ 
    summary: 'Récupérer les journaux d\'activité', 
    description: 'Récupère la liste paginée des activités utilisateur enregistrées'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filtrer par utilisateur' })
  @ApiQuery({ name: 'action', required: false, type: String, description: 'Filtrer par type d\'action' })
  @ApiQuery({ name: 'resourceType', required: false, type: String, description: 'Filtrer par type de ressource' })
  @ApiResponse({ 
    status: 200, 
    description: 'Journaux d\'activité récupérés avec succès',
    type: ActivityLogListResponseDto
  })
  async getActivityLogs(
    @Query() queryDto: ActivityLogQueryDto
  ): Promise<ActivityLogListResponseDto> {
    const { logs, total, page, pages } = await this.dashboardService.getActivityLogs(queryDto);
    return { logs, total, page, pages };
  }
}
