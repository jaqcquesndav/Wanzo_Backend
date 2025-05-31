import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportService } from '../services/report.service';
import { GenerateReportDto, ReportType, ReportFormat } from '../dtos/report.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('generate')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Generate report' })
  @ApiResponse({ status: 201, description: 'Report generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async generateReport(
    @Body() generateReportDto: GenerateReportDto,
    @Req() req: any,
  ) {
    const report = await this.reportService.generateReport(
      req.user.companyId,
      generateReportDto.type,
      generateReportDto.period,
      generateReportDto.format,
    );

    return {
      success: true,
      report,
    };
  }

  @Get('portfolio-summary')
  @ApiOperation({ summary: 'Get portfolio summary report' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  async getPortfolioSummary(@Req() req: any) {
    const report = await this.reportService.generateReport(
      req.user.companyId,
      ReportType.PORTFOLIO_SUMMARY,
      {
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        endDate: new Date(),
      },
      ReportFormat.PDF,
    );

    return {
      success: true,
      report,
    };
  }

  @Get('operations-analysis')
  @ApiOperation({ summary: 'Get operations analysis report' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  async getOperationsAnalysis(@Req() req: any) {
    const report = await this.reportService.generateReport(
      req.user.companyId,
      ReportType.OPERATIONS_ANALYSIS,
      {
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        endDate: new Date(),
      },
      ReportFormat.PDF,
    );

    return {
      success: true,
      report,
    };
  }

  @Get('asset-valuation')
  @ApiOperation({ summary: 'Get asset valuation report' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  async getAssetValuation(@Req() req: any) {
    const report = await this.reportService.generateReport(
      req.user.companyId,
      ReportType.ASSET_VALUATION,
      {
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        endDate: new Date(),
      },
      ReportFormat.PDF,
    );

    return {
      success: true,
      report,
    };
  }

  @Get('risk-assessment')
  @ApiOperation({ summary: 'Get risk assessment report' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  async getRiskAssessment(@Req() req: any ) {
    const report = await this.reportService.generateReport(
      req.user.companyId,
      ReportType.RISK_ASSESSMENT,
      {
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        endDate: new Date(),
      },
      ReportFormat.PDF,
    );

    return {
      success: true,
      report,
    };
  }
}