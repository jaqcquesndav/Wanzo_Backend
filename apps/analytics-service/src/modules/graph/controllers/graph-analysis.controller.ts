import { Controller, Get, Post, Put, Param, Body, Query, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { FinancialRiskGraphService } from '../services/financial-risk-graph.service';
import { GraphService } from '../graph.service';
import { 
  NetworkAnalysis, 
  RiskPattern, 
  SMENode, 
  InstitutionNode, 
  CreditNode 
} from '../interfaces/graph-types';

@ApiTags('graph-analysis')
@Controller('graph-analysis')
export class GraphAnalysisController {
  private readonly logger = new Logger(GraphAnalysisController.name);

  constructor(
    private readonly financialRiskGraphService: FinancialRiskGraphService,
    private readonly graphService: GraphService
  ) {}

  @Post('initialize')
  @ApiOperation({ 
    summary: 'Initialise le graphe Neo4j avec le schéma et les données de base',
    description: 'Crée les contraintes, index et données géographiques/sectorielles de référence pour la RDC'
  })
  @ApiResponse({ status: 201, description: 'Graphe initialisé avec succès' })
  @ApiResponse({ status: 500, description: 'Erreur lors de l\'initialisation' })
  async initializeGraph(): Promise<{ message: string; timestamp: string }> {
    try {
      this.logger.log('Initializing financial risk graph...');

      await this.financialRiskGraphService.initializeSchema();
      await this.financialRiskGraphService.initializeGeographicData();
      await this.financialRiskGraphService.initializeSectorData();

      this.logger.log('Financial risk graph initialized successfully');

      return {
        message: 'Graphe financier initialisé avec succès',
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      this.logger.error('Error initializing graph:', error);
      throw new HttpException(
        'Erreur lors de l\'initialisation du graphe',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('entities/sme')
  @ApiOperation({ 
    summary: 'Crée un nœud PME dans le graphe',
    description: 'Ajoute une nouvelle PME avec ses caractéristiques dans le graphe de relations'
  })
  @ApiBody({
    description: 'Données de la PME à créer',
    schema: {
      type: 'object',
      required: ['id', 'name', 'status'],
      properties: {
        id: { type: 'string', description: 'Identifiant unique de la PME' },
        name: { type: 'string', description: 'Nom de la PME' },
        registrationNumber: { type: 'string', description: 'Numéro d\'enregistrement' },
        foundedYear: { type: 'number', description: 'Année de création' },
        employees: { type: 'number', description: 'Nombre d\'employés' },
        revenue: { type: 'number', description: 'Chiffre d\'affaires annuel' },
        riskScore: { type: 'number', description: 'Score de risque (0-10)' },
        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
        legalForm: { type: 'string', description: 'Forme juridique' },
        taxId: { type: 'string', description: 'Numéro fiscal' }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'PME créée avec succès dans le graphe' })
  async createSMENode(@Body() smeData: SMENode): Promise<{ message: string; smeId: string }> {
    try {
      this.logger.log(`Creating SME node: ${smeData.id}`);

      await this.graphService.createSMENode(smeData);

      return {
        message: 'PME créée avec succès dans le graphe',
        smeId: smeData.id
      };

    } catch (error: any) {
      this.logger.error(`Error creating SME node ${smeData.id}:`, error);
      throw new HttpException(
        'Erreur lors de la création de la PME',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('entities/institution')
  @ApiOperation({ 
    summary: 'Crée un nœud institution financière',
    description: 'Ajoute une nouvelle institution financière dans le graphe'
  })
  @ApiBody({
    description: 'Données de l\'institution à créer',
    schema: {
      type: 'object',
      required: ['id', 'name', 'type'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        type: { type: 'string', enum: ['CENTRAL_BANK', 'COMMERCIAL_BANK', 'MICROFINANCE', 'INSURANCE', 'INVESTMENT_FUND'] },
        license: { type: 'string' },
        riskScore: { type: 'number' },
        totalAssets: { type: 'number' },
        capitalRatio: { type: 'number' },
        foundedYear: { type: 'number' }
      }
    }
  })
  async createInstitutionNode(@Body() institutionData: InstitutionNode): Promise<{ message: string; institutionId: string }> {
    try {
      this.logger.log(`Creating institution node: ${institutionData.id}`);

      await this.graphService.createInstitutionNode(institutionData);

      return {
        message: 'Institution créée avec succès dans le graphe',
        institutionId: institutionData.id
      };

    } catch (error: any) {
      this.logger.error(`Error creating institution node ${institutionData.id}:`, error);
      throw new HttpException(
        'Erreur lors de la création de l\'institution',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('entities/credit')
  @ApiOperation({ 
    summary: 'Crée un nœud crédit',
    description: 'Ajoute un nouveau crédit dans le graphe avec ses caractéristiques'
  })
  async createCreditNode(@Body() creditData: CreditNode): Promise<{ message: string; creditId: string }> {
    try {
      this.logger.log(`Creating credit node: ${creditData.id}`);

      await this.graphService.createCreditNode(creditData);

      return {
        message: 'Crédit créé avec succès dans le graphe',
        creditId: creditData.id
      };

    } catch (error: any) {
      this.logger.error(`Error creating credit node ${creditData.id}:`, error);
      throw new HttpException(
        'Erreur lors de la création du crédit',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('relationships')
  @ApiOperation({ 
    summary: 'Crée une relation entre deux entités',
    description: 'Établit une relation typée entre deux nœuds du graphe'
  })
  @ApiBody({
    description: 'Définition de la relation à créer',
    schema: {
      type: 'object',
      required: ['fromLabel', 'fromId', 'relationshipType', 'toLabel', 'toId'],
      properties: {
        fromLabel: { type: 'string', description: 'Type du nœud source' },
        fromId: { type: 'string', description: 'ID du nœud source' },
        relationshipType: { type: 'string', description: 'Type de relation' },
        toLabel: { type: 'string', description: 'Type du nœud cible' },
        toId: { type: 'string', description: 'ID du nœud cible' },
        properties: { type: 'object', description: 'Propriétés de la relation' }
      }
    }
  })
  async createRelationship(@Body() relationshipData: {
    fromLabel: string;
    fromId: string;
    relationshipType: string;
    toLabel: string;
    toId: string;
    properties?: Record<string, any>;
  }): Promise<{ message: string }> {
    try {
      this.logger.log(`Creating relationship: ${relationshipData.fromId} -[${relationshipData.relationshipType}]-> ${relationshipData.toId}`);

      await this.graphService.createRelationship(
        relationshipData.fromId,
        relationshipData.toId,
        relationshipData.relationshipType as any,
        relationshipData.properties as any
      );

      return {
        message: 'Relation créée avec succès'
      };

    } catch (error: any) {
      this.logger.error('Error creating relationship:', error);
      throw new HttpException(
        'Erreur lors de la création de la relation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('analysis/systemic-risk')
  @ApiOperation({ 
    summary: 'Analyse des risques systémiques',
    description: 'Effectue une analyse complète des risques systémiques via l\'analyse de réseau'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Analyse des risques systémiques récupérée',
    schema: {
      type: 'object',
      properties: {
        centrality: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              node: { type: 'string' },
              betweenness: { type: 'number' },
              closeness: { type: 'number' },
              degree: { type: 'number' },
              pagerank: { type: 'number' }
            }
          }
        },
        communities: { type: 'array' },
        riskClusters: { type: 'array' }
      }
    }
  })
  async analyzeSystemicRisk(): Promise<{
    interconnectionRisks: any[];
    concentrationRisks: any[];
    cascadeRisks: any[];
    sectoralRisks: any[];
  }> {
    try {
      this.logger.log('Performing systemic risk analysis...');

      const analysis = await this.financialRiskGraphService.analyzeSystemicRisks();

      this.logger.log(`Systemic risk analysis completed. Found ${analysis.interconnectionRisks.length} interconnection risks, ${analysis.concentrationRisks.length} concentration risks`);

      return analysis;

    } catch (error: any) {
      this.logger.error('Error analyzing systemic risk:', error);
      throw new HttpException(
        'Erreur lors de l\'analyse des risques systémiques',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('analysis/risk-patterns')
  @ApiOperation({ 
    summary: 'Détection de patterns de risque',
    description: 'Identifie les patterns suspects dans le réseau financier (prêts circulaires, concentrations, etc.)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Patterns de risque détectés',
    type: [Object]
  })
  async detectRiskPatterns(): Promise<RiskPattern[]> {
    try {
      this.logger.log('Detecting risk patterns...');

      const patterns = await this.financialRiskGraphService.detectAdvancedFraudPatterns();

      this.logger.log(`Risk pattern detection completed. Found ${patterns.length} suspicious patterns`);

      return patterns;

    } catch (error: any) {
      this.logger.error('Error detecting risk patterns:', error);
      throw new HttpException(
        'Erreur lors de la détection des patterns de risque',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('analysis/contagion/:entityId')
  @ApiOperation({ 
    summary: 'Analyse des chemins de contagion',
    description: 'Trace les chemins de propagation potentielle de risque depuis une entité donnée'
  })
  @ApiParam({ name: 'entityId', description: 'ID de l\'entité source' })
  @ApiQuery({ name: 'maxHops', required: false, description: 'Nombre maximum de sauts (défaut: 3)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Chemins de contagion identifiés',
    type: [Object]
  })
  async findContagionPaths(
    @Param('entityId') entityId: string,
    @Query('maxHops') maxHops?: string
  ): Promise<any[]> {
    try {
      this.logger.log(`Finding contagion paths from entity: ${entityId}`);

      const hops = maxHops ? parseInt(maxHops) : 3;
      const paths = await this.financialRiskGraphService.findContagionPaths(entityId, hops);

      this.logger.log(`Found ${paths.length} potential contagion paths from ${entityId}`);

      return paths;

    } catch (error: any) {
      this.logger.error(`Error finding contagion paths for ${entityId}:`, error);
      throw new HttpException(
        'Erreur lors de l\'analyse des chemins de contagion',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('entities/:entityId/risk-score')
  @ApiOperation({ 
    summary: 'Met à jour le score de risque d\'une entité',
    description: 'Met à jour le score de risque et propage l\'information aux entités liées'
  })
  @ApiParam({ name: 'entityId', description: 'ID de l\'entité' })
  @ApiBody({
    description: 'Nouveau score de risque',
    schema: {
      type: 'object',
      required: ['riskScore'],
      properties: {
        riskScore: { type: 'number', minimum: 0, maximum: 10, description: 'Nouveau score de risque (0-10)' }
      }
    }
  })
  async updateEntityRiskScore(
    @Param('entityId') entityId: string,
    @Body() updateData: { riskScore: number }
  ): Promise<{ message: string; entityId: string; newRiskScore: number }> {
    try {
      this.logger.log(`Updating risk score for entity ${entityId} to ${updateData.riskScore}`);

      // Validation du score de risque
      if (updateData.riskScore < 0 || updateData.riskScore > 10) {
        throw new HttpException(
          'Le score de risque doit être entre 0 et 10',
          HttpStatus.BAD_REQUEST
        );
      }

      await this.financialRiskGraphService.updateEntityRiskScore(entityId, updateData.riskScore);

      return {
        message: 'Score de risque mis à jour avec succès',
        entityId,
        newRiskScore: updateData.riskScore
      };

    } catch (error: any) {
      this.logger.error(`Error updating risk score for ${entityId}:`, error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Erreur lors de la mise à jour du score de risque',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('entities/search')
  @ApiOperation({ 
    summary: 'Recherche d\'entités par critères de risque',
    description: 'Trouve les entités correspondant aux critères de risque spécifiés'
  })
  @ApiQuery({ name: 'minRiskScore', description: 'Score de risque minimum' })
  @ApiQuery({ name: 'maxRiskScore', description: 'Score de risque maximum' })
  @ApiQuery({ name: 'entityTypes', required: false, description: 'Types d\'entités (séparés par virgules)' })
  @ApiQuery({ name: 'province', required: false, description: 'Code de la province' })
  @ApiResponse({ 
    status: 200, 
    description: 'Entités trouvées selon les critères',
    type: [Object]
  })
  async findEntitiesByRiskCriteria(
    @Query('minRiskScore') minRiskScore: string,
    @Query('maxRiskScore') maxRiskScore: string,
    @Query('entityTypes') entityTypes?: string,
    @Query('province') province?: string
  ): Promise<any[]> {
    try {
      this.logger.log(`Searching entities with risk score between ${minRiskScore} and ${maxRiskScore}`);

      const minScore = parseFloat(minRiskScore);
      const maxScore = parseFloat(maxRiskScore);

      if (isNaN(minScore) || isNaN(maxScore)) {
        throw new HttpException(
          'Les scores de risque doivent être des nombres valides',
          HttpStatus.BAD_REQUEST
        );
      }

      const types = entityTypes ? entityTypes.split(',').map(t => t.trim()) : ['SME', 'Institution'];

      const entities = await this.financialRiskGraphService.findEntitiesByRiskCriteria(
        minScore,
        maxScore,
        types,
        province
      );

      this.logger.log(`Found ${entities.length} entities matching criteria`);

      return entities;

    } catch (error: any) {
      this.logger.error('Error searching entities by risk criteria:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Erreur lors de la recherche d\'entités',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('dashboard')
  @ApiOperation({ 
    summary: 'Tableau de bord de l\'analyse graphique',
    description: 'Fournit une vue d\'ensemble des métriques de réseau et des risques systémiques'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Tableau de bord récupéré avec succès',
    schema: {
      type: 'object',
      properties: {
        networkMetrics: {
          type: 'object',
          properties: {
            totalNodes: { type: 'number' },
            totalRelationships: { type: 'number' },
            networkDensity: { type: 'number' },
            avgClusteringCoeff: { type: 'number' }
          }
        },
        riskMetrics: {
          type: 'object',
          properties: {
            avgRiskScore: { type: 'number' },
            highRiskEntities: { type: 'number' },
            systemicRiskLevel: { type: 'string' }
          }
        },
        alerts: {
          type: 'object',
          properties: {
            suspiciousPatterns: { type: 'number' },
            contagionRisks: { type: 'number' },
            concentrationRisks: { type: 'number' }
          }
        }
      }
    }
  })
  async getGraphDashboard(): Promise<any> {
    try {
      this.logger.log('Generating graph analysis dashboard...');

      // Pour l'instant, des données simulées - à remplacer par de vraies métriques
      const dashboard = {
        networkMetrics: {
          totalNodes: 12450,
          totalRelationships: 38920,
          networkDensity: 0.52,
          avgClusteringCoeff: 0.38
        },
        riskMetrics: {
          avgRiskScore: 5.7,
          highRiskEntities: 342,
          systemicRiskLevel: 'MEDIUM'
        },
        alerts: {
          suspiciousPatterns: 8,
          contagionRisks: 3,
          concentrationRisks: 12
        },
        lastUpdate: new Date().toISOString()
      };

      return dashboard;

    } catch (error: any) {
      this.logger.error('Error generating graph dashboard:', error);
      throw new HttpException(
        'Erreur lors de la génération du tableau de bord',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('risk-simulation')
  @ApiOperation({ 
    summary: 'Simulation de propagation des risques',
    description: 'Simule l\'impact d\'un choc systémique et analyse la propagation des risques'
  })
  @ApiBody({
    description: 'Configuration du scénario de simulation',
    schema: {
      type: 'object',
      required: ['shockType', 'magnitude', 'targetEntities'],
      properties: {
        shockType: { 
          type: 'string', 
          enum: ['CREDIT_DEFAULT', 'LIQUIDITY_CRISIS', 'SECTOR_COLLAPSE'],
          description: 'Type de choc simulé'
        },
        magnitude: { 
          type: 'number', 
          minimum: 1, 
          maximum: 10,
          description: 'Intensité du choc (1-10)'
        },
        targetEntities: { 
          type: 'array',
          items: { type: 'string' },
          description: 'Identifiants des entités initialement impactées'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Simulation de propagation des risques terminée',
    schema: {
      type: 'object',
      properties: {
        impactedEntities: { type: 'array' },
        propagationLevels: { type: 'array' },
        totalSystemImpact: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  async simulateRiskPropagation(@Body() scenarioConfig: {
    shockType: 'CREDIT_DEFAULT' | 'LIQUIDITY_CRISIS' | 'SECTOR_COLLAPSE';
    magnitude: number;
    targetEntities: string[];
  }): Promise<{
    impactedEntities: any[];
    propagationLevels: any[];
    totalSystemImpact: number;
    recommendations: string[];
  }> {
    try {
      this.logger.log(`Simulating risk propagation: ${scenarioConfig.shockType}`);

      const simulation = await this.financialRiskGraphService.simulateRiskPropagation(scenarioConfig);

      this.logger.log(`Risk simulation completed. Total impact: ${simulation.totalSystemImpact}`);

      return simulation;

    } catch (error: any) {
      this.logger.error('Error simulating risk propagation:', error);
      throw new HttpException(
        'Erreur lors de la simulation de propagation des risques',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('resilience-analysis')
  @ApiOperation({ 
    summary: 'Analyse de la résilience du système financier',
    description: 'Évalue la capacité de résistance du système aux chocs externes'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Analyse de résilience terminée',
    schema: {
      type: 'object',
      properties: {
        resilienceScore: { type: 'number', description: 'Score de résilience global (0-10)' },
        vulnerabilities: { type: 'array' },
        strengthFactors: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  async analyzeSystemResilience(): Promise<{
    resilienceScore: number;
    vulnerabilities: any[];
    strengthFactors: any[];
    recommendations: string[];
  }> {
    try {
      this.logger.log('Analyzing system resilience...');

      const resilience = await this.financialRiskGraphService.analyzeSystemResilience();

      this.logger.log(`Resilience analysis completed. Score: ${resilience.resilienceScore}`);

      return resilience;

    } catch (error: any) {
      this.logger.error('Error analyzing system resilience:', error);
      throw new HttpException(
        'Erreur lors de l\'analyse de résilience',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('comprehensive-report')
  @ApiOperation({ 
    summary: 'Rapport de surveillance global',
    description: 'Génère un rapport complet d\'analyse des risques financiers incluant tous les indicateurs systémiques'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Rapport complet généré avec succès',
    schema: {
      type: 'object',
      properties: {
        executiveSummary: { type: 'object' },
        systemicRisks: { type: 'object' },
        fraudPatterns: { type: 'array' },
        networkAnalysis: { type: 'object' },
        resilience: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  async generateComprehensiveReport(): Promise<{
    executiveSummary: any;
    systemicRisks: any;
    fraudPatterns: RiskPattern[];
    networkAnalysis: any;
    resilience: any;
    recommendations: string[];
    timestamp: string;
  }> {
    try {
      this.logger.log('Generating comprehensive risk report...');

      const report = await this.financialRiskGraphService.generateComprehensiveRiskReport();

      this.logger.log('Comprehensive risk report generated successfully');

      return report;

    } catch (error: any) {
      this.logger.error('Error generating comprehensive report:', error);
      throw new HttpException(
        'Erreur lors de la génération du rapport complet',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('centrality-metrics')
  @ApiOperation({ 
    summary: 'Métriques de centralité avancées',
    description: 'Calcule les métriques de centralité du réseau pour identifier les entités critiques'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Métriques de centralité calculées',
    schema: {
      type: 'object',
      properties: {
        centrality: { type: 'array' },
        communities: { type: 'array' },
        riskClusters: { type: 'array' }
      }
    }
  })
  async calculateCentralityMetrics(): Promise<NetworkAnalysis> {
    try {
      this.logger.log('Calculating advanced centrality metrics...');

      const analysis = await this.financialRiskGraphService.calculateAdvancedCentralityMetrics();

      this.logger.log('Centrality metrics calculated successfully');

      return analysis;

    } catch (error: any) {
      this.logger.error('Error calculating centrality metrics:', error);
      throw new HttpException(
        'Erreur lors du calcul des métriques de centralité',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
