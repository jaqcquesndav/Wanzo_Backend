import { Injectable } from '@nestjs/common';
import { 
  DRC_PROVINCES, 
  ECONOMIC_SECTORS, 
  FINANCIAL_INSTITUTIONS, 
  RISK_THRESHOLDS, 
  CURRENCY_CONFIG, 
  ANALYTICS_CONSTANTS,
  DRC_COUNTRY_DATA
} from '../config/drc-financial-data.config';
import { Province, EconomicSector, FinancialInstitution, RiskThreshold, CurrencyConfig } from '../config/data-types';

/**
 * Service centralisé pour la gestion des données de référence RDC
 * Ce service fournit un accès unifié à toutes les données de configuration
 * utilisées dans le système d'analyse des risques financiers
 */
@Injectable()
export class FinancialDataConfigService {
  
  // ====================
  // DONNÉES GÉOGRAPHIQUES
  // ====================
  
  /**
   * Retourne toutes les provinces de la RDC
   */
  getAllProvinces(): Province[] {
    return DRC_PROVINCES;
  }

  /**
   * Retourne une province par son ID
   */
  getProvinceById(id: string): Province | undefined {
    return DRC_PROVINCES.find(province => province.id === id);
  }

  /**
   * Retourne une province par son code
   */
  getProvinceByCode(code: string): Province | undefined {
    return DRC_PROVINCES.find(province => province.code === code);
  }

  /**
   * Retourne les provinces par niveau de risque
   */
  getProvincesByRiskLevel(minRisk: number, maxRisk?: number): Province[] {
    return DRC_PROVINCES.filter(province => {
      if (maxRisk) {
        return province.riskScore >= minRisk && province.riskScore <= maxRisk;
      }
      return province.riskScore >= minRisk;
    });
  }

  /**
   * Retourne les provinces par seuil de population
   */
  getProvincesByPopulation(minPopulation: number): Province[] {
    return DRC_PROVINCES.filter(province => province.population >= minPopulation);
  }

  /**
   * Retourne les données du pays RDC
   */
  getCountryData() {
    return DRC_COUNTRY_DATA;
  }

  // ====================
  // SECTEURS ÉCONOMIQUES
  // ====================

  /**
   * Retourne tous les secteurs économiques
   */
  getAllSectors(): EconomicSector[] {
    return ECONOMIC_SECTORS;
  }

  /**
   * Retourne un secteur par son ID
   */
  getSectorById(id: string): EconomicSector | undefined {
    return ECONOMIC_SECTORS.find(sector => sector.id === id);
  }

  /**
   * Retourne un secteur par son code
   */
  getSectorByCode(code: string): EconomicSector | undefined {
    return ECONOMIC_SECTORS.find(sector => sector.code === code);
  }

  /**
   * Retourne les secteurs par niveau de risque
   */
  getSectorsByRiskLevel(riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): EconomicSector[] {
    return ECONOMIC_SECTORS.filter(sector => sector.riskLevel === riskLevel);
  }

  /**
   * Retourne les secteurs les plus risqués
   */
  getHighRiskSectors(): EconomicSector[] {
    return ECONOMIC_SECTORS.filter(sector => 
      sector.riskLevel === 'HIGH' || sector.riskLevel === 'CRITICAL'
    );
  }

  /**
   * Retourne les secteurs avec le plus de PME
   */
  getSectorsWithMostSMEs(limit: number = 5): EconomicSector[] {
    return ECONOMIC_SECTORS
      .sort((a, b) => b.totalSMEs - a.totalSMEs)
      .slice(0, limit);
  }

  // ====================
  // INSTITUTIONS FINANCIÈRES
  // ====================

  /**
   * Retourne toutes les institutions financières
   */
  getAllInstitutions(): FinancialInstitution[] {
    return FINANCIAL_INSTITUTIONS;
  }

  /**
   * Retourne une institution par son ID
   */
  getInstitutionById(id: string): FinancialInstitution | undefined {
    return FINANCIAL_INSTITUTIONS.find(institution => institution.id === id);
  }

