import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { TraditionalDashboardService } from '../services/traditional-dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { DashboardData, TraditionalDashboardMetrics } from '../interfaces/dashboard.interface';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly traditionalDashboardService: TraditionalDashboardService
  ) {}

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
}