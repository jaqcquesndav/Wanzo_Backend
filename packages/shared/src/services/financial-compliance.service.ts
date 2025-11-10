/**
 * Service de validation et contrôle de conformité financière complète
 * Intègre tous les standards internationaux : ISO 20022, BIC, IBAN, LEI, FATF/GAFI
 */

import { Injectable, Logger } from '@nestjs/common';
import { FinancialStandardsService } from './financial-standards.service';
import { AMLComplianceService, RiskLevel, KYCData } from './aml-compliance.service';
import { ISO4217CurrencyCode } from '../standards/iso-standards';
import { ISO20022FinancialTransaction, ISO20022TransactionStatus, ISO20022ReasonCode } from '../entities/iso20022-financial-transaction.entity';

export interface ComplianceValidationResult {
  isFullyCompliant: boolean;
  complianceScore: number; // 0-100
  violations: ComplianceViolation[];
  recommendations: ComplianceRecommendation[];
  requiredActions: ComplianceAction[];
  blockTransaction: boolean;
  certificationLevel: CertificationLevel;
}

export interface ComplianceViolation {
  category: 'ISO_20022' | 'ISO_4217' | 'BIC_SWIFT' | 'IBAN' | 'LEI' | 'AML_CFT' | 'REGULATORY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  code: string;
  description: string;
  standard: string;
  impact: string;
}

export interface ComplianceRecommendation {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  action: string;
  benefit: string;
  implementation: string;
  timeline: string;
}

export interface ComplianceAction {
  type: 'IMMEDIATE' | 'WITHIN_24H' | 'WITHIN_WEEK' | 'MONTHLY_REVIEW';
  description: string;
  responsible: string;
  deadline?: string;
}

export enum CertificationLevel {
  NON_COMPLIANT = 'non_compliant',           // < 60% - Transaction bloquée
  BASIC_COMPLIANT = 'basic_compliant',       // 60-79% - Fonctionnel mais améliorations requises
  PROFESSIONAL_COMPLIANT = 'professional_compliant', // 80-94% - Niveau professionnel
  ENTERPRISE_CERTIFIED = 'enterprise_certified'      // 95-100% - Certification enterprise
}

@Injectable()
export class FinancialComplianceService {
  private readonly logger = new Logger(FinancialComplianceService.name);

  constructor(
    private readonly financialStandardsService: FinancialStandardsService,
    private readonly amlComplianceService: AMLComplianceService
  ) {}

  /**
   * Validation complète de conformité à 100% des standards internationaux
   */
  async validateFullCompliance(
    transaction: ISO20022FinancialTransaction,
    customerData: KYCData
  ): Promise<ComplianceValidationResult> {
    this.logger.log(`Starting full compliance validation for transaction ${transaction.id}`);

    const violations: ComplianceViolation[] = [];
    const recommendations: ComplianceRecommendation[] = [];
    const requiredActions: ComplianceAction[] = [];

    let complianceScore = 100; // Start perfect, deduct points for violations
    let blockTransaction = false;

    // === 1. VALIDATION ISO 20022 === (25 points)
    const iso20022Result = await this.validateISO20022Compliance(transaction);
    violations.push(...iso20022Result.violations);
    recommendations.push(...iso20022Result.recommendations);
    complianceScore -= iso20022Result.scoreDeduction;

    // === 2. VALIDATION ISO 4217 (DEVISES) === (15 points)
    const iso4217Result = this.validateISO4217Compliance(transaction);
    violations.push(...iso4217Result.violations);
    recommendations.push(...iso4217Result.recommendations);
    complianceScore -= iso4217Result.scoreDeduction;

    // === 3. VALIDATION BIC/SWIFT === (20 points)
    const bicResult = this.validateBICCompliance(transaction);
    violations.push(...bicResult.violations);
    recommendations.push(...bicResult.recommendations);
    complianceScore -= bicResult.scoreDeduction;

    // === 4. VALIDATION IBAN === (10 points)
    const ibanResult = this.validateIBANCompliance(transaction);
    violations.push(...ibanResult.violations);
    recommendations.push(...ibanResult.recommendations);
    complianceScore -= ibanResult.scoreDeduction;

    // === 5. VALIDATION LEI === (10 points)
    const leiResult = this.validateLEICompliance(transaction);
    violations.push(...leiResult.violations);
    recommendations.push(...leiResult.recommendations);
    complianceScore -= leiResult.scoreDeduction;

    // === 6. VALIDATION AML/CFT === (20 points)
    const amlResult = await this.validateAMLCFTCompliance(transaction, customerData);
    violations.push(...amlResult.violations);
    recommendations.push(...amlResult.recommendations);
    complianceScore -= amlResult.scoreDeduction;
    if (amlResult.blockTransaction) blockTransaction = true;

    // Normalize score
    complianceScore = Math.max(0, Math.min(100, complianceScore));

    // Determine actions based on violations
    requiredActions.push(...this.determineRequiredActions(violations, complianceScore));

    // Block transaction if critical violations
    const criticalViolations = violations.filter(v => v.severity === 'CRITICAL');
    if (criticalViolations.length > 0) {
      blockTransaction = true;
      requiredActions.push({
        type: 'IMMEDIATE',
        description: 'Transaction blocked due to critical compliance violations',
        responsible: 'Compliance Officer'
      });
    }

    const certificationLevel = this.determineCertificationLevel(complianceScore, blockTransaction);

    // Log final result
    this.logger.log(`Compliance validation completed for transaction ${transaction.id}: ${complianceScore}% - ${certificationLevel}`);

    return {
      isFullyCompliant: complianceScore >= 100 && !blockTransaction,
      complianceScore,
      violations,
      recommendations,
      requiredActions,
      blockTransaction,
      certificationLevel
    };
  }

