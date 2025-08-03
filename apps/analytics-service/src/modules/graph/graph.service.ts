import { Injectable, OnApplicationShutdown, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver, Session, QueryResult, Record, Node, Relationship } from 'neo4j-driver';
import { 
  GeographicNode, 
  SectorNode, 
  SMENode, 
  InstitutionNode, 
  PortfolioNode, 
  CreditNode, 
  RiskEventNode, 
  GuaranteeNode,
  GraphRelationship,
  RelationshipType,
  CypherQuery,
  GraphQueryOptions,
  NetworkAnalysis,
  RiskPattern
} from './interfaces/graph-types';

interface Neo4jConfig {
  scheme: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

interface NodeProperties {
  [key: string]: string | number | boolean | null;
}

@Injectable()
export class GraphService implements OnApplicationShutdown {
  private readonly logger = new Logger(GraphService.name);
  private readonly driver: Driver;
  private readonly database: string;

  constructor(private configService: ConfigService) {
    // Récupération et vérification de chaque variable d'environnement
    const scheme = this.configService.get<string>('NEO4J_SCHEME', 'bolt');
    const host = this.configService.get<string>('NEO4J_HOST', 'localhost');
    const portStr = this.configService.get<string>('NEO4J_PORT', '7687');
    const port = parseInt(portStr, 10);
    const username = this.configService.get<string>('NEO4J_USERNAME', 'neo4j');
    const password = this.configService.get<string>('NEO4J_PASSWORD', 'password');
    const database = this.configService.get<string>('NEO4J_DATABASE', 'neo4j');

    const config: Neo4jConfig = { scheme, host, port, username, password, database };

    // Stocker le nom de la base pour l'utiliser lors de la création de la session
    this.database = config.database;

    // Créer le driver
    this.driver = neo4j.driver(
      `${config.scheme}://${config.host}:${config.port}`,
      neo4j.auth.basic(config.username, config.password),
      {
        disableLosslessIntegers: true,
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 heures
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
      }
    );

    this.logger.log(`Neo4j connection initialized to ${config.host}:${config.port}`);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.driver.close();
    this.logger.log('Neo4j driver closed');
  }

  getSession(): Session {
    return this.driver.session({ database: this.database });
  }

  async executeQuery(
    query: string,
    params: any = {},
  ): Promise<QueryResult> {
    const session = this.getSession();
    try {
      return await session.executeWrite(tx => tx.run(query, params));
    } finally {
      await session.close();
    }
  }

  async executeReadQuery(
    query: string,
    params: any = {},
  ): Promise<QueryResult> {
    const session = this.getSession();
    try {
      return await session.executeRead(tx => tx.run(query, params));
    } finally {
      await session.close();
    }
  }

  // === CRÉATION DES NŒUDS FINANCIERS ===

  async createGeographicNode(data: GeographicNode): Promise<GeographicNode> {
    const query = `
      CREATE (g:Geographic {
        id: $id,
        name: $name,
        code: $code,
        type: $type,
        riskScore: $riskScore,
        population: $population,
        economicIndicators: $economicIndicators,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      RETURN g
    `;
    
    const result = await this.executeQuery(query, data);
    return this.mapNodeToGeographic(result.records[0].get('g'));
  }

  async createSectorNode(data: SectorNode): Promise<SectorNode> {
    const query = `
      CREATE (s:Sector {
        id: $id,
        name: $name,
        code: $code,
        riskLevel: $riskLevel,
        defaultRate: $defaultRate,
        growthRate: $growthRate,
        totalSMEs: $totalSMEs,
        avgRevenue: $avgRevenue,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      RETURN s
    `;
    
    const result = await this.executeQuery(query, data);
    return this.mapNodeToSector(result.records[0].get('s'));
  }

