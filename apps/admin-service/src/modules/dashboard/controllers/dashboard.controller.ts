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
  HttpCode
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

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(
    @Query() queryParams: DashboardQueryParamsDto
  ): Promise<DashboardResponseDto> {
    const data = await this.dashboardService.getDashboardData(queryParams);
    return { data };
  }

  @Get('widgets/:widgetId')
  async getWidget(
    @Param('widgetId') widgetId: string,
    @Query() queryParams: WidgetQueryParamsDto
  ): Promise<WidgetResponseDto> {
    const data = await this.dashboardService.getWidgetData(widgetId, queryParams);
    return { data };
  }

  @Get('widgets')
  async getUserWidgets(
    @Query('userId') userId?: string
  ): Promise<WidgetsResponseDto> {
    const widgets = await this.dashboardService.getUserWidgets(userId);
    return { widgets };
  }

  @Post('widgets')
  async createWidget(
    @Body() createDto: CreateWidgetDto
  ): Promise<WidgetResponseDto> {
    const widget = await this.dashboardService.createWidget(createDto);
    const data = await this.dashboardService.getWidgetData(widget.id, {});
    return { data };
  }

  @Put('widgets/:widgetId')
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
  async deleteWidget(
    @Param('widgetId', ParseUUIDPipe) widgetId: string
  ): Promise<void> {
    await this.dashboardService.deleteWidget(widgetId);
  }

  @Get('layout')
  async getDashboardLayout(
    @Query('userId') userId?: string
  ) {
    return this.dashboardService.getDashboardLayout(userId);
  }

  @Put('layout')
  async updateDashboardLayout(
    @Query('userId') userId: string,
    @Body() updateDto: UpdateDashboardLayoutDto
  ) {
    return this.dashboardService.updateDashboardLayout(userId, updateDto);
  }

  @Post('activity')
  async createActivityLog(
    @Body() createDto: CreateActivityLogDto
  ) {
    return this.dashboardService.createActivityLog(createDto);
  }

  @Get('activity')
  async getActivityLogs(
    @Query() queryDto: ActivityLogQueryDto
  ): Promise<ActivityLogListResponseDto> {
    const { logs, total, page, pages } = await this.dashboardService.getActivityLogs(queryDto);
    return { logs, total, page, pages };
  }
}
