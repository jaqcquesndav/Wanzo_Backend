import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { SalesSummaryQueryDto } from './dto/sales-summary-query.dto';
import { CustomerStatsQueryDto } from './dto/customer-stats-query.dto';
import { JournalQueryDto } from './dto/journal-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SalesSummary, CustomerStats } from './interfaces/dashboard-types.interface';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('data')
  @ApiOperation({ summary: 'Récupérer les données complètes du tableau de bord' })
  @ApiResponse({
    status: 200,
    description: 'Données du tableau de bord récupérées avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getDashboardData(@Query() query: DashboardQueryDto) {
    const data = await this.dashboardService.getDashboardData(query);
    return {
      status: 'success',
      data
    };
  }

  @Get('sales-summary')
  @ApiOperation({ summary: 'Récupérer le résumé des ventes' })
  @ApiResponse({
    status: 200,
    description: 'Résumé des ventes récupéré avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getSalesSummary(@Query() query: SalesSummaryQueryDto): Promise<{ status: string, data: SalesSummary }> {
    const data = await this.dashboardService.getSalesSummary(query);
    return {
      status: 'success',
      data
    };
  }

  @Get('customer-stats')
  @ApiOperation({ summary: 'Récupérer les statistiques clients' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques clients récupérées avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getCustomerStats(@Query() query: CustomerStatsQueryDto): Promise<{ status: string, data: CustomerStats }> {
    const data = await this.dashboardService.getCustomerStats(query);
    return {
      status: 'success',
      data
    };
  }

  @Get('journal')
  @ApiOperation({ summary: 'Récupérer les entrées du journal d\'opérations' })
  @ApiResponse({
    status: 200,
    description: 'Entrées du journal récupérées avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getJournalEntries(@Query() query: JournalQueryDto) {
    const data = await this.dashboardService.getJournalEntries(query);
    return {
      status: 'success',
      data
    };
  }
}
