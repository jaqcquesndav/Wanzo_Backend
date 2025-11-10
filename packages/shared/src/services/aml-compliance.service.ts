/**
 * Service de conformité aux normes Anti-Money Laundering (AML) et Counter-Financing of Terrorism (CFT)
 * Implémentation des recommandations FATF/GAFI, directives européennes, et réglementations locales
 */

import { Injectable, Logger } from '@nestjs/common';

// Types de risques AML/CFT
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  VERY_HIGH = 'very_high',
  PROHIBITED = 'prohibited'
}

export enum TransactionType {
  DOMESTIC = 'domestic',
  INTERNATIONAL = 'international',
  HIGH_VALUE = 'high_value',
  CASH_INTENSIVE = 'cash_intensive',
  SUSPICIOUS_PATTERN = 'suspicious_pattern'
}

export enum CustomerType {
  INDIVIDUAL = 'individual',
  SME = 'sme',
  CORPORATE = 'corporate',
  FINANCIAL_INSTITUTION = 'financial_institution',
  GOVERNMENT = 'government',
  NGO = 'ngo',
  HIGH_RISK_BUSINESS = 'high_risk_business'
}

// Interface pour les données KYC (Know Your Customer)
export interface KYCData {
  customerId: string;
  customerType: CustomerType;
  
  // Informations personnelles/entreprise
  fullName: string;
  dateOfBirth?: string;
  nationality?: string;
  countryOfResidence: string;
  
  // Identification documents
  identificationDocuments: IdentificationDocument[];
  
  // Adresse de correspondance
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  
  // Informations professionnelles
  occupation?: string;
  employer?: string;
  businessSector?: string;
  
  // Source des fonds
  sourceOfFunds: string[];
  expectedTransactionVolume: {
    monthly: number;
    currency: string;
  };
  
  // Statut PEP (Politically Exposed Person)
  isPEP: boolean;
  pepDetails?: PEPDetails;
  
  // Sanctions et listes de surveillance
  sanctionsCheck: SanctionsCheckResult;
  
  // Score de risque
  riskAssessment: RiskAssessment;
}

export interface IdentificationDocument {
  type: 'PASSPORT' | 'NATIONAL_ID' | 'DRIVERS_LICENSE' | 'RESIDENCE_PERMIT' | 'BUSINESS_REGISTRATION';
  number: string;
  issuingCountry: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate?: string;
  verified: boolean;
  verificationDate: string;
}

export interface PEPDetails {
  pepType: 'DOMESTIC' | 'FOREIGN' | 'INTERNATIONAL_ORGANIZATION';
  position: string;
  jurisdiction: string;
  startDate: string;
  endDate?: string;
  familyMember?: boolean;
  closeAssociate?: boolean;
}

export interface SanctionsCheckResult {
  isOnSanctionsList: boolean;
  listMatches: SanctionMatch[];
  lastCheckDate: string;
  nextCheckDue: string;
}

export interface SanctionMatch {
  listName: string; // OFAC, EU, UN, etc.
  matchType: 'EXACT' | 'PARTIAL' | 'PHONETIC';
  confidence: number;
  details: string;
}

export interface RiskAssessment {
  overallScore: number; // 0-100
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  lastUpdated: string;
  nextReviewDue: string;
}

export interface RiskFactor {
  category: 'GEOGRAPHIC' | 'CUSTOMER' | 'PRODUCT' | 'TRANSACTION' | 'DELIVERY_CHANNEL';
  factor: string;
  weight: number;
  score: number;
  reasoning: string;
}

// Interface pour les transactions suspectes
export interface SuspiciousTransactionReport {
  id: string;
  transactionId: string;
  customerId: string;
  reportDate: string;
  suspicionReasons: SuspicionReason[];
  amount: number;
  currency: string;
  description: string;
  status: 'PENDING' | 'FILED' | 'DISMISSED';
  filingReference?: string;
}

