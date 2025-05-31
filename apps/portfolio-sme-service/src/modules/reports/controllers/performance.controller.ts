import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PerformanceService } from '../services/performance.service';
import { CalculatePerformanceDto, PerformanceMetric } from '../dtos/performance.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('performance')
@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Post('calculate')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Calculate portfolio performance' })
  @ApiResponse({ status: 201, description: 'Performance calculated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async calculatePerformance(@Body() calculateDto: CalculatePerformanceDto) {
    const performance = await this.performanceService.calculatePortfolioPerformance(
      calculateDto.portfolioId,
      calculateDto.period,
    );

    return {
      success: true,
      performance,
    };
  }

  @Get('portfolio/:id')
  @ApiOperation({ summary: 'Get portfolio performance metrics' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getPortfolioPerformance(@Param('id') id: string) {
    const performance = await this.performanceService.calculatePortfolioPerformance(
      id,
      {
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        endDate: new Date(),
      },
    );

    return {
      success: true,
      performance,
    };
  }

  @Get('portfolio/:id/metrics/:metric')
  @ApiOperation({ summary: 'Get specific performance metric' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiParam({ name: 'metric', description: 'Performance metric', enum: PerformanceMetric })
  @ApiResponse({ status: 200, description: 'Performance metric retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio or metric not found' })
  async getSpecificMetric(
    @Param('id') id: string,
    @Param('metric') metric: PerformanceMetric,
  ) {
    const performance = await this.performanceService.calculatePortfolioPerformance(
      id,
      {
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        endDate: new Date(),
      },
    );

    return {
      success: true,
      metric: {
        name: metric,
        value: performance.metrics[metric],
      },
    };
  }
}