  /**
   * Validation ISO 20022 - Messages financiers
   */
  private async validateISO20022Compliance(transaction: ISO20022FinancialTransaction) {
    const violations: ComplianceViolation[] = [];
    const recommendations: ComplianceRecommendation[] = [];
    let scoreDeduction = 0;

    // Identifiants obligatoires
    if (!transaction.endToEndReference) {
      violations.push({
        category: 'ISO_20022',
        severity: 'CRITICAL',
        code: 'ISO20022_001',
        description: 'Missing End-to-End Reference (mandatory for ISO 20022)',
        standard: 'ISO 20022',
        impact: 'Transaction cannot be processed in compliant systems'
      });
      scoreDeduction += 10;
    } else if (!this.financialStandardsService.validateStandardTransactionId(transaction.endToEndReference)) {
      violations.push({
        category: 'ISO_20022',
        severity: 'HIGH',
        code: 'ISO20022_002',
        description: 'End-to-End Reference format not compliant with ISO 20022 standards',
        standard: 'ISO 20022',
        impact: 'May cause processing delays or rejections'
      });
      scoreDeduction += 5;
    }

    if (!transaction.instructionReference) {
      violations.push({
        category: 'ISO_20022',
        severity: 'HIGH',
        code: 'ISO20022_003',
        description: 'Missing Instruction Reference',
        standard: 'ISO 20022',
        impact: 'Difficult to track transaction origin'
      });
      scoreDeduction += 3;
    }

    // Structure des parties
    if (!transaction.debtor?.name || !transaction.creditor?.name) {
      violations.push({
        category: 'ISO_20022',
        severity: 'CRITICAL',
        code: 'ISO20022_004',
        description: 'Missing party identification (debtor or creditor name)',
        standard: 'ISO 20022',
        impact: 'Transaction cannot be processed'
      });
      scoreDeduction += 15;
    }

    // UETR pour transactions internationales
    if (this.isInternationalTransaction(transaction) && !transaction.uetrReference) {
      violations.push({
        category: 'ISO_20022',
        severity: 'MEDIUM',
        code: 'ISO20022_005',
        description: 'Missing UETR for international transaction',
        standard: 'ISO 20022',
        impact: 'Reduced traceability in SWIFT network'
      });
      scoreDeduction += 2;
      
      recommendations.push({
        priority: 'HIGH',
        action: 'Generate UETR for international transactions',
        benefit: 'Enhanced traceability and faster resolution of queries',
        implementation: 'Auto-generate UUID v4 format UETR',
        timeline: 'Immediate'
      });
    }

    return { violations, recommendations, scoreDeduction };
  }

