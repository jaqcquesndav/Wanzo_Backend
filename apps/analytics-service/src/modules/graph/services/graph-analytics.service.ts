import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Node, NodeType } from '../entities/node.entity';
import { Edge, EdgeType } from '../entities/edge.entity';
import { Metric, MetricType } from '../../timeseries/entities/metric.entity';
import { Pattern } from '../interfaces/pattern.interface';
import { Correlation } from '../interfaces/correlation.interface';

@Injectable()
export class GraphAnalyticsService {
  private readonly logger = new Logger(GraphAnalyticsService.name);

  constructor(
    @InjectRepository(Node)
    private nodeRepository: Repository<Node>,
    @InjectRepository(Edge)
    private edgeRepository: Repository<Edge>,
    @InjectRepository(Metric)
    private metricRepository: Repository<Metric>
  ) {}

  async detectFraudPatterns(startDate: Date, endDate: Date) {
    this.logger.debug('Detecting fraud patterns...');

    // 1. Identifier les transactions suspectes
    const suspiciousTransactions = await this.findSuspiciousTransactions(startDate, endDate);

    // 2. Analyser les patterns de connexion
    const connectionPatterns = await this.analyzeConnectionPatterns(suspiciousTransactions);

    // 3. Calculer les scores de risque
    const riskScores = await this.calculateRiskScores(connectionPatterns);

    return {
      suspiciousTransactions,
      connectionPatterns,
      riskScores
    };
  }

  async analyzeMarketTrends(period: { start: Date; end: Date }) {
    this.logger.debug('Analyzing market trends...');

    // 1. Récupérer les indices de marché
    const marketIndices = await this.getMarketIndices(period);

    // 2. Analyser les corrélations
    const correlations = await this.analyzeCorrelations(marketIndices);

    // 3. Identifier les tendances
    const trends = await this.identifyTrends(marketIndices);

    return {
      marketIndices,
      correlations,
      trends
    };
  }

  async predictFinancialCrisis() {
    this.logger.debug('Predicting financial crisis...');

    // 1. Récupérer les indicateurs clés
    const indicators = await this.getKeyIndicators();

    // 2. Analyser les patterns historiques
    const historicalPatterns = await this.analyzeHistoricalPatterns();

    // 3. Calculer les probabilités
    const predictions = await this.calculateCrisisProbabilities(indicators, historicalPatterns);

    return {
      indicators,
      historicalPatterns,
      predictions
    };
  }