export interface SuspicionReason {
  category: 'UNUSUAL_AMOUNT' | 'UNUSUAL_FREQUENCY' | 'UNUSUAL_PATTERN' | 'SANCTIONS_MATCH' | 'HIGH_RISK_COUNTRY' | 'INCONSISTENT_WITH_PROFILE' | 'CASH_INTENSIVE' | 'STRUCTURED_TRANSACTIONS';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Seuils réglementaires par juridiction
export interface RegulatoryThresholds {
  jurisdiction: string;
  
  // Seuils de déclaration
  ctr_threshold: number; // Currency Transaction Report
  str_threshold: number; // Suspicious Transaction Report  
  
  // Identification clients
  cdd_threshold: number; // Customer Due Diligence
  edd_threshold: number; // Enhanced Due Diligence
  
  // Devises
  currency: string;
  
  // Période d'application
  effectiveDate: string;
  
  // Autorité de régulation
  regulator: string;
}

@Injectable()
export class AMLComplianceService {
  private readonly logger = new Logger(AMLComplianceService.name);
  
  // Seuils par juridiction (exemples)
  private readonly regulatoryThresholds: Record<string, RegulatoryThresholds> = {
    'CD': { // République Démocratique du Congo
      jurisdiction: 'CD',
      ctr_threshold: 10000, // 10,000 USD équivalent
      str_threshold: 0, // Pas de seuil - basé sur suspicion
      cdd_threshold: 1000,
      edd_threshold: 10000,
      currency: 'USD',
      effectiveDate: '2024-01-01',
      regulator: 'CENAREF (Cellule Nationale des Renseignements Financiers)'
    },
    'SN': { // Sénégal
      jurisdiction: 'SN',
      ctr_threshold: 5000000, // 5M XOF
      str_threshold: 0,
      cdd_threshold: 500000,
      edd_threshold: 5000000,
      currency: 'XOF',
      effectiveDate: '2024-01-01',
      regulator: 'CENTIF'
    },
    'US': { // États-Unis
      jurisdiction: 'US',
      ctr_threshold: 10000,
      str_threshold: 0,
      cdd_threshold: 3000,
      edd_threshold: 10000,
      currency: 'USD',
      effectiveDate: '2024-01-01',
      regulator: 'FinCEN'
    }
  };

  // Pays à haut risque selon FATF
  private readonly highRiskCountries = [
    'IR', 'KP', 'MM', 'AF', 'SY', // Tier 1 - Countries with significant deficiencies
    'PK', 'UG', 'TT', // Tier 2 - Countries under monitoring
    // Mise à jour régulière nécessaire selon les publications FATF
  ];

  /**
   * Évalue le risque d'un client selon les critères AML/CFT
   */
  async assessCustomerRisk(customer: KYCData): Promise<RiskAssessment> {
    const factors: RiskFactor[] = [];
    let totalScore = 0;

    // 1. Risque géographique
    const geoRisk = this.assessGeographicRisk(customer);
    factors.push(geoRisk);
    totalScore += geoRisk.score * geoRisk.weight;

    // 2. Risque client
    const customerRisk = this.assessCustomerRisk_Internal(customer);
    factors.push(customerRisk);
    totalScore += customerRisk.score * customerRisk.weight;

    // 3. Risque PEP
    if (customer.isPEP) {
      const pepRisk = this.assessPEPRisk(customer);
      factors.push(pepRisk);
      totalScore += pepRisk.score * pepRisk.weight;
    }

    // 4. Risque sanctions
    const sanctionsRisk = this.assessSanctionsRisk(customer);
    factors.push(sanctionsRisk);
    totalScore += sanctionsRisk.score * sanctionsRisk.weight;

    // Normaliser le score (0-100)
    const normalizedScore = Math.min(100, Math.max(0, totalScore));
    
    return {
      overallScore: normalizedScore,
      riskLevel: this.determineRiskLevel(normalizedScore),
      factors,
      lastUpdated: new Date().toISOString(),
      nextReviewDue: this.calculateNextReviewDate(normalizedScore)
    };
  }

