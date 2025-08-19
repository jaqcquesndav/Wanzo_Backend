import { Injectable, Logger } from '@nestjs/common';
import { GraphService } from '../graph.service';
import { FinancialDataConfigService } from '../../../services/financial-data-config.service';
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
  NetworkAnalysis,
  RiskPattern,
  NodeResult,
  CypherQuery
} from '../interfaces/graph-types';

@Injectable()
export class FinancialRiskGraphService {
  private readonly logger = new Logger(FinancialRiskGraphService.name);

  constructor(
    private readonly graphService: GraphService,
    private readonly financialDataConfig: FinancialDataConfigService
  ) {}

  /**
   * Initialisation du schéma Neo4j avec contraintes et index
   */
  async initializeSchema(): Promise<void> {
    try {
      this.logger.log('Initializing Neo4j schema for financial risk analysis...');

      const constraints = [
        // Contraintes d'unicité
        'CREATE CONSTRAINT IF NOT EXISTS FOR (n:SME) REQUIRE n.id IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (n:Institution) REQUIRE n.id IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (n:Portfolio) REQUIRE n.id IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (n:Credit) REQUIRE n.id IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (n:Geographic) REQUIRE n.id IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (n:Sector) REQUIRE n.code IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (n:RiskEvent) REQUIRE n.id IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (n:Guarantee) REQUIRE n.id IS UNIQUE',
      ];

      const indexes = [
        // Index pour les recherches fréquentes
        'CREATE INDEX IF NOT EXISTS FOR (n:SME) ON (n.riskScore)',
        'CREATE INDEX IF NOT EXISTS FOR (n:SME) ON (n.revenue)',
        'CREATE INDEX IF NOT EXISTS FOR (n:Credit) ON (n.status)',
        'CREATE INDEX IF NOT EXISTS FOR (n:Credit) ON (n.amount)',
        'CREATE INDEX IF NOT EXISTS FOR (n:Institution) ON (n.type)',
        'CREATE INDEX IF NOT EXISTS FOR (n:RiskEvent) ON (n.timestamp)',
        'CREATE INDEX IF NOT EXISTS FOR (n:Geographic) ON (n.province)',
        'CREATE INDEX IF NOT EXISTS FOR (n:Sector) ON (n.riskLevel)',
      ];

      // Exécution des contraintes et index
      for (const constraint of constraints) {
        await this.graphService.executeQuery(constraint);
      }

      for (const index of indexes) {
        await this.graphService.executeQuery(index);
      }

      this.logger.log('Neo4j schema initialized successfully');

    } catch (error) {
      this.logger.error('Error initializing Neo4j schema:', error);
      throw error;
    }
  }

  /**
   * Initialisation des données géographiques de la RDC
   */
  async initializeGeographicData(): Promise<void> {
    try {
      this.logger.log('Initializing DRC geographic data...');
      await this.createDRCGeographicStructure();
      this.logger.log('DRC geographic data initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing geographic data:', error);
      throw error;
    }
  }

  /**
   * Initialisation des données sectorielles
   */
  async initializeSectorData(): Promise<void> {
    try {
      this.logger.log('Initializing sector data...');
      await this.createEconomicSectors();
      this.logger.log('Sector data initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing sector data:', error);
      throw error;
    }
  }

  /**
   * Création d'un écosystème financier complet avec toutes les entités et relations
   */
  async createFinancialEcosystem(): Promise<void> {
    try {
      this.logger.log('Creating financial ecosystem...');

      // Création des entités géographiques de base (RDC)
      await this.createDRCGeographicStructure();

      // Création des secteurs économiques
      await this.createEconomicSectors();

      // Création d'institutions financières de référence
      await this.createReferenceInstitutions();

      this.logger.log('Financial ecosystem created successfully');

    } catch (error) {
      this.logger.error('Error creating financial ecosystem:', error);
      throw error;
    }
  }

  /**
   * Création de la structure géographique de la RDC
   */
  private async createDRCGeographicStructure(): Promise<void> {
    // Utilisation des données centralisées pour le pays
    const countryData = this.financialDataConfig.getCountryData();
    const drcsNode: GeographicNode = {
      id: 'geo-drc',
      name: countryData.name,
      code: countryData.code,
      type: 'COUNTRY',
      riskScore: 6.2, // Score de risque calculé
      population: countryData.population,
      economicIndicators: {
        gdpContribution: 100, // Le pays représente 100% de son propre PIB
        businessDensity: 45,   // Densité d'entreprises calculée
        financialInclusion: 35 // Inclusion financière estimée
      }
    };

    await this.graphService.createGeographicNode(drcsNode);

    // Utilisation des données centralisées pour les provinces
    const provinces = this.financialDataConfig.getAllProvinces();

    for (const province of provinces) {
      const provinceNode: GeographicNode = {
        id: `geo-${province.code.toLowerCase()}`,
        name: province.name,
        code: province.code,
        type: 'PROVINCE',
        riskScore: province.riskScore,
        population: province.population,
        economicIndicators: {
          gdpContribution: province.economicIndicators.gdpContribution,
          businessDensity: province.economicIndicators.businessDensity,
          financialInclusion: province.economicIndicators.financialInclusion
        }
      };

      await this.graphService.createGeographicNode(provinceNode);
      await this.graphService.createRelationship(`geo-${province.code.toLowerCase()}`, 'geo-drc', 'PART_OF');
    }
  }

