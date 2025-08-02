
import { Controller, Get, Post, Put, Body, UseGuards, Request, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../../modules/auth/decorators/roles.decorator';
import { Role } from '../../../modules/auth/enums/role.enum';
import { RolesGuard } from '../../../modules/auth/guards/roles.guard';
import { DashboardService } from '../services/dashboard.service';
import { 
  MainDashboardDto, 
  KpisDto, 
  FinancialSummaryDto, 
  RecentActivityDto, 
  UserStatisticDto, 
  SystemHealthDto, 
  NotificationDto,
  DashboardQueryParamsDto,
  WidgetResponseDto,
  DashboardCompleteDataDto,
  DashboardConfigurationDto,
  UpdateDashboardConfigurationDto
} from '../dtos';
import { Request as ExpressRequest } from 'express';
import { APIResponse } from '../../../common/interfaces';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('api/dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get main dashboard data' })
  @ApiResponse({ status: 200, description: 'Main dashboard data retrieved successfully.', type: DashboardCompleteDataDto })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'dateRange', required: false, type: String })
  @ApiQuery({ name: 'timeZone', required: false, type: String })
  @Roles(Role.Admin)
  async getMainDashboardData(
    @Request() req: ExpressRequest,
    @Query() queryParams: DashboardQueryParamsDto
  ): Promise<DashboardCompleteDataDto> {
    return this.dashboardService.getMainDashboardData(req.user.companyId, queryParams);
  }

  @Get('widgets/:widgetId')
  @ApiOperation({ summary: 'Get data for a specific widget' })
  @ApiResponse({ status: 200, description: 'Widget data retrieved successfully.', type: WidgetResponseDto })
  @ApiParam({ name: 'widgetId', description: 'The ID of the widget to fetch data for' })
  @ApiQuery({ name: 'userId', required: false, description: 'Optional user ID if widget data is user-specific' })
  @Roles(Role.Admin, Role.User)
  async getWidgetData(
    @Param('widgetId') widgetId: string,
    @Request() req: ExpressRequest
  ): Promise<WidgetResponseDto> {
    return this.dashboardService.getWidgetData(widgetId, req.user.id);
  }

  @Get('configuration')
  @ApiOperation({ summary: 'Get user dashboard configuration' })
  @ApiResponse({ status: 200, description: 'Dashboard configuration retrieved successfully.', type: DashboardConfigurationDto })
  @Roles(Role.Admin, Role.User)
  async getDashboardConfiguration(
    @Request() req: ExpressRequest
  ): Promise<DashboardConfigurationDto> {
    return this.dashboardService.getDashboardConfiguration(req.user.id);
  }

  @Put('configuration')
  @ApiOperation({ summary: 'Update user dashboard configuration' })
  @ApiResponse({ status: 200, description: 'Dashboard configuration updated successfully.' })
  @Roles(Role.Admin, Role.User)
  async updateDashboardConfiguration(
    @Request() req: ExpressRequest,
    @Body() updateData: UpdateDashboardConfigurationDto
  ): Promise<APIResponse<DashboardConfigurationDto>> {
    const updatedConfig = await this.dashboardService.updateDashboardConfiguration(req.user.id, updateData);
    return {
      success: true,
      data: updatedConfig,
      message: 'Dashboard configuration updated successfully.'
    };
  }

  @Get('statistics/sales')
  @ApiOperation({ summary: 'Get sales statistics' })
  @ApiResponse({ status: 200, description: 'Sales statistics retrieved successfully.' })
  @ApiQuery({ name: 'period', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @Roles(Role.Admin)
  async getSalesStatistics(
    @Request() req: ExpressRequest,
    @Query() query: any
  ): Promise<any> {
    return this.dashboardService.getSalesStatistics(req.user.companyId, query);
  }

  @Get('statistics/user-engagement')
  @ApiOperation({ summary: 'Get user engagement statistics' })
  @ApiResponse({ status: 200, description: 'User engagement statistics retrieved successfully.' })
  @ApiQuery({ name: 'metricType', required: false, type: String })
  @ApiQuery({ name: 'dateRange', required: false, type: String })
  @Roles(Role.Admin)
  async getUserEngagementStatistics(
    @Request() req: ExpressRequest,
    @Query() query: any
  ): Promise<any> {
    return this.dashboardService.getUserEngagementStatistics(req.user.companyId, query);
  }

  // Legacy endpoints for backward compatibility
  @Get('kpis')
  @ApiOperation({ summary: 'Get Key Performance Indicators' })
  @ApiResponse({ status: 200, description: 'KPIs retrieved successfully.', type: KpisDto })
  @Roles(Role.Admin)
  async getKpis(@Request() req: ExpressRequest): Promise<KpisDto> {
    return this.dashboardService.getKpis(req.user.companyId);
  }

  @Get('financial-summary')
  @ApiOperation({ summary: 'Get financial summary' })
  @ApiResponse({ status: 200, description: 'Financial summary retrieved successfully.', type: FinancialSummaryDto })
  @Roles(Role.Admin)
  async getFinancialSummary(@Request() req: ExpressRequest): Promise<FinancialSummaryDto> {
    return this.dashboardService.getFinancialSummary(req.user.companyId);
  }

  @Get('recent-activities')
  @ApiOperation({ summary: 'Get recent activities' })
  @ApiResponse({ status: 200, description: 'Recent activities retrieved successfully.', type: [RecentActivityDto] })
  @Roles(Role.Admin, Role.User)
  async getRecentActivities(@Request() req: ExpressRequest): Promise<RecentActivityDto[]> {
    return this.dashboardService.getRecentActivities(req.user.companyId);
  }

  @Get('user-statistics')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully.', type: UserStatisticDto })
  @Roles(Role.Admin)
  async getUserStatistics(@Request() req: ExpressRequest): Promise<UserStatisticDto> {
    return this.dashboardService.getUserStatistics(req.user.companyId);
  }

  @Get('system-health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System health status retrieved successfully.', type: SystemHealthDto })
  @Roles(Role.Admin)
  async getSystemHealth(): Promise<SystemHealthDto> {
    return this.dashboardService.getSystemHealth();
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully.', type: [NotificationDto] })
  @Roles(Role.Admin, Role.User)
  async getNotifications(@Request() req: ExpressRequest): Promise<NotificationDto[]> {
    return this.dashboardService.getNotifications(req.user.id);
  }
}
