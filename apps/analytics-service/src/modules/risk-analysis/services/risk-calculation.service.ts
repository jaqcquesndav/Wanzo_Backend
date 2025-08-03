import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiskProfile, EntityType, RiskLevel } from '../entities/risk-profile.entity';
import * as _ from 'lodash';

export interface SMEData {
  id: string;
  accounting?: {
    currentAssets: number;
    currentLiabilities: number;
    totalAssets: number;
    totalDebt: number;
    netIncome: number;
    revenue: number;
    operatingIncome: number;
  };
  business?: {
    sector: string;
    yearsInBusiness: number;
    employeeCount: number;
    monthlyRevenue: number;
  };
  location?: {
    province: string;
    city: string;
    commune?: string;
  };
  history?: {
    payments: Array<{
      amount: number;
      dueDate: Date;
      paymentDate?: Date;
      onTime: boolean;
      delayDays: number;
    }>;
    creditHistory?: Array<{
      amount: number;
      status: string;
      performance: 'good' | 'fair' | 'poor';
    }>;
  };
}

@Injectable()
export class RiskCalculationService {
  private readonly logger = new Logger(RiskCalculationService.name);

  constructor(
    @InjectRepository(RiskProfile)
    private riskProfileRepository: Repository<RiskProfile>
  ) {}

  /**
   * Calcule le score de risque global d'une PME
   */
  async calculateSMERisk(smeId: string, smeData: SMEData): Promise<RiskProfile> {
    try {
      this.logger.log(`Calculating risk for SME: ${smeId}`);

      // Calcul des différents facteurs de risque
      const factors = {
        financial: await this.calculateFinancialRisk(smeData.accounting),
        operational: await this.calculateOperationalRisk(smeData.business),
        market: await this.calculateMarketRisk(smeData.business?.sector, smeData.location),
        geographic: await this.calculateGeographicRisk(smeData.location),
        behavioral: await this.calculateBehavioralRisk(smeData.history)
      };

      // Pondération des facteurs selon les best practices du financial engineering
      const weights = {
        financial: 0.35,      // Ratios financiers - poids le plus important
        operational: 0.25,    // Facteurs opérationnels
        market: 0.20,         // Risque sectoriel et concurrentiel
        geographic: 0.15,     // Risque géographique/politique
        behavioral: 0.05      // Historique de paiement
      };

      // Calcul du score pondéré
      const riskScore = Object.keys(factors).reduce((sum, key) => {
        const factor = factors[key as keyof typeof factors];
        const weight = weights[key as keyof typeof weights];
        return sum + (factor * weight);
      }, 0);

      // Borner le score entre 0 et 10
      const finalScore = Math.min(Math.max(riskScore, 0), 10);
      const riskLevel = RiskProfile.determineRiskLevel(finalScore);

      // Calcul de la probabilité de défaut (modèle logistique simplifié)
      const defaultProbability = this.calculateDefaultProbability(finalScore);

      // Sauvegarde ou mise à jour du profil de risque
      let riskProfile = await this.riskProfileRepository.findOne({
        where: { entityType: EntityType.SME, entityId: smeId }
      });

      if (!riskProfile) {
        riskProfile = new RiskProfile();
        riskProfile.entityType = EntityType.SME;
        riskProfile.entityId = smeId;
      }

      riskProfile.riskScore = Math.round(finalScore * 100) / 100; // 2 décimales
      riskProfile.riskLevel = riskLevel;
      riskProfile.defaultProbability = defaultProbability;
      riskProfile.recoveryRate = this.estimateRecoveryRate(finalScore, smeData);
      riskProfile.riskFactors = factors;
      riskProfile.province = smeData.location?.province;
      riskProfile.sector = smeData.business?.sector;
      
      riskProfile.calculations = {
        model: 'SME_RISK_MODEL_V1',
        version: '1.0.0',
        confidence: this.calculateConfidence(smeData),
        lastCalculation: new Date(),
        dataPoints: this.countDataPoints(smeData),
        inputs: {
          weights,
          factors,
          dataQuality: this.assessDataQuality(smeData)
        }
      };

      const savedProfile = await this.riskProfileRepository.save(riskProfile);
      
      this.logger.log(`Risk calculated for SME ${smeId}: ${finalScore} (${riskLevel})`);
      return savedProfile;

    } catch (error) {
      this.logger.error(`Error calculating SME risk for ${smeId}:`, error);
      throw error;
    }
  }

