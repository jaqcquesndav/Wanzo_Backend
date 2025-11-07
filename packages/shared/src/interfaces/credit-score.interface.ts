/**
 * Interfaces standardisées pour la Cote Crédit XGBoost
 * Compatible avec tous les services de la plateforme Wanzo
 */

export enum RiskLevel {
  LOW = 'LOW',        // Score 71-100 - Risque faible
  MEDIUM = 'MEDIUM',  // Score 41-70 - Risque modéré  
  HIGH = 'HIGH'       // Score 1-40 - Risque élevé
}

export enum CreditScoreClass {
  EXCELLENT = 'EXCELLENT',  // 91-100
  VERY_GOOD = 'VERY_GOOD',  // 81-90
  GOOD = 'GOOD',            // 71-80
  FAIR = 'FAIR',            // 51-70
  POOR = 'POOR',            // 31-50
  VERY_POOR = 'VERY_POOR'   // 1-30
}

/**
 * Structure standardisée du score crédit pour tous les services
 * Score unifié : 1-100 (obligatoire)
 */
export interface StandardCreditScore {
  /** Score crédit principal (1-100) */
  score: number;
  
  /** Niveau de risque déterminé par le score */
  riskLevel: RiskLevel;
  
  /** Classification détaillée du score */
  scoreClass: CreditScoreClass;
  
  /** Date de calcul du score */
  calculatedAt: Date;
  
  /** Date d'expiration du score (30 jours par défaut) */
  validUntil: Date;
  
  /** Version du modèle utilisé pour le calcul */
  modelVersion: string;
  
  /** Source des données utilisées pour le calcul */
  dataSource: string;
  
  /** Score de confiance du modèle (0-1) */
  confidenceScore: number;
}

/**
 * Composants détaillés du score crédit XGBoost
 * Chaque composant est scoré de 0 à 100
 */
export interface CreditScoreComponents {
  /** Qualité des flux de trésorerie */
  cashFlowQuality: number;
  
  /** Stabilité de l'activité commerciale */
  businessStability: number;
  
  /** Santé financière globale */
  financialHealth: number;
  
  /** Comportement de paiement */
  paymentBehavior: number;
  
  /** Tendance de croissance */
  growthTrend: number;
}

/**
 * Score crédit détaillé avec composants et explications
 * Utilisé pour les analyses approfondies
 */
export interface DetailedCreditScore extends StandardCreditScore {
  /** Composants détaillés du score */
  components: CreditScoreComponents;
  
  /** Facteurs explicatifs du score */
  explanation: string[];
  
  /** Recommandations basées sur l'analyse */
  recommendations: string[];
  
  /** Données contextuelles additionnelles */
  context?: {
    companyId: string;
    companyName?: string;
    sector?: string;
    analysisType: string;
  };
}

/**
 * Historique des scores crédit
 * Pour le suivi de l'évolution dans le temps
 */
export interface CreditScoreHistory {
  /** Identifiant unique de l'entrée historique */
  id: string;
  
  /** Score crédit à cette date */
  score: StandardCreditScore;
  
  /** Type d'événement qui a déclenché le recalcul */
  trigger: 'manual' | 'automatic' | 'transaction_update' | 'periodic';
  
  /** Utilisateur qui a initié le calcul (si manuel) */
  calculatedBy?: string;
  
  /** Changement par rapport au score précédent */
  scoreChange?: {
    previousScore: number;
    change: number;
    changePercentage: number;
  };
}

/**
 * Paramètres de calcul du score crédit
 * Configuration pour les appels à l'API XGBoost
 */
export interface CreditScoreCalculationParams {
  /** ID de l'entreprise */
  companyId: string;
  
  /** Période d'analyse - date de début */
  startDate: Date;
  
  /** Période d'analyse - date de fin */
  endDate: Date;
  
  /** Forcer le recalcul même si un score récent existe */
  forceRecalculation?: boolean;
  
  /** Type d'analyse demandée */
  analysisType: 'full' | 'quick' | 'minimal';
  
  /** Inclure les détails des composants */
  includeComponents?: boolean;
  
  /** Inclure les explications et recommandations */
  includeExplanations?: boolean;
}

/**
 * Réponse standardisée des APIs de calcul de score
 */
export interface CreditScoreApiResponse {
  /** Succès de l'opération */
  success: boolean;
  
  /** Score calculé (simple ou détaillé) */
  score: StandardCreditScore | DetailedCreditScore;
  
  /** Message informatif */
  message?: string;
  
