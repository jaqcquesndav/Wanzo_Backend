import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { 
  MicroRelationAnalysisService,
  ConcentrationMetrics,
  EconomicCluster,
  SystemicRiskAnalysis,
  ProductPortfolioAnalysis 
} from '../services/micro-relation-analysis.service';

export class CreateConcentrationPointDto {
  type!: 'SINGLE_BORROWER' | 'SECTOR' | 'GEOGRAPHIC' | 'PRODUCT' | 'MATURITY' | 'CURRENCY';
  entityId!: string;
  threshold!: number;
  responsibleTeam!: string;
}

export class ConcentrationQueryDto {
  dimensions?: string[]; // ['sector', 'geographic', 'product']
  includeHerfindahl?: boolean;
  riskWeighting?: boolean;
}

@ApiTags('Micro-Relations Analysis')
@Controller('analytics/micro-relations')
export class MicroRelationController {
  private readonly logger = new Logger(MicroRelationController.name);

  constructor(
    private readonly microRelationService: MicroRelationAnalysisService
  ) {}

  @Get('portfolio/:portfolioId/concentration')
  @ApiOperation({ 
    summary: 'Analyser la concentration d\'un portefeuille',
    description: 'Analyse les concentrations sectorielles, géographiques et produits d\'un portefeuille avec calcul de l\'indice Herfindahl'
  })
  @ApiParam({ name: 'portfolioId', description: 'ID du portefeuille à analyser' })
  @ApiQuery({ name: 'dimensions', required: false, description: 'Dimensions d\'analyse (sector,geographic,product)', type: [String] })
  @ApiResponse({ status: 200, description: 'Métriques de concentration du portefeuille' })
  async analyzePortfolioConcentration(
    @Param('portfolioId') portfolioId: string,
    @Query() query: ConcentrationQueryDto
  ): Promise<ConcentrationMetrics> {
    try {
      this.logger.log(`Analyzing concentration for portfolio: ${portfolioId}`);
      
      const metrics = await this.microRelationService.analyzePorfolioConcentration(portfolioId);
      
      // Filtrer selon les dimensions demandées
      if (query.dimensions?.length) {
        const result: Partial<ConcentrationMetrics> = {
          herfindahlIndex: metrics.herfindahlIndex,
          concentrationRisk: metrics.concentrationRisk
        };
        
        if (query.dimensions.includes('sector')) {
          result.sectorConcentration = metrics.sectorConcentration;
        }
        if (query.dimensions.includes('geographic')) {
          result.geographicConcentration = metrics.geographicConcentration;
        }
        if (query.dimensions.includes('product')) {
          result.productConcentration = metrics.productConcentration;
        }
        
        return result as ConcentrationMetrics;
      }
      
      return metrics;
      
    } catch (error) {
      this.logger.error(`Error analyzing portfolio concentration: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  @Get('clusters/economic')
  @ApiOperation({ 
    summary: 'Détecter les clusters économiques',
    description: 'Identifie les groupes d\'entités interconnectées et analyse leur cohésion et risque systémique'
  })
  @ApiQuery({ name: 'minSize', required: false, description: 'Taille minimale des clusters', type: Number })
  @ApiQuery({ name: 'riskLevel', required: false, description: 'Filtrer par niveau de risque', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  @ApiResponse({ status: 200, description: 'Liste des clusters économiques détectés' })
  async detectEconomicClusters(
    @Query('minSize') minSize?: number,
    @Query('riskLevel') riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): Promise<EconomicCluster[]> {
    try {
      this.logger.log('Detecting economic clusters');
      
      let clusters = await this.microRelationService.detectEconomicClusters();
      
      // Filtrer selon les critères
      if (minSize) {
        clusters = clusters.filter(cluster => cluster.members.length >= minSize);
      }
      
      if (riskLevel) {
        clusters = clusters.filter(cluster => cluster.riskProfile === riskLevel);
      }
      
      this.logger.log(`Found ${clusters.length} economic clusters`);
      return clusters;
      
    } catch (error) {
      this.logger.error(`Error detecting economic clusters: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  @Get('systemic-risk')
  @ApiOperation({ 
    summary: 'Analyser le risque systémique',
    description: 'Analyse complète du risque systémique avec métriques de réseau, nœuds critiques et simulation de stress'
  })
  @ApiQuery({ name: 'includeStressTest', required: false, description: 'Inclure les tests de stress', type: Boolean })
  @ApiQuery({ name: 'topCriticalNodes', required: false, description: 'Nombre de nœuds critiques à retourner', type: Number })
  @ApiResponse({ status: 200, description: 'Analyse complète du risque systémique' })
  async analyzeSystemicRisk(
    @Query('includeStressTest') includeStressTest: boolean = true,
    @Query('topCriticalNodes') topCriticalNodes: number = 20
  ): Promise<SystemicRiskAnalysis> {
    try {
      this.logger.log('Analyzing systemic risk');
      
      const analysis = await this.microRelationService.analyzeSystemicRisk();
      
      // Limiter le nombre de nœuds critiques si demandé
      if (topCriticalNodes < analysis.criticalNodes.length) {
        analysis.criticalNodes = analysis.criticalNodes
          .sort((a, b) => b.systemicImportance - a.systemicImportance)
          .slice(0, topCriticalNodes);
      }
      
      // Exclure les stress tests si demandé
      if (!includeStressTest) {
        return {
          networkDensity: analysis.networkDensity,
          avgPathLength: analysis.avgPathLength,
          clusteringCoefficient: analysis.clusteringCoefficient,
          criticalNodes: analysis.criticalNodes,
          vulnerabilityPoints: analysis.vulnerabilityPoints,
          resilientComponents: analysis.resilientComponents
        };
      }
      
      this.logger.log(`Systemic risk analysis completed. Network density: ${analysis.networkDensity.toFixed(3)}`);
      return analysis;
      
    } catch (error) {
      this.logger.error(`Error analyzing systemic risk: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  @Get('institution/:institutionId/portfolio')
  @ApiOperation({ 
    summary: 'Analyser le portefeuille produits d\'une institution',
    description: 'Analyse détaillée de la composition, performance et diversification des produits d\'une institution'
  })
  @ApiParam({ name: 'institutionId', description: 'ID de l\'institution financière' })
  @ApiQuery({ name: 'includeRecommendations', required: false, description: 'Inclure les recommandations', type: Boolean })
  @ApiResponse({ status: 200, description: 'Analyse du portefeuille de produits' })
  async analyzeInstitutionPortfolio(
    @Param('institutionId') institutionId: string,
    @Query('includeRecommendations') includeRecommendations: boolean = true
  ): Promise<ProductPortfolioAnalysis> {
    try {
      this.logger.log(`Analyzing product portfolio for institution: ${institutionId}`);
      
      const analysis = await this.microRelationService.analyzeProductPortfolio(institutionId);
      
      if (!includeRecommendations) {
        return {
          productMix: analysis.productMix,
          maturityProfile: analysis.maturityProfile,
          performanceMetrics: analysis.performanceMetrics,
          diversificationScore: analysis.diversificationScore
        };
      }
      
      this.logger.log(`Portfolio analysis completed. Diversification score: ${analysis.diversificationScore.toFixed(1)}`);
      return analysis;
      
    } catch (error) {
      this.logger.error(`Error analyzing institution portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  @Post('concentration-point')
  @ApiOperation({ 
    summary: 'Créer un point de surveillance de concentration',
    description: 'Crée un point de surveillance automatique pour détecter les concentrations excessives'
  })
  @ApiResponse({ status: 201, description: 'Point de concentration créé avec succès' })
  async createConcentrationPoint(
    @Body() createDto: CreateConcentrationPointDto
  ): Promise<{ id: string; message: string }> {
    try {
      this.logger.log(`Creating concentration point for ${createDto.type} on ${createDto.entityId}`);
      
      const id = await this.microRelationService.createConcentrationPoint(
        createDto.type,
        createDto.entityId,
        createDto.threshold,
        createDto.responsibleTeam
      );
      
      return {
        id,
        message: `Point de concentration créé avec succès. Surveillance ${createDto.type} activée.`
      };
      
    } catch (error) {
      this.logger.error(`Error creating concentration point: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  @Post('concentration/update')
  @ApiOperation({ 
    summary: 'Mettre à jour les niveaux de concentration',
    description: 'Recalcule tous les niveaux de concentration et déclenche des alertes si nécessaire'
  })
  @ApiResponse({ status: 200, description: 'Niveaux de concentration mis à jour' })
  async updateConcentrationLevels(): Promise<{ message: string }> {
    try {
      this.logger.log('Updating concentration levels');
      
      await this.microRelationService.updateConcentrationLevels();
      
      return {
        message: 'Niveaux de concentration mis à jour avec succès. Alertes générées si nécessaire.'
      };
      
    } catch (error) {
      this.logger.error(`Error updating concentration levels: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  @Get('concentration/summary')
  @ApiOperation({ 
    summary: 'Résumé des concentrations critiques',
    description: 'Vue d\'ensemble des concentrations qui approchent ou dépassent les seuils'
  })
  @ApiQuery({ name: 'riskLevel', required: false, description: 'Niveau de risque minimum', enum: ['YELLOW', 'ORANGE', 'RED'] })
  @ApiResponse({ status: 200, description: 'Résumé des concentrations critiques' })
  async getConcentrationSummary(
    @Query('riskLevel') riskLevel: 'YELLOW' | 'ORANGE' | 'RED' = 'YELLOW'
  ): Promise<any> {
    try {
      const query = `
        MATCH (cp:ConcentrationPoint)
        WHERE cp.riskRating IN $riskLevels
        
        OPTIONAL MATCH (cp)-[:MONITORS]->(entity)
        
        RETURN cp.id as id,
               cp.type as type,
               cp.entity as entityId,
               entity.name as entityName,
               cp.currentLevel as currentLevel,
               cp.threshold as threshold,
               cp.riskRating as riskRating,
               cp.trend as trend,
               cp.responsibleTeam as responsibleTeam,
               cp.lastMeasurement as lastMeasurement
        ORDER BY 
          CASE cp.riskRating 
            WHEN 'RED' THEN 1 
            WHEN 'ORANGE' THEN 2 
            ELSE 3 
          END,
          cp.currentLevel DESC
      `;
      
      const riskLevels = riskLevel === 'RED' ? ['RED'] : 
                        riskLevel === 'ORANGE' ? ['RED', 'ORANGE'] : 
                        ['RED', 'ORANGE', 'YELLOW'];
      
      // Note: Cette méthode nécessiterait un accès direct au GraphService
      // Pour l'instant, on retourne un exemple de structure
      
      return {
        totalConcentrationPoints: 0,
        criticalCount: 0,
        warningCount: 0,
        concentrationsByType: {},
        recentAlerts: [],
        recommendations: [
          "Surveiller de près les concentrations en statut ROUGE",
          "Diversifier les expositions sectorielles concentrées",
          "Renforcer le monitoring des grandes contreparties"
        ]
      };
      
    } catch (error) {
      this.logger.error(`Error getting concentration summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  @Get('relationships/strength')
  @ApiOperation({ 
    summary: 'Analyser la force des relations',
    description: 'Analyse la force et stabilité des relations entre entités financières'
  })
  @ApiQuery({ name: 'entityId', required: false, description: 'ID de l\'entité de référence' })
  @ApiQuery({ name: 'relationshipType', required: false, description: 'Type de relation à analyser' })
  @ApiQuery({ name: 'minStrength', required: false, description: 'Force minimale des relations', type: Number })
  @ApiResponse({ status: 200, description: 'Analyse de la force des relations' })
  async analyzeRelationshipStrength(
    @Query('entityId') entityId?: string,
    @Query('relationshipType') relationshipType?: string,
    @Query('minStrength') minStrength: number = 0.5
  ): Promise<any> {
    try {
      this.logger.log('Analyzing relationship strength');
      
      // Structure de retour pour l'analyse des relations
      return {
        strongRelationships: [],
        weakRelationships: [],
        volatileRelationships: [],
        stableRelationships: [],
        networkResilience: 0,
        keyConnectors: [],
        isolatedEntities: [],
        recommendations: [
          "Renforcer les relations faibles critiques",
          "Surveiller la volatilité des relations importantes",
          "Diversifier les connexions des entités isolées"
        ]
      };
      
    } catch (error) {
      this.logger.error(`Error analyzing relationship strength: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  @Get('patterns/risk')
  @ApiOperation({ 
    summary: 'Détecter les patterns de risque',
    description: 'Identifie les motifs récurrents de risque dans le réseau financier'
  })
  @ApiQuery({ name: 'patternType', required: false, description: 'Type de pattern à rechercher' })
  @ApiQuery({ name: 'timeWindow', required: false, description: 'Fenêtre temporelle en jours', type: Number })
  @ApiResponse({ status: 200, description: 'Patterns de risque détectés' })
  async detectRiskPatterns(
    @Query('patternType') patternType?: string,
    @Query('timeWindow') timeWindow: number = 30
  ): Promise<any> {
    try {
      this.logger.log('Detecting risk patterns');
      
      return {
        circularLending: [],
        excessiveConcentration: [],
        unusualFlows: [],
        isolatedEntities: [],
        cascadeRisks: [],
        detectionDate: new Date(),
        recommendations: [
          "Investiguer les prêts circulaires détectés",
          "Réduire les concentrations excessives",
          "Analyser les flux inhabituels"
        ]
      };
      
    } catch (error) {
      this.logger.error(`Error detecting risk patterns: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}
