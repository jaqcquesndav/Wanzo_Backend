import { Injectable, Logger } from '@nestjs/common';
import { GraphService } from '../graph.service';
import { 
  ExtendedNodeType, 
  ExtendedEdgeType,
  FinancialProductProperties,
  EconomicGroupProperties,
  RiskClusterProperties,
  ConcentrationPointProperties,
  ConcentrationRelationshipProperties 
} from '../entities/extended-graph.entity';

export interface ConcentrationMetrics {
  sectorConcentration: {
    sector: string;
    exposure: number;
    percentage: number;
    riskWeight: number;
  }[];
  geographicConcentration: {
    province: string;
    exposure: number;
    percentage: number;
    riskScore: number;
  }[];
  productConcentration: {
    productType: string;
    exposure: number;
    percentage: number;
    maturityProfile: string;
  }[];
  herfindahlIndex: number;
  concentrationRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface EconomicCluster {
  clusterId: string;
  type: 'SECTOR' | 'GEOGRAPHIC' | 'PRODUCT' | 'SIZE';
  members: string[];
  centralNode: string;
  cohesionScore: number;
  riskProfile: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  totalExposure: number;
  averageRiskScore: number;
  interconnectedness: number;
}

export interface SystemicRiskAnalysis {
  networkDensity: number;
  avgPathLength: number;
  clusteringCoefficient: number;
  criticalNodes: {
    nodeId: string;
    centralityScore: number;
    systemicImportance: number;
    contagionPotential: number;
  }[];
  vulnerabilityPoints: string[];
  resilientComponents: string[];
  stressTestResults?: {
    scenario: string;
    impactedNodes: number;
    totalLoss: number;
    recoveryTime: number;
  }[];
}

export interface ProductPortfolioAnalysis {
  productMix: {
    category: string;
    count: number;
    totalAmount: number;
    avgRiskScore: number;
    margin: number;
  }[];
  maturityProfile: {
    bucket: string;
    exposure: number;
    percentage: number;
  }[];
  performanceMetrics: {
    npl_ratio: number;
    yield: number;
    cost_of_risk: number;
  };
  diversificationScore: number;
  recommendations?: string[];
}

@Injectable()
export class MicroRelationAnalysisService {
  private readonly logger = new Logger(MicroRelationAnalysisService.name);

  constructor(private readonly graphService: GraphService) {}

  /**
   * Analyse la concentration d'un portefeuille par différentes dimensions
   */
  async analyzePorfolioConcentration(portfolioId: string): Promise<ConcentrationMetrics> {
    try {
      // Concentration sectorielle
      const sectorQuery = `
        MATCH (p:Portfolio {id: $portfolioId})-[:INVESTS_IN]->(prod:FinancialProduct)
        -[:TARGETS_SECTOR]->(s:Sector)
        WITH s.name as sector, sum(prod.amount) as exposure, s.riskLevel as riskLevel
        WITH *, (exposure / sum(exposure)) as percentage
        RETURN sector, exposure, percentage, 
               CASE riskLevel 
                 WHEN 'LOW' THEN 0.5 
                 WHEN 'MEDIUM' THEN 1.0 
                 WHEN 'HIGH' THEN 1.5 
                 ELSE 2.0 
               END as riskWeight
        ORDER BY exposure DESC
      `;

      // Concentration géographique
      const geoQuery = `
        MATCH (p:Portfolio {id: $portfolioId})-[:INVESTS_IN]->(prod:FinancialProduct)
        -[:LOCATED_IN]->(geo:Geographic)
        WITH geo.province as province, sum(prod.amount) as exposure, geo.riskScore as riskScore
        WITH *, (exposure / sum(exposure)) as percentage
        RETURN province, exposure, percentage, riskScore
        ORDER BY exposure DESC
      `;

      // Concentration produit
      const productQuery = `
        MATCH (p:Portfolio {id: $portfolioId})-[:INVESTS_IN]->(prod:FinancialProduct)
        WITH prod.type as productType, sum(prod.amount) as exposure, prod.maturityBucket as maturityProfile
        WITH *, (exposure / sum(exposure)) as percentage
        RETURN productType, exposure, percentage, maturityProfile
        ORDER BY exposure DESC
      `;

      const [sectorResult, geoResult, productResult] = await Promise.all([
        this.graphService.executeQuery(sectorQuery, { portfolioId }),
        this.graphService.executeQuery(geoQuery, { portfolioId }),
        this.graphService.executeQuery(productQuery, { portfolioId })
      ]);

      // Calcul de l'indice Herfindahl pour la concentration globale
      const sectorConcentrations = sectorResult.records.map(r => r.get('percentage'));
      const herfindahlIndex = sectorConcentrations.reduce((sum, p) => sum + (p * p), 0);

      // Détermination du niveau de risque de concentration
      let concentrationRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      if (herfindahlIndex < 0.15) concentrationRisk = 'LOW';
      else if (herfindahlIndex < 0.25) concentrationRisk = 'MEDIUM';
      else if (herfindahlIndex < 0.4) concentrationRisk = 'HIGH';
      else concentrationRisk = 'CRITICAL';

      return {
        sectorConcentration: sectorResult.records.map(r => ({
          sector: r.get('sector'),
          exposure: r.get('exposure'),
          percentage: r.get('percentage'),
          riskWeight: r.get('riskWeight')
        })),
        geographicConcentration: geoResult.records.map(r => ({
          province: r.get('province'),
          exposure: r.get('exposure'),
          percentage: r.get('percentage'),
          riskScore: r.get('riskScore')
        })),
        productConcentration: productResult.records.map(r => ({
          productType: r.get('productType'),
          exposure: r.get('exposure'),
          percentage: r.get('percentage'),
          maturityProfile: r.get('maturityProfile')
        })),
        herfindahlIndex,
        concentrationRisk
      };

    } catch (error) {
      this.logger.error(`Error analyzing portfolio concentration for ${portfolioId}:`, error);
      throw error;
    }
  }

