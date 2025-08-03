import { Controller, Get, Param, Query, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FinancialDataConfigService } from '../../services/financial-data-config.service';

/**
 * Contrôleur pour l'accès aux données de configuration financière RDC
 * Expose les données centralisées via des endpoints REST
 */
@ApiTags('Configuration des Données Financières RDC')
@Controller('api/v1/financial-data-config')
export class FinancialDataConfigController {
  constructor(
    private readonly financialDataConfigService: FinancialDataConfigService
  ) {}

  // ====================
  // ENDPOINTS GÉOGRAPHIQUES
  // ====================

  @Get('provinces')
  @ApiOperation({ summary: 'Obtenir toutes les provinces de la RDC' })
  @ApiResponse({ status: 200, description: 'Liste de toutes les provinces avec leurs indicateurs économiques' })
  getAllProvinces() {
    try {
      return {
        status: 'success',
        data: this.financialDataConfigService.getAllProvinces(),
        message: 'Provinces récupérées avec succès'
      };
    } catch (error) {
      throw new HttpException('Erreur lors de la récupération des provinces', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('provinces/:id')
  @ApiOperation({ summary: 'Obtenir une province par son ID' })
  @ApiParam({ name: 'id', description: 'ID de la province' })
  @ApiResponse({ status: 200, description: 'Province trouvée' })
  @ApiResponse({ status: 404, description: 'Province non trouvée' })
  getProvinceById(@Param('id') id: string) {
    try {
      const province = this.financialDataConfigService.getProvinceById(id);
      if (!province) {
        throw new HttpException('Province non trouvée', HttpStatus.NOT_FOUND);
      }
      return {
        status: 'success',
        data: province,
        message: 'Province récupérée avec succès'
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Erreur lors de la récupération de la province', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('provinces/code/:code')
  @ApiOperation({ summary: 'Obtenir une province par son code' })
  @ApiParam({ name: 'code', description: 'Code de la province (ex: KIN, KAT)' })
  @ApiResponse({ status: 200, description: 'Province trouvée' })
  @ApiResponse({ status: 404, description: 'Province non trouvée' })
  getProvinceByCode(@Param('code') code: string) {
    try {
      const province = this.financialDataConfigService.getProvinceByCode(code.toUpperCase());
      if (!province) {
        throw new HttpException('Province non trouvée', HttpStatus.NOT_FOUND);
      }
      return {
        status: 'success',
        data: province,
        message: 'Province récupérée avec succès'
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Erreur lors de la récupération de la province', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('provinces/risk-level')
  @ApiOperation({ summary: 'Filtrer les provinces par niveau de risque' })
  @ApiQuery({ name: 'min', description: 'Score de risque minimum', type: Number })
  @ApiQuery({ name: 'max', description: 'Score de risque maximum (optionnel)', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Provinces filtrées par niveau de risque' })
  getProvincesByRiskLevel(@Query('min') minRisk: string, @Query('max') maxRisk?: string) {
    try {
      const min = parseFloat(minRisk);
      const max = maxRisk ? parseFloat(maxRisk) : undefined;
      
      if (isNaN(min)) {
        throw new HttpException('Le score de risque minimum doit être un nombre', HttpStatus.BAD_REQUEST);
      }
      
      const provinces = this.financialDataConfigService.getProvincesByRiskLevel(min, max);
      return {
        status: 'success',
        data: provinces,
        message: `${provinces.length} provinces trouvées pour le critère de risque`
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Erreur lors du filtrage des provinces', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('country')
  @ApiOperation({ summary: 'Obtenir les données du pays RDC' })
  @ApiResponse({ status: 200, description: 'Données du pays RDC' })
  getCountryData() {
    try {
      return {
        status: 'success',
        data: this.financialDataConfigService.getCountryData(),
        message: 'Données du pays récupérées avec succès'
      };
    } catch (error) {
      throw new HttpException('Erreur lors de la récupération des données du pays', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ====================
  // ENDPOINTS SECTEURS ÉCONOMIQUES
  // ====================

  @Get('sectors')
  @ApiOperation({ summary: 'Obtenir tous les secteurs économiques' })
  @ApiResponse({ status: 200, description: 'Liste de tous les secteurs économiques' })
  getAllSectors() {
    try {
      return {
        status: 'success',
        data: this.financialDataConfigService.getAllSectors(),
        message: 'Secteurs récupérés avec succès'
      };
    } catch (error) {
      throw new HttpException('Erreur lors de la récupération des secteurs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('sectors/:id')
  @ApiOperation({ summary: 'Obtenir un secteur par son ID' })
  @ApiParam({ name: 'id', description: 'ID du secteur' })
  @ApiResponse({ status: 200, description: 'Secteur trouvé' })
  @ApiResponse({ status: 404, description: 'Secteur non trouvé' })
  getSectorById(@Param('id') id: string) {
    try {
      const sector = this.financialDataConfigService.getSectorById(id);
      if (!sector) {
        throw new HttpException('Secteur non trouvé', HttpStatus.NOT_FOUND);
      }
      return {
        status: 'success',
        data: sector,
        message: 'Secteur récupéré avec succès'
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Erreur lors de la récupération du secteur', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('sectors/risk/:level')
  @ApiOperation({ summary: 'Obtenir les secteurs par niveau de risque' })
  @ApiParam({ name: 'level', description: 'Niveau de risque (LOW, MEDIUM, HIGH, CRITICAL)' })
  @ApiResponse({ status: 200, description: 'Secteurs filtrés par niveau de risque' })
  getSectorsByRiskLevel(@Param('level') level: string) {
    try {
      const riskLevel = level.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(riskLevel)) {
        throw new HttpException('Niveau de risque invalide. Utilisez: LOW, MEDIUM, HIGH, CRITICAL', HttpStatus.BAD_REQUEST);
      }
      
      const sectors = this.financialDataConfigService.getSectorsByRiskLevel(riskLevel);
      return {
        status: 'success',
        data: sectors,
        message: `${sectors.length} secteurs trouvés pour le niveau de risque ${riskLevel}`
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Erreur lors du filtrage des secteurs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('sectors/high-risk')
  @ApiOperation({ summary: 'Obtenir les secteurs à haut risque' })
  @ApiResponse({ status: 200, description: 'Liste des secteurs à haut risque (HIGH et CRITICAL)' })
  getHighRiskSectors() {
    try {
      return {
        status: 'success',
        data: this.financialDataConfigService.getHighRiskSectors(),
        message: 'Secteurs à haut risque récupérés avec succès'
      };
    } catch (error) {
      throw new HttpException('Erreur lors de la récupération des secteurs à haut risque', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ====================
  // ENDPOINTS INSTITUTIONS FINANCIÈRES
  // ====================

  @Get('institutions')
  @ApiOperation({ summary: 'Obtenir toutes les institutions financières' })
  @ApiResponse({ status: 200, description: 'Liste de toutes les institutions financières' })
  getAllInstitutions() {
    try {
      return {
        status: 'success',
        data: this.financialDataConfigService.getAllInstitutions(),
        message: 'Institutions récupérées avec succès'
      };
    } catch (error) {
      throw new HttpException('Erreur lors de la récupération des institutions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('institutions/:id')
  @ApiOperation({ summary: 'Obtenir une institution par son ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'institution' })
  @ApiResponse({ status: 200, description: 'Institution trouvée' })
  @ApiResponse({ status: 404, description: 'Institution non trouvée' })
  getInstitutionById(@Param('id') id: string) {
    try {
      const institution = this.financialDataConfigService.getInstitutionById(id);
      if (!institution) {
        throw new HttpException('Institution non trouvée', HttpStatus.NOT_FOUND);
      }
      return {
        status: 'success',
        data: institution,
        message: 'Institution récupérée avec succès'
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Erreur lors de la récupération de l\'institution', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('institutions/type/:type')
  @ApiOperation({ summary: 'Obtenir les institutions par type' })
  @ApiParam({ name: 'type', description: 'Type d\'institution (CENTRAL_BANK, COMMERCIAL_BANK, MICROFINANCE, INSURANCE, INVESTMENT_FUND)' })
  @ApiResponse({ status: 200, description: 'Institutions filtrées par type' })
  getInstitutionsByType(@Param('type') type: string) {
    try {
      const instType = type.toUpperCase() as 'CENTRAL_BANK' | 'COMMERCIAL_BANK' | 'MICROFINANCE' | 'INSURANCE' | 'INVESTMENT_FUND';
      if (!['CENTRAL_BANK', 'COMMERCIAL_BANK', 'MICROFINANCE', 'INSURANCE', 'INVESTMENT_FUND'].includes(instType)) {
        throw new HttpException('Type d\'institution invalide', HttpStatus.BAD_REQUEST);
      }
      
      const institutions = this.financialDataConfigService.getInstitutionsByType(instType);
      return {
        status: 'success',
        data: institutions,
        message: `${institutions.length} institutions trouvées pour le type ${instType}`
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Erreur lors du filtrage des institutions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('institutions/systemic')
  @ApiOperation({ summary: 'Obtenir les institutions systémiquement importantes' })
  @ApiResponse({ status: 200, description: 'Liste des institutions systémiquement importantes' })
  getSystemicallyImportantInstitutions() {
    try {
      return {
        status: 'success',
        data: this.financialDataConfigService.getSystemicallyImportantInstitutions(),
        message: 'Institutions systémiquement importantes récupérées avec succès'
      };
    } catch (error) {
      throw new HttpException('Erreur lors de la récupération des institutions systémiques', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ====================
  // ENDPOINTS CONFIGURATION GÉNÉRALE
  // ====================

  @Get('risk-thresholds')
  @ApiOperation({ summary: 'Obtenir tous les seuils de risque' })
  @ApiResponse({ status: 200, description: 'Configuration des seuils de risque' })
  getRiskThresholds() {
    try {
      return {
        status: 'success',
        data: this.financialDataConfigService.getRiskThresholds(),
        message: 'Seuils de risque récupérés avec succès'
      };
    } catch (error) {
      throw new HttpException('Erreur lors de la récupération des seuils de risque', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('currencies')
  @ApiOperation({ summary: 'Obtenir la configuration des devises' })
  @ApiResponse({ status: 200, description: 'Configuration des devises et taux de change' })
  getAllCurrencies() {
    try {
      return {
        status: 'success',
        data: this.financialDataConfigService.getAllCurrencies(),
        message: 'Configuration des devises récupérée avec succès'
      };
    } catch (error) {
      throw new HttpException('Erreur lors de la récupération des devises', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('convert')
  @ApiOperation({ summary: 'Convertir un montant entre devises' })
  @ApiQuery({ name: 'amount', description: 'Montant à convertir', type: Number })
  @ApiQuery({ name: 'from', description: 'Devise source (ex: CDF)' })
  @ApiQuery({ name: 'to', description: 'Devise cible (ex: USD)' })
  @ApiResponse({ status: 200, description: 'Montant converti' })
  convertCurrency(
    @Query('amount') amount: string,
    @Query('from') fromCurrency: string,
    @Query('to') toCurrency: string
  ) {
    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum)) {
        throw new HttpException('Le montant doit être un nombre', HttpStatus.BAD_REQUEST);
      }
      
      const converted = this.financialDataConfigService.convertCurrency(
        amountNum, 
        fromCurrency.toUpperCase(), 
        toCurrency.toUpperCase()
      );
      
      if (converted === null) {
        throw new HttpException('Devise non supportée', HttpStatus.BAD_REQUEST);
      }
      
      return {
        status: 'success',
        data: {
          originalAmount: amountNum,
          originalCurrency: fromCurrency.toUpperCase(),
          convertedAmount: Math.round(converted * 100) / 100,
          targetCurrency: toCurrency.toUpperCase(),
          timestamp: new Date().toISOString()
        },
        message: 'Conversion réussie'
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Erreur lors de la conversion', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('analytics-constants')
  @ApiOperation({ summary: 'Obtenir les constantes analytiques' })
  @ApiResponse({ status: 200, description: 'Constantes pour l\'analyse des risques et la détection de fraude' })
  getAnalyticsConstants() {
    try {
      return {
        status: 'success',
        data: {
          fraudDetection: this.financialDataConfigService.getFraudDetectionThresholds(),
          systemicRisk: this.financialDataConfigService.getSystemicRiskLimits(),
          reporting: this.financialDataConfigService.getReportingFrequency()
        },
        message: 'Constantes analytiques récupérées avec succès'
      };
    } catch (error) {
      throw new HttpException('Erreur lors de la récupération des constantes', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Recherche globale dans toutes les entités' })
  @ApiQuery({ name: 'q', description: 'Terme de recherche' })
  @ApiResponse({ status: 200, description: 'Résultats de recherche dans provinces, secteurs et institutions' })
  globalSearch(@Query('q') query: string) {
    try {
      if (!query || query.trim().length < 2) {
        throw new HttpException('Le terme de recherche doit contenir au moins 2 caractères', HttpStatus.BAD_REQUEST);
      }
      
      const results = this.financialDataConfigService.globalSearch(query.trim());
      const totalResults = results.provinces.length + results.sectors.length + results.institutions.length;
      
      return {
        status: 'success',
        data: results,
        message: `${totalResults} résultats trouvés pour "${query}"`
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Erreur lors de la recherche', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Obtenir les statistiques globales du système' })
  @ApiResponse({ status: 200, description: 'Statistiques complètes du système financier RDC' })
  getSystemStatistics() {
    try {
      return {
        status: 'success',
        data: this.financialDataConfigService.getSystemStatistics(),
        message: 'Statistiques du système récupérées avec succès'
      };
    } catch (error) {
      throw new HttpException('Erreur lors de la récupération des statistiques', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('validate')
  @ApiOperation({ summary: 'Valider l\'intégrité des données de configuration' })
  @ApiResponse({ status: 200, description: 'Rapport de validation des données' })
  validateDataIntegrity() {
    try {
      return {
        status: 'success',
        data: this.financialDataConfigService.validateDataIntegrity(),
        message: 'Validation des données terminée'
      };
    } catch (error) {
      throw new HttpException('Erreur lors de la validation', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
