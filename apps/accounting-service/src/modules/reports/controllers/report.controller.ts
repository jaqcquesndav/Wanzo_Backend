import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportService } from '../services/report.service';
import { GenerateReportDto, ExportReportDto } from '../dtos/report.dto';
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
  @Roles('admin', 'accountant')
  @ApiOperation({ 
    summary: 'Generate financial report',
    description: 'Generate a financial report based on specified parameters'
  })
  @ApiResponse({ status: 201, description: 'Report generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async generateReport(@Body() generateReportDto: GenerateReportDto) {
    const report = await this.reportService.generateReport(generateReportDto);
    return {
      success: true,
      report,
    };
  }

  @Post('export')
  @Roles('admin', 'accountant')
  @ApiOperation({ 
    summary: 'Export report',
    description: 'Export a report in the specified format'
  })
  @ApiResponse({ status: 201, description: 'Report exported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async exportReport(@Body() exportReportDto: ExportReportDto) {
    const downloadUrl = await this.reportService.exportReport(exportReportDto);
    return {
      success: true,
      downloadUrl,
    };
  }
}