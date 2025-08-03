import { Controller, Get, Param, Query, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { 
  GeographicAnalysisService, 
  GeographicRiskMetrics, 
  ConcentrationAnalysis, 
  ProvinceComparison 
} from '../services/geographic-analysis.service';

// Interface pour les changements géographiques
interface GeographicShift {
  province: string;
  type: 'DETERIORATION' | 'IMPROVEMENT';
  magnitude: number;
  currentRisk: number;
}

@ApiTags('geographic-analysis')
@Controller('geographic-analysis')
export class GeographicAnalysisController {
  private readonly logger = new Logger(GeographicAnalysisController.name);

  constructor(
    private readonly geographicAnalysisService: GeographicAnalysisService
  ) {}

  @Get('provinces')
  @ApiOperation({ 
    summary: 'Comparaison des risques inter-provinciaux',
    description: 'Fournit une analyse comparative des risques financiers entre toutes les provinces de la RDC'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Comparaison inter-provinciale récupérée avec succès',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          province: { type: 'string' },
          rank: { type: 'number' },
          avgRiskScore: { type: 'number' },
          fraudRate: { type: 'number' },
          economicIndicators: {
            type: 'object',
            properties: {
              gdpContribution: { type: 'number' },
              businessDensity: { type: 'number' },
              financialInclusion: { type: 'number' }
            }
          },
          trends: {
            type: 'object',
            properties: {
              riskEvolution: { type: 'string', enum: ['IMPROVING', 'STABLE', 'DETERIORATING'] },
              monthlyChange: { type: 'number' }
            }
          }
        }
      }
    }
  })
  async compareProvinces(): Promise<ProvinceComparison[]> {
    try {
      this.logger.log('Generating inter-provincial risk comparison');
      return await this.geographicAnalysisService.compareProvinces();
    } catch (error: any) {
      this.logger.error('Error comparing provinces:', error);
      throw new HttpException(
        'Erreur lors de la comparaison inter-provinciale',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('provinces/:provinceName/risk')
  @ApiOperation({ 
    summary: 'Analyse de risque pour une province spécifique',
    description: 'Fournit une analyse détaillée des risques financiers pour une province donnée'
  })
  @ApiParam({ 
    name: 'provinceName', 
    description: 'Nom de la province à analyser',
    example: 'Kinshasa'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Analyse de risque provincial récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        province: { type: 'string' },
        totalEntities: { type: 'number' },
        avgRiskScore: { type: 'number' },
        fraudAlertCount: { type: 'number' },
        riskDistribution: {
          type: 'object',
          properties: {
            low: { type: 'number' },
            medium: { type: 'number' },
            high: { type: 'number' },
            critical: { type: 'number' }
          }
        },
        concentrationRisk: { type: 'number' },
        systemicRiskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Province non trouvée' })
  async analyzeProvinceRisk(@Param('provinceName') provinceName: string): Promise<GeographicRiskMetrics> {
    try {
      this.logger.log(`Analyzing risk for province: ${provinceName}`);
      
      return await this.geographicAnalysisService.analyzeProvinceRisk(provinceName);
    } catch (error: any) {
      this.logger.error(`Error analyzing province risk for ${provinceName}:`, error);
      
      if (error.message.includes('Aucune entité trouvée')) {
        throw new HttpException(
          `Province ${provinceName} non trouvée ou sans données`,
          HttpStatus.NOT_FOUND
        );
      }
      
      throw new HttpException(
        'Erreur lors de l\'analyse de risque provincial',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('concentration')
  @ApiOperation({ 
    summary: 'Analyse de concentration géographique des risques',
    description: 'Identifie les zones de forte concentration de risques et évalue la diversification géographique'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Analyse de concentration récupérée avec succès',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          province: { type: 'string' },
          city: { type: 'string' },
          entityCount: { type: 'number' },
          totalExposure: { type: 'number' },
          concentrationRatio: { type: 'number' },
          riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          diversificationIndex: { type: 'number' }
        }
      }
    }
  })
  async analyzeConcentrationRisk(): Promise<ConcentrationAnalysis[]> {
    try {
      this.logger.log('Analyzing geographic concentration risk');
      return await this.geographicAnalysisService.analyzeConcentrationRisk();
    } catch (error: any) {
      this.logger.error('Error analyzing concentration risk:', error);
      throw new HttpException(
        'Erreur lors de l\'analyse de concentration',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('clusters')
  @ApiOperation({ 
    summary: 'Détection de clusters de risque géographiques',
    description: 'Identifie les zones géographiques présentant des concentrations anormales de risques'
  })
  @ApiQuery({ 
    name: 'minSize', 
    required: false, 
    description: 'Taille minimale du cluster (nombre d\'entités)',
    example: 3
  })
  @ApiQuery({ 
    name: 'riskThreshold', 
    required: false, 
    description: 'Seuil de risque minimum pour considérer un cluster',
    example: 6.0
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Clusters de risque identifiés avec succès',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          location: {
            type: 'object',
            properties: {
              province: { type: 'string' },
              city: { type: 'string' }
            }
          },
          entityCount: { type: 'number' },
          avgRiskScore: { type: 'number' },
          highRiskRatio: { type: 'number' },
          clusterRisk: { type: 'string', enum: ['MEDIUM', 'HIGH', 'CRITICAL'] },
          recommendedActions: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  })
  async detectRiskClusters(
    @Query('minSize') minSize?: string,
    @Query('riskThreshold') riskThreshold?: string
  ): Promise<any[]> {
    try {
      this.logger.log('Detecting geographic risk clusters');
      
      // Pour l'instant, on utilise les paramètres par défaut du service
      // Dans une version future, on pourrait passer ces paramètres au service
      const clusters = await this.geographicAnalysisService.detectRiskClusters();
      
      // Filtrage optionnel côté contrôleur
      let filteredClusters = clusters;
      
      if (minSize) {
        const minSizeNum = parseInt(minSize);
        filteredClusters = filteredClusters.filter(cluster => cluster.entityCount >= minSizeNum);
      }
      
      if (riskThreshold) {
        const thresholdNum = parseFloat(riskThreshold);
        filteredClusters = filteredClusters.filter(cluster => cluster.avgRiskScore >= thresholdNum);
      }
      
      return filteredClusters;
    } catch (error: any) {
      this.logger.error('Error detecting risk clusters:', error);
      throw new HttpException(
        'Erreur lors de la détection des clusters',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('dashboard')
  @ApiOperation({ 
    summary: 'Tableau de bord géographique global',
    description: 'Fournit une vue d\'ensemble des risques géographiques avec métriques clés et visualisations'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Tableau de bord géographique récupéré avec succès',
    schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'object',
          properties: {
            totalProvinces: { type: 'number' },
            avgNationalRisk: { type: 'number' },
            highRiskProvinces: { type: 'number' },
            criticalClusters: { type: 'number' },
            concentrationIndex: { type: 'number' }
          }
        },
        topRiskProvinces: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              province: { type: 'string' },
              riskScore: { type: 'number' },
              entityCount: { type: 'number' }
            }
          }
        },
        riskDistribution: {
          type: 'object',
          properties: {
            byProvince: { type: 'object' },
            byRiskLevel: { type: 'object' }
          }
        },
        alerts: {
          type: 'object',
          properties: {
            criticalRegions: { type: 'array' },
            emergingRisks: { type: 'array' },
            recommendations: { type: 'array' }
          }
        },
        trends: {
          type: 'object',
          properties: {
            riskEvolution: { type: 'object' },
            geographicShifts: { type: 'array' }
          }
        }
      }
    }
  })
  async getGeographicDashboard(): Promise<any> {
    try {
      this.logger.log('Generating geographic risk dashboard');

      // Récupération des données depuis les différentes analyses
      const [provinceComparison, concentrationAnalysis, riskClusters] = await Promise.all([
        this.geographicAnalysisService.compareProvinces(),
        this.geographicAnalysisService.analyzeConcentrationRisk(),
        this.geographicAnalysisService.detectRiskClusters()
      ]);

      // Construction du tableau de bord
      const summary = {
        totalProvinces: provinceComparison.length,
        avgNationalRisk: provinceComparison.length > 0 
          ? Math.round((provinceComparison.reduce((sum, p) => sum + p.avgRiskScore, 0) / provinceComparison.length) * 1000) / 1000
          : 0,
        highRiskProvinces: provinceComparison.filter(p => p.avgRiskScore > 6).length,
        criticalClusters: riskClusters.filter(c => c.clusterRisk === 'CRITICAL').length,
        concentrationIndex: concentrationAnalysis.length > 0
          ? Math.round((concentrationAnalysis.reduce((sum, c) => sum + c.concentrationRatio, 0) / concentrationAnalysis.length) * 100) / 100
          : 0
      };

      const topRiskProvinces = provinceComparison
        .slice(0, 5)
        .map(p => ({
          province: p.province,
          riskScore: p.avgRiskScore,
          entityCount: 0 // À calculer depuis les données d'entités
        }));

      const riskDistribution = {
        byProvince: provinceComparison.reduce((dist, province) => {
          dist[province.province] = province.avgRiskScore;
          return dist;
        }, {} as Record<string, number>),
        byRiskLevel: {
          low: provinceComparison.filter(p => p.avgRiskScore < 4).length,
          medium: provinceComparison.filter(p => p.avgRiskScore >= 4 && p.avgRiskScore < 6).length,
          high: provinceComparison.filter(p => p.avgRiskScore >= 6 && p.avgRiskScore < 8).length,
          critical: provinceComparison.filter(p => p.avgRiskScore >= 8).length
        }
      };

      const alerts = {
        criticalRegions: riskClusters
          .filter(c => c.clusterRisk === 'CRITICAL')
          .map(c => `${c.location.city}, ${c.location.province}`),
        emergingRisks: provinceComparison
          .filter(p => p.trends.riskEvolution === 'DETERIORATING')
          .map(p => `Détérioration dans ${p.province} (+${p.trends.monthlyChange}%)`),
        recommendations: this.generateDashboardRecommendations(summary, topRiskProvinces, riskClusters)
      };

      const trends = {
        riskEvolution: provinceComparison.reduce((trends, province) => {
          trends[province.province] = {
            direction: province.trends.riskEvolution,
            change: province.trends.monthlyChange
          };
          return trends;
        }, {} as Record<string, any>),
        geographicShifts: this.identifyGeographicShifts(provinceComparison)
      };

      return {
        summary,
        topRiskProvinces,
        riskDistribution,
        alerts,
        trends,
        lastUpdate: new Date().toISOString()
      };

    } catch (error: any) {
      this.logger.error('Error generating geographic dashboard:', error);
      throw new HttpException(
        'Erreur lors de la génération du tableau de bord',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Méthodes utilitaires privées

  private generateDashboardRecommendations(summary: any, topRiskProvinces: any[], riskClusters: any[]): string[] {
    const recommendations: string[] = [];

    if (summary.avgNationalRisk > 6) {
      recommendations.push('Révision urgente de la politique de risque nationale');
    }

    if (summary.criticalClusters > 0) {
      recommendations.push(`Investigation immédiate de ${summary.criticalClusters} cluster(s) critiques`);
    }

    if (summary.concentrationIndex > 30) {
      recommendations.push('Diversification géographique des expositions recommandée');
    }

    if (topRiskProvinces.length > 0 && topRiskProvinces[0].riskScore > 8) {
      recommendations.push(`Surveillance renforcée de ${topRiskProvinces[0].province}`);
    }

    if (summary.highRiskProvinces > summary.totalProvinces * 0.5) {
      recommendations.push('Mise en place d\'un plan d\'action national anti-risque');
    }

    return recommendations;
  }

  private identifyGeographicShifts(provinceComparison: ProvinceComparison[]): GeographicShift[] {
    const shifts: GeographicShift[] = [];

    // Identification des provinces avec des changements significatifs
    for (const province of provinceComparison) {
      if (Math.abs(province.trends.monthlyChange) > 0.1) {
        shifts.push({
          province: province.province,
          type: province.trends.monthlyChange > 0 ? 'DETERIORATION' : 'IMPROVEMENT',
          magnitude: Math.abs(province.trends.monthlyChange),
          currentRisk: province.avgRiskScore
        });
      }
    }

    return shifts.sort((a, b) => b.magnitude - a.magnitude);
  }
}
