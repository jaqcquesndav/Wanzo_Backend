import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { GeographicEntity } from '../entities/geographic-entity.entity';
import { RiskProfile } from '../../risk-analysis/entities/risk-profile.entity';
import { FraudAlert } from '../../fraud-detection/entities/fraud-alert.entity';

export interface GeographicRiskMetrics {
  province: string;
  totalEntities: number;
  avgRiskScore: number;
  fraudAlertCount: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  concentrationRisk: number;
  systemicRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
}

export interface ConcentrationAnalysis {
  province: string;
  city?: string;
  sector?: string;
  entityCount: number;
  totalExposure: number;
  concentrationRatio: number; // % du total national
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  diversificationIndex: number; // 0-1, 1 = parfaitement diversifié
}

export interface ProvinceComparison {
  province: string;
  rank: number;
  avgRiskScore: number;
  fraudRate: number;
  economicIndicators: {
    gdpContribution: number;
    businessDensity: number;
    financialInclusion: number;
  };
  trends: {
    riskEvolution: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
    monthlyChange: number;
  };
}

@Injectable()
export class GeographicAnalysisService {
  private readonly logger = new Logger(GeographicAnalysisService.name);

  constructor(
    @InjectRepository(GeographicEntity)
    private geographicRepository: Repository<GeographicEntity>,
    @InjectRepository(RiskProfile)
    private riskProfileRepository: Repository<RiskProfile>,
    @InjectRepository(FraudAlert)
    private fraudAlertRepository: Repository<FraudAlert>
  ) {}

  /**
   * Analyse le risque géographique pour une province donnée
   */
  async analyzeProvinceRisk(provinceName: string): Promise<GeographicRiskMetrics> {
    try {
      this.logger.log(`Analyzing geographic risk for province: ${provinceName}`);

      // Récupération des profils de risque pour cette province
      const riskProfiles = await this.riskProfileRepository.find({
        where: { province: provinceName }
      });

      if (riskProfiles.length === 0) {
        throw new Error(`Aucune entité trouvée pour la province ${provinceName}`);
      }

      // Calcul des métriques de base
      const totalEntities = riskProfiles.length;
      const allRiskScores = riskProfiles
        .map(profile => profile.riskScore)
        .filter(score => score !== null && score !== undefined);

      const avgRiskScore = allRiskScores.length > 0 
        ? allRiskScores.reduce((sum, score) => sum + score, 0) / allRiskScores.length 
        : 0;

      // Comptage des alertes de fraude pour cette province
      const fraudAlertCount = await this.fraudAlertRepository.count({
        where: { province: provinceName }
      });

      // Distribution des risques
      const riskDistribution = this.calculateRiskDistribution(allRiskScores);

      // Calcul du risque de concentration
      const concentrationRisk = this.calculateConcentrationRisk(riskProfiles, totalEntities);

      // Détermination du niveau de risque systémique
      const systemicRiskLevel = this.determineSystemicRiskLevel(
        avgRiskScore, 
        fraudAlertCount, 
        concentrationRisk,
        totalEntities
      );

      // Génération de recommandations
      const recommendations = this.generateProvinceRecommendations(
        systemicRiskLevel,
        concentrationRisk,
        fraudAlertCount,
        avgRiskScore
      );

      return {
        province: provinceName,
        totalEntities,
        avgRiskScore: Math.round(avgRiskScore * 1000) / 1000,
        fraudAlertCount,
        riskDistribution,
        concentrationRisk: Math.round(concentrationRisk * 1000) / 1000,
        systemicRiskLevel,
        recommendations
      };

    } catch (error: any) {
      this.logger.error(`Error analyzing province risk for ${provinceName}:`, error);
      throw error;
    }
  }