  /**
   * Détecte les clusters économiques et groupes d'entités interconnectées
   */
  async detectEconomicClusters(): Promise<EconomicCluster[]> {
    try {
      // Utilisation de l'algorithme Louvain pour détecter les communautés
      const clusterQuery = `
        CALL gds.graph.project(
          'economic-network',
          ['SME', 'Institution', 'EconomicGroup'],
          ['OWNS', 'CONTROLS', 'SUPPLIES_TO', 'BORROWS_FROM', 'PARTNERS_WITH']
        ) YIELD graphName;
        
        CALL gds.louvain.stream('economic-network', {
          relationshipWeightProperty: 'strength'
        })
        YIELD nodeId, communityId
        
        WITH gds.util.asNode(nodeId) as node, communityId
        
        RETURN communityId,
               collect(node.id) as members,
               collect(node.type) as types,
               avg(node.riskScore) as avgRiskScore,
               sum(coalesce(node.totalAssets, node.revenue, 0)) as totalExposure,
               count(node) as memberCount
        ORDER BY memberCount DESC, totalExposure DESC
      `;

      const result = await this.graphService.executeQuery(clusterQuery);

      const clusters: EconomicCluster[] = [];

      for (const record of result.records) {
        const members = record.get('members');
        const communityId = record.get('communityId').toString();
        
        // Identifier le nœud central (plus haut degré de centralité)
        const centralityQuery = `
          MATCH (n)
          WHERE n.id IN $members
          WITH n, size((n)--()) as degree
          RETURN n.id as nodeId, degree
          ORDER BY degree DESC
          LIMIT 1
        `;
        
        const centralityResult = await this.graphService.executeQuery(centralityQuery, { members });
        const centralNode = centralityResult.records[0]?.get('nodeId') || members[0];

        // Calculer l'interconnectedness
        const interconnectQuery = `
          MATCH (n1)-[r]-(n2)
          WHERE n1.id IN $members AND n2.id IN $members
          RETURN count(r) as connections
        `;
        
        const interconnectResult = await this.graphService.executeQuery(interconnectQuery, { members });
        const connections = interconnectResult.records[0]?.get('connections') || 0;
        const maxPossibleConnections = members.length * (members.length - 1) / 2;
        const interconnectedness = maxPossibleConnections > 0 ? connections / maxPossibleConnections : 0;

        // Déterminer le type de cluster
        const types = record.get('types');
        let clusterType: 'SECTOR' | 'GEOGRAPHIC' | 'PRODUCT' | 'SIZE';
        if (types.every((t: string) => t === 'SME')) clusterType = 'SIZE';
        else if (types.includes('Institution')) clusterType = 'SECTOR';
        else clusterType = 'GEOGRAPHIC';

        // Calculer le score de cohésion
        const avgRiskScore = record.get('avgRiskScore') || 0;
        const cohesionScore = interconnectedness * 0.6 + (1 - Math.abs(avgRiskScore - 5) / 5) * 0.4;

        // Déterminer le profil de risque
        let riskProfile: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        if (avgRiskScore < 3) riskProfile = 'LOW';
        else if (avgRiskScore < 5) riskProfile = 'MEDIUM';
        else if (avgRiskScore < 7) riskProfile = 'HIGH';
        else riskProfile = 'CRITICAL';

        clusters.push({
          clusterId: communityId,
          type: clusterType,
          members,
          centralNode,
          cohesionScore,
          riskProfile,
          totalExposure: record.get('totalExposure') || 0,
          averageRiskScore: avgRiskScore,
          interconnectedness
        });
      }

      return clusters;

    } catch (error) {
      this.logger.error('Error detecting economic clusters:', error);
      throw error;
    }
  }