  /**
   * Retourne les institutions par type
   */
  getInstitutionsByType(type: 'CENTRAL_BANK' | 'COMMERCIAL_BANK' | 'MICROFINANCE' | 'INSURANCE' | 'INVESTMENT_FUND'): FinancialInstitution[] {
    return FINANCIAL_INSTITUTIONS.filter(institution => institution.type === type);
  }

  /**
   * Retourne les institutions systémiquement importantes
   */
  getSystemicallyImportantInstitutions(): FinancialInstitution[] {
    return FINANCIAL_INSTITUTIONS.filter(institution => institution.isSystemicallyImportant);
  }

  /**
   * Retourne les institutions par ordre d'actifs
   */
  getInstitutionsByAssets(limit?: number): FinancialInstitution[] {
    const sorted = FINANCIAL_INSTITUTIONS.sort((a, b) => b.totalAssets - a.totalAssets);
    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Retourne les banques commerciales principales
   */
  getMainCommercialBanks(): FinancialInstitution[] {
    return FINANCIAL_INSTITUTIONS
      .filter(inst => inst.type === 'COMMERCIAL_BANK')
      .sort((a, b) => b.totalAssets - a.totalAssets);
  }

  // ====================
  // GESTION DES RISQUES
  // ====================

  /**
   * Retourne tous les seuils de risque
   */
  getRiskThresholds(): RiskThreshold[] {
    return RISK_THRESHOLDS;
  }

  /**
   * Détermine le niveau de risque pour un score donné
   */
  getRiskLevelForScore(score: number): RiskThreshold | undefined {
    return RISK_THRESHOLDS.find(threshold => 
      score >= threshold.minScore && score <= threshold.maxScore
    );
  }

  /**
   * Retourne les actions recommandées pour un niveau de risque
   */
  getActionsForRiskLevel(level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): string[] {
    const threshold = RISK_THRESHOLDS.find(t => t.level === level);
    return threshold ? threshold.actions : [];
  }

  // ====================
  // CONFIGURATION MONÉTAIRE
  // ====================

  /**
   * Retourne toutes les devises configurées
   */
  getAllCurrencies(): CurrencyConfig[] {
    return CURRENCY_CONFIG;
  }

  /**
   * Retourne le taux de change pour une devise
   */
  getExchangeRate(currencyCode: string): number | undefined {
    const currency = CURRENCY_CONFIG.find(c => c.code === currencyCode);
    return currency?.exchangeRate;
  }

  /**
   * Convertit un montant d'une devise à une autre
   */
  convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number | null {
    const fromRate = this.getExchangeRate(fromCurrency);
    const toRate = this.getExchangeRate(toCurrency);
    
    if (!fromRate || !toRate) return null;
    
    // Conversion via USD comme devise de base
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  }

  /**
   * Convertit un montant en CDF vers USD
   */
  convertCDFtoUSD(amountCDF: number): number {
    const cdfRate = this.getExchangeRate('CDF');
    return cdfRate ? amountCDF / cdfRate : 0;
  }

  /**
   * Convertit un montant en USD vers CDF
   */
  convertUSDtoCDF(amountUSD: number): number {
    const cdfRate = this.getExchangeRate('CDF');
    return cdfRate ? amountUSD * cdfRate : 0;
  }

  // ====================
  // CONSTANTES ANALYTIQUES
  // ====================

  /**
   * Retourne les seuils de détection de fraude
   */
  getFraudDetectionThresholds() {
    return ANALYTICS_CONSTANTS.fraudDetectionThresholds;
  }

  /**
   * Retourne les limites de risque systémique
   */
  getSystemicRiskLimits() {
    return ANALYTICS_CONSTANTS.systemicRiskLimits;
  }

  /**
   * Retourne la fréquence des rapports
   */
  getReportingFrequency() {
    return ANALYTICS_CONSTANTS.reportingFrequency;
  }

  /**
   * Vérifie si un montant dépasse le seuil de structuration
   */
  isAboveStructuringThreshold(amount: number): boolean {
    return amount >= ANALYTICS_CONSTANTS.fraudDetectionThresholds.structuringAmount;
  }

  /**
   * Vérifie si une interconnexion dépasse le seuil critique
   */
  isInterconnectionCritical(ratio: number): boolean {
    return ratio >= ANALYTICS_CONSTANTS.systemicRiskLimits.interconnectionThreshold;
  }

  // ====================
  // UTILITAIRES DE RECHERCHE
  // ====================

  /**
   * Recherche globale dans toutes les entités
   */
  globalSearch(query: string): {
    provinces: Province[];
    sectors: EconomicSector[];
    institutions: FinancialInstitution[];
  } {
    const lowerQuery = query.toLowerCase();

    const provinces = DRC_PROVINCES.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.code.toLowerCase().includes(lowerQuery)
    );

    const sectors = ECONOMIC_SECTORS.filter(s => 
      s.name.toLowerCase().includes(lowerQuery) || 
      s.code.toLowerCase().includes(lowerQuery)
    );

    const institutions = FINANCIAL_INSTITUTIONS.filter(i => 
      i.name.toLowerCase().includes(lowerQuery) || 
      i.license.toLowerCase().includes(lowerQuery)
    );

    return { provinces, sectors, institutions };
  }

