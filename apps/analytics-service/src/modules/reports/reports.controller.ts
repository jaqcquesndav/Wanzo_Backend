import { Controller, Get, Param, Query, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { DataCollectionService } from '../data-collection/data-collection.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);
  
  constructor(private readonly dataCollectionService: DataCollectionService) {}

  @Get('institution/:id')
  @ApiOperation({ summary: 'Get institution analytics' })
  @ApiParam({ name: 'id', description: 'Institution ID' })
  @ApiQuery({ name: 'period', required: false, description: 'Analysis period (e.g., "1y", "6m", "3m")' })
  @ApiResponse({ status: 200, description: 'Institution analytics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access forbidden or data sharing not enabled' })
  @ApiResponse({ status: 503, description: 'Service unavailable due to database connection issues' })
  async getInstitutionAnalytics(
    @Param('id') institutionId: string,
    @Query('period') period?: string
  ) {
    try {
      this.logger.log(`Fetching institution analytics for ${institutionId}, period: ${period || 'all'}`);
      const data = await this.dataCollectionService.getAggregatedData(institutionId, period);
      
      // Check if we have enough data for meaningful analysis
      if (!data.hasData) {
        return {
          institutionId,
          period: period || 'all',
          timestamp: new Date().toISOString(),
          message: 'Insufficient data available for comprehensive analysis',
          availableData: data
        };
      }
      
      // Here we would normally process the data further
      return {
        institutionId,
        period: period || 'all',
        timestamp: new Date().toISOString(),
        data
      };
    } catch (error: any) {
      if (error.status === HttpStatus.FORBIDDEN) {
        throw error; // Re-throw ForbiddenException
      } else if (error.status === HttpStatus.SERVICE_UNAVAILABLE) {
        throw error; // Re-throw ServiceUnavailableException
      }
      
      this.logger.error(`Error retrieving institution analytics: ${error.message || String(error)}`);
      throw new HttpException('Failed to retrieve analytics data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('portfolio-performance/:id')
  @ApiOperation({ summary: 'Get portfolio performance analytics' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Portfolio performance retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access forbidden or data sharing not enabled' })
  @ApiResponse({ status: 503, description: 'Service unavailable due to database connection issues' })
  async getPortfolioPerformance(@Param('id') portfolioId: string) {
    try {
      this.logger.log(`Fetching portfolio performance for ${portfolioId}`);
      const institutionData = await this.dataCollectionService.getInstitutionPortfolioData(portfolioId);
      
      // Check if we have data
      if (institutionData.isEmpty) {
        return {
          portfolioId,
          timestamp: new Date().toISOString(),
          message: 'No portfolio data available for analysis'
        };
      }
      
      // Simulate some analytics processing
      return {
        portfolioId,
        timestamp: new Date().toISOString(),
        performance: {
          totalReturn: Math.random() * 20 - 5, // Mock data
          volatility: Math.random() * 10,
          sharpeRatio: Math.random() * 3,
          maxDrawdown: Math.random() * -15,
        },
        sourceData: institutionData
      };
    } catch (error: any) {
      if (error.status === HttpStatus.FORBIDDEN) {
        throw error; // Re-throw ForbiddenException
      } else if (error.status === HttpStatus.SERVICE_UNAVAILABLE) {
        throw error; // Re-throw ServiceUnavailableException
      }
      
      this.logger.error(`Error retrieving portfolio performance: ${error.message || String(error)}`);
      throw new HttpException('Failed to retrieve portfolio performance data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('financial-health/:id')
  @ApiOperation({ summary: 'Get financial health analysis' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiQuery({ name: 'fiscalYear', required: false, description: 'Fiscal year' })
  @ApiResponse({ status: 200, description: 'Financial health analysis retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access forbidden or data sharing not enabled' })
  @ApiResponse({ status: 503, description: 'Service unavailable due to database connection issues' })
  async getFinancialHealth(
    @Param('id') companyId: string,
    @Query('fiscalYear') fiscalYear?: string
  ) {
    try {
      this.logger.log(`Fetching financial health for ${companyId}, fiscal year: ${fiscalYear || 'current'}`);
      
      // For SMEs, we need to check data sharing permissions
      if (companyId.startsWith('SME-')) {
        // Extract the actual SME ID from the companyId format
        const smeId = companyId.replace('SME-', '');
        
        // This will throw a ForbiddenException if data sharing is not enabled
        await this.dataCollectionService.checkSMEDataSharingEnabled(smeId);
      }
      
      const accountingData = await this.dataCollectionService.getAccountingData(companyId, fiscalYear);
      
      // Check if we have data
      if (accountingData.isEmpty) {
        return {
          companyId,
          fiscalYear: fiscalYear || 'current',
          timestamp: new Date().toISOString(),
          message: 'No accounting data available for analysis'
        };
      }
      
      // Simulate financial health analysis
      return {
        companyId,
        fiscalYear: fiscalYear || 'current',
        timestamp: new Date().toISOString(),
        healthScore: Math.floor(Math.random() * 100), // Mock score
        metrics: {
          liquidityRatio: Math.random() * 3 + 0.5,
          debtToEquity: Math.random() * 2,
          operatingMargin: Math.random() * 0.4,
          returnOnAssets: Math.random() * 0.2,
        },
        sourceData: accountingData
      };
    } catch (error: any) {
      if (error.status === HttpStatus.FORBIDDEN) {
        throw error; // Re-throw ForbiddenException
      } else if (error.status === HttpStatus.SERVICE_UNAVAILABLE) {
        throw error; // Re-throw ServiceUnavailableException
      }
      
      this.logger.error(`Error retrieving financial health: ${error.message || String(error)}`);
      throw new HttpException('Failed to retrieve financial health data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