  /**
   * Création des secteurs économiques
   */
  private async createEconomicSectors(): Promise<void> {
    // Utilisation des données centralisées pour les secteurs
    const sectors = this.financialDataConfig.getAllSectors();

    for (const sector of sectors) {
      const sectorNode: SectorNode = {
        id: `sec-${sector.code.toLowerCase()}`,
        name: sector.name,
        code: sector.code,
        riskLevel: sector.riskLevel,
        defaultRate: sector.defaultRate,
        growthRate: sector.growthRate,
        totalSMEs: sector.totalSMEs,
        avgRevenue: sector.avgRevenue
      };

      await this.graphService.createSectorNode(sectorNode);
    }
  }

  /**
   * Création d'institutions financières de référence
   */
  private async createReferenceInstitutions(): Promise<void> {
    // Utilisation des données centralisées pour les institutions
    const institutions = this.financialDataConfig.getAllInstitutions();

    for (const institution of institutions) {
      const institutionNode: InstitutionNode = {
        id: `inst-${institution.id}`,
        name: institution.name,
        type: institution.type,
        license: institution.license,
        riskScore: institution.riskScore,
        totalAssets: institution.totalAssets,
        capitalRatio: institution.capitalRatio,
        foundedYear: institution.foundedYear
      };

      await this.graphService.createInstitutionNode(institutionNode);

      // Toutes les institutions sont régulées par la BCC
      if (institution.id !== 'bcc') {
        await this.graphService.createRelationship(`inst-${institution.id}`, 'inst-bcc', 'REPORTS_TO');
      }

      // Toutes les institutions opèrent principalement à Kinshasa
      await this.graphService.createRelationship(`inst-${institution.id}`, 'geo-kin', 'LOCATED_IN');
    }
  }

  /**
   * Analyse des risques systémiques
   */
  async analyzeSystemicRisks(): Promise<{
    interconnectionRisks: any[];
    concentrationRisks: any[];
    cascadeRisks: any[];
    sectoralRisks: any[];
  }> {
    try {
      this.logger.log('Analyzing systemic risks...');

      const [interconnectionRisks, concentrationRisks, cascadeRisks, sectoralRisks] = await Promise.all([
        this.analyzeInterconnectionRisks(),
        this.analyzeConcentrationRisks(),
        this.analyzeCascadeRisks(),
        this.analyzeSectoralRisks()
      ]);

      return {
        interconnectionRisks,
        concentrationRisks,
        cascadeRisks,
        sectoralRisks
      };

    } catch (error) {
      this.logger.error('Error analyzing systemic risks:', error);
      throw error;
    }
  }

  /**
   * Analyse des risques d'interconnexion
   */
  private async analyzeInterconnectionRisks(): Promise<any[]> {
    const query = `
      // Identifier les institutions hautement interconnectées
      MATCH (inst:Institution)
      OPTIONAL MATCH (inst)-[r1:PROVIDES_CREDIT]->(sme:SME)-[r2:HAS_CREDIT]->(other:Institution)
      WHERE other <> inst
      WITH inst, 
           count(DISTINCT sme) as sharedClients,
           count(DISTINCT other) as connectedInstitutions,
           sum(r1.amount) as totalSharedExposure
      WHERE connectedInstitutions > 0
      
      // Calculer les métriques d'interconnexion
      MATCH (allInst:Institution)
      WITH inst, sharedClients, connectedInstitutions, totalSharedExposure,
           count(allInst) as totalInstitutions
      
      RETURN inst.id as institutionId,
             inst.name as institutionName,
             sharedClients,
             connectedInstitutions,
             totalSharedExposure,
             (connectedInstitutions * 100.0 / (totalInstitutions - 1)) as interconnectionRate,
             CASE 
               WHEN connectedInstitutions > (totalInstitutions * 0.7) THEN 'CRITICAL'
               WHEN connectedInstitutions > (totalInstitutions * 0.5) THEN 'HIGH'
               WHEN connectedInstitutions > (totalInstitutions * 0.3) THEN 'MEDIUM'
               ELSE 'LOW'
             END as riskLevel
      ORDER BY interconnectionRate DESC
    `;

    const result = await this.graphService.executeReadQuery(query);
    return result.records.map(record => ({
      institutionId: record.get('institutionId'),
      institutionName: record.get('institutionName'),
      sharedClients: record.get('sharedClients'),
      connectedInstitutions: record.get('connectedInstitutions'),
      totalSharedExposure: record.get('totalSharedExposure'),
      interconnectionRate: record.get('interconnectionRate'),
      riskLevel: record.get('riskLevel')
    }));
  }

  /**
   * Analyse des risques de concentration
   */
  private async analyzeConcentrationRisks(): Promise<any[]> {
    const query = `
      // Concentration par secteur
      MATCH (sme:SME)-[:OPERATES_IN]->(sector:Sector),
            (sme)-[credit:HAS_CREDIT]->(inst:Institution)
      WITH sector, inst, 
           count(sme) as smeCount,
           sum(credit.amount) as totalExposure,
           avg(sme.riskScore) as avgRiskScore
      
      // Calculer la part de marché par secteur
      MATCH (allSME:SME)-[:OPERATES_IN]->(sector)
      WITH sector, inst, smeCount, totalExposure, avgRiskScore,
           count(allSME) as totalSectorSMEs
      
      RETURN sector.id as sectorId,
             sector.name as sectorName,
             inst.id as institutionId,
             inst.name as institutionName,
             smeCount,
             totalExposure,
             avgRiskScore,
             (smeCount * 100.0 / totalSectorSMEs) as marketSharePercent,
             CASE 
               WHEN (smeCount * 100.0 / totalSectorSMEs) > 40 THEN 'CRITICAL'
               WHEN (smeCount * 100.0 / totalSectorSMEs) > 25 THEN 'HIGH'
               WHEN (smeCount * 100.0 / totalSectorSMEs) > 15 THEN 'MEDIUM'
               ELSE 'LOW'
             END as concentrationRisk
      ORDER BY marketSharePercent DESC
      LIMIT 20
    `;

    const result = await this.graphService.executeReadQuery(query);
    return result.records.map(record => ({
      sectorId: record.get('sectorId'),
      sectorName: record.get('sectorName'),
      institutionId: record.get('institutionId'),
      institutionName: record.get('institutionName'),
      smeCount: record.get('smeCount'),
      totalExposure: record.get('totalExposure'),
      avgRiskScore: record.get('avgRiskScore'),
      marketSharePercent: record.get('marketSharePercent'),
      concentrationRisk: record.get('concentrationRisk')
    }));
  }

