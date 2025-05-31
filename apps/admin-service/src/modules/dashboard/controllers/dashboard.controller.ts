import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { DashboardFilterDto } from '../dtos/dashboard.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Activity } from '../../activities/entities/activity.entity';

interface DashboardResponse {
  success: boolean;
  overview: {
    totalUsers: number;
    totalCompanies: number;
    totalDocuments: number;
  };
  recentActivities: Activity[];
  documentsByStatus: {
    status: string;
    count: string;
  }[];
  usersByRole: {
    role: string;
    count: string;
  }[];
}

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('statistics')
  @ApiOperation({ 
    summary: 'Get dashboard statistics',
    description: 'Retrieve statistics and metrics for the dashboard'
  })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter statistics by company' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for statistics period' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for statistics period' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics(@Query() filters: DashboardFilterDto): Promise<DashboardResponse> {
    const statistics = await this.dashboardService.getStatistics(filters);
    return {
      success: true,
      ...statistics,
    };
  }
}