  /**
   * Validation ISO 4217 - Codes de devises
   */
  private validateISO4217Compliance(transaction: ISO20022FinancialTransaction) {
    const violations: ComplianceViolation[] = [];
    const recommendations: ComplianceRecommendation[] = [];
    let scoreDeduction = 0;

    // Validation code devise principal
    if (!this.financialStandardsService.validateCurrencyCode(transaction.currency)) {
      violations.push({
        category: 'ISO_4217',
        severity: 'CRITICAL',
        code: 'ISO4217_001',
        description: `Currency code ${transaction.currency} is not valid according to ISO 4217`,
        standard: 'ISO 4217',
        impact: 'Transaction will be rejected by compliant systems'
      });
      scoreDeduction += 15;
    } else {
      // Validation précision décimale
      const currencyProps = this.financialStandardsService.getCurrencyProperties(transaction.currency);
      const actualDecimals = this.getDecimalPlaces(transaction.amount);
      
      if (actualDecimals !== currencyProps.minorUnit) {
        violations.push({
          category: 'ISO_4217',
          severity: 'HIGH',
          code: 'ISO4217_002',
          description: `Amount decimal places (${actualDecimals}) don't match currency minor unit (${currencyProps.minorUnit}) for ${transaction.currency}`,
          standard: 'ISO 4217',
          impact: 'May cause rounding errors or processing issues'
        });
        scoreDeduction += 3;
      }
    }

    // Validation devise originale si conversion
    if (transaction.originalCurrency && !this.financialStandardsService.validateCurrencyCode(transaction.originalCurrency)) {
      violations.push({
        category: 'ISO_4217',
        severity: 'HIGH',
        code: 'ISO4217_003',
        description: `Original currency code ${transaction.originalCurrency} is not valid according to ISO 4217`,
        standard: 'ISO 4217',
        impact: 'Exchange rate validation cannot be performed'
      });
      scoreDeduction += 5;
    }

    return { violations, recommendations, scoreDeduction };
  }

  /**
   * Validation BIC/SWIFT
   */
  private validateBICCompliance(transaction: ISO20022FinancialTransaction) {
    const violations: ComplianceViolation[] = [];
    const recommendations: ComplianceRecommendation[] = [];
    let scoreDeduction = 0;

    // Validation BIC débiteur
    const debtorBIC = transaction.debtor.agent?.bic;
    if (debtorBIC) {
      const bicValidation = this.financialStandardsService.validateBIC(debtorBIC);
      if (!bicValidation.isValid) {
        violations.push({
          category: 'BIC_SWIFT',
          severity: 'HIGH',
          code: 'BIC_001',
          description: `Invalid debtor BIC format: ${debtorBIC}`,
          standard: 'ISO 9362 (BIC)',
          impact: 'Transaction routing may fail'
        });
        scoreDeduction += 8;
      }
    } else if (this.isInternationalTransaction(transaction)) {
      violations.push({
        category: 'BIC_SWIFT',
        severity: 'CRITICAL',
        code: 'BIC_002',
        description: 'Missing debtor BIC for international transaction',
        standard: 'ISO 9362 (BIC)',
        impact: 'International transaction cannot be routed'
      });
      scoreDeduction += 15;
    }

    // Validation BIC créditeur
    const creditorBIC = transaction.creditor.agent?.bic;
    if (creditorBIC) {
      const bicValidation = this.financialStandardsService.validateBIC(creditorBIC);
      if (!bicValidation.isValid) {
        violations.push({
          category: 'BIC_SWIFT',
          severity: 'HIGH',
          code: 'BIC_003',
          description: `Invalid creditor BIC format: ${creditorBIC}`,
          standard: 'ISO 9362 (BIC)',
          impact: 'Transaction routing may fail'
        });
        scoreDeduction += 8;
      }
    } else if (this.isInternationalTransaction(transaction)) {
      violations.push({
        category: 'BIC_SWIFT',
        severity: 'CRITICAL',
        code: 'BIC_004',
        description: 'Missing creditor BIC for international transaction',
        standard: 'ISO 9362 (BIC)',
        impact: 'International transaction cannot be routed'
      });
      scoreDeduction += 15;
    }

    return { violations, recommendations, scoreDeduction };
  }

