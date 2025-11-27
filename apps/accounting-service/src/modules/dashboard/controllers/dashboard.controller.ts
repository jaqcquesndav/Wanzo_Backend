import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { DashboardFilterDto, DashboardResponseDto } from '../dtos/dashboard.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Request as ExpressRequest } from 'express';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get Dashboard Data',
    description: 'Retrieves all dashboard data including quick stats, financial ratios, KPIs, revenue data, expenses data, recent transactions, and alerts.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard data retrieved successfully'
  })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'quarter', 'year'], description: 'Time period for dashboard data' })
  @ApiQuery({ name: 'fiscalYearId', required: false, description: 'ID of the fiscal year (default: current fiscal year)' })
  async getDashboard(
    @Query() filterDto: DashboardFilterDto,
    @Request() req: ExpressRequest & { user: { organizationId: string, role: string } }
  ): Promise<{ success: boolean, data: DashboardResponseDto }> {
    // Handle super admin or invalid organizationId
    if (req.user.role === 'super_admin' || !req.user.organizationId || req.user.organizationId === 'default-company') {
      return {
        success: true,
        data: await this.dashboardService.getDefaultDashboardData()
      };
    }
    
    const dashboardData = await this.dashboardService.getDashboardData({
      period: filterDto.period,
      fiscalYearId: filterDto.fiscalYearId,
      // Nous utilisons companyId ici pour le service, mais ce n'est pas dans le DTO public
      // Ce paramètre sera géré en interne
      companyId: req.user.organizationId
    } as any);
    
    return {
      success: true,
      data: dashboardData
    };
  }

  @Get('quick-stats')
  @ApiOperation({ 
    summary: 'Get Quick Stats',
    description: 'Retrieves only the quick statistics data.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Quick stats retrieved successfully'
  })
  @ApiQuery({ name: 'fiscalYearId', required: false, description: 'ID of the fiscal year' })
  async getQuickStats(
    @Query() filterDto: DashboardFilterDto,
    @Request() req: ExpressRequest & { user: { organizationId: string } }
  ) {
    const quickStats = await this.dashboardService.getQuickStats({
      fiscalYearId: filterDto.fiscalYearId,
      companyId: req.user.organizationId
    } as any);
    
    return {
      success: true,
      data: quickStats
    };
  }

  @Get('financial-ratios')
  @ApiOperation({ 
    summary: 'Get Financial Ratios',
    description: 'Retrieves financial ratios and metrics.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Financial ratios retrieved successfully'
  })
  @ApiQuery({ name: 'fiscalYearId', required: false, description: 'ID of the fiscal year' })
  async getFinancialRatios(
    @Query() filterDto: DashboardFilterDto,
    @Request() req: ExpressRequest & { user: { organizationId: string } }
  ) {
    const ratios = await this.dashboardService.getFinancialRatios({
      fiscalYearId: filterDto.fiscalYearId,
      companyId: req.user.organizationId
    } as any);
    
    return {
      success: true,
      data: ratios
    };
  }

  @Get('key-performance-indicators')
  @ApiOperation({ 
    summary: 'Get Key Performance Indicators',
    description: 'Retrieves credit score and financial rating.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'KPIs retrieved successfully'
  })
  @ApiQuery({ name: 'fiscalYearId', required: false, description: 'ID of the fiscal year' })
  async getKeyPerformanceIndicators(
    @Query() filterDto: DashboardFilterDto,
    @Request() req: ExpressRequest & { user: { organizationId: string } }
  ) {
    const kpis = await this.dashboardService.getKeyPerformanceIndicators({
      fiscalYearId: filterDto.fiscalYearId,
      companyId: req.user.organizationId
    } as any);
    
    return {
      success: true,
      data: kpis
    };
  }

  @Get('revenue')
  @ApiOperation({ 
    summary: 'Get Revenue Data',
    description: 'Retrieves revenue data for charts.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Revenue data retrieved successfully'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month'], description: 'Time period' })
  @ApiQuery({ name: 'fiscalYearId', required: false, description: 'ID of the fiscal year' })
  async getRevenueData(
    @Query() filterDto: DashboardFilterDto,
    @Request() req: ExpressRequest & { user: { organizationId: string } }
  ) {
    const revenueData = await this.dashboardService.getRevenueData({
      startDate: filterDto.startDate,
      endDate: filterDto.endDate,
      period: filterDto.period,
      fiscalYearId: filterDto.fiscalYearId,
      companyId: req.user.organizationId
    } as any);
    
    return {
      success: true,
      data: revenueData
    };
  }

  @Get('expenses')
  @ApiOperation({ 
    summary: 'Get Expenses Data',
    description: 'Retrieves expenses breakdown for charts.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Expenses data retrieved successfully'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'fiscalYearId', required: false, description: 'ID of the fiscal year' })
  async getExpensesData(
    @Query() filterDto: DashboardFilterDto,
    @Request() req: ExpressRequest & { user: { organizationId: string } }
  ) {
    const expensesData = await this.dashboardService.getExpensesData({
      startDate: filterDto.startDate,
      endDate: filterDto.endDate,
      fiscalYearId: filterDto.fiscalYearId,
      companyId: req.user.organizationId
    } as any);
    
    return {
      success: true,
      data: expensesData
    };
  }
}
