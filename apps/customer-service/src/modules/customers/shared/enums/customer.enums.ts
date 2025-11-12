/**
 * Énumérations communes pour les clients
 * Centralisées pour éviter les duplications
 */

export enum CustomerType {
  SME = 'sme',
  FINANCIAL = 'financial'
}

export enum CustomerStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
  NEEDS_VALIDATION = 'needs_validation',
  VALIDATION_IN_PROGRESS = 'validation_in_progress'
}

export enum AccountType {
  FREEMIUM = 'freemium',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
  BUSINESS = 'business'
}

export enum CurrencyType {
  USD = 'USD',
  CDF = 'CDF',
  EUR = 'EUR'
}

/**
 * Énumérations pour les institutions financières
 */
export enum InstitutionType {
  BANQUE = 'BANQUE',
  MICROFINANCE = 'MICROFINANCE',
  COOPEC = 'COOPEC',
  FOND_GARANTIE = 'FOND_GARANTIE',
  ENTREPRISE_FINANCIERE = 'ENTREPRISE_FINANCIERE',
  FOND_CAPITAL_INVESTISSEMENT = 'FOND_CAPITAL_INVESTISSEMENT',
  FOND_IMPACT = 'FOND_IMPACT',
  AUTRE = 'AUTRE',
}

export enum InstitutionCategory {
  PRIVE = 'PRIVE',
  PUBLIC = 'PUBLIC',
  PUBLIC_PRIVE = 'PUBLIC_PRIVE',
}

export enum RegulatoryStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}