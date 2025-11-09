import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { 
  RequireInvoiceGeneration,
  RequireSalesTransaction,
  RequireDataExport,
  RequireCustomReport,
  RequireDocumentAnalysis 
} from '@wanzobe/shared';
import { InvoiceService } from '../services/invoice.service';
import { CreateInvoiceDto, UpdateInvoiceDto, InvoiceQueryDto } from '../dto/invoice.dto';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  /**
   * Créer une nouvelle facture
   * Consomme 1 crédit de génération de facture
   */
  @Post()
  @RequireInvoiceGeneration(1)
  @ApiOperation({ 
    summary: 'Créer une nouvelle facture',
    description: 'Crée une nouvelle facture. Consomme 1 crédit de génération de facture mensuelle.'
  })
  async create(@Body() createDto: CreateInvoiceDto) {
    return this.invoiceService.create(createDto);
  }

  /**
   * Générer des factures automatiquement
   * Consomme autant de crédits que de factures générées
   */
  @Post('auto-generate')
  @RequireInvoiceGeneration() // Quantité déterminée dynamiquement
  @ApiOperation({ 
    summary: 'Générer des factures automatiquement',
    description: 'Génère automatiquement des factures basées sur les commandes en attente.'
  })
  async autoGenerate(@Body() generationConfig: any) {
    return this.invoiceService.autoGenerateInvoices(generationConfig);
  }

  /**
   * Traitement d'une transaction de vente
   * Consomme 1 crédit de transaction de vente
   */
  @Post(':id/process-sale')
  @RequireSalesTransaction(1)
  @ApiOperation({ 
    summary: 'Traiter une transaction de vente',
    description: 'Traite une transaction de vente pour une facture. Consomme 1 crédit de transaction mensuelle.'
  })
  async processSale(@Param('id') id: string, @Body() saleData: any) {
    return this.invoiceService.processSale(id, saleData);
  }

  /**
   * Analyser une facture avec l'IA
   * Consomme 1 crédit d'analyse de document
   */
  @Post(':id/ai-analysis')
  @RequireDocumentAnalysis(1)
  @ApiOperation({ 
    summary: 'Analyser une facture avec l\'IA',
    description: 'Analyse une facture avec l\'IA pour détecter des anomalies ou optimisations.'
  })
  async analyzeInvoice(@Param('id') id: string) {
    return this.invoiceService.analyzeInvoiceWithAI(id);
  }

  /**
   * Récupérer les factures
   * Lecture gratuite
   */
  @Get()
  @ApiOperation({ summary: 'Récupérer la liste des factures' })
  async findAll(@Query() query: InvoiceQueryDto) {
    return this.invoiceService.findAll(query);
  }

  /**
   * Récupérer une facture par ID
   * Lecture gratuite
   */
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une facture par ID' })
  async findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(id);
  }

  /**
   * Mettre à jour une facture
   * Ne consomme pas de crédit supplémentaire
   */
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une facture' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateInvoiceDto) {
    return this.invoiceService.update(id, updateDto);
  }

  /**
   * Supprimer une facture
   * Ne consomme pas de crédit
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une facture' })
  async remove(@Param('id') id: string) {
    return this.invoiceService.remove(id);
  }

  /**
   * Exporter les factures
   * Consomme 1 crédit d'export de données
   */
  @Post('export')
  @RequireDataExport(1)
  @ApiOperation({ 
    summary: 'Exporter les factures',
    description: 'Exporte les factures au format spécifié. Consomme 1 crédit d\'export mensuel.'
  })
  async exportInvoices(@Body() exportConfig: any) {
    return this.invoiceService.exportInvoices(exportConfig);
  }

  /**
   * Rapport de performance des ventes
   * Consomme 1 crédit de rapport personnalisé
   */
  @Post('reports/sales-performance')
  @RequireCustomReport(1)
  @ApiOperation({ 
    summary: 'Rapport de performance des ventes',
    description: 'Génère un rapport de performance des ventes. Consomme 1 crédit de rapport mensuel.'
  })
  async salesPerformanceReport(@Body() reportConfig: any) {
    return this.invoiceService.generateSalesPerformanceReport(reportConfig);
  }

  /**
   * Rapport de revenus par période
   * Consomme 1 crédit de rapport personnalisé
   */
  @Post('reports/revenue')
  @RequireCustomReport(1)
  @ApiOperation({ 
    summary: 'Rapport de revenus',
    description: 'Génère un rapport de revenus par période. Consomme 1 crédit de rapport mensuel.'
  })
  async revenueReport(@Body() reportConfig: any) {
    return this.invoiceService.generateRevenueReport(reportConfig);
  }
}