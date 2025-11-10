/**
 * Service de validation et génération d'identifiants financiers internationaux
 * Conforme aux standards ISO 20022, BIC, IBAN, LEI
 */

import { Injectable } from '@nestjs/common';
import { 
  ISO4217CurrencyCode, 
  ISO4217_CURRENCY_DATA,
  IBANValidator,
  BICValidator,
  LEIValidator,
  IBANValidation,
  BICValidation,
  LEIValidation
} from '../standards/iso-standards';

export interface FinancialIdentifierGenerationOptions {
  entityCode: string;
  transactionType: 'PAY' | 'FUND' | 'CONT' | 'DISB' | 'REPAY' | 'COLL' | 'TRAN';
  includeChecksum: boolean;
}

export interface StandardTransactionId {
  id: string;
  format: 'ISO20022';
  components: {
    date: string;        // YYYYMMDD
    entity: string;      // Code entité (4 chars)
    type: string;        // Type transaction (4 chars)  
    sequence: string;    // Numéro séquentiel (6 digits)
    checksum: string;    // Hash de vérification (4 chars)
  };
}

@Injectable()
export class FinancialStandardsService {
  
  /**
   * Génère un identifiant de transaction conforme ISO 20022
   * Format: YYYYMMDD-AAAA-TTTT-NNNNNN-HHHH
   * 
   * @param options Options de génération
   * @returns Identifiant standard
   */
  generateStandardTransactionId(options: FinancialIdentifierGenerationOptions): StandardTransactionId {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const entity = options.entityCode.padEnd(4, '0').substring(0, 4).toUpperCase();
    const type = options.transactionType.padEnd(4, '0').substring(0, 4);
    const sequence = this.generateSequenceNumber();
    
    let checksum = '';
    if (options.includeChecksum) {
      const baseString = `${date}${entity}${type}${sequence}`;
      checksum = this.generateChecksum(baseString);
    }

    const id = options.includeChecksum 
      ? `${date}-${entity}-${type}-${sequence}-${checksum}`
      : `${date}-${entity}-${type}-${sequence}`;

    return {
      id,
      format: 'ISO20022',
      components: {
        date,
        entity,
        type,
        sequence,
        checksum
      }
    };
  }

  /**
   * Valide un code de devise ISO 4217
   */
  validateCurrencyCode(currencyCode: string): boolean {
    return Object.values(ISO4217CurrencyCode).includes(currencyCode as ISO4217CurrencyCode);
  }

  /**
   * Obtient les propriétés d'une devise ISO 4217
   */
  getCurrencyProperties(currencyCode: ISO4217CurrencyCode) {
    return ISO4217_CURRENCY_DATA[currencyCode];
  }

  /**
   * Valide et formate un montant selon la devise
   */
  formatAmountByCurrency(amount: number, currencyCode: ISO4217CurrencyCode): string {
    const properties = this.getCurrencyProperties(currencyCode);
    if (!properties) {
      throw new Error(`Currency ${currencyCode} not supported`);
    }

    return amount.toFixed(properties.minorUnit);
  }

  /**
   * Valide un IBAN
   */
  validateIBAN(iban: string): IBANValidation {
    return IBANValidator.validate(iban);
  }

  /**
   * Valide un code BIC/SWIFT
   */
  validateBIC(bic: string): BICValidation {
    return BICValidator.validate(bic);
  }

  /**
   * Valide un LEI (Legal Entity Identifier)
   */
  validateLEI(lei: string): LEIValidation {
    return LEIValidator.validate(lei);
  }

  /**
   * Génère un numéro de séquence unique basé sur timestamp
   */
  private generateSequenceNumber(): string {
    const timestamp = Date.now();
    const sequence = (timestamp % 1000000).toString().padStart(6, '0');
    return sequence;
  }

  /**
   * Génère un checksum pour validation
   */
  private generateChecksum(input: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    return hash.substring(0, 4).toUpperCase();
  }