  /**
   * Retourne les statistiques globales du système
   */
  getSystemStatistics() {
    const totalProvinces = DRC_PROVINCES.length;
    const totalPopulation = DRC_PROVINCES.reduce((sum, p) => sum + p.population, 0);
    const avgRiskScore = DRC_PROVINCES.reduce((sum, p) => sum + p.riskScore, 0) / totalProvinces;
    
    const totalSectors = ECONOMIC_SECTORS.length;
    const totalSMEs = ECONOMIC_SECTORS.reduce((sum, s) => sum + s.totalSMEs, 0);
    
    const totalInstitutions = FINANCIAL_INSTITUTIONS.length;
    const totalAssets = FINANCIAL_INSTITUTIONS.reduce((sum, i) => sum + i.totalAssets, 0);
    const systemicallyImportant = FINANCIAL_INSTITUTIONS.filter(i => i.isSystemicallyImportant).length;

    return {
      geography: {
        totalProvinces,
        totalPopulation,
        avgRiskScore: Math.round(avgRiskScore * 100) / 100
      },
      economy: {
        totalSectors,
        totalSMEs,
        highRiskSectors: this.getHighRiskSectors().length
      },
      financial: {
        totalInstitutions,
        totalAssets,
        systemicallyImportant,
        commercialBanks: this.getInstitutionsByType('COMMERCIAL_BANK').length,
        microfinance: this.getInstitutionsByType('MICROFINANCE').length,
        insurance: this.getInstitutionsByType('INSURANCE').length
      }
    };
  }

  /**
   * Valide la cohérence des données
   */
  validateDataIntegrity(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérification des provinces
    const provinceCodes = new Set();
    DRC_PROVINCES.forEach(province => {
      if (provinceCodes.has(province.code)) {
        errors.push(`Code province dupliqué: ${province.code}`);
      }
      provinceCodes.add(province.code);

      if (province.riskScore < 0 || province.riskScore > 10) {
        errors.push(`Score de risque invalide pour ${province.name}: ${province.riskScore}`);
      }

      if (province.population <= 0) {
        errors.push(`Population invalide pour ${province.name}: ${province.population}`);
      }
    });

    // Vérification des secteurs
    const sectorCodes = new Set();
    ECONOMIC_SECTORS.forEach(sector => {
      if (sectorCodes.has(sector.code)) {
        errors.push(`Code secteur dupliqué: ${sector.code}`);
      }
      sectorCodes.add(sector.code);

      if (sector.defaultRate < 0 || sector.defaultRate > 100) {
        errors.push(`Taux de défaut invalide pour ${sector.name}: ${sector.defaultRate}%`);
      }
    });

    // Vérification des institutions
    const institutionLicenses = new Set();
    FINANCIAL_INSTITUTIONS.forEach(institution => {
      if (institutionLicenses.has(institution.license)) {
        errors.push(`Licence institution dupliquée: ${institution.license}`);
      }
      institutionLicenses.add(institution.license);

      if (institution.totalAssets <= 0) {
        errors.push(`Actifs invalides pour ${institution.name}: ${institution.totalAssets}`);
      }

      if (institution.capitalRatio < 0 || institution.capitalRatio > 100) {
        warnings.push(`Ratio de capital suspect pour ${institution.name}: ${institution.capitalRatio}%`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
