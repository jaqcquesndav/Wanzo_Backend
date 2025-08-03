import { Controller, Get, Post, Param, Body, Query, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RiskCalculationService, SMEData } from '../services/risk-calculation.service';
import { RiskProfile, EntityType, RiskLevel } from '../entities/risk-profile.entity';

@ApiTags('risk-analysis')
@Controller('risk-analysis')
export class RiskAnalysisController {
  private readonly logger = new Logger(RiskAnalysisController.name);

  constructor(
    private readonly riskCalculationService: RiskCalculationService
  ) {}

  @Post('sme/:id/calculate')
  @ApiOperation({ 
    summary: 'Calcule le score de risque d\'une PME',
    description: 'Analyse complète du risque d\'une PME basée sur ses données financières, opérationnelles et historiques'
  })
  @ApiParam({ name: 'id', description: 'Identifiant de la PME' })
  @ApiBody({ 
    description: 'Données de la PME pour le calcul du risque',
    schema: {
      type: 'object',
      properties: {
        accounting: {
          type: 'object',
          properties: {
            currentAssets: { type: 'number' },
            currentLiabilities: { type: 'number' },
            totalAssets: { type: 'number' },
            totalDebt: { type: 'number' },
            netIncome: { type: 'number' },
            revenue: { type: 'number' }
          }
        },
        business: {
          type: 'object',
          properties: {
            sector: { type: 'string' },
            yearsInBusiness: { type: 'number' },
            employeeCount: { type: 'number' },
            monthlyRevenue: { type: 'number' }
          }
        },
        location: {
          type: 'object',
          properties: {
            province: { type: 'string' },
            city: { type: 'string' },
            commune: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Score de risque calculé avec succès',
    type: RiskProfile
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
  async calculateSMERisk(
    @Param('id') smeId: string,
    @Body() smeData: SMEData
  ): Promise<RiskProfile> {
    try {
      this.logger.log(`Calculating risk for SME: ${smeId}`);
      
      // Validation des données minimales
      if (!smeData.accounting && !smeData.business) {
        throw new HttpException(
          'Au moins les données comptables ou business sont requises',
          HttpStatus.BAD_REQUEST
        );
      }

      const riskProfile = await this.riskCalculationService.calculateSMERisk(smeId, smeData);
      
      this.logger.log(`Risk calculated successfully for SME ${smeId}: ${riskProfile.riskScore}`);
      return riskProfile;

    } catch (error: any) {
      this.logger.error(`Error calculating SME risk for ${smeId}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Erreur lors du calcul du risque',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('profile/:entityType/:entityId')
  @ApiOperation({ 
    summary: 'Récupère le profil de risque d\'une entité',
    description: 'Retourne le profil de risque complet d\'une entité (PME, Institution, Portfolio, etc.)'
  })
  @ApiParam({ name: 'entityType', description: 'Type d\'entité', enum: EntityType })
  @ApiParam({ name: 'entityId', description: 'Identifiant de l\'entité' })
  @ApiResponse({ 
    status: 200, 
    description: 'Profil de risque récupéré avec succès',
    type: RiskProfile
  })
  @ApiResponse({ status: 404, description: 'Profil de risque non trouvé' })
  async getRiskProfile(
    @Param('entityType') entityType: EntityType,
    @Param('entityId') entityId: string
  ): Promise<RiskProfile> {
    try {
      const riskProfile = await this.riskCalculationService.getRiskProfile(entityType, entityId);
      
      if (!riskProfile) {
        throw new HttpException(
          `Profil de risque non trouvé pour ${entityType}:${entityId}`,
          HttpStatus.NOT_FOUND
        );
      }

      return riskProfile;

    } catch (error: any) {
      this.logger.error(`Error retrieving risk profile for ${entityType}:${entityId}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Erreur lors de la récupération du profil de risque',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('profiles/by-level/:riskLevel')
  @ApiOperation({ 
    summary: 'Récupère les profils de risque par niveau',
    description: 'Retourne tous les profils de risque d\'un niveau spécifique (VERY_LOW, LOW, MEDIUM, HIGH, VERY_HIGH)'
  })
  @ApiParam({ name: 'riskLevel', description: 'Niveau de risque', enum: RiskLevel })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre maximum de résultats' })
  @ApiResponse({ 
    status: 200, 
    description: 'Profils de risque récupérés avec succès',
    type: [RiskProfile]
  })
  async getRiskProfilesByLevel(
    @Param('riskLevel') riskLevel: RiskLevel,
    @Query('limit') limit?: string
  ): Promise<RiskProfile[]> {
    try {
      const profiles = await this.riskCalculationService.getRiskProfilesByLevel(riskLevel);
      
      // Application de la limite si fournie
      if (limit && !isNaN(parseInt(limit))) {
        return profiles.slice(0, parseInt(limit));
      }

      return profiles;

    } catch (error: any) {
      this.logger.error(`Error retrieving risk profiles by level ${riskLevel}:`, error);
      
      throw new HttpException(
        'Erreur lors de la récupération des profils de risque',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('profiles/by-province/:province')
  @ApiOperation({ 
    summary: 'Récupère les profils de risque par province',
    description: 'Retourne tous les profils de risque d\'une province spécifique'
  })
  @ApiParam({ name: 'province', description: 'Nom de la province' })
  @ApiQuery({ name: 'minRiskScore', required: false, description: 'Score de risque minimum' })
  @ApiQuery({ name: 'maxRiskScore', required: false, description: 'Score de risque maximum' })
  @ApiResponse({ 
    status: 200, 
    description: 'Profils de risque récupérés avec succès',
    type: [RiskProfile]
  })
  async getRiskProfilesByProvince(
    @Param('province') province: string,
    @Query('minRiskScore') minRiskScore?: string,
    @Query('maxRiskScore') maxRiskScore?: string
  ): Promise<RiskProfile[]> {
    try {
      let profiles = await this.riskCalculationService.getRiskProfilesByProvince(province);
      
      // Filtrage par score de risque si fourni
      if (minRiskScore && !isNaN(parseFloat(minRiskScore))) {
        profiles = profiles.filter(p => p.riskScore >= parseFloat(minRiskScore));
      }
      
      if (maxRiskScore && !isNaN(parseFloat(maxRiskScore))) {
        profiles = profiles.filter(p => p.riskScore <= parseFloat(maxRiskScore));
      }

      return profiles;

    } catch (error: any) {
      this.logger.error(`Error retrieving risk profiles for province ${province}:`, error);
      
      throw new HttpException(
        'Erreur lors de la récupération des profils de risque',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('summary/statistics')
  @ApiOperation({ 
    summary: 'Statistiques générales des risques',
    description: 'Fournit des statistiques agrégées sur les profils de risque'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistiques récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        totalProfiles: { type: 'number' },
        averageRiskScore: { type: 'number' },
        distributionByLevel: {
          type: 'object',
          properties: {
            VERY_LOW: { type: 'number' },
            LOW: { type: 'number' },
            MEDIUM: { type: 'number' },
            HIGH: { type: 'number' },
            VERY_HIGH: { type: 'number' }
          }
        },
        highRiskEntities: { type: 'number' },
        lastUpdated: { type: 'string', format: 'date-time' }
      }
    }
  })
  async getRiskStatistics(): Promise<any> {
    try {
      // Cette méthode pourrait être optimisée avec des requêtes SQL directes
      const allProfiles = await Promise.all([
        this.riskCalculationService.getRiskProfilesByLevel(RiskLevel.VERY_LOW),
        this.riskCalculationService.getRiskProfilesByLevel(RiskLevel.LOW),
        this.riskCalculationService.getRiskProfilesByLevel(RiskLevel.MEDIUM),
        this.riskCalculationService.getRiskProfilesByLevel(RiskLevel.HIGH),
        this.riskCalculationService.getRiskProfilesByLevel(RiskLevel.VERY_HIGH)
      ]);

      const [veryLow, low, medium, high, veryHigh] = allProfiles;
      const totalProfiles = veryLow.length + low.length + medium.length + high.length + veryHigh.length;
      
      // Calcul de la moyenne
      const allScores = [...veryLow, ...low, ...medium, ...high, ...veryHigh]
        .map(p => p.riskScore);
      const averageRiskScore = totalProfiles > 0 
        ? allScores.reduce((sum, score) => sum + score, 0) / totalProfiles 
        : 0;

      return {
        totalProfiles,
        averageRiskScore: Math.round(averageRiskScore * 100) / 100,
        distributionByLevel: {
          VERY_LOW: veryLow.length,
          LOW: low.length,
          MEDIUM: medium.length,
          HIGH: high.length,
          VERY_HIGH: veryHigh.length
        },
        highRiskEntities: high.length + veryHigh.length,
        lastUpdated: new Date().toISOString()
      };

    } catch (error: any) {
      this.logger.error('Error retrieving risk statistics:', error);
      
      throw new HttpException(
        'Erreur lors de la récupération des statistiques',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