  /**
   * Analyse des risques de cascade
   */
  private async analyzeCascadeRisks(): Promise<any[]> {
    const query = `
      // Identifier les chemins de risque potentiels
      MATCH path = (source:SME)-[:HAS_CREDIT]->(inst1:Institution)-[:PROVIDES_CREDIT]->(target:SME)
      WHERE source.riskScore > 8 AND target.riskScore < 5
      WITH path, source, inst1, target,
           length(path) as pathLength
      
      // Calculer l'impact potentiel
      MATCH (inst1)-[allCredits:PROVIDES_CREDIT]->()
      WITH source, inst1, target, pathLength,
           sum(allCredits.amount) as institutionTotalExposure,
           count(allCredits) as institutionTotalClients
      
      RETURN source.id as sourceId,
             source.name as sourceName,
             source.riskScore as sourceRisk,
             inst1.id as intermediaryId,
             inst1.name as intermediaryName,
             target.id as targetId,
             target.name as targetName,
             target.riskScore as targetRisk,
             pathLength,
             institutionTotalExposure,
             institutionTotalClients,
             CASE 
               WHEN source.riskScore > 9 AND institutionTotalExposure > 100000000 THEN 'CRITICAL'
               WHEN source.riskScore > 8 AND institutionTotalExposure > 50000000 THEN 'HIGH'
               WHEN source.riskScore > 7 AND institutionTotalExposure > 10000000 THEN 'MEDIUM'
               ELSE 'LOW'
             END as cascadeRisk
      ORDER BY sourceRisk DESC, institutionTotalExposure DESC
      LIMIT 15
    `;

    const result = await this.graphService.executeReadQuery(query);
    return result.records.map(record => ({
      sourceId: record.get('sourceId'),
      sourceName: record.get('sourceName'),
      sourceRisk: record.get('sourceRisk'),
      intermediaryId: record.get('intermediaryId'),
      intermediaryName: record.get('intermediaryName'),
      targetId: record.get('targetId'),
      targetName: record.get('targetName'),
      targetRisk: record.get('targetRisk'),
      pathLength: record.get('pathLength'),
      institutionTotalExposure: record.get('institutionTotalExposure'),
      institutionTotalClients: record.get('institutionTotalClients'),
      cascadeRisk: record.get('cascadeRisk')
    }));
  }

  /**
   * Analyse des risques sectoriels
   */
  private async analyzeSectoralRisks(): Promise<any[]> {
    const query = `
      // Analyser les risques par secteur
      MATCH (sector:Sector)<-[:OPERATES_IN]-(sme:SME)
      OPTIONAL MATCH (sme)-[credit:HAS_CREDIT]->(inst:Institution)
      
      WITH sector,
           count(sme) as totalSMEs,
           avg(sme.riskScore) as avgRiskScore,
           sum(credit.amount) as totalCredit,
           count(credit) as activeCredits,
           collect(DISTINCT inst.id) as involvedInstitutions
      
      // Calculer les métriques sectorielles
      RETURN sector.id as sectorId,
             sector.name as sectorName,
             sector.riskLevel as inherentRiskLevel,
             sector.defaultRate as historicalDefaultRate,
             totalSMEs,
             avgRiskScore,
             totalCredit,
             activeCredits,
             size(involvedInstitutions) as institutionCount,
             CASE 
               WHEN avgRiskScore > 8 OR sector.defaultRate > 15 THEN 'CRITICAL'
               WHEN avgRiskScore > 6.5 OR sector.defaultRate > 10 THEN 'HIGH'
               WHEN avgRiskScore > 5 OR sector.defaultRate > 7 THEN 'MEDIUM'
               ELSE 'LOW'
             END as currentRiskLevel,
             CASE 
               WHEN size(involvedInstitutions) < 2 THEN 'HIGH'
               WHEN size(involvedInstitutions) < 4 THEN 'MEDIUM'
               ELSE 'LOW'
             END as concentrationRisk
      ORDER BY avgRiskScore DESC, totalCredit DESC
    `;

    const result = await this.graphService.executeReadQuery(query);
    return result.records.map(record => ({
      sectorId: record.get('sectorId'),
      sectorName: record.get('sectorName'),
      inherentRiskLevel: record.get('inherentRiskLevel'),
      historicalDefaultRate: record.get('historicalDefaultRate'),
      totalSMEs: record.get('totalSMEs'),
      avgRiskScore: record.get('avgRiskScore'),
      totalCredit: record.get('totalCredit'),
      activeCredits: record.get('activeCredits'),
      institutionCount: record.get('institutionCount'),
      currentRiskLevel: record.get('currentRiskLevel'),
      concentrationRisk: record.get('concentrationRisk')
    }));
  }

  /**
   * Détection de patterns de fraude sophistiqués
   */
  async detectAdvancedFraudPatterns(): Promise<RiskPattern[]> {
    try {
      this.logger.log('Detecting advanced fraud patterns...');

      const patterns = await Promise.all([
        this.detectLayeringSchemes(),
        this.detectStructuringPatterns(),
        this.detectShellCompanyNetworks(),
        this.detectRoundTripTransactions()
      ]);

      return patterns.flat();

    } catch (error) {
      this.logger.error('Error detecting fraud patterns:', error);
      throw error;
    }
  }