  /**
   * Analyse le risque systémique du réseau financier
   */
  async analyzeSystemicRisk(): Promise<SystemicRiskAnalysis> {
    try {
      // Métriques globales du réseau
      const networkMetricsQuery = `
        MATCH (n)
        WITH count(n) as nodeCount
        MATCH (n)-[r]-(m)
        WITH nodeCount, count(r)/2 as edgeCount
        WITH nodeCount, edgeCount, 
             toFloat(edgeCount) / (nodeCount * (nodeCount - 1) / 2) as density
        
        // Chemin moyen
        CALL gds.graph.project('temp-network', '*', '*') YIELD graphName;
        CALL gds.alpha.allShortestPaths.stream('temp-network')
        YIELD sourceNodeId, targetNodeId, distance
        WITH density, avg(distance) as avgPathLength
        
        RETURN density, avgPathLength
      `;

      // Nœuds critiques (centralité élevée)
      const criticalNodesQuery = `
        CALL gds.betweennessCentrality.stream('temp-network')
        YIELD nodeId, score as betweenness
        
        WITH gds.util.asNode(nodeId) as node, betweenness
        
        CALL gds.pageRank.stream('temp-network') 
        YIELD nodeId as prNodeId, score as pagerank
        WHERE nodeId = prNodeId
        
        WITH node, betweenness, pagerank,
             (betweenness * 0.4 + pagerank * 0.6) as centralityScore
        
        // Calcul du potentiel de contagion
        WITH node, centralityScore,
             CASE 
               WHEN node.type = 'Institution' THEN centralityScore * 2
               WHEN node.type = 'EconomicGroup' THEN centralityScore * 1.5
               ELSE centralityScore
             END as contagionPotential
        
        RETURN node.id as nodeId, centralityScore, 
               centralityScore * coalesce(node.totalAssets, 1000000) / 1000000 as systemicImportance,
               contagionPotential
        ORDER BY centralityScore DESC
        LIMIT 20
      `;

      // Simulation de stress test
      const stressTestQuery = `
        // Simulation de défaillance des top 5 institutions
        MATCH (n:Institution)
        WITH n ORDER BY n.totalAssets DESC LIMIT 5
        
        MATCH (n)-[*1..3]-(affected)
        WHERE affected.type IN ['SME', 'Portfolio']
        
        WITH collect(DISTINCT affected.id) as impactedNodes, 
             sum(coalesce(affected.revenue, affected.amount, 0)) as totalLoss
        
        RETURN 'Top 5 Institution Failure' as scenario,
               size(impactedNodes) as impactedNodes,
               totalLoss,
               30 as recoveryTime
      `;

      const [networkResult, criticalResult, stressResult] = await Promise.all([
        this.graphService.executeQuery(networkMetricsQuery),
        this.graphService.executeQuery(criticalNodesQuery),
        this.graphService.executeQuery(stressTestQuery)
      ]);

      const networkMetrics = networkResult.records[0];
      const networkDensity = networkMetrics?.get('density') || 0;
      const avgPathLength = networkMetrics?.get('avgPathLength') || 0;

      // Calcul du coefficient de clustering global
      const clusteringQuery = `
        MATCH (n)--(neighbor1)--(neighbor2)--(n)
        WHERE neighbor1 <> neighbor2
        WITH n, count(DISTINCT neighbor1) as neighbors, count(*) as triangles
        WHERE neighbors >= 2
        WITH avg(toFloat(triangles) / (neighbors * (neighbors - 1) / 2)) as globalClustering
        RETURN globalClustering
      `;
      
      const clusteringResult = await this.graphService.executeQuery(clusteringQuery);
      const clusteringCoefficient = clusteringResult.records[0]?.get('globalClustering') || 0;

      return {
        networkDensity,
        avgPathLength,
        clusteringCoefficient,
        criticalNodes: criticalResult.records.map(r => ({
          nodeId: r.get('nodeId'),
          centralityScore: r.get('centralityScore'),
          systemicImportance: r.get('systemicImportance'),
          contagionPotential: r.get('contagionPotential')
        })),
        vulnerabilityPoints: criticalResult.records
          .filter(r => r.get('contagionPotential') > 0.7)
          .map(r => r.get('nodeId')),
        resilientComponents: criticalResult.records
          .filter(r => r.get('centralityScore') < 0.1)
          .map(r => r.get('nodeId')),
        stressTestResults: stressResult.records.map(r => ({
          scenario: r.get('scenario'),
          impactedNodes: r.get('impactedNodes'),
          totalLoss: r.get('totalLoss'),
          recoveryTime: r.get('recoveryTime')
        }))
      };

    } catch (error) {
      this.logger.error('Error analyzing systemic risk:', error);
      throw error;
    }
  }

