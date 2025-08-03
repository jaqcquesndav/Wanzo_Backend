import { Controller, Get, Query, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { SalesSummaryQueryDto } from './dto/sales-summary-query.dto';
import { CustomerStatsQueryDto } from './dto/customer-stats-query.dto';
import { JournalQueryDto } from './dto/journal-query.dto';
import { DateQueryDto } from './dto/date-query.dto';
import { OperationsJournalQueryDto } from './dto/operations-journal-query.dto';
import { ExportJournalQueryDto } from './dto/export-journal-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SalesSummary, CustomerStats } from './interfaces/dashboard-types.interface';
import { DashboardData, ApiResponse as ApiResponseInterface, SalesToday, OperationJournalEntry } from './interfaces/dashboard.interface';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('data')
  @ApiOperation({ summary: 'Récupérer les données du tableau de bord' })
  @ApiResponse({
    status: 200,
    description: 'Données du tableau de bord récupérées avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getDashboardData(@Query() query: DashboardQueryDto): Promise<ApiResponseInterface<DashboardData>> {
    const data = await this.dashboardService.getDashboardData(query);
    return {
      success: true,
      message: 'Données du tableau de bord récupérées avec succès',
      statusCode: 200,
      data
    };
  }

  @Get('sales-today')
  @ApiOperation({ summary: 'Récupérer uniquement les ventes du jour' })
  @ApiResponse({
    status: 200,
    description: 'Ventes du jour récupérées avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getSalesToday(@Query() query: DateQueryDto): Promise<ApiResponseInterface<SalesToday>> {
    const data = await this.dashboardService.getSalesToday(query);
    return {
      success: true,
      message: 'Ventes du jour récupérées avec succès',
      statusCode: 200,
      data
    };
  }

  @Get('clients-served-today')
  @ApiOperation({ summary: 'Récupérer le nombre de clients servis aujourd\'hui' })
  @ApiResponse({
    status: 200,
    description: 'Nombre de clients servis aujourd\'hui récupéré avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getClientsServedToday(@Query() query: DateQueryDto): Promise<ApiResponseInterface<number>> {
    const data = await this.dashboardService.getClientsServedToday(query);
    return {
      success: true,
      message: 'Nombre de clients servis aujourd\'hui récupéré avec succès',
      statusCode: 200,
      data
    };
  }

  @Get('receivables')
  @ApiOperation({ summary: 'Récupérer le total des montants à recevoir' })
  @ApiResponse({
    status: 200,
    description: 'Total des montants à recevoir récupéré avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getReceivables(): Promise<ApiResponseInterface<number>> {
    const data = await this.dashboardService.getReceivables();
    return {
      success: true,
      message: 'Total des montants à recevoir récupéré avec succès',
      statusCode: 200,
      data
    };
  }

  @Get('expenses-today')
  @ApiOperation({ summary: 'Récupérer les dépenses du jour' })
  @ApiResponse({
    status: 200,
    description: 'Dépenses du jour récupérées avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getExpensesToday(@Query() query: DateQueryDto): Promise<ApiResponseInterface<number>> {
    const data = await this.dashboardService.getExpensesToday(query);
    return {
      success: true,
      message: 'Dépenses du jour récupérées avec succès',
      statusCode: 200,
      data
    };
  }

  @Get('operations-journal')
  @ApiOperation({ summary: 'Récupérer les entrées du journal des opérations' })
  @ApiResponse({
    status: 200,
    description: 'Entrées du journal récupérées avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getOperationsJournal(@Query() query: OperationsJournalQueryDto): Promise<ApiResponseInterface<OperationJournalEntry[]>> {
    const data = await this.dashboardService.getOperationsJournal(query);
    return {
      success: true,
      message: 'Entrées du journal récupérées avec succès',
      statusCode: 200,
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
  async getSalesSummary(@Query() query: SalesSummaryQueryDto): Promise<ApiResponseInterface<SalesSummary>> {
    const data = await this.dashboardService.getSalesSummary(query);
    return {
      success: true,
      message: 'Résumé des ventes récupéré avec succès',
      statusCode: 200,
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
  async getCustomerStats(@Query() query: CustomerStatsQueryDto): Promise<ApiResponseInterface<CustomerStats>> {
    const data = await this.dashboardService.getCustomerStats(query);
    return {
      success: true,
      message: 'Statistiques clients récupérées avec succès',
      statusCode: 200,
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
  async getJournalEntries(@Query() query: JournalQueryDto): Promise<ApiResponseInterface<any>> {
    const data = await this.dashboardService.getJournalEntries(query);
    return {
      success: true,
      message: 'Entrées du journal récupérées avec succès',
      statusCode: 200,
      data
    };
  }

  @Get('operations-journal/export')
  @ApiOperation({ summary: 'Exporter le journal des opérations en PDF' })
  @ApiResponse({
    status: 200,
    description: 'Journal exporté avec succès',
    headers: {
      'Content-Type': {
        description: 'Type de contenu du fichier',
        schema: { type: 'string', example: 'application/pdf' }
      },
      'Content-Disposition': {
        description: 'Disposition du contenu pour téléchargement',
        schema: { type: 'string', example: 'attachment; filename="journal-operations.pdf"' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async exportOperationsJournal(@Query() query: ExportJournalQueryDto, @Res() res: Response) {
    try {
      const buffer = await this.dashboardService.exportOperationsJournal(query);
      
      if (query.format === 'csv') {
        res.set({
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="journal-operations.csv"',
        });
      } else {
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="journal-operations.pdf"',
        });
      }
      
      res.status(HttpStatus.OK).send(buffer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue s\'est produite';
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Erreur lors de l\'export du journal',
        statusCode: 500,
        error: errorMessage
      });
    }
  }
}