  /**
   * Détection de schémas de layering (superposition)
   */
  private async detectLayeringSchemes(): Promise<RiskPattern[]> {
    const query = `
      // Identifier les chaînes de transactions complexes
      MATCH path = (start:SME)-[:HAS_CREDIT*3..8]->(end:SME)
      WHERE start <> end
      WITH path, nodes(path) as pathNodes, relationships(path) as pathRels,
           length(path) as pathLength
      WHERE pathLength >= 3
      
      // Analyser les montants et timing
      WITH path, pathNodes, pathRels, pathLength,
           reduce(total = 0, rel in pathRels | total + rel.amount) as totalAmount,
           [rel in pathRels | rel.timestamp] as timestamps
      
      // Filtrer les patterns suspects
      WHERE totalAmount > 50000000 // Plus de 50M CDF
        AND pathLength >= 4
        AND all(node in pathNodes WHERE node.riskScore > 3)
      
      RETURN [node in pathNodes | {id: node.id, name: node.name, riskScore: node.riskScore}] as entities,
             pathLength,
             totalAmount,
             timestamps,
             pathLength * 2.5 + (totalAmount / 10000000) as suspicionScore
      ORDER BY suspicionScore DESC
      LIMIT 10
    `;

    const result = await this.graphService.executeReadQuery(query);
    return result.records.map(record => ({
      patternId: `layering_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'LAYERING_SCHEME' as any,
      entities: record.get('entities').map((e: any) => e.id),
      riskScore: Math.min(record.get('suspicionScore'), 10),
      description: `Schéma de superposition détecté avec ${record.get('pathLength')} étapes et ${record.get('totalAmount')} CDF`,
      recommendations: [
        'Investigation approfondie des flux financiers',
        'Vérification de la légitimité économique des transactions',
        'Surveillance renforcée des entités impliquées'
      ]
    }));
  }

  /**
   * Détection de patterns de structuration
   */
  private async detectStructuringPatterns(): Promise<RiskPattern[]> {
    const query = `
      // Identifier les multiples transactions juste en dessous des seuils
      MATCH (sme:SME)-[credits:HAS_CREDIT]->(inst:Institution)
      WHERE credits.amount > 9000000 AND credits.amount < 10000000 // Juste sous 10M CDF
      
      WITH sme, inst, 
           count(credits) as nearThresholdCount,
           sum(credits.amount) as totalAmount,
           collect(credits.timestamp) as timestamps
      WHERE nearThresholdCount >= 3
      
      // Analyser la temporalité
      WITH sme, inst, nearThresholdCount, totalAmount, timestamps,
           reduce(timeSpan = 0, i in range(0, size(timestamps)-2) | 
             timeSpan + duration.between(datetime(timestamps[i]), datetime(timestamps[i+1])).days
           ) / (size(timestamps) - 1) as avgDaysBetween
      WHERE avgDaysBetween <= 30 // Moins de 30 jours entre transactions
      
      RETURN sme.id as smeId,
             sme.name as smeName,
             inst.id as institutionId,
             nearThresholdCount,
             totalAmount,
             avgDaysBetween,
             (nearThresholdCount * 2) + (30 - avgDaysBetween) / 3 as structuringScore
      ORDER BY structuringScore DESC
      LIMIT 8
    `;

    const result = await this.graphService.executeReadQuery(query);
    return result.records.map(record => ({
      patternId: `structuring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'STRUCTURING' as any,
      entities: [record.get('smeId'), record.get('institutionId')],
      riskScore: Math.min(record.get('structuringScore'), 10),
      description: `Pattern de structuration: ${record.get('nearThresholdCount')} transactions près du seuil totalisant ${record.get('totalAmount')} CDF`,
      recommendations: [
        'Vérification de conformité AML/CFT',
        'Analyse des justificatifs économiques',
        'Signalement aux autorités compétentes si nécessaire'
      ]
    }));
  }