  /**
   * Vérifie si une transaction nécessite une déclaration
   */
  async checkTransactionReporting(transaction: {
    amount: number;
    currency: string;
    customerId: string;
    customerRisk: RiskLevel;
    sourceCountry: string;
    destinationCountry: string;
    transactionType: TransactionType;
  }): Promise<{
    ctrRequired: boolean;
    strRequired: boolean;
    reasoning: string[];
  }> {
    const reasoning: string[] = [];
    let ctrRequired = false;
    let strRequired = false;

    // Obtenir les seuils applicables
    const thresholds = this.getApplicableThresholds(transaction.sourceCountry);
    
    // Convertir le montant en devise de référence si nécessaire
    const convertedAmount = await this.convertToReferenceCurrency(
      transaction.amount, 
      transaction.currency, 
      thresholds.currency
    );

    // Vérification CTR (Currency Transaction Report)
    if (convertedAmount >= thresholds.ctr_threshold) {
      ctrRequired = true;
      reasoning.push(`Amount ${convertedAmount} ${thresholds.currency} exceeds CTR threshold of ${thresholds.ctr_threshold}`);
    }

    // Vérification STR (Suspicious Transaction Report)
    const suspiciousIndicators = this.checkSuspiciousIndicators(transaction);
    if (suspiciousIndicators.length > 0) {
      strRequired = true;
      reasoning.push(`Suspicious indicators detected: ${suspiciousIndicators.join(', ')}`);
    }

    return {
      ctrRequired,
      strRequired,
      reasoning
    };
  }

  /**
   * Effectue un screening des sanctions
   */
  async performSanctionsScreening(entity: {
    name: string;
    aliases?: string[];
    dateOfBirth?: string;
    nationality?: string;
    address?: string;
  }): Promise<SanctionsCheckResult> {
    // Dans un environnement de production, ceci ferait appel à des services
    // externes comme World-Check, OFAC, etc.
    
    const matches: SanctionMatch[] = [];
    
    // Simulation de vérification sur différentes listes
    const sanctionsLists = ['OFAC_SDN', 'EU_SANCTIONS', 'UN_SANCTIONS', 'NATIONAL_SANCTIONS'];
    
    for (const listName of sanctionsLists) {
      const match = await this.checkAgainstSanctionsList(entity, listName);
      if (match) {
        matches.push(match);
      }
    }

    return {
      isOnSanctionsList: matches.length > 0,
      listMatches: matches,
      lastCheckDate: new Date().toISOString(),
      nextCheckDue: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
    };
  }

  /**
   * Génère un rapport de transaction suspecte
   */
  async generateSTR(transaction: {
    id: string;
    customerId: string;
    amount: number;
    currency: string;
    description: string;
  }, suspicionReasons: SuspicionReason[]): Promise<SuspiciousTransactionReport> {
    const str: SuspiciousTransactionReport = {
      id: `STR-${Date.now()}`,
      transactionId: transaction.id,
      customerId: transaction.customerId,
      reportDate: new Date().toISOString(),
      suspicionReasons,
      amount: transaction.amount,
      currency: transaction.currency,
      description: transaction.description,
      status: 'PENDING'
    };

    // Log de sécurité
    this.logger.warn(`STR generated for transaction ${transaction.id}`, {
      strId: str.id,
      customerId: transaction.customerId,
      reasons: suspicionReasons.map(r => r.category)
    });

    return str;
  }