  /**
   * Analyse de la composition et performance des produits d'un portefeuille
   */
  async analyzeProductPortfolio(institutionId: string): Promise<ProductPortfolioAnalysis> {
    try {
      // Mix produits
      const productMixQuery = `
        MATCH (inst:Institution {id: $institutionId})-[:PROVIDES_CREDIT]->(prod:FinancialProduct)
        WITH prod.category as category, 
             count(prod) as count,
             sum(prod.amount) as totalAmount,
             avg(coalesce(prod.riskScore, 5)) as avgRiskScore,
             avg(coalesce(prod.interestRate, 0) - coalesce(prod.cost, 0)) as margin
        RETURN category, count, totalAmount, avgRiskScore, margin
        ORDER BY totalAmount DESC
      `;

      // Profil de maturité
      const maturityQuery = `
        MATCH (inst:Institution {id: $institutionId})-[:PROVIDES_CREDIT]->(prod:FinancialProduct)
        WITH prod.maturityBucket as bucket,
             sum(prod.amount) as exposure
        WITH *, (exposure / sum(exposure)) as percentage
        RETURN bucket, exposure, percentage
        ORDER BY 
          CASE bucket 
            WHEN 'DEMAND' THEN 1 
            WHEN 'SHORT' THEN 2 
            WHEN 'MEDIUM' THEN 3 
            ELSE 4 
          END
      `;

      // Métriques de performance
      const performanceQuery = `
        MATCH (inst:Institution {id: $institutionId})-[:PROVIDES_CREDIT]->(prod:FinancialProduct)
        WITH count(prod) as totalProducts,
             count(CASE WHEN prod.performanceStatus <> 'PERFORMING' THEN 1 END) as nplCount,
             avg(coalesce(prod.interestRate, 0)) as avgYield,
             sum(CASE WHEN prod.performanceStatus = 'LOSS' THEN prod.amount ELSE 0 END) as totalLosses,
             sum(prod.amount) as totalExposure
        
        RETURN toFloat(nplCount) / totalProducts as npl_ratio,
               avgYield as yield,
               toFloat(totalLosses) / totalExposure as cost_of_risk
      `;

      const [mixResult, maturityResult, performanceResult] = await Promise.all([
        this.graphService.executeQuery(productMixQuery, { institutionId }),
        this.graphService.executeQuery(maturityQuery, { institutionId }),
        this.graphService.executeQuery(performanceQuery, { institutionId })
      ]);

      // Calcul du score de diversification
      const exposures = mixResult.records.map(r => r.get('totalAmount'));
      const totalExposure = exposures.reduce((sum, exp) => sum + exp, 0);
      const proportions = exposures.map(exp => exp / totalExposure);
      const herfindahl = proportions.reduce((sum, p) => sum + (p * p), 0);
      const diversificationScore = Math.max(0, (1 - herfindahl) * 100);

      // Générer des recommandations
      const recommendations: string[] = [];
      if (herfindahl > 0.4) {
        recommendations.push("Réduire la concentration dans les produits dominants");
      }
      if (performanceResult.records[0]?.get('npl_ratio') > 0.05) {
        recommendations.push("Renforcer les critères d'octroi de crédit");
      }
      if (performanceResult.records[0]?.get('cost_of_risk') > 0.02) {
        recommendations.push("Améliorer les stratégies de recouvrement");
      }

      return {
        productMix: mixResult.records.map(r => ({
          category: r.get('category'),
          count: r.get('count'),
          totalAmount: r.get('totalAmount'),
          avgRiskScore: r.get('avgRiskScore'),
          margin: r.get('margin')
        })),
        maturityProfile: maturityResult.records.map(r => ({
          bucket: r.get('bucket'),
          exposure: r.get('exposure'),
          percentage: r.get('percentage')
        })),
        performanceMetrics: {
          npl_ratio: performanceResult.records[0]?.get('npl_ratio') || 0,
          yield: performanceResult.records[0]?.get('yield') || 0,
          cost_of_risk: performanceResult.records[0]?.get('cost_of_risk') || 0
        },
        diversificationScore,
        recommendations
      };

    } catch (error) {
      this.logger.error(`Error analyzing product portfolio for ${institutionId}:`, error);
      throw error;
    }
  }

