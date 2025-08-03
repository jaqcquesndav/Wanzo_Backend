import { Controller, Get, Post, Body, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { FinancialRiskGraphService } from '../services/financial-risk-graph.service';
import { NetworkAnalysis, RiskPattern } from '../interfaces/graph-types';

@ApiTags('financial-risk-analysis')
@Controller('financial-risk-analysis')
export class FinancialRiskController {
  private readonly logger = new Logger(FinancialRiskController.name);

  constructor(
    private readonly financialRiskGraphService: FinancialRiskGraphService
  ) {}

  @Post('initialize')
  @ApiOperation({ 
    summary: 'Initialise le système d\'analyse des risques financiers',
    description: 'Crée le schéma Neo4j et initialise l\'écosystème financier de la RDC'
  })
  @ApiResponse({ status: 201, description: 'Système initialisé avec succès' })
  @ApiResponse({ status: 500, description: 'Erreur lors de l\'initialisation' })
  async initializeFinancialRiskSystem(): Promise<{ message: string; timestamp: string }> {
    try {
      this.logger.log('Initializing financial risk analysis system...');

      await this.financialRiskGraphService.initializeSchema();
      await this.financialRiskGraphService.initializeGeographicData();
      await this.financialRiskGraphService.initializeSectorData();

      this.logger.log('Financial risk analysis system initialized successfully');

      return {
        message: 'Système d\'analyse des risques financiers initialisé avec succès',
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      this.logger.error('Error initializing financial risk system:', error);
      throw new HttpException(
        'Erreur lors de l\'initialisation du système d\'analyse des risques',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('ecosystem/create')
  @ApiOperation({ 
    summary: 'Création de l\'écosystème financier complet',
    description: 'Crée toutes les entités de référence (géographie, secteurs, institutions) pour la RDC'
  })
  @ApiResponse({ status: 201, description: 'Écosystème créé avec succès' })
  async createFinancialEcosystem(): Promise<{ message: string; timestamp: string }> {
    try {
      this.logger.log('Creating complete financial ecosystem...');

      await this.financialRiskGraphService.createFinancialEcosystem();

      return {
        message: 'Écosystème financier créé avec succès',
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      this.logger.error('Error creating financial ecosystem:', error);
      throw new HttpException(
        'Erreur lors de la création de l\'écosystème financier',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('analysis/systemic-risks')
  @ApiOperation({ 
    summary: 'Analyse des risques systémiques',
    description: 'Analyse complète des interconnexions, concentrations, cascades et risques sectoriels'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Analyse des risques systémiques terminée',
    schema: {
      type: 'object',
      properties: {
        interconnectionRisks: { type: 'array' },
        concentrationRisks: { type: 'array' },
        cascadeRisks: { type: 'array' },
        sectoralRisks: { type: 'array' }
      }
    }
  })
  async analyzeSystemicRisks(): Promise<{
    interconnectionRisks: any[];
    concentrationRisks: any[];
    cascadeRisks: any[];
    sectoralRisks: any[];
  }> {
    try {
      this.logger.log('Analyzing systemic risks...');

      const analysis = await this.financialRiskGraphService.analyzeSystemicRisks();

      this.logger.log(`Systemic risk analysis completed. Found ${analysis.interconnectionRisks.length} interconnection risks, ${analysis.concentrationRisks.length} concentration risks`);

      return analysis;

    } catch (error: any) {
      this.logger.error('Error analyzing systemic risks:', error);
      throw new HttpException(
        'Erreur lors de l\'analyse des risques systémiques',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('analysis/fraud-patterns')
  @ApiOperation({ 
    summary: 'Détection de patterns de fraude avancés',
    description: 'Détecte les schémas de superposition, structuration, sociétés écrans et transactions circulaires'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Détection de fraude terminée',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          patternId: { type: 'string' },
          type: { type: 'string' },
          entities: { type: 'array', items: { type: 'string' } },
          riskScore: { type: 'number' },
          description: { type: 'string' },
          recommendations: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  })
  async detectFraudPatterns(): Promise<RiskPattern[]> {
    try {
      this.logger.log('Detecting advanced fraud patterns...');

      const patterns = await this.financialRiskGraphService.detectAdvancedFraudPatterns();

      this.logger.log(`Fraud detection completed. Found ${patterns.length} suspicious patterns`);

      return patterns;

    } catch (error: any) {
      this.logger.error('Error detecting fraud patterns:', error);
      throw new HttpException(
        'Erreur lors de la détection de patterns de fraude',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('simulation/risk-propagation')
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

  @Get('analysis/resilience')
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

  @Get('analysis/network-centrality')
  @ApiOperation({ 
    summary: 'Métriques de centralité du réseau',
    description: 'Calcule les métriques de centralité pour identifier les entités critiques'
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
  async calculateNetworkCentrality(): Promise<NetworkAnalysis> {
    try {
      this.logger.log('Calculating network centrality metrics...');

      const analysis = await this.financialRiskGraphService.calculateAdvancedCentralityMetrics();

      this.logger.log('Network centrality metrics calculated successfully');

      return analysis;

    } catch (error: any) {
      this.logger.error('Error calculating network centrality:', error);
      throw new HttpException(
        'Erreur lors du calcul des métriques de centralité',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('reports/comprehensive')
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
}