  /**
   * Valide la conformité AML/CFT d'une transaction
   */
  async validateAMLCompliance(transaction: {
    id: string;
    customerId: string;
    amount: number;  
    currency: string;
    customerData: KYCData;
    sourceCountry: string;
    destinationCountry: string;
  }): Promise<{
    isCompliant: boolean;
    riskLevel: RiskLevel;
    requiredActions: string[];
    blockTransaction: boolean;
  }> {
    const requiredActions: string[] = [];
    let blockTransaction = false;
    
    // 1. Vérification sanctions
    const sanctionsResult = transaction.customerData.sanctionsCheck;
    if (sanctionsResult.isOnSanctionsList) {
      blockTransaction = true;
      requiredActions.push('BLOCK - Customer on sanctions list');
      return {
        isCompliant: false,
        riskLevel: RiskLevel.PROHIBITED,
        requiredActions,
        blockTransaction
      };
    }

    // 2. Évaluation du risque client
    const riskAssessment = await this.assessCustomerRisk(transaction.customerData);
    
    // 3. Vérification des seuils
    const reportingCheck = await this.checkTransactionReporting({
      amount: transaction.amount,
      currency: transaction.currency,
      customerId: transaction.customerId,
      customerRisk: riskAssessment.riskLevel,
      sourceCountry: transaction.sourceCountry,
      destinationCountry: transaction.destinationCountry,
      transactionType: this.determineTransactionType(transaction)
    });

    // 4. Actions requises selon le niveau de risque
    switch (riskAssessment.riskLevel) {
      case RiskLevel.VERY_HIGH:
        requiredActions.push('Enhanced Due Diligence required');
        requiredActions.push('Senior management approval required');
        break;
      case RiskLevel.HIGH:
        requiredActions.push('Additional documentation required');
        break;
      case RiskLevel.MEDIUM:
        requiredActions.push('Standard monitoring');
        break;
    }

    // 5. Déclarations requises
    if (reportingCheck.ctrRequired) {
      requiredActions.push('File CTR (Currency Transaction Report)');
    }
    
    if (reportingCheck.strRequired) {
      requiredActions.push('File STR (Suspicious Transaction Report)');
    }

    return {
      isCompliant: !blockTransaction,
      riskLevel: riskAssessment.riskLevel,
      requiredActions,
      blockTransaction
    };
  }

  // Méthodes privées d'assistance

  private assessGeographicRisk(customer: KYCData): RiskFactor {
    let score = 0;
    let reasoning = '';

    if (this.highRiskCountries.includes(customer.countryOfResidence)) {
      score = 80;
      reasoning = 'Customer resident in high-risk jurisdiction';
    } else {
      score = 20;
      reasoning = 'Standard geographic risk';
    }

    return {
      category: 'GEOGRAPHIC',
      factor: 'Country of residence',
      weight: 0.3,
      score,
      reasoning
    };
  }

  private assessCustomerRisk_Internal(customer: KYCData): RiskFactor {
    let score = 0;
    let reasoning = '';

    switch (customer.customerType) {
      case CustomerType.HIGH_RISK_BUSINESS:
        score = 90;
        reasoning = 'High-risk business category';
        break;
      case CustomerType.FINANCIAL_INSTITUTION:
        score = 60;
        reasoning = 'Financial institution - medium risk';
        break;
      case CustomerType.CORPORATE:
        score = 40;
        reasoning = 'Corporate customer - standard risk';
        break;
      default:
        score = 20;
        reasoning = 'Individual customer - low risk';
    }

    return {
      category: 'CUSTOMER',
      factor: 'Customer type',
      weight: 0.25,
      score,
      reasoning
    };
  }

  private assessPEPRisk(customer: KYCData): RiskFactor {
    if (!customer.isPEP || !customer.pepDetails) {
      return {
        category: 'CUSTOMER',
        factor: 'PEP status',
        weight: 0.2,
        score: 0,
        reasoning: 'Not a PEP'
      };
    }

    let score = 70; // Base PEP score
    let reasoning = 'Customer is a Politically Exposed Person';

    if (customer.pepDetails.pepType === 'FOREIGN') {
      score += 10;
      reasoning += ' (Foreign PEP)';
    }

    if (customer.pepDetails.familyMember || customer.pepDetails.closeAssociate) {
      score += 5;
      reasoning += ' (Family member/Close associate)';
    }

    return {
      category: 'CUSTOMER',
      factor: 'PEP status',
      weight: 0.2,
      score: Math.min(100, score),
      reasoning
    };
  }