  private async findSuspiciousTransactions(startDate: Date, endDate: Date) {
    // Requête pour trouver les transactions avec des patterns suspects
    const transactions = await this.nodeRepository
      .createQueryBuilder('node')
      .where('node.type = :type', { type: NodeType.TRANSACTION })
      .andWhere('node.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();

    return transactions.filter(tx => this.isTransactionSuspicious(tx));
  }

  private async analyzeConnectionPatterns(transactions: Node[]): Promise<Pattern[]> {
    // Analyse des connexions entre entités pour détecter des patterns suspects
    const patterns = [] as Pattern[];
    for (const tx of transactions) {
      const connections = await this.edgeRepository
        .createQueryBuilder('edge')
        .where('edge.sourceId = :txId OR edge.targetId = :txId', { txId: tx.id })
        .getMany();

      patterns.push({
        transaction: tx,
        connections,
        riskLevel: this.calculateConnectionRiskLevel(connections)
      });
    }
    return patterns;
  }

  private async calculateRiskScores(patterns: Pattern[]) {
    // Calcul des scores de risque basé sur les patterns détectés
    return patterns.map(pattern => ({
      entityId: pattern.transaction.id,
      riskScore: this.computeRiskScore(pattern),
      factors: this.identifyRiskFactors(pattern)
    }));
  }

  identifyRiskFactors(pattern: any): any {
    throw new Error('Method not implemented.');
  }

  private async getMarketIndices(period: { start: Date; end: Date }) {
    // Récupération des indices de marché sur la période
    return await this.metricRepository.find({
      where: {
        type: MetricType.MARKET_INDEX,
        timestamp: Between(period.start, period.end)
      },
      order: { timestamp: 'ASC' }
    });
  }

  private async analyzeCorrelations(indices: Metric[]): Promise<Correlation[]> {
    // Analyse des corrélations entre différents indices
    const correlations = [] as Correlation[];
    for (let i = 0; i < indices.length; i++) {
      for (let j = i + 1; j < indices.length; j++) {
        correlations.push({
          index1: indices[i],
          index2: indices[j],
          correlation: this.calculateCorrelation(indices[i], indices[j])
        });
      }
    }
    return correlations;
  }

  private async identifyTrends(indices: Metric[]) {
    // Identification des tendances de marché
    return {
      uptrends: this.findUptrends(indices),
      downtrends: this.findDowntrends(indices),
      volatility: this.calculateVolatility(indices)
    };
  }

  private async getKeyIndicators() {
    // Récupération des indicateurs clés pour la prédiction de crise
    const [marketMetrics, riskScores, transactionVolumes] = await Promise.all([
      this.getMarketMetrics(),
      this.getRiskScores(),
      this.getTransactionVolumes()
    ]);

    return { marketMetrics, riskScores, transactionVolumes };
  }

  private async analyzeHistoricalPatterns() {
    // Analyse des patterns historiques pour identifier les précurseurs de crise
    return await this.metricRepository
      .createQueryBuilder('metric')
      .where('metric.type = :type', { type: MetricType.HISTORICAL_PATTERN })
      .getMany();
  }

  private async calculateCrisisProbabilities(indicators: any, historicalPatterns: any) {
    // Calcul des probabilités de crise basé sur les indicateurs actuels et les patterns historiques
    return {
      shortTerm: this.calculateShortTermProbability(indicators, historicalPatterns),
      mediumTerm: this.calculateMediumTermProbability(indicators, historicalPatterns),
      longTerm: this.calculateLongTermProbability(indicators, historicalPatterns)
    };
  }

  // Helper methods
  private isTransactionSuspicious(transaction: Node): boolean {
    // Logique pour déterminer si une transaction est suspecte
    // Exemple simple basé sur le montant
    return transaction.properties && 
           transaction.properties.amount && 
           transaction.properties.amount > 10000;
  }

  private calculateConnectionRiskLevel(connections: Edge[]): number {
    // Calcul du niveau de risque basé sur les connexions
    if (!connections || connections.length === 0) return 0;
    
    // Plus il y a de connexions à des entités à risque, plus le niveau de risque est élevé
    const riskyConnections = connections.filter(edge => 
      edge.properties && edge.properties.riskFactor && edge.properties.riskFactor > 0.7
    );
    
    return riskyConnections.length / connections.length;
  }

  private computeRiskScore(pattern: Pattern): number {
    // Calcul du score de risque basé sur le pattern
    // Exemple: combiner niveau de risque des connexions et caractéristiques de la transaction
    const connectionRiskFactor = pattern.riskLevel;
    const transactionRiskFactor = this.calculateTransactionRiskFactor(pattern.transaction);
    
    return (connectionRiskFactor * 0.7) + (transactionRiskFactor * 0.3);
  }

  private calculateTransactionRiskFactor(transaction: Node): number {
    // Calcul du facteur de risque basé sur les caractéristiques de la transaction
    if (!transaction.properties) return 0;
    
    let riskFactor = 0;
    
    // Facteurs de risque basés sur différentes caractéristiques
    if (transaction.properties.amount > 50000) riskFactor += 0.4;
    if (transaction.properties.frequency && transaction.properties.frequency === 'unusual') riskFactor += 0.3;
    if (transaction.properties.location && transaction.properties.location.highRisk) riskFactor += 0.2;
    if (transaction.properties.time && (transaction.properties.time < 2 || transaction.properties.time > 22)) riskFactor += 0.1;
    
    return Math.min(riskFactor, 1); // Cap at 1
  }

  private calculateCorrelation(metric1: Metric, metric2: Metric): number {
    // Calcul de la corrélation entre deux métriques
    // Implémentation simplifiée - une véritable implémentation utiliserait
    // des algorithmes statistiques comme la corrélation de Pearson
    if (!metric1.metadata?.values || !metric2.metadata?.values) return 0;
    
    // Vérifier que les deux métriques ont le même nombre de points de données
    const values1 = metric1.metadata.values;
    const values2 = metric2.metadata.values;
    
    if (values1.length !== values2.length) return 0;
    
    // Calcul simple de la corrélation (exemple très simplifié)
    let sum = 0;
    for (let i = 0; i < values1.length; i++) {
      sum += (values1[i] * values2[i]);
    }
    
    return sum / values1.length; // Valeur normalisée
  }

  private findUptrends(indices: Metric[]) {
    // Identification des tendances à la hausse
    return indices.filter(index => this.isUptrend(index));
  }

  private findDowntrends(indices: Metric[]) {
    // Identification des tendances à la baisse
    return indices.filter(index => this.isDowntrend(index));
  }

  private calculateVolatility(indices: Metric[]) {
    // Calcul de la volatilité des indices
    return indices.map(index => ({
      metricId: index.id,
      volatility: this.computeVolatility(index)
    }));
  }

  private isUptrend(metric: Metric): boolean {
    // Déterminer si une métrique est en tendance à la hausse
    if (!metric.metadata?.values || metric.metadata.values.length < 5) return false;
    
    const values = metric.metadata.values;
    let upCount = 0;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i-1]) upCount++;
    }
    
    // Si plus de 60% des changements sont à la hausse, c'est une tendance à la hausse
    return (upCount / (values.length - 1)) > 0.6;
  }

  private isDowntrend(metric: Metric): boolean {
    // Déterminer si une métrique est en tendance à la baisse
    if (!metric.metadata?.values || metric.metadata.values.length < 5) return false;
    
    const values = metric.metadata.values;
    let downCount = 0;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[i-1]) downCount++;
    }
    
    // Si plus de 60% des changements sont à la baisse, c'est une tendance à la baisse
    return (downCount / (values.length - 1)) > 0.6;
  }

  private computeVolatility(metric: Metric): number {
    // Calcul de la volatilité d'une métrique
    if (!metric.metadata?.values || metric.metadata.values.length < 2) return 0;
    
    const values = metric.metadata.values;
    let sumOfSquaredChanges = 0;
    
    for (let i = 1; i < values.length; i++) {
      const percentChange = (values[i] - values[i-1]) / values[i-1];
      sumOfSquaredChanges += percentChange * percentChange;
    }
    
    // Racine carrée de la moyenne des carrés des changements en pourcentage
    return Math.sqrt(sumOfSquaredChanges / (values.length - 1));
  }

  private async getMarketMetrics() {
    // Récupération des métriques de marché
    return await this.metricRepository
      .createQueryBuilder('metric')
      .where('metric.type = :type', { type: MetricType.MARKET })
      .getMany();
  }

  private async getRiskScores() {
    // Récupération des scores de risque récents
    // Implémentation fictive
    return [
      { entityId: 'entity1', score: 0.8 },
      { entityId: 'entity2', score: 0.4 },
      { entityId: 'entity3', score: 0.9 }
    ];
  }

  private async getTransactionVolumes() {
    // Récupération des volumes de transaction récents
    // Implémentation fictive
    return [
      { date: new Date('2023-01-01'), volume: 1250000 },
      { date: new Date('2023-01-02'), volume: 1340000 },
      { date: new Date('2023-01-03'), volume: 980000 }
    ];
  }

  private calculateShortTermProbability(indicators: any, historicalPatterns: any): number {
    // Calcul de probabilité à court terme
    return 0.35; // Implémentation fictive
  }

  private calculateMediumTermProbability(indicators: any, historicalPatterns: any): number {
    // Calcul de probabilité à moyen terme
    return 0.48; // Implémentation fictive
  }

  private calculateLongTermProbability(indicators: any, historicalPatterns: any): number {
    // Calcul de probabilité à long terme
    return 0.62; // Implémentation fictive
  }
}