  /**
   * Calcule le risque financier basé sur les ratios comptables
   */
  private async calculateFinancialRisk(accountingData?: SMEData['accounting']): Promise<number> {
    if (!accountingData) {
      this.logger.warn('No accounting data available - using high risk score');
      return 8.0; // Score élevé en l'absence de données
    }

    let score = 5.0; // Score neutre de base
    
    try {
      // Ratio de liquidité (Current Ratio)
      const liquidityRatio = accountingData.currentAssets / accountingData.currentLiabilities;
      if (liquidityRatio < 1.0) score += 2.5;
      else if (liquidityRatio < 1.2) score += 1.5;
      else if (liquidityRatio > 2.5) score -= 1.0;
      else if (liquidityRatio > 1.5) score -= 0.5;

      // Ratio d'endettement (Debt-to-Assets)
      const debtRatio = accountingData.totalDebt / accountingData.totalAssets;
      if (debtRatio > 0.8) score += 2.0;
      else if (debtRatio > 0.6) score += 1.0;
      else if (debtRatio < 0.3) score -= 0.5;

      // Ratio de rentabilité (ROA - Return on Assets)
      const roa = accountingData.netIncome / accountingData.totalAssets;
      if (roa < 0) score += 3.0; // Pertes
      else if (roa < 0.02) score += 1.5; // Très faible rentabilité
      else if (roa > 0.15) score -= 1.0; // Bonne rentabilité

      // Marge opérationnelle
      if (accountingData.revenue > 0) {
        const operatingMargin = accountingData.operatingIncome / accountingData.revenue;
        if (operatingMargin < 0) score += 2.0;
        else if (operatingMargin < 0.05) score += 1.0;
        else if (operatingMargin > 0.20) score -= 1.0;
      }

    } catch (error) {
      this.logger.warn('Error in financial ratio calculation:', error);
      score += 1.0; // Pénalité pour données incomplètes
    }

    return Math.min(Math.max(score, 0), 10);
  }

  /**
   * Calcule le risque opérationnel
   */
  private async calculateOperationalRisk(businessData?: SMEData['business']): Promise<number> {
    if (!businessData) return 7.0;

    let score = 5.0;

    // Maturité de l'entreprise
    if (businessData.yearsInBusiness < 1) score += 2.0;
    else if (businessData.yearsInBusiness < 3) score += 1.0;
    else if (businessData.yearsInBusiness > 10) score -= 1.0;

    // Taille (nombre d'employés)
    if (businessData.employeeCount < 5) score += 1.5;
    else if (businessData.employeeCount > 50) score -= 0.5;

    // Stabilité des revenus (variance mensuelle)
    if (businessData.monthlyRevenue && businessData.monthlyRevenue > 0) {
      // Logique à améliorer avec données historiques
      score -= 0.5;
    }

    return Math.min(Math.max(score, 0), 10);
  }

  /**
   * Calcule le risque de marché (sectoriel)
   */
  private async calculateMarketRisk(sector?: string, location?: SMEData['location']): Promise<number> {
    // Mapping des risques sectoriels pour la RDC
    const sectorRiskMap: Record<string, number> = {
      'AGR': 5.5,  // Agriculture - risque modéré
      'MIN': 7.5,  // Mines - risque élevé (volatilité des prix)
      'COM': 4.0,  // Commerce - risque faible
      'SER': 4.5,  // Services - risque faible
      'IND': 6.0,  // Industrie - risque modéré
      'CON': 8.0,  // Construction - risque élevé
      'TRA': 5.5,  // Transport - risque modéré
      'TEC': 3.5,  // Technologie - risque faible
      'AGR,COM': 4.5, // Agriculture-Commerce
      'default': 6.0
    };

    return sectorRiskMap[sector || 'default'] || 6.0;
  }

  /**
   * Calcule le risque géographique
   */
  private async calculateGeographicRisk(location?: SMEData['location']): Promise<number> {
    if (!location?.province) return 6.0;

    // Mapping des risques par province RDC
    const provinceRiskMap: Record<string, number> = {
      'Kinshasa': 3.5,      // Capital - infrastructure meilleure
      'Bas-Congo': 4.5,     // Port de Matadi - accès international
      'Katanga': 6.5,       // Mines - instabilité possible
      'Nord-Kivu': 8.5,     // Conflits - très haut risque
      'Sud-Kivu': 8.0,      // Conflits - haut risque
      'Kasaï Oriental': 6.0, // Diamants - risque modéré-élevé
      'Kasaï Occidental': 6.0,
      'Bandundu': 5.5,      // Rural - infrastructure limitée
      'Équateur': 5.5,
      'Province Orientale': 7.0,
      'Maniema': 6.5
    };

    return provinceRiskMap[location.province] || 6.0;
  }