  /**
   * Validation IBAN
   */
  private validateIBANCompliance(transaction: ISO20022FinancialTransaction) {
    const violations: ComplianceViolation[] = [];
    const recommendations: ComplianceRecommendation[] = [];
    let scoreDeduction = 0;

    // Validation IBAN débiteur
    const debtorIBAN = transaction.debtor.account?.iban;
    if (debtorIBAN) {
      const ibanValidation = this.financialStandardsService.validateIBAN(debtorIBAN);
      if (!ibanValidation.isValid) {
        violations.push({
          category: 'IBAN',
          severity: 'HIGH',
          code: 'IBAN_001',
          description: `Invalid debtor IBAN: ${debtorIBAN}`,
          standard: 'ISO 13616 (IBAN)',
          impact: 'Account identification may fail'
        });
        scoreDeduction += 5;
      }
    }

    // Validation IBAN créditeur
    const creditorIBAN = transaction.creditor.account?.iban;
    if (creditorIBAN) {
      const ibanValidation = this.financialStandardsService.validateIBAN(creditorIBAN);
      if (!ibanValidation.isValid) {
        violations.push({
          category: 'IBAN',
          severity: 'HIGH',
          code: 'IBAN_002',
          description: `Invalid creditor IBAN: ${creditorIBAN}`,
          standard: 'ISO 13616 (IBAN)',
          impact: 'Account identification may fail'
        });
        scoreDeduction += 5;
      }
    }

    return { violations, recommendations, scoreDeduction };
  }

