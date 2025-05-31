import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GraphAnalyticsService } from '../services/graph-analytics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('graph-analytics')
@Controller('graph-analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GraphAnalyticsController {
  constructor(private readonly graphAnalyticsService: GraphAnalyticsService) {}

  
  @Get('fraud-detection')
  @ApiOperation({ summary: 'Detect fraud patterns' })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  @ApiResponse({ status: 200, description: 'Fraud patterns detected successfully' })
  async detectFraud(
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    const patterns = await this.graphAnalyticsService.detectFraudPatterns(startDate, endDate);
    return {
      success: true,
      patterns,
    };
  }

  @Get('market-trends')
  @ApiOperation({ summary: 'Analyze market trends' })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  @ApiResponse({ status: 200, description: 'Market trends analyzed successfully' })
  async analyzeMarket(
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    const trends = await this.graphAnalyticsService.analyzeMarketTrends({
      start: startDate,
      end: endDate,
    });
    return {
      success: true,
      trends,
    };
  }

  @Get('crisis-prediction')
  @ApiOperation({ summary: 'Predict potential financial crisis' })
  @ApiResponse({ status: 200, description: 'Crisis prediction completed successfully' })
  async predictCrisis() {
    const prediction = await this.graphAnalyticsService.predictFinancialCrisis();
    return {
      success: true,
      prediction,
    };
  }
}