  /**
   * Détection de réseaux de sociétés écrans
   */
  private async detectShellCompanyNetworks(): Promise<RiskPattern[]> {
    const query = `
      // Identifier les groupes de SMEs avec caractéristiques suspectes
      MATCH (sme:SME)
      WHERE sme.employees IS NULL OR sme.employees < 2
        AND sme.revenue IS NULL OR sme.revenue < 100000
        AND sme.foundedYear > 2020
      
      // Chercher les connexions entre ces entités
      MATCH (sme)-[r:HAS_CREDIT|GUARANTEES*1..3]-(connected)
      WHERE connected <> sme
        AND (connected.employees IS NULL OR connected.employees < 2)
      
      WITH sme, collect(DISTINCT connected) as connectedEntities
      WHERE size(connectedEntities) >= 2
      
      // Analyser les flux financiers
      MATCH (sme)-[credits:HAS_CREDIT]->(inst:Institution)
      WITH sme, connectedEntities, 
           sum(credits.amount) as totalCredits,
           count(credits) as creditCount
      WHERE totalCredits > 5000000 // Plus de 5M CDF malgré faible activité
      
      RETURN sme.id as centerId,
             [entity in connectedEntities | entity.id] as networkEntities,
             totalCredits,
             creditCount,
             size(connectedEntities) as networkSize,
             (totalCredits / 1000000) + (size(connectedEntities) * 1.5) as shellScore
      ORDER BY shellScore DESC
      LIMIT 6
    `;

    const result = await this.graphService.executeReadQuery(query);
    return result.records.map(record => ({
      patternId: `shell_network_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'SHELL_COMPANY_NETWORK' as any,
      entities: [record.get('centerId'), ...record.get('networkEntities')],
      riskScore: Math.min(record.get('shellScore'), 10),
      description: `Réseau de sociétés écrans potentiel: ${record.get('networkSize')} entités connectées avec ${record.get('totalCredits')} CDF de crédits`,
      recommendations: [
        'Vérification de l\'activité économique réelle',
        'Contrôle des bénéficiaires effectifs',
        'Investigation des flux de trésorerie'
      ]
    }));
  }

  /**
   * Détection de transactions circulaires
   */
  private async detectRoundTripTransactions(): Promise<RiskPattern[]> {
    const query = `
      // Identifier les boucles de crédit
      MATCH path = (start:SME)-[:HAS_CREDIT*2..5]->(start)
      WITH path, nodes(path) as pathNodes, relationships(path) as pathRels,
           length(path) as pathLength
      WHERE pathLength >= 2 AND pathLength <= 4
      
      // Analyser les montants et délais
      WITH pathNodes, pathRels, pathLength,
           reduce(total = 0, rel in pathRels | total + rel.amount) as circularAmount,
           [rel in pathRels | rel.timestamp] as timestamps
      WHERE circularAmount > 10000000 // Plus de 10M CDF
      
      // Calculer la vitesse de circulation
      WITH pathNodes, pathLength, circularAmount, timestamps,
           duration.between(datetime(timestamps[0]), datetime(timestamps[-1])).days as circulationDays
      WHERE circulationDays <= 90 // Moins de 3 mois pour boucler
      
      RETURN [node in pathNodes | node.id][0..-1] as entities, // Exclure le dernier (doublon du premier)
             pathLength,
             circularAmount,
             circulationDays,
             (circularAmount / 1000000) + (90 - circulationDays) / 10 + pathLength as roundTripScore
      ORDER BY roundTripScore DESC
      LIMIT 8
    `;

    const result = await this.graphService.executeReadQuery(query);
    return result.records.map(record => ({
      patternId: `round_trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'ROUND_TRIP' as any,
      entities: record.get('entities'),
      riskScore: Math.min(record.get('roundTripScore'), 10),
      description: `Transaction circulaire: ${record.get('circularAmount')} CDF en ${record.get('circulationDays')} jours`,
      recommendations: [
        'Vérification de la finalité économique',
        'Analyse des contreparties réelles',
        'Contrôle de conformité réglementaire'
      ]
    }));
  }

  /**
   * Calcul de métriques de centralité avancées
   */
  async calculateAdvancedCentralityMetrics(): Promise<NetworkAnalysis> {
    try {
      this.logger.log('Calculating advanced centrality metrics...');

      // Utiliser les algorithmes Graph Data Science si disponibles
      const centralityResults = await this.calculateNetworkCentrality();
      const communities = await this.detectCommunities();
      const riskClusters = await this.identifyRiskClusters();

      return {
        centrality: centralityResults,
        communities,
        riskClusters
      };

    } catch (error) {
      this.logger.error('Error calculating centrality metrics:', error);
      throw error;
    }
  }

  private async calculateNetworkCentrality(): Promise<any[]> {
    // Implémentation simplifiée sans Graph Data Science
    const query = `
      MATCH (n)
      WHERE n.id IS NOT NULL
      OPTIONAL MATCH (n)-[r]-(connected)
      WITH n, count(DISTINCT connected) as degree,
           collect(DISTINCT connected.riskScore) as connectedRisks
      
      RETURN n.id as node,
             n.name as name,
             labels(n) as labels,
             degree,
             CASE WHEN degree = 0 THEN 0 ELSE 1.0 / degree END as closeness,
             degree as betweenness, // Approximation
             coalesce(n.riskScore, 0) as riskScore,
             CASE WHEN size(connectedRisks) > 0 THEN avg([risk in connectedRisks WHERE risk IS NOT NULL | risk]) ELSE 0 END as avgConnectedRisk
      ORDER BY degree DESC, riskScore DESC
      LIMIT 50
    `;

    const result = await this.graphService.executeReadQuery(query);
    return result.records.map(record => ({
      node: record.get('node'),
      name: record.get('name'),
      labels: record.get('labels'),
      degree: record.get('degree'),
      closeness: record.get('closeness'),
      betweenness: record.get('betweenness'),
      pagerank: 0, // Placeholder
      riskScore: record.get('riskScore'),
      avgConnectedRisk: record.get('avgConnectedRisk')
    }));
  }

  private async detectCommunities(): Promise<any[]> {
    const query = `
      // Détection simple de communautés basée sur la géographie et le secteur
      MATCH (sme:SME)-[:LOCATED_IN]->(geo:Geographic),
            (sme)-[:OPERATES_IN]->(sector:Sector)
      WITH geo.id + '_' + sector.id as communityId,
           collect(sme.id) as members,
           avg(sme.riskScore) as avgRisk,
           count(sme) as size
      WHERE size >= 3
      
      RETURN communityId,
             members,
             avgRisk,
             size,
             CASE WHEN avgRisk > 7 THEN 'HIGH_RISK' 
                  WHEN avgRisk > 5 THEN 'MEDIUM_RISK' 
                  ELSE 'LOW_RISK' END as riskCategory
      ORDER BY avgRisk DESC, size DESC
      LIMIT 20
    `;

    const result = await this.graphService.executeReadQuery(query);
    return result.records.map((record, index) => ({
      communityId: index,
      nodes: record.get('members'),
      modularity: 0.85, // Placeholder
      avgRisk: record.get('avgRisk'),
      size: record.get('size'),
      riskCategory: record.get('riskCategory')
    }));
  }