  /**
   * Analyse de concentration par secteur géographique
   */
  async analyzeConcentrationRisk(): Promise<ConcentrationAnalysis[]> {
    try {
      this.logger.log('Analyzing geographic concentration risk');

      // Récupération de tous les profils de risque avec des provinces
      const allRiskProfiles = await this.riskProfileRepository.find({
        where: { province: Not(IsNull()) }
      });

      const totalNationalEntities = allRiskProfiles.length;
      const totalNationalExposure = allRiskProfiles
        .reduce((sum, profile) => sum + (profile.riskScore || 0), 0);

      // Groupement par province
      const provinceGroups = allRiskProfiles.reduce((groups, profile) => {
        const province = profile.province!;
        if (!groups[province]) {
          groups[province] = [];
        }
        groups[province].push(profile);
        return groups;
      }, {} as Record<string, RiskProfile[]>);

      const concentrationAnalyses: ConcentrationAnalysis[] = [];

      // Analyse pour chaque province
      for (const [province, profiles] of Object.entries(provinceGroups)) {
        const entityCount = profiles.length;
        const totalExposure = profiles
          .reduce((sum, profile) => sum + (profile.riskScore || 0), 0);

        const concentrationRatio = totalNationalEntities > 0 
          ? (entityCount / totalNationalEntities) * 100 
          : 0;

        // Calcul de l'indice de diversification simplifié
        const sectorDiversity = new Set(profiles.map(p => p.sector).filter(Boolean)).size;
        const diversificationIndex = Math.min(sectorDiversity / 10, 1); // Normalisé sur 10 secteurs max

        // Détermination du niveau de risque de concentration
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        if (concentrationRatio > 40) riskLevel = 'CRITICAL';
        else if (concentrationRatio > 25) riskLevel = 'HIGH';
        else if (concentrationRatio > 15) riskLevel = 'MEDIUM';

        concentrationAnalyses.push({
          province,
          entityCount,
          totalExposure: Math.round(totalExposure * 100) / 100,
          concentrationRatio: Math.round(concentrationRatio * 100) / 100,
          riskLevel,
          diversificationIndex: Math.round(diversificationIndex * 1000) / 1000
        });
      }

      // Tri par ratio de concentration décroissant
      return concentrationAnalyses.sort((a, b) => b.concentrationRatio - a.concentrationRatio);

    } catch (error: any) {
      this.logger.error('Error analyzing concentration risk:', error);
      throw error;
    }
  }

  /**
   * Comparaison inter-provinciale des risques
   */
  async compareProvinces(): Promise<ProvinceComparison[]> {
    try {
      this.logger.log('Performing inter-provincial risk comparison');

      // Récupération de tous les profils de risque avec des provinces
      const allRiskProfiles = await this.riskProfileRepository.find({
        where: { province: Not(IsNull()) }
      });

      const provinceGroups = allRiskProfiles.reduce((groups, profile) => {
        const province = profile.province!;
        if (!groups[province]) {
          groups[province] = [];
        }
        groups[province].push(profile);
        return groups;
      }, {} as Record<string, RiskProfile[]>);

      const comparisons: ProvinceComparison[] = [];

      // Analyse pour chaque province
      for (const [province, profiles] of Object.entries(provinceGroups)) {
        const allRiskScores = profiles
          .map(profile => profile.riskScore)
          .filter(score => score !== null && score !== undefined);

        const avgRiskScore = allRiskScores.length > 0 
          ? allRiskScores.reduce((sum, score) => sum + score, 0) / allRiskScores.length 
          : 0;

        // Calcul du taux de fraude (alertes / entités)
        const fraudAlertCount = await this.fraudAlertRepository.count({
          where: { province }
        });
        const fraudRate = profiles.length > 0 ? fraudAlertCount / profiles.length : 0;

        // Indicateurs économiques simulés (à remplacer par de vraies données)
        const economicIndicators = this.getEconomicIndicators(province);

        // Tendances simulées (à calculer avec des données historiques)
        const trends = this.calculateTrends(avgRiskScore, fraudRate);

        comparisons.push({
          province,
          rank: 0, // Sera calculé après le tri
          avgRiskScore: Math.round(avgRiskScore * 1000) / 1000,
          fraudRate: Math.round(fraudRate * 1000) / 1000,
          economicIndicators,
          trends
        });
      }

      // Tri par score de risque décroissant et attribution des rangs
      comparisons.sort((a, b) => b.avgRiskScore - a.avgRiskScore);
      comparisons.forEach((comparison, index) => {
        comparison.rank = index + 1;
      });

      return comparisons;

    } catch (error: any) {
      this.logger.error('Error comparing provinces:', error);
      throw error;
    }
  }