  async createSMENode(data: SMENode): Promise<SMENode> {
    const query = `
      CREATE (sme:SME {
        id: $id,
        name: $name,
        registrationNumber: $registrationNumber,
        foundedYear: $foundedYear,
        employees: $employees,
        revenue: $revenue,
        riskScore: $riskScore,
        status: $status,
        legalForm: $legalForm,
        taxId: $taxId,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      RETURN sme
    `;
    
    const result = await this.executeQuery(query, data);
    return this.mapNodeToSME(result.records[0].get('sme'));
  }

  async createInstitutionNode(data: InstitutionNode): Promise<InstitutionNode> {
    const query = `
      CREATE (inst:Institution {
        id: $id,
        name: $name,
        type: $type,
        license: $license,
        riskScore: $riskScore,
        totalAssets: $totalAssets,
        capitalRatio: $capitalRatio,
        foundedYear: $foundedYear,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      RETURN inst
    `;
    
    const result = await this.executeQuery(query, data);
    return this.mapNodeToInstitution(result.records[0].get('inst'));
  }

  async createCreditNode(data: CreditNode): Promise<CreditNode> {
    const query = `
      CREATE (c:Credit {
        id: $id,
        amount: $amount,
        interestRate: $interestRate,
        term: $term,
        status: $status,
        disbursementDate: $disbursementDate,
        maturityDate: $maturityDate,
        collateralValue: $collateralValue,
        riskGrade: $riskGrade,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      RETURN c
    `;
    
    const result = await this.executeQuery(query, data);
    return this.mapNodeToCredit(result.records[0].get('c'));
  }

  async createRiskEventNode(data: RiskEventNode): Promise<RiskEventNode> {
    const query = `
      CREATE (re:RiskEvent {
        id: $id,
        type: $type,
        severity: $severity,
        timestamp: $timestamp,
        amount: $amount,
        description: $description,
        resolved: $resolved,
        impact: $impact,
        createdAt: datetime()
      })
      RETURN re
    `;
    
    const result = await this.executeQuery(query, data);
    return this.mapNodeToRiskEvent(result.records[0].get('re'));
  }

  // === CRÉATION DES RELATIONS ===

  async createRelationship(
    fromNodeId: string,
    toNodeId: string,
    relationshipType: RelationshipType,
    properties: any = {}
  ): Promise<void> {
    const query = `
      MATCH (from), (to)
      WHERE from.id = $fromNodeId AND to.id = $toNodeId
      CREATE (from)-[r:${relationshipType} $properties]->(to)
      RETURN r
    `;
    
    await this.executeQuery(query, { fromNodeId, toNodeId, properties });
    this.logger.debug(`Created relationship ${relationshipType} between ${fromNodeId} and ${toNodeId}`);
  }

  // === REQUÊTES D'ANALYSE DE RISQUE ===

  async findRiskPathsBetweenEntities(
    entityId1: string,
    entityId2: string,
    maxDepth: number = 5
  ): Promise<any[]> {
    const query = `
      MATCH path = shortestPath((e1)-[*1..${maxDepth}]-(e2))
      WHERE e1.id = $entityId1 AND e2.id = $entityId2
      RETURN path, length(path) as pathLength,
             [node in nodes(path) | {id: node.id, labels: labels(node), riskScore: node.riskScore}] as nodes,
             [rel in relationships(path) | type(rel)] as relationships
      ORDER BY pathLength
      LIMIT 10
    `;
    
    const result = await this.executeReadQuery(query, { entityId1, entityId2 } as any);
    return result.records.map(record => ({
      pathLength: record.get('pathLength'),
      nodes: record.get('nodes'),
      relationships: record.get('relationships')
    }));
  }

