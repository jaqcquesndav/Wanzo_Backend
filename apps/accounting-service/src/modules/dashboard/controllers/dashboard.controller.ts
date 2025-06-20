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
  @ApiQuery({ name: 'fiscalYearId', required: false, description: 'ID of the fiscal year (default: current fiscal year)' })
  async getDashboard(
    @Query() filterDto: DashboardFilterDto,
    @Request() req: ExpressRequest & { user: { companyId: string } }
  ): Promise<{ success: boolean, data: DashboardResponseDto }> {
    const dashboardData = await this.dashboardService.getDashboardData({
      fiscalYearId: filterDto.fiscalYearId,
      // Nous utilisons companyId ici pour le service, mais ce n'est pas dans le DTO public
      // Ce paramètre sera géré en interne
      companyId: req.user.companyId
    } as any);
    
    return {
      success: true,
      data: dashboardData
    };
  }
}