  /**
   * Détection de clusters de risque géographiques
   */
  async detectRiskClusters(): Promise<any[]> {
    try {
      this.logger.log('Detecting geographic risk clusters');

      // Récupération de tous les profils de risque par province
      const allRiskProfiles = await this.riskProfileRepository.find({
        where: { province: Not(IsNull()) }
      });

      // Groupement par province (simplifié car pas de données de ville)
      const provinceGroups = allRiskProfiles.reduce((groups, profile) => {
        const province = profile.province!;
        if (!groups[province]) {
          groups[province] = [];
        }
        groups[province].push(profile);
        return groups;
      }, {} as Record<string, RiskProfile[]>);

      const clusters: any[] = [];

      // Identification des clusters à risque par province
      for (const [province, profiles] of Object.entries(provinceGroups)) {
        
        if (profiles.length < 3) continue; // Minimum 3 entités pour former un cluster

        const riskScores = profiles
          .map(profile => profile.riskScore)
          .filter(score => score !== null && score !== undefined);

        if (riskScores.length === 0) continue;

        const avgRiskScore = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
        const highRiskCount = riskScores.filter(score => score > 7).length;
        const highRiskRatio = highRiskCount / riskScores.length;

        // Critères pour considérer comme cluster à risque
        if (avgRiskScore > 6 || highRiskRatio > 0.5) {
          clusters.push({
            location: {
              province: province,
              city: 'Diverses' // Simplifié car pas de données de ville
            },
            entityCount: profiles.length,
            avgRiskScore: Math.round(avgRiskScore * 1000) / 1000,
            highRiskRatio: Math.round(highRiskRatio * 1000) / 1000,
            clusterRisk: avgRiskScore > 8 ? 'CRITICAL' : 
                         avgRiskScore > 6.5 ? 'HIGH' : 'MEDIUM',
            recommendedActions: this.generateClusterRecommendations(avgRiskScore, highRiskRatio, profiles.length)
          });
        }
      }

      // Tri par score de risque décroissant
      return clusters.sort((a, b) => b.avgRiskScore - a.avgRiskScore);

    } catch (error: any) {
      this.logger.error('Error detecting risk clusters:', error);
      throw error;
    }
  }

  // Méthodes utilitaires privées

  private calculateRiskDistribution(riskScores: number[]) {
    const total = riskScores.length;
    if (total === 0) {
      return { low: 0, medium: 0, high: 0, critical: 0 };
    }

    return {
      low: riskScores.filter(score => score < 4).length,
      medium: riskScores.filter(score => score >= 4 && score < 6).length,
      high: riskScores.filter(score => score >= 6 && score < 8).length,
      critical: riskScores.filter(score => score >= 8).length
    };
  }