  /**
   * Valide un identifiant de transaction standard
   */
  validateStandardTransactionId(transactionId: string): boolean {
    const parts = transactionId.split('-');
    
    // Format avec checksum: 5 parties
    // Format sans checksum: 4 parties
    if (parts.length !== 4 && parts.length !== 5) {
      return false;
    }

    const [date, entity, type, sequence, checksum] = parts;

    // Validation date (YYYYMMDD)
    if (!/^\d{8}$/.test(date)) return false;

    // Validation entity (4 caractères alphanumériques)
    if (!/^[A-Z0-9]{4}$/.test(entity)) return false;

    // Validation type (4 caractères)
    if (!/^[A-Z0-9]{4}$/.test(type)) return false;

    // Validation sequence (6 digits)
    if (!/^\d{6}$/.test(sequence)) return false;

    // Validation checksum si présent
    if (checksum && !/^[A-Z0-9]{4}$/.test(checksum)) return false;

    // Vérification checksum si présent
    if (checksum) {
      const baseString = `${date}${entity}${type}${sequence}`;
      const expectedChecksum = this.generateChecksum(baseString);
      return checksum === expectedChecksum;
    }

    return true;
  }

  /**
   * Génère les identifiants pour différents types d'entités
   */
  generateEntityIdentifiers() {
    return {
      // Wanzo Platform
      WANZO: {
        payment: this.generateStandardTransactionId({
          entityCode: 'WNZO',
          transactionType: 'PAY',
          includeChecksum: true
        }),
        funding: this.generateStandardTransactionId({
          entityCode: 'WNZO', 
          transactionType: 'FUND',
          includeChecksum: true
        })
      },
      
      // Institutions bancaires
      BANK: {
        disbursement: this.generateStandardTransactionId({
          entityCode: 'BANK',
          transactionType: 'DISB', 
          includeChecksum: true
        })
      },
      
      // Institutions de microfinance  
      MFI: {
        collection: this.generateStandardTransactionId({
          entityCode: 'MFI0',
          transactionType: 'COLL',
          includeChecksum: true
        })
      }
    };
  }

  /**
   * Vérifie la conformité d'une transaction aux standards internationaux
   */
  validateTransactionCompliance(transaction: {
    id?: string;
    amount: number;
    currency: string;
    bicCode?: string;
    iban?: string;
    lei?: string;
  }): {
    isCompliant: boolean;
    violations: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Validation ID transaction
    if (transaction.id && !this.validateStandardTransactionId(transaction.id)) {
      violations.push('Transaction ID does not conform to ISO 20022 standard');
      recommendations.push('Use generateStandardTransactionId() method');
    }

    // Validation devise
    if (!this.validateCurrencyCode(transaction.currency)) {
      violations.push(`Currency code ${transaction.currency} is not ISO 4217 compliant`);
      recommendations.push('Use ISO4217CurrencyCode enum for currency codes');
    }

    // Validation BIC si fourni
    if (transaction.bicCode) {
      const bicValidation = this.validateBIC(transaction.bicCode);
      if (!bicValidation.isValid) {
        violations.push('BIC code format is invalid');
        recommendations.push('Verify BIC code format (8 or 11 characters)');
      }
    }

    // Validation IBAN si fourni  
    if (transaction.iban) {
      const ibanValidation = this.validateIBAN(transaction.iban);
      if (!ibanValidation.isValid) {
        violations.push('IBAN format is invalid');
        recommendations.push('Verify IBAN format and check digits');
      }
    }

    // Validation LEI si fourni
    if (transaction.lei) {
      const leiValidation = this.validateLEI(transaction.lei);
      if (!leiValidation.isValid) {
        violations.push('LEI format is invalid');
        recommendations.push('Verify LEI format (20 characters with valid check digits)');
      }
    }

    // Validation montant selon devise
    try {
      const currencyCode = transaction.currency as ISO4217CurrencyCode;
      if (this.validateCurrencyCode(currencyCode)) {
        const properties = this.getCurrencyProperties(currencyCode);
        const expectedDecimals = properties.minorUnit;
        const actualDecimals = transaction.amount.toString().split('.')[1]?.length || 0;
        
        if (actualDecimals !== expectedDecimals) {
          violations.push(`Amount decimals (${actualDecimals}) don't match currency minor unit (${expectedDecimals})`);
          recommendations.push(`Use ${expectedDecimals} decimal places for ${currencyCode}`);
        }
      }
    } catch (error) {
      // Erreur déjà capturée dans validation devise
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      recommendations
    };
  }
}