  /**
   * Crée un point de concentration avec surveillance automatique
   */
  async createConcentrationPoint(
    type: 'SINGLE_BORROWER' | 'SECTOR' | 'GEOGRAPHIC' | 'PRODUCT' | 'MATURITY' | 'CURRENCY',
    entityId: string,
    threshold: number,
    responsibleTeam: string
  ): Promise<string> {
    try {
      const concentrationPoint: ConcentrationPointProperties = {
        id: `CONC_${type}_${entityId}_${Date.now()}`,
        type,
        entity: entityId,
        threshold,
        currentLevel: 0, // À calculer
        maxHistorical: 0,
        trend: 'STABLE',
        riskRating: 'GREEN',
        reviewFrequency: type === 'SINGLE_BORROWER' ? 'DAILY' : 'WEEKLY',
        responsibleTeam
      };

      const createQuery = `
        CREATE (cp:ConcentrationPoint $properties)
        RETURN cp.id as id
      `;

      const result = await this.graphService.executeQuery(createQuery, { 
        properties: concentrationPoint 
      });

      const concentrationId = result.records[0]?.get('id');

      // Créer les relations de surveillance
      const linkQuery = `
        MATCH (cp:ConcentrationPoint {id: $concentrationId})
        MATCH (entity {id: $entityId})
        CREATE (cp)-[:MONITORS]->(entity)
      `;

      await this.graphService.executeQuery(linkQuery, { concentrationId, entityId });

      this.logger.log(`Created concentration point ${concentrationId} for ${type} on ${entityId}`);
      return concentrationId;

    } catch (error) {
      this.logger.error('Error creating concentration point:', error);
      throw error;
    }
  }

  /**
   * Met à jour les niveaux de concentration et déclenche des alertes si nécessaire
   */
  async updateConcentrationLevels(): Promise<void> {
    try {
      const updateQuery = `
        MATCH (cp:ConcentrationPoint)-[:MONITORS]->(entity)
        
        // Calculer le niveau actuel selon le type
        WITH cp, entity,
          CASE cp.type
            WHEN 'SINGLE_BORROWER' THEN 
              size((entity)<-[:HAS_CREDIT]-()) * 100.0 / 
              size((:Portfolio)-[:PROVIDES_CREDIT]->())
            WHEN 'SECTOR' THEN
              size((entity)<-[:OPERATES_IN]-()) * 100.0 /
              size((:SME))
            ELSE 0
          END as currentLevel
        
        SET cp.currentLevel = currentLevel,
            cp.maxHistorical = CASE 
              WHEN currentLevel > cp.maxHistorical THEN currentLevel 
              ELSE cp.maxHistorical 
            END,
            cp.riskRating = CASE
              WHEN currentLevel >= cp.threshold THEN 'RED'
              WHEN currentLevel >= cp.threshold * 0.8 THEN 'ORANGE'
              WHEN currentLevel >= cp.threshold * 0.6 THEN 'YELLOW'
              ELSE 'GREEN'
            END,
            cp.lastMeasurement = datetime()
        
        // Créer des alertes si nécessaire
        WITH cp WHERE cp.riskRating IN ['ORANGE', 'RED']
        
        CREATE (alert:Alert {
          id: 'ALERT_CONC_' + cp.id + '_' + toString(timestamp()),
          type: 'CONCENTRATION_BREACH',
          severity: CASE cp.riskRating WHEN 'RED' THEN 'HIGH' ELSE 'MEDIUM' END,
          message: 'Concentration threshold approached/breached for ' + cp.type,
          entityId: cp.entity,
          currentLevel: cp.currentLevel,
          threshold: cp.threshold,
          responsibleTeam: cp.responsibleTeam,
          timestamp: datetime(),
          status: 'OPEN'
        })
        
        CREATE (cp)-[:GENERATES]->(alert)
        
        RETURN count(alert) as alertsCreated
      `;

      const result = await this.graphService.executeQuery(updateQuery);
      const alertsCreated = result.records[0]?.get('alertsCreated') || 0;

      this.logger.log(`Updated concentration levels and created ${alertsCreated} alerts`);

    } catch (error) {
      this.logger.error('Error updating concentration levels:', error);
      throw error;
    }
  }
}
