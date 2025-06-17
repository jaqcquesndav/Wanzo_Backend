import { Controller, Get, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SystemService } from '../services/system.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { 
    SystemHealthDto, 
    SystemLogsResponseDto, 
    SystemAlertsResponseDto, 
    SystemAlertDto, 
    ApiPerformanceResponseDto, 
    DatabaseMetricsResponseDto, 
    AiModelsResponseDto, 
    AiModelConfigDto, 
    ResolveSystemAlertDto, 
    UpdateAiModelConfigDto, 
    SetMaintenanceModeDto, 
    GetSystemLogsQueryDto, 
    GetSystemAlertsQueryDto, 
    GetApiPerformanceQueryDto, 
    MaintenanceStatusResponseDto,
    SetMaintenanceModeResponseDto,
    SystemStatusResponseDto
} from '../dtos/system.dto';
import { AuthGuard } from '@nestjs/passport';
// import { RolesGuard } from 'src/common/guards/roles.guard';
// import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('System')
@ApiBearerAuth()
// @UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('admin/system')
export class SystemController {
    constructor(private readonly systemService: SystemService) {}

    @Get('health')
    @ApiOperation({ summary: 'Get system health', description: 'Retrieves the current health status of the system and its components.' })
    @ApiResponse({ status: 200, description: 'Successful response', type: SystemHealthDto })
    // @Roles('admin:system:read')
    getSystemHealth(): Promise<SystemHealthDto> {
        return this.systemService.getSystemHealth();
    }

    @Get('logs')
    @ApiOperation({ summary: 'Get system logs', description: 'Retrieves system logs with optional filtering and pagination.' })
    @ApiResponse({ status: 200, description: 'Successful response', type: SystemLogsResponseDto })
    // @Roles('admin:system:read')
    getSystemLogs(@Query() query: GetSystemLogsQueryDto): Promise<SystemLogsResponseDto> {
        return this.systemService.getSystemLogs(query);
    }

    @Get('alerts')
    @ApiOperation({ summary: 'Get system alerts', description: 'Retrieves active and/or resolved system alerts.' })
    @ApiResponse({ status: 200, description: 'Successful response', type: SystemAlertsResponseDto })
    // @Roles('admin:system:read')
    getSystemAlerts(@Query() query: GetSystemAlertsQueryDto): Promise<SystemAlertsResponseDto> {
        return this.systemService.getSystemAlerts(query);
    }

    @Put('alerts/:alertId/resolve')
    @ApiOperation({ summary: 'Resolve a system alert', description: 'Marks a system alert as resolved.' })
    @ApiParam({ name: 'alertId', description: 'The ID of the alert to resolve.' })
    @ApiResponse({ status: 200, description: 'Alert resolved successfully', type: SystemAlertDto })
    // @Roles('admin:system:write')
    resolveSystemAlert(
        @Param('alertId') alertId: string, 
        @Body() body: ResolveSystemAlertDto
    ): Promise<SystemAlertDto> {
        return this.systemService.resolveSystemAlert(alertId, body.resolutionNotes);
    }

    @Get('api/performance')
    @ApiOperation({ summary: 'Get API performance metrics', description: 'Retrieves performance metrics for API endpoints.' })
    @ApiResponse({ status: 200, description: 'Successful response', type: ApiPerformanceResponseDto })
    // @Roles('admin:system:read')
    getApiPerformanceMetrics(@Query() query: GetApiPerformanceQueryDto): Promise<ApiPerformanceResponseDto> {
        return this.systemService.getApiPerformanceMetrics(query);
    }

    @Get('databases')
    @ApiOperation({ summary: 'Get database metrics', description: 'Retrieves performance metrics for system databases.' })
    @ApiResponse({ status: 200, description: 'Successful response', type: DatabaseMetricsResponseDto })
    // @Roles('admin:system:read')
    getDatabaseMetrics(): Promise<DatabaseMetricsResponseDto> {
        return this.systemService.getDatabaseMetrics();
    }

    @Get('ai/models')
    @ApiOperation({ summary: 'Get AI model configurations', description: 'Retrieves the configuration for AI models used in the system.' })
    @ApiResponse({ status: 200, description: 'Successful response', type: AiModelsResponseDto })
    // @Roles('admin:system:read')
    getAiModelConfigs(): Promise<AiModelsResponseDto> {
        return this.systemService.getAiModelConfigs();
    }

    @Put('ai/models/:modelId')
    @ApiOperation({ summary: 'Update AI model configuration', description: 'Updates the configuration for a specific AI model.' })
    @ApiParam({ name: 'modelId', description: 'The ID of the AI model to update.' })
    @ApiResponse({ status: 200, description: 'AI model updated successfully', type: AiModelConfigDto })
    // @Roles('admin:system:write')
    updateAiModelConfig(
        @Param('modelId') modelId: string, 
        @Body() body: UpdateAiModelConfigDto
    ): Promise<AiModelConfigDto> {
        return this.systemService.updateAiModelConfig(modelId, body);
    }

    @Get('/system/status')
    @ApiOperation({ summary: 'Get system status', description: 'Retrieves a simplified status of the system for health checks and monitoring.' })
    @ApiResponse({ status: 200, description: 'Successful response', type: SystemStatusResponseDto })
    getSystemStatus(): Promise<SystemStatusResponseDto> {
        return this.systemService.getSystemStatus();
    }

    @Get('/system/maintenance')
    @ApiOperation({ summary: 'Get public maintenance status', description: 'Checks if the system is in maintenance mode.' })
    @ApiResponse({ status: 200, description: 'Successful response', type: MaintenanceStatusResponseDto })
    getMaintenanceStatus(): Promise<MaintenanceStatusResponseDto> {
        return this.systemService.getMaintenanceStatus();
    }

    @Put('maintenance')
    @ApiOperation({ summary: 'Set maintenance mode', description: 'Enables or disables maintenance mode for the system.' })
    @ApiResponse({ status: 200, description: 'Maintenance mode updated successfully', type: SetMaintenanceModeResponseDto })
    // @Roles('admin:system:write')
    setMaintenanceMode(@Body() body: SetMaintenanceModeDto): Promise<SetMaintenanceModeResponseDto> {
        return this.systemService.setMaintenanceMode(body);
    }
}
