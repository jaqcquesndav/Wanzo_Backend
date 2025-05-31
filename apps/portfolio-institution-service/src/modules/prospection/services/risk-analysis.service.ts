import { Injectable } from '@nestjs/common';
import { Prospect } from '../entities/prospect.entity';

interface RiskScore {
  score: number;
  category: string;
  factors: string[];
  recommendations: string[];
}

@Injectable()
export class RiskAnalysisService {
  async analyzeFinancialRisk(prospect: Prospect): Promise<RiskScore> {
    const financialMetrics = prospect.financialData.keyMetrics;
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Analyser le ratio de liquidité
    if (financialMetrics.currentRatio !== undefined && financialMetrics.currentRatio < 1.5) {
      factors.push('Low liquidity ratio');
      recommendations.push('Improve working capital management');
    }

    // Analyser le ratio d'endettement
    if (financialMetrics.debtToEquity !== undefined && financialMetrics.debtToEquity > 2) {
      factors.push('High debt level');
      recommendations.push('Consider debt restructuring');
    }

    // Calculer le score final
    const score = this.calculateRiskScore(factors.length);

    return {
      score,
      category: this.getRiskCategory(score),
      factors,
      recommendations,
    };
  }

  async analyzeOperationalRisk(prospect: Prospect): Promise<RiskScore> {
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Analyser la taille de l'entreprise
    if (prospect.employeeCount < 10) {
      factors.push('Small operational scale');
      recommendations.push('Consider operational scalability');
    }

    // Analyser l'historique
    if (prospect.financialData.historicalPerformance.length < 2) {
      factors.push('Limited operational history');
      recommendations.push('Require additional operational documentation');
    }

    // Calculer le score final
    const score = this.calculateRiskScore(factors.length);

    return {
      score,
      category: this.getRiskCategory(score),
      factors,
      recommendations,
    };
  }

  async analyzeMarketRisk(prospect: Prospect): Promise<RiskScore> {
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Analyser le secteur
    if (this.isVolatileSector(prospect.sector)) {
      factors.push('High sector volatility');
      recommendations.push('Implement sector-specific risk mitigation');
    }
/*
    // Analyser la concentration
    if (this.hasHighConcentration({ _prospect: prospect })) {
      factors.push('High market concentration');
      recommendations.push('Diversify market presence');
    } */

    // Calculer le score final
    const score = this.calculateRiskScore(factors.length);

    return {
      score,
      category: this.getRiskCategory(score),
      factors,
      recommendations,
    };
  }
  hasHighConcentration() {
    throw new Error('Method not implemented.');
  }

  private calculateRiskScore(factorsCount: number): number {
    const baseScore = 100;
    const deductionPerFactor = 15;
    return Math.max(0, Math.min(100, baseScore - (factorsCount * deductionPerFactor)));
  }

  private getRiskCategory(score: number): string {
    if (score >= 80) return 'low';
    if (score >= 60) return 'moderate';
    return 'high';
  }

  private isVolatileSector(sector: string): boolean {
    const volatileSectors = ['technology', 'cryptocurrency', 'commodities'];
    return volatileSectors.includes(sector.toLowerCase());
  }
/*
  private hasHighConcentration({ _prospect }: { _prospect: Prospect; }): boolean {
    // Simuler l'analyse de concentration
    return false;
  }*/
}