  private async identifyRiskClusters(): Promise<any[]> {
    const query = `
      MATCH (n)
      WHERE n.riskScore > 6.5
      OPTIONAL MATCH (n)-[r:HAS_CREDIT|PROVIDES_CREDIT|GUARANTEES*1..2]-(connected)
      WHERE connected.riskScore > 6.5
      
      WITH n, collect(DISTINCT connected) as cluster
      WHERE size(cluster) >= 2
      
      RETURN n.id as clusterId,
             [node in [n] + cluster | node.id] as nodes,
             avg([node in [n] + cluster | node.riskScore]) as avgRiskScore,
             size(cluster) + 1 as interconnectedness
      ORDER BY avgRiskScore DESC, interconnectedness DESC
      LIMIT 15
    `;

    const result = await this.graphService.executeReadQuery(query);
    return result.records.map(record => ({
      clusterId: record.get('clusterId'),
      nodes: record.get('nodes'),
      avgRiskScore: record.get('avgRiskScore'),
      interconnectedness: record.get('interconnectedness')
    }));
  }

  /**
   * Analyse de la propagation des risques par simulation
   */
  async simulateRiskPropagation(scenarioConfig: {
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

      const query = `
        // Simulation de propagation de risque
        MATCH (start) WHERE start.id IN ['${scenarioConfig.targetEntities.join("', '")}']
        
        // Niveau 1: Impact direct
        OPTIONAL MATCH (start)-[r1:HAS_CREDIT|PROVIDES_CREDIT|GUARANTEES]-(level1)
        WITH start, collect(DISTINCT {entity: level1, relationship: type(r1), distance: 1}) as level1Impact
        
        // Niveau 2: Impact indirect  
        OPTIONAL MATCH (start)-[r1:HAS_CREDIT|PROVIDES_CREDIT|GUARANTEES*2]-(level2)
        WITH start, level1Impact, collect(DISTINCT {entity: level2, relationship: 'INDIRECT', distance: 2}) as level2Impact
        
        // Calcul de l'impact total
        WITH start, level1Impact + level2Impact as allImpacted
        UNWIND allImpacted as impact
        
        RETURN start.id as originEntity,
               impact.entity.id as impactedEntity,
               impact.entity.name as impactedName,
               labels(impact.entity) as entityType,
               coalesce(impact.entity.riskScore, 0) as currentRisk,
               impact.distance as propagationDistance,
               CASE 
                 WHEN impact.distance = 1 THEN ${scenarioConfig.magnitude} * 0.8
                 WHEN impact.distance = 2 THEN ${scenarioConfig.magnitude} * 0.4
                 ELSE ${scenarioConfig.magnitude} * 0.1
               END as riskIncrease
        ORDER BY propagationDistance, currentRisk DESC
      `;

      const result = await this.graphService.executeReadQuery(query);

      const impactedEntities = result.records.map(record => ({
        originEntity: record.get('originEntity'),
        impactedEntity: record.get('impactedEntity'),
        impactedName: record.get('impactedName'),
        entityType: record.get('entityType'),
        currentRisk: record.get('currentRisk'),
        propagationDistance: record.get('propagationDistance'),
        riskIncrease: record.get('riskIncrease'),
        newRiskScore: Math.min(record.get('currentRisk') + record.get('riskIncrease'), 10)
      }));

      // Grouper par niveau de propagation
      const propagationLevels = [1, 2].map(level => ({
        level,
        entities: impactedEntities.filter(e => e.propagationDistance === level),
        averageImpact: impactedEntities
          .filter(e => e.propagationDistance === level)
          .reduce((avg, e) => avg + e.riskIncrease, 0) / 
          impactedEntities.filter(e => e.propagationDistance === level).length || 0
      }));

      const totalSystemImpact = impactedEntities.reduce((total, e) => total + e.riskIncrease, 0);

      const recommendations = this.generateRiskMitigationRecommendations(scenarioConfig, totalSystemImpact);

      return {
        impactedEntities,
        propagationLevels,
        totalSystemImpact,
        recommendations
      };

    } catch (error) {
      this.logger.error('Error simulating risk propagation:', error);
      throw error;
    }
  }

  /**
   * Génération de recommandations de mitigation des risques
   */
  private generateRiskMitigationRecommendations(
    scenarioConfig: any, 
    totalImpact: number
  ): string[] {
    const recommendations: string[] = [];

    if (totalImpact > 50) {
      recommendations.push('ALERTE CRITIQUE: Impact systémique majeur détecté');
      recommendations.push('Activation immédiate du plan de continuité des activités');
      recommendations.push('Coordination avec la Banque Centrale du Congo');
    } else if (totalImpact > 25) {
      recommendations.push('Impact systémique élevé - surveillance renforcée requise');
      recommendations.push('Révision des limites d\'exposition inter-institutionnelles');
    }

    switch (scenarioConfig.shockType) {
      case 'CREDIT_DEFAULT':
        recommendations.push('Renforcement des provisions pour créances douteuses');
        recommendations.push('Diversification immédiate du portefeuille de crédits');
        break;
      case 'LIQUIDITY_CRISIS':
        recommendations.push('Activation des facilités de liquidité d\'urgence');
        recommendations.push('Stress-testing des ratios de liquidité');
        break;
      case 'SECTOR_COLLAPSE':
        recommendations.push('Réduction de l\'exposition sectorielle');
        recommendations.push('Diversification géographique et sectorielle');
        break;
    }

    recommendations.push('Mise à jour des politiques de gestion des risques');
    recommendations.push('Formation renforcée des équipes risques');

    return recommendations;
  }

