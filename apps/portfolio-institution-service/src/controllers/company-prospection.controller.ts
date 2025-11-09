import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { 
  RequirePortfolioUser,
  RequireCompanyProspection,
  RequireRiskAssessment,
  RequireCreditApplication,
  RequireCreditScoring,
  RequireLoanSimulation,
  RequireCustomReport 
} from '@wanzobe/shared';
import { CompanyProspectionService } from '../services/company-prospection.service';
import { CreateProspectDto, UpdateProspectDto, ProspectQueryDto } from '../dto/prospect.dto';

@ApiTags('company-prospection')
@ApiBearerAuth()
@Controller('prospection')
@UseGuards(JwtAuthGuard)
export class CompanyProspectionController {
  constructor(private readonly prospectionService: CompanyProspectionService) {}

  /**
   * Ajouter une nouvelle entreprise prospectable
   * Consomme 1 crédit d'entreprise prospectable
   */
  @Post('companies')
  @RequireCompanyProspection(1)
  @ApiOperation({ 
    summary: 'Ajouter une entreprise prospectable',
    description: 'Ajoute une nouvelle entreprise au portefeuille prospectable. Consomme 1 crédit d\'entreprise prospectable.'
  })
  async addProspectableCompany(@Body() createDto: CreateProspectDto) {
    return this.prospectionService.addProspectableCompany(createDto);
  }

  /**
   * Import en lot d'entreprises prospectables
   * Consomme autant de crédits que d'entreprises importées
   */
  @Post('companies/bulk-import')
  @RequireCompanyProspection() // Quantité déterminée par le nombre d'entreprises
  @ApiOperation({ 
    summary: 'Importer des entreprises en lot',
    description: 'Importe plusieurs entreprises prospectables depuis un fichier. Consomme 1 crédit par entreprise.'
  })
  async bulkImportCompanies(@Body() importData: { companies: CreateProspectDto[] }) {
    return this.prospectionService.bulkImportCompanies(importData.companies);
  }

  /**
   * Effectuer une évaluation de risque
   * Consomme 1 crédit d'évaluation de risque mensuelle
   */
  @Post('risk-assessment/:companyId')
  @RequireRiskAssessment(1)
  @ApiOperation({ 
    summary: 'Effectuer une évaluation de risque',
    description: 'Effectue une évaluation de risque pour une entreprise. Consomme 1 crédit d\'évaluation mensuelle.'
  })
  async performRiskAssessment(@Param('companyId') companyId: string, @Body() assessmentData: any) {
    return this.prospectionService.performRiskAssessment(companyId, assessmentData);
  }

  /**
   * Calculer la cote de crédit d'une entreprise
   * Consomme 1 crédit de calcul de cote crédit
   */
  @Post('credit-scoring/:companyId')
  @RequireCreditScoring(1)
  @ApiOperation({ 
    summary: 'Calculer la cote de crédit',
    description: 'Calcule la cote de crédit d\'une entreprise. Consomme 1 crédit de calcul de cote crédit.'
  })
  async calculateCreditScore(@Param('companyId') companyId: string, @Body() scoringData: any) {
    return this.prospectionService.calculateCreditScore(companyId, scoringData);
  }

  /**
   * Simuler un prêt pour une entreprise
   * Consomme 1 crédit de simulation de prêt
   */
  @Post('loan-simulation/:companyId')
  @RequireLoanSimulation(1)
  @ApiOperation({ 
    summary: 'Simuler un prêt',
    description: 'Simule les conditions d\'un prêt pour une entreprise. Consomme 1 crédit de simulation.'
  })
  async simulateLoan(@Param('companyId') companyId: string, @Body() loanData: any) {
    return this.prospectionService.simulateLoan(companyId, loanData);
  }

  /**
   * Traiter une demande de crédit
   * Consomme 1 crédit de demande de crédit mensuelle
   */
  @Post('credit-application/:companyId')
  @RequireCreditApplication(1)
  @ApiOperation({ 
    summary: 'Traiter une demande de crédit',
    description: 'Traite une demande de crédit d\'entreprise. Consomme 1 crédit de demande mensuelle.'
  })
  async processCreditApplication(@Param('companyId') companyId: string, @Body() applicationData: any) {
    return this.prospectionService.processCreditApplication(companyId, applicationData);
  }

  /**
   * Récupérer les entreprises prospectables
   * Lecture gratuite
   */
  @Get('companies')
  @ApiOperation({ summary: 'Récupérer les entreprises prospectables' })
  async getProspectableCompanies(@Query() query: ProspectQueryDto) {
    return this.prospectionService.getProspectableCompanies(query);
  }

  /**
   * Récupérer les détails d'une entreprise
   * Lecture gratuite
   */
  @Get('companies/:id')
  @ApiOperation({ summary: 'Récupérer les détails d\'une entreprise' })
  async getCompanyDetails(@Param('id') id: string) {
    return this.prospectionService.getCompanyDetails(id);
  }

  /**
   * Mettre à jour les informations d'une entreprise
   * Ne consomme pas de crédit supplémentaire
   */
  @Put('companies/:id')
  @ApiOperation({ summary: 'Mettre à jour une entreprise' })
  async updateCompany(@Param('id') id: string, @Body() updateDto: UpdateProspectDto) {
    return this.prospectionService.updateCompany(id, updateDto);
  }

  /**
   * Supprimer une entreprise du portefeuille
   * Libère un crédit d'entreprise prospectable
   */
  @Delete('companies/:id')
  @ApiOperation({ summary: 'Supprimer une entreprise du portefeuille' })
  async removeCompany(@Param('id') id: string) {
    return this.prospectionService.removeCompany(id);
  }

  /**
   * Générer un rapport de prospection
   * Consomme 1 crédit de rapport personnalisé
   */
  @Post('reports/prospection')
  @RequireCustomReport(1)
  @ApiOperation({ 
    summary: 'Générer un rapport de prospection',
    description: 'Génère un rapport détaillé sur les activités de prospection. Consomme 1 crédit de rapport mensuel.'
  })
  async generateProspectionReport(@Body() reportConfig: any) {
    return this.prospectionService.generateProspectionReport(reportConfig);
  }

  /**
   * Rapport d'analyse de portefeuille
   * Consomme 1 crédit de rapport personnalisé
   */
  @Post('reports/portfolio-analysis')
  @RequireCustomReport(1)
  @ApiOperation({ 
    summary: 'Analyse du portefeuille',
    description: 'Génère une analyse complète du portefeuille d\'entreprises. Consomme 1 crédit de rapport mensuel.'
  })
  async generatePortfolioAnalysis(@Body() analysisConfig: any) {
    return this.prospectionService.generatePortfolioAnalysis(analysisConfig);
  }
}