  /**
   * Calcule le risque comportemental basé sur l'historique
   */
  private async calculateBehavioralRisk(history?: SMEData['history']): Promise<number> {
    if (!history?.payments || history.payments.length === 0) {
      return 7.0; // Risque élevé si pas d'historique
    }

    const payments = history.payments;
    
    // Taux de paiement à temps
    const onTimeRate = payments.filter(p => p.onTime).length / payments.length;
    
    // Délai moyen de paiement
    const avgDelay = payments.reduce((sum, p) => sum + p.delayDays, 0) / payments.length;
    
    let score = 5.0;
    
    // Scoring basé sur le taux de ponctualité
    if (onTimeRate > 0.95) score -= 2.0;
    else if (onTimeRate > 0.85) score -= 1.0;
    else if (onTimeRate < 0.70) score += 2.0;
    else if (onTimeRate < 0.80) score += 1.0;

    // Scoring basé sur les délais
    if (avgDelay > 60) score += 2.0;
    else if (avgDelay > 30) score += 1.0;
    else if (avgDelay < 5) score -= 1.0;

    return Math.min(Math.max(score, 0), 10);
  }

  /**
   * Calcule la probabilité de défaut basée sur le score de risque
   */
  private calculateDefaultProbability(riskScore: number): number {
    // Modèle logistique simplifié: P(default) = 1 / (1 + e^(-k*(score-offset)))
    const k = 0.8; // Paramètre de pente
    const offset = 5; // Point d'inflexion
    
    const logit = k * (riskScore - offset);
    const probability = 1 / (1 + Math.exp(-logit));
    
    return Math.round(probability * 10000) / 10000; // 4 décimales
  }

  /**
   * Estime le taux de recouvrement en cas de défaut
   */
  private estimateRecoveryRate(riskScore: number, smeData: SMEData): number {
    let recoveryRate = 0.6; // Base de 60%

    // Ajustement basé sur le score de risque
    if (riskScore < 4) recoveryRate += 0.2;
    else if (riskScore > 7) recoveryRate -= 0.2;

    // Ajustement basé sur le secteur
    const sector = smeData.business?.sector;
    if (sector === 'MIN' || sector === 'CON') recoveryRate += 0.1; // Actifs tangibles
    else if (sector === 'SER' || sector === 'TEC') recoveryRate -= 0.1; // Actifs intangibles

    return Math.min(Math.max(recoveryRate, 0.1), 0.9);
  }

  /**
   * Calcule le niveau de confiance du calcul
   */
  private calculateConfidence(smeData: SMEData): number {
    let confidence = 0.5; // Base 50%

    if (smeData.accounting) confidence += 0.3;
    if (smeData.business) confidence += 0.2;
    if (smeData.location) confidence += 0.1;
    if (smeData.history?.payments && smeData.history.payments.length > 5) confidence += 0.2;

    return Math.min(confidence, 1.0);
  }

  /**
   * Compte le nombre de points de données disponibles
   */
  private countDataPoints(smeData: SMEData): number {
    let count = 0;
    
    if (smeData.accounting) {
      count += Object.keys(smeData.accounting).length;
    }
    if (smeData.business) {
      count += Object.keys(smeData.business).length;
    }
    if (smeData.location) {
      count += Object.keys(smeData.location).length;
    }
    if (smeData.history?.payments) {
      count += smeData.history.payments.length;
    }

    return count;
  }

  /**
   * Évalue la qualité des données fournies
   */
  private assessDataQuality(smeData: SMEData): 'excellent' | 'good' | 'fair' | 'poor' {
    const dataPoints = this.countDataPoints(smeData);
    const confidence = this.calculateConfidence(smeData);

    if (confidence >= 0.9 && dataPoints >= 20) return 'excellent';
    if (confidence >= 0.7 && dataPoints >= 15) return 'good';
    if (confidence >= 0.5 && dataPoints >= 10) return 'fair';
    return 'poor';
  }

  /**
   * Récupère le profil de risque d'une entité
   */
  async getRiskProfile(entityType: EntityType, entityId: string): Promise<RiskProfile | null> {
    return this.riskProfileRepository.findOne({
      where: { entityType, entityId }
    });
  }

  /**
   * Récupère tous les profils de risque par niveau
   */
  async getRiskProfilesByLevel(riskLevel: RiskLevel): Promise<RiskProfile[]> {
    return this.riskProfileRepository.find({
      where: { riskLevel },
      order: { riskScore: 'DESC' }
    });
  }

  /**
   * Récupère les profils de risque par province
   */
  async getRiskProfilesByProvince(province: string): Promise<RiskProfile[]> {
    return this.riskProfileRepository.find({
      where: { province },
      order: { riskScore: 'DESC' }
    });
  }
}