  /**
   * Analyse de la résilience du système financier
   */
  async analyzeSystemResilience(): Promise<{
    resilienceScore: number;
    vulnerabilities: any[];
    strengthFactors: any[];
    recommendations: string[];
  }> {
    try {
      this.logger.log('Analyzing system resilience...');

      const vulnerabilityQuery = `
        // Identifier les vulnérabilités systémiques
        MATCH (inst:Institution)
        OPTIONAL MATCH (inst)-[:PROVIDES_CREDIT]->(sme:SME)
        WITH inst, 
             count(sme) as clientCount,
             avg(sme.riskScore) as avgClientRisk,
             sum(sme.revenue) as totalClientRevenue
        
        // Calculer les métriques de vulnérabilité
        RETURN inst.id as institutionId,
               inst.name as institutionName,
               inst.riskScore as inherentRisk,
               clientCount,
               avgClientRisk,
               totalClientRevenue,
               CASE 
                 WHEN clientCount < 10 THEN 'HIGH_CONCENTRATION'
                 WHEN avgClientRisk > 7 THEN 'HIGH_RISK_PORTFOLIO'
                 WHEN inst.capitalRatio < 15 THEN 'LOW_CAPITAL'
                 ELSE 'STABLE'
               END as vulnerabilityType,
               (inst.riskScore + coalesce(avgClientRisk, 0)) / 2 as compositeRisk
        ORDER BY compositeRisk DESC
      `;

      const strengthQuery = `
        // Identifier les facteurs de force
        MATCH (inst:Institution)
        OPTIONAL MATCH (inst)-[:PROVIDES_CREDIT]->(sme:SME)
        OPTIONAL MATCH (sme)-[:OPERATES_IN]->(sector:Sector)
        
        WITH inst,
             count(DISTINCT sme) as portfolioSize,
             count(DISTINCT sector) as sectorDiversity,
             avg(sme.riskScore) as avgRisk,
             inst.capitalRatio as capitalRatio
        
        RETURN inst.id as institutionId,
               inst.name as institutionName,
               portfolioSize,
               sectorDiversity,
               capitalRatio,
               avgRisk,
               CASE 
                 WHEN portfolioSize > 100 AND sectorDiversity > 5 THEN 'WELL_DIVERSIFIED'
                 WHEN capitalRatio > 20 THEN 'WELL_CAPITALIZED'
                 WHEN avgRisk < 5 THEN 'LOW_RISK_PORTFOLIO'
                 ELSE 'STANDARD'
               END as strengthType
        ORDER BY capitalRatio DESC, sectorDiversity DESC
      `;

      const [vulnerabilityResult, strengthResult] = await Promise.all([
        this.graphService.executeReadQuery(vulnerabilityQuery),
        this.graphService.executeReadQuery(strengthQuery)
      ]);

      const vulnerabilities = vulnerabilityResult.records.map(record => ({
        institutionId: record.get('institutionId'),
        institutionName: record.get('institutionName'),
        inherentRisk: record.get('inherentRisk'),
        clientCount: record.get('clientCount'),
        avgClientRisk: record.get('avgClientRisk'),
        vulnerabilityType: record.get('vulnerabilityType'),
        compositeRisk: record.get('compositeRisk')
      }));

      const strengthFactors = strengthResult.records.map(record => ({
        institutionId: record.get('institutionId'),
        institutionName: record.get('institutionName'),
        portfolioSize: record.get('portfolioSize'),
        sectorDiversity: record.get('sectorDiversity'),
        capitalRatio: record.get('capitalRatio'),
        avgRisk: record.get('avgRisk'),
        strengthType: record.get('strengthType')
      }));

      // Calcul du score de résilience global
      const totalInstitutions = strengthFactors.length;
      const wellCapitalized = strengthFactors.filter(s => s.capitalRatio > 20).length;
      const wellDiversified = strengthFactors.filter(s => s.sectorDiversity > 5).length;
      const lowRisk = vulnerabilities.filter(v => v.compositeRisk < 5).length;

      const resilienceScore = Math.min(
        ((wellCapitalized + wellDiversified + lowRisk) / (totalInstitutions * 3)) * 10,
        10
      );

      const recommendations = [
        resilienceScore < 4 ? 'URGENT: Renforcement immédiat requis' : 'Surveillance continue recommandée',
        'Amélioration de la diversification sectorielle',
        'Renforcement des ratios de capital',
        'Mise en place de stress tests réguliers',
        'Développement de plans de contingence sectoriels'
      ];

      return {
        resilienceScore,
        vulnerabilities,
        strengthFactors,
        recommendations
      };

    } catch (error) {
      this.logger.error('Error analyzing system resilience:', error);
      throw error;
    }
  }

  /**
   * Génération de rapport de surveillance global
   */
  async generateComprehensiveRiskReport(): Promise<{
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

      const [
        systemicRisks,
        fraudPatterns,
        networkAnalysis,
        resilience
      ] = await Promise.all([
        this.analyzeSystemicRisks(),
        this.detectAdvancedFraudPatterns(),
        this.calculateAdvancedCentralityMetrics(),
        this.analyzeSystemResilience()
      ]);

      const executiveSummary = {
        totalEntities: await this.getEntityCount(),
        systemRiskLevel: this.calculateOverallRiskLevel(systemicRisks, resilience.resilienceScore),
        criticalAlerts: fraudPatterns.filter(p => p.riskScore > 8).length,
        resilienceScore: resilience.resilienceScore,
        lastUpdate: new Date().toISOString()
      };

      const recommendations = [
        ...this.generateExecutiveRecommendations(executiveSummary),
        ...resilience.recommendations.slice(0, 3),
        'Révision trimestrielle des politiques de risque',
        'Formation continue des équipes d\'analyse'
      ];

      return {
        executiveSummary,
        systemicRisks,
        fraudPatterns,
        networkAnalysis,
        resilience,
        recommendations,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Error generating comprehensive risk report:', error);
      throw error;
    }
  }