  /** Erreurs éventuelles */
  errors?: string[];
  
  /** Métadonnées de l'API */
  metadata: {
    processingTime: number;
    apiVersion: string;
    requestId: string;
  };
}

/**
 * Utilitaires pour la gestion des scores crédit
 */
export class CreditScoreUtils {
  /**
   * Détermine le niveau de risque basé sur le score
   */
  static determineRiskLevel(score: number): RiskLevel {
    if (score >= 71) return RiskLevel.LOW;
    if (score >= 41) return RiskLevel.MEDIUM;
    return RiskLevel.HIGH;
  }
  
  /**
   * Détermine la classification détaillée basée sur le score
   */
  static determineScoreClass(score: number): CreditScoreClass {
    if (score >= 91) return CreditScoreClass.EXCELLENT;
    if (score >= 81) return CreditScoreClass.VERY_GOOD;
    if (score >= 71) return CreditScoreClass.GOOD;
    if (score >= 51) return CreditScoreClass.FAIR;
    if (score >= 31) return CreditScoreClass.POOR;
    return CreditScoreClass.VERY_POOR;
  }
  
  /**
   * Valide qu'un score est dans la plage correcte (1-100)
   */
  static validateScore(score: number): boolean {
    return score >= 1 && score <= 100 && Number.isInteger(score);
  }
  
  /**
   * Calcule la date d'expiration (30 jours après le calcul)
   */
  static calculateExpiryDate(calculatedAt: Date = new Date()): Date {
    const expiryDate = new Date(calculatedAt);
    expiryDate.setDate(expiryDate.getDate() + 30);
    return expiryDate;
  }
  
  /**
   * Vérifie si un score est encore valide
   */
  static isScoreValid(validUntil: Date): boolean {
    return new Date() < validUntil;
  }
  
  /**
   * Calcule le changement de score en pourcentage
   */
  static calculateScoreChange(newScore: number, oldScore: number): {
    change: number;
    changePercentage: number;
  } {
    const change = newScore - oldScore;
    const changePercentage = oldScore > 0 ? (change / oldScore) * 100 : 0;
    
    return {
      change: Math.round(change),
      changePercentage: Math.round(changePercentage * 100) / 100
    };
  }
  
  /**
   * Génère une recommandation textuelle basée sur le score
   */
  static getScoreRecommendation(score: number): string {
    const scoreClass = this.determineScoreClass(score);
    
    switch (scoreClass) {
      case CreditScoreClass.EXCELLENT:
        return 'Crédit excellent - Conditions préférentielles applicables';
      case CreditScoreClass.VERY_GOOD:
        return 'Très bon crédit - Taux avantageux recommandés';
      case CreditScoreClass.GOOD:
        return 'Bon crédit - Conditions standard applicables';
      case CreditScoreClass.FAIR:
        return 'Crédit acceptable - Surveillance recommandée';
      case CreditScoreClass.POOR:
        return 'Crédit faible - Garanties supplémentaires requises';
      case CreditScoreClass.VERY_POOR:
        return 'Crédit très faible - Approbation spéciale requise';
      default:
        return 'Score en cours d\'évaluation';
    }
  }
  
  /**
   * Convertit un score de risque (0-10) vers un score crédit (1-100)
   * Utilisé pour la migration depuis Analytics Service
   */
  static convertRiskScoreToCreditScore(riskScore: number): number {
    // Validation de l'entrée
    if (riskScore < 0 || riskScore > 10) {
      throw new Error('Risk score must be between 0 and 10');
    }
    
    // Inversion de l'échelle (risque élevé = crédit faible)
    const invertedScore = 10 - riskScore;
    
    // Conversion vers échelle 1-100
    const creditScore = Math.round((invertedScore / 10) * 99) + 1;
    
    // Assurer que le score reste dans les limites
    return Math.max(1, Math.min(100, creditScore));
  }
  
  /**
   * Formate un score pour l'affichage
   */
  static formatScore(score: number): string {
    return `${score}/100`;
  }
  
  /**
   * Retourne une couleur CSS basée sur le niveau de risque
   */
  static getScoreColor(score: number): string {
    const riskLevel = this.determineRiskLevel(score);
    
    switch (riskLevel) {
      case RiskLevel.LOW:
        return '#22c55e';      // Vert
      case RiskLevel.MEDIUM:
        return '#f59e0b';      // Orange
      case RiskLevel.HIGH:
        return '#ef4444';      // Rouge
      default:
        return '#6b7280';      // Gris
    }
  }
}