import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import { JournalService } from '../../journals/services/journal.service';
import { JournalType } from '../../journals/entities/journal.entity';
import { CompanyCreditScore, CreditScoreTrigger, CreditScoreStatus } from '../entities/company-score.entity';
import { CalculateCreditScoreDto, CreditScoreResponseDto } from '../dtos/credit-score.dto';
import { 
  StandardCreditScore, 
  DetailedCreditScore, 
  CreditScoreComponents,
  CreditScoreUtils,
  RiskLevel,
  CreditScoreClass
} from '@wanzobe/shared/interfaces/credit-score.interface';

export interface CreditScoringRequest {
  companyId: string;
  startDate: Date;
  endDate: Date;
  method: 'traditional' | 'ml' | 'hybrid';
  includeDetails?: boolean;
  forceRecalculation?: boolean;
}

export interface CreditScoringResult {
  score: StandardCreditScore;
  details?: DetailedCreditScore;
  method: string;
  metadata: {
    calculatedAt: Date;
    processingTime: number;
    dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
    confidenceLevel: number;
  };
}

@Injectable()
export class CreditScoringService {
  private readonly logger = new Logger(CreditScoringService.name);

  constructor(
    @InjectRepository(CompanyCreditScore)
    private readonly companyCreditScoreRepository: Repository<CompanyCreditScore>,
    private readonly journalService: JournalService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Point d'entrée principal pour le calcul de crédit score
   */
  async calculateCreditScore(request: CreditScoringRequest): Promise<CreditScoringResult> {
    const startTime = Date.now();
    
    this.logger.log(`Calcul crédit score pour ${request.companyId} - méthode: ${request.method}`);

    try {
      let result: CreditScoringResult;

      switch (request.method) {
        case 'traditional':
          result = await this.calculateTraditionalScore(request);
          break;
        case 'ml':
          result = await this.calculateMLScore(request);
          break;
        case 'hybrid':
          result = await this.calculateHybridScore(request);
          break;
        default:
          throw new Error(`Méthode de calcul non supportée: ${request.method}`);
      }

      // Enregistrer le résultat
      await this.saveScoreResult(request.companyId, result);

      // Calculer le temps de traitement
      result.metadata.processingTime = Date.now() - startTime;

      this.logger.log(
        `Score calculé pour ${request.companyId}: ${result.score.score}/100 (${result.score.riskLevel}) - ${result.metadata.processingTime}ms`
      );

      return result;

    } catch (error) {
      this.logger.error(`Erreur calcul score pour ${request.companyId}:`, error);
      throw error;
    }
  }

  /**
   * Calcul traditionnel basé sur les journaux comptables
   */
  private async calculateTraditionalScore(request: CreditScoringRequest): Promise<CreditScoringResult> {
    this.logger.debug(`Calcul traditionnel pour ${request.companyId}`);

    // Récupération des données comptables
    const accountingData = await this.getAccountingData(request.companyId, request.startDate, request.endDate);
    
    // Calcul des composants
    const components = this.calculateScoreComponents(accountingData);
    
    // Calcul du score final
    const finalScore = this.computeFinalScore(components);
    
    // Construction du score standard
    const standardScore: StandardCreditScore = {
      score: finalScore,
      riskLevel: CreditScoreUtils.determineRiskLevel(finalScore),
      scoreClass: CreditScoreUtils.determineScoreClass(finalScore),
      calculatedAt: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      modelVersion: 'traditional-v1.0',
      dataSource: 'accounting_journals',
      confidenceScore: this.calculateConfidenceScore(accountingData)
    };

    const result: CreditScoringResult = {
      score: standardScore,
      method: 'traditional',
      metadata: {
        calculatedAt: new Date(),
        processingTime: 0, // Sera calculé dans la méthode principale
        dataQuality: this.assessDataQuality(accountingData),
        confidenceLevel: standardScore.confidenceScore
      }
    };

    // Ajouter les détails si demandés
    if (request.includeDetails) {
      result.details = this.buildDetailedScore(standardScore, components, accountingData);
    }

    return result;
  }

  /**
   * Calcul ML/XGBoost via service externe
   */
  private async calculateMLScore(request: CreditScoringRequest): Promise<CreditScoringResult> {
    this.logger.debug(`Calcul ML pour ${request.companyId}`);

    try {
      // Préparation des données pour le modèle ML
      const mlData = await this.prepareMLData(request);
      
      // Appel au service ML/XGBoost
      const mlResult = await this.callMLService(mlData);
      
      // Construction du score standard
      const standardScore: StandardCreditScore = {
        score: Math.round(mlResult.prediction * 100),
        riskLevel: CreditScoreUtils.determineRiskLevel(Math.round(mlResult.prediction * 100)),
        scoreClass: CreditScoreUtils.determineScoreClass(Math.round(mlResult.prediction * 100)),
        calculatedAt: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        modelVersion: mlResult.modelVersion || 'xgboost-v1.2',
        dataSource: 'ml_features',
        confidenceScore: mlResult.confidence || 0.85
      };

      return {
        score: standardScore,
        method: 'ml',
        metadata: {
          calculatedAt: new Date(),
          processingTime: 0,
          dataQuality: 'good', // Basé sur la qualité des features ML
          confidenceLevel: standardScore.confidenceScore
        }
      };

    } catch (error) {
      this.logger.warn(`Échec calcul ML, utilisation méthode traditionnelle de secours`);
      return this.calculateTraditionalScore(request);
    }
  }

  /**
   * Calcul hybride combinant traditionnel et ML
   */
  private async calculateHybridScore(request: CreditScoringRequest): Promise<CreditScoringResult> {
    this.logger.debug(`Calcul hybride pour ${request.companyId}`);

    // Calcul en parallèle des deux méthodes
    const [traditionalResult, mlResult] = await Promise.allSettled([
      this.calculateTraditionalScore({ ...request, method: 'traditional' }),
      this.calculateMLScore({ ...request, method: 'ml' })
    ]);

    let hybridScore: number;
    let confidenceScore: number;
    let dataQuality: 'excellent' | 'good' | 'fair' | 'poor';

    if (traditionalResult.status === 'fulfilled' && mlResult.status === 'fulfilled') {
      // Les deux calculs ont réussi - moyenne pondérée
      const traditionalWeight = 0.4;
      const mlWeight = 0.6;
      
      hybridScore = Math.round(
        traditionalResult.value.score.score * traditionalWeight + 
        mlResult.value.score.score * mlWeight
      );
      
      confidenceScore = Math.max(
        traditionalResult.value.score.confidenceScore,
        mlResult.value.score.confidenceScore
      );
      
      dataQuality = 'excellent';
      
    } else if (traditionalResult.status === 'fulfilled') {
      // Seul le calcul traditionnel a réussi
      this.logger.warn('Calcul ML échoué, utilisation score traditionnel');
      hybridScore = traditionalResult.value.score.score;
      confidenceScore = traditionalResult.value.score.confidenceScore * 0.8; // Réduction confidence
      dataQuality = 'good';
      
    } else if (mlResult.status === 'fulfilled') {
      // Seul le calcul ML a réussi
      this.logger.warn('Calcul traditionnel échoué, utilisation score ML');
      hybridScore = mlResult.value.score.score;
      confidenceScore = mlResult.value.score.confidenceScore * 0.8;
      dataQuality = 'fair';
      
    } else {
      // Les deux ont échoué
      throw new Error('Échec des calculs traditionnel et ML');
    }

    const standardScore: StandardCreditScore = {
      score: hybridScore,
      riskLevel: CreditScoreUtils.determineRiskLevel(hybridScore),
      scoreClass: CreditScoreUtils.determineScoreClass(hybridScore),
      calculatedAt: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      modelVersion: 'hybrid-v1.0',
      dataSource: 'accounting_journals_ml_features',
      confidenceScore: confidenceScore
    };

    return {
      score: standardScore,
      method: 'hybrid',
      metadata: {
        calculatedAt: new Date(),
        processingTime: 0,
        dataQuality: dataQuality,
        confidenceLevel: confidenceScore
      }
    };
  }

  /**
   * Récupération des données comptables
   */
  private async getAccountingData(companyId: string, startDate: Date, endDate: Date) {
    const result = await this.journalService.findAll({
      companyId,
      startDate,
      endDate
    });

    const journals = result.journals;

    return {
      journals,
      totalTransactions: journals.length,
      periodStart: startDate,
      periodEnd: endDate,
      totalAmount: journals.reduce((sum, j) => sum + j.lines.reduce((lineSum, line) => lineSum + Math.abs(line.debit + line.credit), 0), 0),
      averageTransaction: journals.length > 0 ? 
        journals.reduce((sum, j) => sum + j.lines.reduce((lineSum, line) => lineSum + Math.abs(line.debit + line.credit), 0), 0) / journals.length : 0
    };
  }

  /**
   * Calcul des composants du score
   */
  private calculateScoreComponents(accountingData: any): CreditScoreComponents {
    const { journals, totalTransactions, totalAmount } = accountingData;

    // Analyse des flux de trésorerie
    const cashFlowQuality = this.analyzeCashFlowQuality(journals);
    
    // Stabilité de l'activité
    const businessStability = this.analyzeBusinessStability(journals);
    
    // Santé financière
    const financialHealth = this.analyzeFinancialHealth(journals);
    
    // Comportement de paiement
    const paymentBehavior = this.analyzePaymentBehavior(journals);
    
    // Tendance de croissance
    const growthTrend = this.analyzeGrowthTrend(journals);

    return {
      cashFlowQuality,
      businessStability,
      financialHealth,
      paymentBehavior,
      growthTrend
    };
  }

  /**
   * Calcul du score final
   */
  private computeFinalScore(components: CreditScoreComponents): number {
    const weights = {
      cashFlowQuality: 0.25,
      businessStability: 0.20,
      financialHealth: 0.25,
      paymentBehavior: 0.20,
      growthTrend: 0.10
    };

    const weightedScore = 
      components.cashFlowQuality * weights.cashFlowQuality +
      components.businessStability * weights.businessStability +
      components.financialHealth * weights.financialHealth +
      components.paymentBehavior * weights.paymentBehavior +
      components.growthTrend * weights.growthTrend;

    return Math.round(Math.max(1, Math.min(100, weightedScore)));
  }

  /**
   * Analyse de la qualité des flux de trésorerie
   */
  private analyzeCashFlowQuality(journals: any[]): number {
    if (journals.length === 0) return 30;

    const inflows = journals.filter(j => j.amount > 0);
    const outflows = journals.filter(j => j.amount < 0);
    
    const inflowRegularity = this.calculateRegularity(inflows);
    const outflowControl = this.calculateOutflowControl(outflows);
    const netCashFlow = inflows.reduce((sum, j) => sum + j.amount, 0) + 
                       outflows.reduce((sum, j) => sum + j.amount, 0);

    let score = 50;
    score += inflowRegularity * 0.4;
    score += outflowControl * 0.3;
    score += (netCashFlow > 0 ? 20 : -10);

    return Math.max(10, Math.min(100, score));
  }

  /**
   * Analyse de la stabilité de l'activité
   */
  private analyzeBusinessStability(journals: any[]): number {
    if (journals.length === 0) return 30;

    const monthlyActivity = this.groupByMonth(journals);
    const variability = this.calculateVariability(monthlyActivity);
    
    let score = 60;
    score -= variability * 0.5; // Moins de variabilité = plus stable
    
    return Math.max(20, Math.min(100, score));
  }

  /**
   * Analyse de la santé financière
   */
  private analyzeFinancialHealth(journals: any[]): number {
    if (journals.length === 0) return 30;

    const balanceHistory = this.calculateBalanceHistory(journals);
    const debtRatio = this.calculateDebtRatio(journals);
    const liquidityScore = this.calculateLiquidityScore(journals);

    let score = 50;
    score += (balanceHistory.trend > 0 ? 20 : -15);
    score += (debtRatio < 0.7 ? 15 : -10);
    score += liquidityScore * 0.3;

    return Math.max(15, Math.min(100, score));
  }

  /**
   * Analyse du comportement de paiement
   */
  private analyzePaymentBehavior(journals: any[]): number {
    if (journals.length === 0) return 50;

    const paymentPatterns = this.analyzePaymentPatterns(journals);
    const punctuality = this.calculatePunctuality(journals);
    
    let score = 60;
    score += punctuality * 0.4;
    score += (paymentPatterns.consistency * 0.3);

    return Math.max(25, Math.min(100, score));
  }

  /**
   * Analyse de la tendance de croissance
   */
  private analyzeGrowthTrend(journals: any[]): number {
    if (journals.length === 0) return 40;

    const monthlyRevenue = this.calculateMonthlyRevenue(journals);
    const growthRate = this.calculateGrowthRate(monthlyRevenue);
    
    let score = 50;
    score += Math.max(-30, Math.min(40, growthRate * 2));

    return Math.max(20, Math.min(100, score));
  }

  /**
   * Préparation des données pour le modèle ML
   */
  private async prepareMLData(request: CreditScoringRequest): Promise<CalculateCreditScoreDto> {
    const accountingData = await this.getAccountingData(request.companyId, request.startDate, request.endDate);
    
    // Transformation des données comptables en format ML
    return {
      companyId: request.companyId,
      startDate: request.startDate,
      endDate: request.endDate,
      // Features extraites des données comptables pour XGBoost
      monthlyTransactionVolumes: this.extractMonthlyVolumes(accountingData),
      averageBalance: accountingData.averageTransaction,
      transactionFrequency: accountingData.totalTransactions,
      cashFlowPattern: this.extractCashFlowPattern(accountingData),
      seasonalityIndex: this.calculateSeasonality(accountingData),
      businessActivityScore: this.calculateBusinessActivity(accountingData)
    } as any;
  }

  /**
   * Appel au service ML externe
   */
  private async callMLService(mlData: CalculateCreditScoreDto): Promise<any> {
    const mlServiceUrl = this.configService.get<string>('ML_SERVICE_URL', 'http://localhost:8000');
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${mlServiceUrl}/predict-credit-score`, mlData, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      return response.data;
    } catch (error) {
      this.logger.error('Erreur appel service ML:', error instanceof Error ? error.message : 'Erreur inconnue');
      throw error;
    }
  }

  /**
   * Sauvegarde du résultat de score
   */
  private async saveScoreResult(companyId: string, result: CreditScoringResult): Promise<void> {
    const existingScore = await this.companyCreditScoreRepository.findOne({
      where: { companyId }
    });

    const scoreData = {
      companyId,
      score: result.score.score,
      riskLevel: result.score.riskLevel as RiskLevel,
      scoreClass: result.score.scoreClass as CreditScoreClass,
      calculatedAt: new Date(result.score.calculatedAt),
      validUntil: new Date(result.score.validUntil),
      modelVersion: result.score.modelVersion,
      dataSource: result.score.dataSource,
      confidenceScore: result.score.confidenceScore,
      method: result.method,
      trigger: CreditScoreTrigger.API_REQUEST,
      status: CreditScoreStatus.COMPLETED
    };

    if (existingScore) {
      await this.companyCreditScoreRepository.update({ companyId }, scoreData);
    } else {
      await this.companyCreditScoreRepository.save(scoreData);
    }
  }

  /**
   * Construction du score détaillé
   */
  private buildDetailedScore(
    standardScore: StandardCreditScore,
    components: CreditScoreComponents,
    accountingData: any
  ): DetailedCreditScore {
    return {
      ...standardScore,
      components,
      explanation: this.generateExplanation(components, standardScore.score),
      recommendations: this.generateRecommendations(components),
      context: {
        companyId: standardScore.dataSource,
        analysisType: 'comprehensive'
      }
    };
  }

  // Méthodes utilitaires privées
  private calculateRegularity(transactions: any[]): number {
    // Logique de calcul de régularité
    return 70; // Placeholder
  }

  private calculateOutflowControl(outflows: any[]): number {
    // Logique de contrôle des sorties
    return 65; // Placeholder
  }

  private groupByMonth(journals: any[]): any[] {
    // Groupement par mois
    return []; // Placeholder
  }

  private calculateVariability(monthlyData: any[]): number {
    // Calcul de variabilité
    return 25; // Placeholder
  }

  private calculateBalanceHistory(journals: any[]): any {
    // Historique des soldes
    return { trend: 1 }; // Placeholder
  }

  private calculateDebtRatio(journals: any[]): number {
    // Ratio d'endettement
    return 0.3; // Placeholder
  }

  private calculateLiquidityScore(journals: any[]): number {
    // Score de liquidité
    return 70; // Placeholder
  }

  private analyzePaymentPatterns(journals: any[]): any {
    // Patterns de paiement
    return { consistency: 80 }; // Placeholder
  }

  private calculatePunctuality(journals: any[]): number {
    // Ponctualité des paiements
    return 85; // Placeholder
  }

  private calculateMonthlyRevenue(journals: any[]): number[] {
    // Revenus mensuels
    return [1000, 1100, 1200]; // Placeholder
  }

  private calculateGrowthRate(monthlyRevenue: number[]): number {
    // Taux de croissance
    return 5; // Placeholder
  }

  private extractMonthlyVolumes(accountingData: any): number[] {
    // Extraction volumes mensuels
    return [100, 110, 120]; // Placeholder
  }

  private extractCashFlowPattern(accountingData: any): string {
    // Pattern de flux de trésorerie
    return 'stable'; // Placeholder
  }

  private calculateSeasonality(accountingData: any): number {
    // Index de saisonnalité
    return 0.2; // Placeholder
  }

  private calculateBusinessActivity(accountingData: any): number {
    // Score d'activité business
    return 75; // Placeholder
  }

  private calculateConfidenceScore(accountingData: any): number {
    // Score de confiance basé sur la qualité des données
    const transactionCount = accountingData.totalTransactions;
    if (transactionCount > 100) return 0.95;
    if (transactionCount > 50) return 0.85;
    if (transactionCount > 20) return 0.75;
    return 0.65;
  }

  private assessDataQuality(accountingData: any): 'excellent' | 'good' | 'fair' | 'poor' {
    const transactionCount = accountingData.totalTransactions;
    if (transactionCount > 100) return 'excellent';
    if (transactionCount > 50) return 'good';
    if (transactionCount > 20) return 'fair';
    return 'poor';
  }

  private generateExplanation(components: CreditScoreComponents, score: number): string[] {
    const explanations: string[] = [];
    
    if (components.cashFlowQuality > 70) {
      explanations.push('Flux de trésorerie réguliers et prévisibles');
    }
    if (components.businessStability > 70) {
      explanations.push('Activité commerciale stable dans le temps');
    }
    if (components.financialHealth > 70) {
      explanations.push('Situation financière saine');
    }
    
    return explanations;
  }

  private generateRecommendations(components: CreditScoreComponents): string[] {
    const recommendations: string[] = [];
    
    if (components.cashFlowQuality < 60) {
      recommendations.push('Améliorer la régularité des flux de trésorerie');
    }
    if (components.growthTrend < 50) {
      recommendations.push('Développer des stratégies de croissance');
    }
    
    return recommendations;
  }

  private identifyRiskFactors(components: CreditScoreComponents): string[] {
    const riskFactors: string[] = [];
    
    if (components.cashFlowQuality < 40) {
      riskFactors.push('flux_tresorerie_irreguliers');
    }
    if (components.financialHealth < 40) {
      riskFactors.push('sante_financiere_fragile');
    }
    
    return riskFactors;
  }
}