  private assessSanctionsRisk(customer: KYCData): RiskFactor {
    const sanctionsCheck = customer.sanctionsCheck;
    
    if (sanctionsCheck.isOnSanctionsList) {
      return {
        category: 'CUSTOMER',
        factor: 'Sanctions screening',
        weight: 0.25,
        score: 100,
        reasoning: 'Customer matches sanctions list'
      };
    }

    return {
      category: 'CUSTOMER', 
      factor: 'Sanctions screening',
      weight: 0.25,
      score: 0,
      reasoning: 'No sanctions list matches'
    };
  }

  private determineRiskLevel(score: number): RiskLevel {
    if (score >= 90) return RiskLevel.VERY_HIGH;
    if (score >= 70) return RiskLevel.HIGH;
    if (score >= 40) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private calculateNextReviewDate(riskScore: number): string {
    let months = 12; // Default annual review

    if (riskScore >= 90) months = 3;  // Quarterly for very high risk
    else if (riskScore >= 70) months = 6;  // Semi-annual for high risk
    else if (riskScore >= 40) months = 12; // Annual for medium risk

    const nextReview = new Date();
    nextReview.setMonth(nextReview.getMonth() + months);
    
    return nextReview.toISOString();
  }

  private getApplicableThresholds(country: string): RegulatoryThresholds {
    return this.regulatoryThresholds[country] || this.regulatoryThresholds['US']; // Default to US
  }

  private async convertToReferenceCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    // Dans un environnement de production, utiliser un service de taux de change en temps réel
    // Pour la démonstration, utiliser des taux statiques
    const exchangeRates: Record<string, number> = {
      'XOF_USD': 0.0017,
      'CDF_USD': 0.0004,
      'EUR_USD': 1.1,
      'USD_USD': 1.0
    };

    const rate = exchangeRates[`${fromCurrency}_${toCurrency}`] || 1.0;
    return amount * rate;
  }

  private checkSuspiciousIndicators(transaction: {
    amount: number;
    customerRisk: RiskLevel;
    sourceCountry: string;
    destinationCountry: string;
    transactionType: TransactionType;
  }): string[] {
    const indicators: string[] = [];

    // Montant inhabituellement élevé
    if (transaction.amount > 50000) {
      indicators.push('High value transaction');
    }

    // Client à haut risque
    if (transaction.customerRisk === RiskLevel.HIGH || transaction.customerRisk === RiskLevel.VERY_HIGH) {
      indicators.push('High-risk customer');
    }

    // Pays à haut risque
    if (this.highRiskCountries.includes(transaction.sourceCountry) || 
        this.highRiskCountries.includes(transaction.destinationCountry)) {
      indicators.push('High-risk jurisdiction involved');
    }

    // Type de transaction suspecte
    if (transaction.transactionType === TransactionType.SUSPICIOUS_PATTERN) {
      indicators.push('Suspicious transaction pattern detected');
    }

    return indicators;
  }

  private async checkAgainstSanctionsList(entity: any, listName: string): Promise<SanctionMatch | null> {
    // Simulation - dans un environnement réel, ceci interrogerait des bases de données externes
    // Retourne null pour l'instant (pas de correspondance)
    return null;
  }

  private determineTransactionType(transaction: any): TransactionType {
    if (transaction.amount > 10000) return TransactionType.HIGH_VALUE;
    if (transaction.sourceCountry !== transaction.destinationCountry) return TransactionType.INTERNATIONAL;
    return TransactionType.DOMESTIC;
  }
}