  /**
   * Validation LEI (Legal Entity Identifier)
   */
  private validateLEICompliance(transaction: ISO20022FinancialTransaction) {
    const violations: ComplianceViolation[] = [];
    const recommendations: ComplianceRecommendation[] = [];
    let scoreDeduction = 0;

    // Validation LEI débiteur
    const debtorLEI = transaction.debtor.identification?.lei;
    if (debtorLEI) {
      const leiValidation = this.financialStandardsService.validateLEI(debtorLEI);
      if (!leiValidation.isValid) {
        violations.push({
          category: 'LEI',
          severity: 'MEDIUM',
          code: 'LEI_001',
          description: `Invalid debtor LEI: ${debtorLEI}`,
          standard: 'ISO 17442 (LEI)',
          impact: 'Regulatory reporting may be incomplete'
        });
        scoreDeduction += 3;
      }
    } else if (transaction.amount > 50000) { // Seuil pour LEI obligatoire
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Obtain LEI for high-value transactions',
        benefit: 'Enhanced regulatory compliance and transparency',
        implementation: 'Register with LEI issuing organization',
        timeline: '2-4 weeks'
      });
      scoreDeduction += 2;
    }

    // Validation LEI créditeur
    const creditorLEI = transaction.creditor.identification?.lei;
    if (creditorLEI) {
      const leiValidation = this.financialStandardsService.validateLEI(creditorLEI);
      if (!leiValidation.isValid) {
        violations.push({
          category: 'LEI',
          severity: 'MEDIUM',
          code: 'LEI_002',
          description: `Invalid creditor LEI: ${creditorLEI}`,
          standard: 'ISO 17442 (LEI)',
          impact: 'Regulatory reporting may be incomplete'
        });
        scoreDeduction += 3;
      }
    }

    return { violations, recommendations, scoreDeduction };
  }

  /**
   * Validation AML/CFT (Anti-Money Laundering / Counter-Financing of Terrorism)
   */
  private async validateAMLCFTCompliance(transaction: ISO20022FinancialTransaction, customerData: KYCData) {
    const violations: ComplianceViolation[] = [];
    const recommendations: ComplianceRecommendation[] = [];
    let scoreDeduction = 0;
    let blockTransaction = false;

    try {
      // Validation AML complète
      const amlResult = await this.amlComplianceService.validateAMLCompliance({
        id: transaction.id,
        customerId: transaction.companyId,
        amount: transaction.amount,
        currency: transaction.currency,
        customerData,
        sourceCountry: transaction.debtor.agent?.bic?.substring(4, 6) || 'CD',
        destinationCountry: transaction.creditor.agent?.bic?.substring(4, 6) || 'CD'
      });

      if (!amlResult.isCompliant) {
        blockTransaction = amlResult.blockTransaction;
        
        violations.push({
          category: 'AML_CFT',
          severity: blockTransaction ? 'CRITICAL' : 'HIGH',
          code: 'AML_001',
          description: `AML/CFT compliance check failed: ${amlResult.requiredActions.join(', ')}`,
          standard: 'FATF Recommendations',
          impact: blockTransaction ? 'Transaction blocked' : 'Enhanced monitoring required'
        });
        
        scoreDeduction += blockTransaction ? 20 : 10;
      }

      // Vérification des contrôles spécifiques
      if (!transaction.complianceChecks.amlCheckPassed) {
        violations.push({
          category: 'AML_CFT',
          severity: 'CRITICAL',
          code: 'AML_002',
          description: 'AML screening check failed',
          standard: 'Local AML Regulations',
          impact: 'Transaction cannot proceed'
        });
        blockTransaction = true;
        scoreDeduction += 15;
      }

      if (!transaction.complianceChecks.sanctionsCheckPassed) {
        violations.push({
          category: 'AML_CFT',
          severity: 'CRITICAL',
          code: 'AML_003',
          description: 'Sanctions screening check failed',
          standard: 'International Sanctions Lists',
          impact: 'Transaction blocked - sanctions violation'
        });
        blockTransaction = true;
        scoreDeduction += 20;
      }

    } catch (error) {
      this.logger.error(`AML/CFT validation error for transaction ${transaction.id}`, error);
      violations.push({
        category: 'AML_CFT',
        severity: 'HIGH',
        code: 'AML_999',
        description: 'AML/CFT validation service error',
        standard: 'System Integrity',
        impact: 'Cannot verify compliance status'
      });
      scoreDeduction += 5;
    }

    return { violations, recommendations, scoreDeduction, blockTransaction };
  }

  /**
   * Détermine les actions requises selon les violations
   */
  private determineRequiredActions(violations: ComplianceViolation[], score: number): ComplianceAction[] {
    const actions: ComplianceAction[] = [];

    // Actions selon criticité
    const criticalViolations = violations.filter(v => v.severity === 'CRITICAL');
    const highViolations = violations.filter(v => v.severity === 'HIGH');

    if (criticalViolations.length > 0) {
      actions.push({
        type: 'IMMEDIATE',
        description: 'Resolve critical compliance violations before processing',
        responsible: 'Compliance Officer'
      });
    }

    if (highViolations.length > 0) {
      actions.push({
        type: 'WITHIN_24H',
        description: 'Address high-priority compliance issues',
        responsible: 'Operations Team'
      });
    }

    if (score < 80) {
      actions.push({
        type: 'WITHIN_WEEK',
        description: 'Implement compliance improvements to reach professional level',
        responsible: 'Technical Team'
      });
    }

    return actions;
  }

  /**
   * Détermine le niveau de certification
   */
  private determineCertificationLevel(score: number, blocked: boolean): CertificationLevel {
    if (blocked || score < 60) return CertificationLevel.NON_COMPLIANT;
    if (score < 80) return CertificationLevel.BASIC_COMPLIANT;
    if (score < 95) return CertificationLevel.PROFESSIONAL_COMPLIANT;
    return CertificationLevel.ENTERPRISE_CERTIFIED;
  }

  // Méthodes utilitaires
  private isInternationalTransaction(transaction: ISO20022FinancialTransaction): boolean {
    const debtorCountry = transaction.debtor.agent?.bic?.substring(4, 6);
    const creditorCountry = transaction.creditor.agent?.bic?.substring(4, 6);
    return Boolean(debtorCountry !== creditorCountry && debtorCountry && creditorCountry);
  }

  private getDecimalPlaces(num: number): number {
    const str = num.toString();
    if (str.indexOf('.') !== -1) {
      return str.split('.')[1].length;
    }
    return 0;
  }

  /**
   * Génère un rapport de conformité détaillé
   */
  async generateComplianceReport(result: ComplianceValidationResult): Promise<string> {
    const report = {
      timestamp: new Date().toISOString(),
      complianceScore: result.complianceScore,
      certificationLevel: result.certificationLevel,
      summary: {
        totalViolations: result.violations.length,
        criticalViolations: result.violations.filter(v => v.severity === 'CRITICAL').length,
        highViolations: result.violations.filter(v => v.severity === 'HIGH').length,
        isBlocked: result.blockTransaction
      },
      details: {
        violations: result.violations,
        recommendations: result.recommendations,
        requiredActions: result.requiredActions
      }
    };

    return JSON.stringify(report, null, 2);
  }
}