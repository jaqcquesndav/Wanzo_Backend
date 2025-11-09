import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { 
  RequireAccountingEntries,
  RequireAutomatedAccounting,
  RequireFinancialReports,
  BusinessFeature 
} from '../../../../packages/shared/src';
import { JournalEntryService } from '../services/journal-entry.service';
import { CreateJournalEntryDto, UpdateJournalEntryDto, JournalEntryQueryDto } from '../dto/journal-entry.dto';

@ApiTags('journal-entries')
@ApiBearerAuth()
@Controller('journal-entries')
@UseGuards(JwtAuthGuard)
export class JournalEntryController {
  constructor(private readonly journalEntryService: JournalEntryService) {}

  /**
   * Créer une nouvelle écriture comptable
   * Consomme 1 crédit d'écriture comptable mensuelle
   */
  @Post()
  @RequireAccountingEntries(1)
  @ApiOperation({ 
    summary: 'Créer une écriture comptable',
    description: 'Crée une nouvelle écriture comptable. Consomme 1 crédit d\'écriture mensuelle selon le plan d\'abonnement.'
  })
  @ApiResponse({ status: 201, description: 'Écriture créée avec succès' })
  @ApiResponse({ status: 403, description: 'Limite d\'écritures comptables atteinte' })
  async create(@Body() createDto: CreateJournalEntryDto) {
    return this.journalEntryService.create(createDto);
  }

  /**
   * Créer plusieurs écritures comptables en lot
   * Consomme autant de crédits que d'écritures créées
   */
  @Post('batch')
  @RequireAccountingEntries() // La quantité sera déterminée dynamiquement
  @ApiOperation({ 
    summary: 'Créer des écritures en lot',
    description: 'Crée plusieurs écritures comptables simultanément. Consomme 1 crédit par écriture créée.'
  })
  async createBatch(@Body() createDtos: CreateJournalEntryDto[]) {
    // La vérification d'accès se fait avec la quantité fournie dans le body
    return this.journalEntryService.createBatch(createDtos);
  }

  /**
   * Générer des écritures automatisées via ADHA
   * Consomme des crédits d'écritures automatisées
   */
  @Post('automated')
  @RequireAutomatedAccounting(1)
  @ApiOperation({ 
    summary: 'Générer des écritures automatisées',
    description: 'Génère des écritures comptables automatiquement via l\'IA ADHA. Consomme 1 crédit d\'écriture automatisée.'
  })
  async generateAutomated(@Body() analysisData: any) {
    return this.journalEntryService.generateAutomatedEntries(analysisData);
  }

  /**
   * Récupérer les écritures comptables
   * Lecture gratuite, ne consomme pas de crédits
   */
  @Get()
  @ApiOperation({ summary: 'Récupérer les écritures comptables' })
  async findAll(@Query() query: JournalEntryQueryDto) {
    return this.journalEntryService.findAll(query);
  }

  /**
   * Récupérer une écriture par ID
   * Lecture gratuite
   */
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une écriture par ID' })
  async findOne(@Param('id') id: string) {
    return this.journalEntryService.findOne(id);
  }

  /**
   * Mettre à jour une écriture comptable
   * Ne consomme pas de crédit supplémentaire
   */
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une écriture comptable' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateJournalEntryDto) {
    return this.journalEntryService.update(id, updateDto);
  }

  /**
   * Supprimer une écriture comptable
   * Ne consomme pas de crédit
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une écriture comptable' })
  async remove(@Param('id') id: string) {
    return this.journalEntryService.remove(id);
  }

  /**
   * Générer un rapport financier
   * Consomme 1 crédit de génération de rapport
   */
  @Post('reports/financial')
  @RequireFinancialReports(1)
  @ApiOperation({ 
    summary: 'Générer un rapport financier',
    description: 'Génère un rapport financier basé sur les écritures comptables. Consomme 1 crédit de rapport.'
  })
  async generateFinancialReport(@Body() reportConfig: any) {
    return this.journalEntryService.generateFinancialReport(reportConfig);
  }

  /**
   * Générer le bilan comptable
   * Consomme 1 crédit de génération de rapport
   */
  @Post('reports/balance-sheet')
  @RequireFinancialReports(1)
  @ApiOperation({ summary: 'Générer le bilan comptable' })
  async generateBalanceSheet(@Body() config: any) {
    return this.journalEntryService.generateBalanceSheet(config);
  }

  /**
   * Générer le compte de résultat
   * Consomme 1 crédit de génération de rapport
   */
  @Post('reports/income-statement')
  @RequireFinancialReports(1)
  @ApiOperation({ summary: 'Générer le compte de résultat' })
  async generateIncomeStatement(@Body() config: any) {
    return this.journalEntryService.generateIncomeStatement(config);
  }
}