  private calculateConcentrationRisk(riskProfiles: RiskProfile[], totalEntities: number): number {
    // Calcul simplifié du risque de concentration basé sur la répartition par secteur
    const sectorDistribution = riskProfiles.reduce((dist, profile) => {
      const sector = profile.sector || 'UNKNOWN';
      dist[sector] = (dist[sector] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);

    const sectorShares = Object.values(sectorDistribution).map(count => count / totalEntities);
    
    // Calcul de l'indice Herfindahl-Hirschman (simplifié)
    const hhi = sectorShares.reduce((sum, share) => sum + (share * share), 0);
    
    // Normalisation sur une échelle de 0 à 1
    return Math.min(hhi * 2, 1);
  }

  private determineSystemicRiskLevel(
    avgRiskScore: number, 
    fraudAlertCount: number, 
    concentrationRisk: number,
    totalEntities: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    
    const fraudRate = totalEntities > 0 ? fraudAlertCount / totalEntities : 0;
    
    // Score composite
    const compositeScore = (avgRiskScore * 0.4) + (fraudRate * 10 * 0.3) + (concentrationRisk * 10 * 0.3);
    
    if (compositeScore >= 8) return 'CRITICAL';
    if (compositeScore >= 6) return 'HIGH';
    if (compositeScore >= 4) return 'MEDIUM';
    return 'LOW';
  }

  private generateProvinceRecommendations(
    systemicRiskLevel: string,
    concentrationRisk: number,
    fraudAlertCount: number,
    avgRiskScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (systemicRiskLevel === 'CRITICAL') {
      recommendations.push('Surveillance renforcée immédiate requise');
      recommendations.push('Audit complet des institutions financières');
    }

    if (concentrationRisk > 0.7) {
      recommendations.push('Diversification géographique recommandée');
      recommendations.push('Limitation des expositions concentrées');
    }

    if (fraudAlertCount > 10) {
      recommendations.push('Renforcement des contrôles anti-fraude');
      recommendations.push('Formation du personnel local');
    }

    if (avgRiskScore > 7) {
      recommendations.push('Révision des critères d\'octroi de crédit');
      recommendations.push('Mise en place de garanties supplémentaires');
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintenir la surveillance de routine');
    }

    return recommendations;
  }

  private getEconomicIndicators(province: string) {
    // Données simulées - à remplacer par de vraies données économiques
    const indicators = {
      'Kinshasa': { gdpContribution: 25, businessDensity: 85, financialInclusion: 60 },
      'Katanga': { gdpContribution: 20, businessDensity: 70, financialInclusion: 45 },
      'Kasaï': { gdpContribution: 15, businessDensity: 55, financialInclusion: 35 },
      'Nord-Kivu': { gdpContribution: 8, businessDensity: 40, financialInclusion: 25 },
      'Sud-Kivu': { gdpContribution: 7, businessDensity: 38, financialInclusion: 22 }
    };

    return indicators[province] || { gdpContribution: 5, businessDensity: 30, financialInclusion: 20 };
  }

  private calculateTrends(avgRiskScore: number, fraudRate: number) {
    // Simulation de tendances - à calculer avec de vraies données historiques
    let riskEvolution: 'IMPROVING' | 'STABLE' | 'DETERIORATING' = 'STABLE';
    let monthlyChange = 0;

    if (avgRiskScore > 7) {
      riskEvolution = 'DETERIORATING';
      monthlyChange = Math.random() * 0.2 + 0.1; // Simulation
    } else if (avgRiskScore < 4) {
      riskEvolution = 'IMPROVING';
      monthlyChange = -(Math.random() * 0.1 + 0.05); // Simulation
    }

    return {
      riskEvolution,
      monthlyChange: Math.round(monthlyChange * 1000) / 1000
    };
  }

  private generateClusterRecommendations(avgRiskScore: number, highRiskRatio: number, entityCount: number): string[] {
    const recommendations: string[] = [];

    if (avgRiskScore > 8) {
      recommendations.push('Investigation immédiate du cluster');
      recommendations.push('Blocage temporaire des nouvelles opérations');
    }

    if (highRiskRatio > 0.7) {
      recommendations.push('Audit détaillé de toutes les entités');
      recommendations.push('Renforcement des contrôles locaux');
    }

    if (entityCount > 10) {
      recommendations.push('Surveillance continue du cluster');
      recommendations.push('Limitation des expositions croisées');
    }

    return recommendations;
  }
}