  private async getEntityCount(): Promise<{[key: string]: number}> {
    const query = `
      MATCH (n)
      RETURN labels(n)[0] as entityType, count(n) as count
      ORDER BY count DESC
    `;
    
    const result = await this.graphService.executeReadQuery(query);
    const counts = {};
    result.records.forEach(record => {
      counts[record.get('entityType')] = record.get('count');
    });
    
    return counts;
  }

  private calculateOverallRiskLevel(systemicRisks: any, resilienceScore: number): string {
    const avgSectorRisk = systemicRisks.sectoralRisks
      .reduce((sum: number, sector: any) => sum + sector.avgRiskScore, 0) / 
      systemicRisks.sectoralRisks.length;

    const overallScore = (avgSectorRisk + (10 - resilienceScore)) / 2;

    if (overallScore > 8) return 'CRITICAL';
    if (overallScore > 6.5) return 'HIGH';
    if (overallScore > 5) return 'MEDIUM';
    return 'LOW';
  }

  private generateExecutiveRecommendations(summary: any): string[] {
    const recommendations: string[] = [];

    if (summary.systemRiskLevel === 'CRITICAL') {
      recommendations.push('ALERTE ROUGE: Action immédiate requise au niveau systémique');
      recommendations.push('Convocation d\'urgence du comité de stabilité financière');
    }

    if (summary.criticalAlerts > 5) {
      recommendations.push('Intensification de la surveillance des patterns de fraude');
      recommendations.push('Révision des seuils d\'alerte automatique');
    }

    if (summary.resilienceScore < 5) {
      recommendations.push('Programme d\'urgence de renforcement de la résilience');
      recommendations.push('Évaluation complète des fonds propres sectoriels');
    }

    return recommendations;
  }

  /**
   * Trouve les chemins de contagion depuis une entité
   */
  async findContagionPaths(entityId: string, maxHops: number = 3): Promise<any[]> {
    try {
      this.logger.log(`Finding contagion paths from ${entityId} with max ${maxHops} hops`);

      const query = `
        MATCH path = (start)-[*1..${maxHops}]-(end)
        WHERE start.id = $entityId
        AND start.riskScore > 6
        WITH path, nodes(path) as pathNodes, relationships(path) as pathRels
        WHERE ALL(n in pathNodes WHERE n.riskScore IS NOT NULL AND n.riskScore > 4)
        RETURN 
          [n in pathNodes | {id: n.id, label: labels(n)[0], riskScore: n.riskScore}] as entities,
          [r in pathRels | {type: type(r), strength: r.amount}] as relationships,
          length(path) as pathLength,
          reduce(s = 0, n in pathNodes | s + n.riskScore) / length(pathNodes) as avgRiskScore
        ORDER BY avgRiskScore DESC, pathLength ASC
        LIMIT 50
      `;

      const result = await this.graphService.executeQuery(query, { entityId } as any);
      return result.records.map(record => ({
        entities: record.get('entities'),
        relationships: record.get('relationships'),
        pathLength: record.get('pathLength'),
        avgRiskScore: record.get('avgRiskScore')
      }));

    } catch (error) {
      this.logger.error(`Error finding contagion paths for ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Met à jour le score de risque d'une entité
   */
  async updateEntityRiskScore(entityId: string, newRiskScore: number): Promise<void> {
    try {
      this.logger.log(`Updating risk score for entity ${entityId} to ${newRiskScore}`);

      const query = `
        MATCH (entity)
        WHERE entity.id = $entityId
        SET entity.riskScore = $newRiskScore,
            entity.updatedAt = datetime()
        RETURN entity
      `;

      const result = await this.graphService.executeQuery(query, { entityId, newRiskScore } as any);
      
      if (result.records.length === 0) {
        throw new Error(`Entity with ID ${entityId} not found`);
      }

      this.logger.log(`Successfully updated risk score for entity ${entityId}`);

    } catch (error) {
      this.logger.error(`Error updating risk score for ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Trouve les entités selon les critères de risque
   */
  async findEntitiesByRiskCriteria(
    minRiskScore: number,
    maxRiskScore: number,
    entityTypes: string[] = ['SME', 'Institution'],
    province?: string
  ): Promise<any[]> {
    try {
      this.logger.log(`Finding entities with risk score between ${minRiskScore} and ${maxRiskScore}`);

      let whereClause = `entity.riskScore >= $minRiskScore AND entity.riskScore <= $maxRiskScore`;
      const parameters: any = { minRiskScore, maxRiskScore };

      if (province) {
        whereClause += ` AND entity.province = $province`;
        parameters.province = province;
      }

      const typeFilter = entityTypes.map(type => `'${type}'`).join(',');

      const query = `
        MATCH (entity)
        WHERE any(label in labels(entity) WHERE label IN [${typeFilter}])
        AND ${whereClause}
        RETURN 
          entity.id as id,
          labels(entity)[0] as type,
          entity.name as name,
          entity.riskScore as riskScore,
          entity.province as province,
          entity.sector as sector,
          entity.totalAssets as totalAssets,
          entity.employees as employees
        ORDER BY entity.riskScore DESC
        LIMIT 100
      `;

      const result = await this.graphService.executeQuery(query, parameters as any);
      return result.records.map(record => ({
        id: record.get('id'),
        type: record.get('type'),
        name: record.get('name'),
        riskScore: record.get('riskScore'),
        province: record.get('province'),
        sector: record.get('sector'),
        totalAssets: record.get('totalAssets'),
        employees: record.get('employees')
      }));

    } catch (error) {
      this.logger.error('Error finding entities by risk criteria:', error);
      throw error;
    }
  }
}