  async identifyRiskClusters(riskThreshold: number = 7.0): Promise<any[]> {
    const query = `
      MATCH (n)
      WHERE n.riskScore >= $riskThreshold
      WITH n
      MATCH (n)-[*1..2]-(connected)
      WHERE connected.riskScore >= $riskThreshold
      WITH n, collect(DISTINCT connected) as cluster
      WHERE size(cluster) >= 3
      RETURN n.id as centerId, 
             [node in cluster | {id: node.id, riskScore: node.riskScore, labels: labels(node)}] as clusterNodes,
             avg([node in cluster | node.riskScore]) as avgRiskScore,
             size(cluster) as clusterSize
      ORDER BY avgRiskScore DESC, clusterSize DESC
      LIMIT 20
    `;
    
    const result = await this.executeReadQuery(query, { riskThreshold } as any);
    return result.records.map(record => ({
      centerId: record.get('centerId'),
      clusterNodes: record.get('clusterNodes'),
      avgRiskScore: record.get('avgRiskScore'),
      clusterSize: record.get('clusterSize')
    }));
  }

  async detectCircularLending(): Promise<RiskPattern[]> {
    const query = `
      MATCH path = (start:SME)-[:HAS_CREDIT*3..6]->(start)
      WHERE all(node in nodes(path) WHERE 'SME' in labels(node) OR 'Institution' in labels(node))
      WITH path, nodes(path) as pathNodes, length(path) as pathLength
      WHERE pathLength >= 3
      RETURN DISTINCT
        [node in pathNodes | node.id] as entities,
        pathLength,
        avg([node in pathNodes WHERE node.riskScore IS NOT NULL | node.riskScore]) as avgRiskScore,
        reduce(totalAmount = 0, rel in relationships(path) | totalAmount + COALESCE(rel.amount, 0)) as totalAmount
      ORDER BY avgRiskScore DESC, totalAmount DESC
      LIMIT 10
    `;
    
    const result = await this.executeReadQuery(query);
    return result.records.map(record => ({
      patternId: `circular_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'CIRCULAR_LENDING' as const,
      entities: record.get('entities'),
      riskScore: record.get('avgRiskScore') || 0,
      description: `Prêt circulaire détecté impliquant ${record.get('entities').length} entités avec un montant total de ${record.get('totalAmount')} CDF`,
      recommendations: [
        'Investigation immédiate du circuit de crédit',
        'Vérification de la légitimité des transactions',
        'Mise en place de monitoring renforcé'
      ]
    }));
  }

  async analyzeConcentrationRisk(entityType: string = 'SME'): Promise<any[]> {
    const query = `
      MATCH (institution:Institution)-[r:PROVIDES_CREDIT]->(entity:${entityType})
      WITH institution, collect(entity) as clients, sum(r.amount) as totalExposure, count(entity) as clientCount
      WHERE clientCount >= 5
      WITH institution, clients, totalExposure, clientCount,
           totalExposure / clientCount as avgExposure
      MATCH (allClients:${entityType})
      WITH institution, clients, totalExposure, clientCount, avgExposure,
           count(allClients) as totalMarketEntities
      RETURN 
        institution.id as institutionId,
        institution.name as institutionName,
        clientCount,
        totalExposure,
        avgExposure,
        (clientCount * 100.0 / totalMarketEntities) as marketSharePercent,
        CASE 
          WHEN (clientCount * 100.0 / totalMarketEntities) > 30 THEN 'CRITICAL'
          WHEN (clientCount * 100.0 / totalMarketEntities) > 20 THEN 'HIGH'
          WHEN (clientCount * 100.0 / totalMarketEntities) > 10 THEN 'MEDIUM'
          ELSE 'LOW'
        END as concentrationRisk
      ORDER BY marketSharePercent DESC
    `;
    
    const result = await this.executeReadQuery(query);
    return result.records.map(record => ({
      institutionId: record.get('institutionId'),
      institutionName: record.get('institutionName'),
      clientCount: record.get('clientCount'),
      totalExposure: record.get('totalExposure'),
      avgExposure: record.get('avgExposure'),
      marketSharePercent: record.get('marketSharePercent'),
      concentrationRisk: record.get('concentrationRisk')
    }));
  }

  async calculateNetworkCentrality(): Promise<any[]> {
    const query = `
      CALL gds.graph.project('riskNetwork', 
        ['SME', 'Institution', 'Geographic', 'Sector'],
        ['HAS_CREDIT', 'PROVIDES_CREDIT', 'LOCATED_IN', 'OPERATES_IN']
      )
      YIELD graphName, nodeCount, relationshipCount
      
      CALL gds.pageRank.stream('riskNetwork')
      YIELD nodeId, score as pageRankScore
      
      CALL gds.betweenness.stream('riskNetwork')
      YIELD nodeId, score as betweennessScore
      
      MATCH (n)
      WHERE id(n) = nodeId
      RETURN n.id as entityId, 
             labels(n) as labels,
             n.name as name,
             pageRankScore,
             betweennessScore,
             n.riskScore as riskScore
      ORDER BY pageRankScore DESC
      LIMIT 50
    `;
    
    try {
      const result = await this.executeReadQuery(query);
      return result.records.map(record => ({
        entityId: record.get('entityId'),
        labels: record.get('labels'),
        name: record.get('name'),
        pageRankScore: record.get('pageRankScore'),
        betweennessScore: record.get('betweennessScore'),
        riskScore: record.get('riskScore')
      }));
    } catch (error) {
      this.logger.warn('Graph Data Science library not available, using basic centrality analysis');
      return this.calculateBasicCentrality();
    }
  }

  private async calculateBasicCentrality(): Promise<any[]> {
    const query = `
      MATCH (n)
      WHERE n.id IS NOT NULL
      OPTIONAL MATCH (n)-[r]-()
      WITH n, count(r) as degreeCount
      RETURN n.id as entityId,
             labels(n) as labels,
             n.name as name,
             degreeCount,
             n.riskScore as riskScore
      ORDER BY degreeCount DESC
      LIMIT 50
    `;
    
    const result = await this.executeReadQuery(query);
    return result.records.map(record => ({
      entityId: record.get('entityId'),
      labels: record.get('labels'),
      name: record.get('name'),
      degreeCount: record.get('degreeCount'),
      riskScore: record.get('riskScore')
    }));
  }

  async findSystemicRiskFactors(): Promise<any[]> {
    const query = `
      // Identifier les institutions avec forte interconnexion
      MATCH (inst:Institution)
      OPTIONAL MATCH (inst)-[r1:PROVIDES_CREDIT]->(sme:SME)
      OPTIONAL MATCH (sme)-[r2:HAS_CREDIT]->(other:Institution)
      WHERE other <> inst
      WITH inst, count(DISTINCT sme) as directClients, 
           count(DISTINCT other) as interconnectedInstitutions,
           sum(r1.amount) as totalExposure
      WHERE directClients > 0
      
      // Calculer les métriques de risque systémique
      MATCH (allInst:Institution)
      WITH inst, directClients, interconnectedInstitutions, totalExposure,
           count(allInst) as totalInstitutions
      
      RETURN inst.id as institutionId,
             inst.name as institutionName,
             directClients,
             interconnectedInstitutions,
             totalExposure,
             (interconnectedInstitutions * 100.0 / (totalInstitutions - 1)) as interconnectionRate,
             CASE 
               WHEN interconnectedInstitutions > (totalInstitutions * 0.5) THEN 'CRITICAL'
               WHEN interconnectedInstitutions > (totalInstitutions * 0.3) THEN 'HIGH'
               WHEN interconnectedInstitutions > (totalInstitutions * 0.1) THEN 'MEDIUM'
               ELSE 'LOW'
             END as systemicRiskLevel
      ORDER BY interconnectionRate DESC, totalExposure DESC
    `;
    
    const result = await this.executeReadQuery(query);
    return result.records.map(record => ({
      institutionId: record.get('institutionId'),
      institutionName: record.get('institutionName'),
      directClients: record.get('directClients'),
      interconnectedInstitutions: record.get('interconnectedInstitutions'),
      totalExposure: record.get('totalExposure'),
      interconnectionRate: record.get('interconnectionRate'),
      systemicRiskLevel: record.get('systemicRiskLevel')
    }));
  }

  // === MÉTHODES UTILITAIRES DE MAPPING ===

  private mapNodeToGeographic(node: Node): GeographicNode {
    const props = node.properties;
    return {
      id: props.id,
      name: props.name,
      code: props.code,
      type: props.type,
      riskScore: props.riskScore,
      population: props.population,
      economicIndicators: props.economicIndicators
    };
  }

  private mapNodeToSector(node: Node): SectorNode {
    const props = node.properties;
    return {
      id: props.id,
      name: props.name,
      code: props.code,
      riskLevel: props.riskLevel,
      defaultRate: props.defaultRate,
      growthRate: props.growthRate,
      totalSMEs: props.totalSMEs,
      avgRevenue: props.avgRevenue
    };
  }

  private mapNodeToSME(node: Node): SMENode {
    const props = node.properties;
    return {
      id: props.id,
      name: props.name,
      registrationNumber: props.registrationNumber,
      foundedYear: props.foundedYear,
      employees: props.employees,
      revenue: props.revenue,
      riskScore: props.riskScore,
      status: props.status,
      legalForm: props.legalForm,
      taxId: props.taxId
    };
  }

  private mapNodeToInstitution(node: Node): InstitutionNode {
    const props = node.properties;
    return {
      id: props.id,
      name: props.name,
      type: props.type,
      license: props.license,
      riskScore: props.riskScore,
      totalAssets: props.totalAssets,
      capitalRatio: props.capitalRatio,
      foundedYear: props.foundedYear
    };
  }

  private mapNodeToCredit(node: Node): CreditNode {
    const props = node.properties;
    return {
      id: props.id,
      amount: props.amount,
      interestRate: props.interestRate,
      term: props.term,
      status: props.status,
      disbursementDate: props.disbursementDate,
      maturityDate: props.maturityDate,
      collateralValue: props.collateralValue,
      riskGrade: props.riskGrade
    };
  }

  private mapNodeToRiskEvent(node: Node): RiskEventNode {
    const props = node.properties;
    return {
      id: props.id,
      type: props.type,
      severity: props.severity,
      timestamp: props.timestamp,
      amount: props.amount,
      description: props.description,
      resolved: props.resolved,
      impact: props.impact
    };
  }

  async createNode(
    label: string,
    properties: NodeProperties,
  ): Promise<QueryResult> {
    const query = `
      CREATE (n:${label} $properties)
      RETURN n
    `;
    return this.executeQuery(query, { properties } as any);
  }

  async findNodesByLabel(label: string): Promise<QueryResult> {
    const query = `
      MATCH (n:${label})
      RETURN n
    `;
    return this.executeReadQuery(query);
  }

  // === MÉTHODES DE NETTOYAGE ET MAINTENANCE ===

  async clearDatabase(): Promise<void> {
    const query = `
      MATCH (n)
      DETACH DELETE n
    `;
    await this.executeQuery(query);
    this.logger.log('Database cleared');
  }

  async getGraphStatistics(): Promise<any> {
    const query = `
      MATCH (n)
      WITH labels(n) as nodeLabels
      UNWIND nodeLabels as label
      WITH label, count(*) as nodeCount
      RETURN collect({label: label, count: nodeCount}) as nodeStats
      
      UNION ALL
      
      MATCH ()-[r]->()
      WITH type(r) as relType
      RETURN collect({type: relType, count: count(*)}) as relationshipStats
    `;
    
    const result = await this.executeReadQuery(query);
    return {
      nodes: result.records[0]?.get('nodeStats') || [],
      relationships: result.records[1]?.get('relationshipStats') || []
    };
  }
}
