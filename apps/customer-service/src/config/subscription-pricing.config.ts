/**
 * Configuration centralisée des plans d'abonnement et de la tarification
 * Ce fichier permet de configurer facilement tous les paramètres de tarification
 * selon l'évolution du business model
 */

export enum CustomerType {
  SME = 'sme',
  FINANCIAL_INSTITUTION = 'financial_institution'
}

export enum BillingPeriod {
  MONTHLY = 'monthly',
  ANNUAL = 'annual'
}

export enum FeatureCode {
  // Gestion commerciale
  COMMERCIAL_MANAGEMENT = 'commercial_management',
  CUSTOMER_MANAGEMENT = 'customer_management',
  SALES_TRACKING = 'sales_tracking',
  INVENTORY_MANAGEMENT = 'inventory_management',
  
  // Comptabilité
  ACCOUNTING_BASIC = 'accounting_basic',
  ACCOUNTING_ADVANCED = 'accounting_advanced',
  FINANCIAL_REPORTS = 'financial_reports',
  TAX_MANAGEMENT = 'tax_management',
  
  // IA et tokens
  AI_CHAT_ASSISTANCE = 'ai_chat_assistance',
  DOCUMENT_ANALYSIS = 'document_analysis',
  PREDICTIVE_ANALYTICS = 'predictive_analytics',
  
  // Collaboration et utilisateurs
  MULTI_USER_ACCESS = 'multi_user_access',
  USER_INVITATIONS = 'user_invitations',
  ROLE_MANAGEMENT = 'role_management',
  
  // Financement (PME)
  FINANCING_REQUESTS = 'financing_requests',
  CREDIT_SCORING = 'credit_scoring',
  
  // Prospection (Institutions)
  COMPANY_PROSPECTING = 'company_prospecting',
  PORTFOLIO_MANAGEMENT = 'portfolio_management',
  RISK_ASSESSMENT = 'risk_assessment',
  
  // Intégrations
  API_ACCESS = 'api_access',
  THIRD_PARTY_INTEGRATIONS = 'third_party_integrations',
  
  // Support
  PRIORITY_SUPPORT = 'priority_support',
  DEDICATED_SUPPORT = 'dedicated_support'
}

export interface FeatureLimit {
  enabled: boolean;
  limit?: number; // undefined = illimité
  description?: string;
}

export interface TokenAllocation {
  monthlyTokens: number;
  tokenRollover: boolean; // Les tokens non utilisés se reportent-ils au mois suivant ?
  maxRolloverMonths: number; // Nombre de mois maximum pour le report
}

export interface PlanFeatures {
  [FeatureCode.COMMERCIAL_MANAGEMENT]: FeatureLimit;
  [FeatureCode.CUSTOMER_MANAGEMENT]: FeatureLimit;
  [FeatureCode.SALES_TRACKING]: FeatureLimit;
  [FeatureCode.INVENTORY_MANAGEMENT]: FeatureLimit;
  [FeatureCode.ACCOUNTING_BASIC]: FeatureLimit;
  [FeatureCode.ACCOUNTING_ADVANCED]: FeatureLimit;
  [FeatureCode.FINANCIAL_REPORTS]: FeatureLimit;
  [FeatureCode.TAX_MANAGEMENT]: FeatureLimit;
  [FeatureCode.AI_CHAT_ASSISTANCE]: FeatureLimit;
  [FeatureCode.DOCUMENT_ANALYSIS]: FeatureLimit;
  [FeatureCode.PREDICTIVE_ANALYTICS]: FeatureLimit;
  [FeatureCode.MULTI_USER_ACCESS]: FeatureLimit;
  [FeatureCode.USER_INVITATIONS]: FeatureLimit;
  [FeatureCode.ROLE_MANAGEMENT]: FeatureLimit;
  [FeatureCode.FINANCING_REQUESTS]: FeatureLimit;
  [FeatureCode.CREDIT_SCORING]: FeatureLimit;
  [FeatureCode.COMPANY_PROSPECTING]: FeatureLimit;
  [FeatureCode.PORTFOLIO_MANAGEMENT]: FeatureLimit;
  [FeatureCode.RISK_ASSESSMENT]: FeatureLimit;
  [FeatureCode.API_ACCESS]: FeatureLimit;
  [FeatureCode.THIRD_PARTY_INTEGRATIONS]: FeatureLimit;
  [FeatureCode.PRIORITY_SUPPORT]: FeatureLimit;
  [FeatureCode.DEDICATED_SUPPORT]: FeatureLimit;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  customerType: CustomerType;
  billingPeriod: BillingPeriod;
  
  // Tarification
  monthlyPriceUSD: number;
  annualPriceUSD: number;
  annualDiscountPercentage: number; // Réduction appliquée sur le prix annuel
  
  // Allocation de tokens
  tokenAllocation: TokenAllocation;
  
  // Fonctionnalités incluses
  features: PlanFeatures;
  
  // Métadonnées
  isPopular: boolean;
  isVisible: boolean; // Pour désactiver temporairement un plan
  sortOrder: number;
  tags: string[];
}

export interface TokenPurchasePackage {
  id: string;
  name: string;
  description: string;
  tokenAmount: number;
  priceUSD: number;
  pricePerMillionTokens: number; // Calculé automatiquement
  bonusPercentage: number; // Tokens bonus offerts
  customerTypes: CustomerType[]; // Quels types de clients peuvent acheter ce package
  isVisible: boolean;
  sortOrder: number;
}

/**
 * Configuration des plans d'abonnement
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // Plans PME
  {
    id: 'sme-freemium',
    name: 'PME Freemium',
    description: 'Accès gratuit avec limitations pour découvrir la plateforme',
    customerType: CustomerType.SME,
    billingPeriod: BillingPeriod.MONTHLY,
    monthlyPriceUSD: 0,
    annualPriceUSD: 0,
    annualDiscountPercentage: 0,
    tokenAllocation: {
      monthlyTokens: 100000,
      tokenRollover: false,
      maxRolloverMonths: 0
    },
    features: {
      [FeatureCode.COMMERCIAL_MANAGEMENT]: { enabled: true, limit: 50, description: '50 clients max' },
      [FeatureCode.CUSTOMER_MANAGEMENT]: { enabled: true, limit: 50 },
      [FeatureCode.SALES_TRACKING]: { enabled: true, limit: 100, description: '100 ventes max/mois' },
      [FeatureCode.INVENTORY_MANAGEMENT]: { enabled: true, limit: 100, description: '100 produits max' },
      [FeatureCode.ACCOUNTING_BASIC]: { enabled: true, limit: 50, description: '50 transactions/mois' },
      [FeatureCode.ACCOUNTING_ADVANCED]: { enabled: false },
      [FeatureCode.FINANCIAL_REPORTS]: { enabled: false },
      [FeatureCode.TAX_MANAGEMENT]: { enabled: false },
      [FeatureCode.AI_CHAT_ASSISTANCE]: { enabled: true, limit: 100000, description: 'Limité aux tokens mensuels' },
      [FeatureCode.DOCUMENT_ANALYSIS]: { enabled: true, limit: 10, description: '10 documents/mois' },
      [FeatureCode.PREDICTIVE_ANALYTICS]: { enabled: false },
      [FeatureCode.MULTI_USER_ACCESS]: { enabled: false },
      [FeatureCode.USER_INVITATIONS]: { enabled: false },
      [FeatureCode.ROLE_MANAGEMENT]: { enabled: false },
      [FeatureCode.FINANCING_REQUESTS]: { enabled: false },
      [FeatureCode.CREDIT_SCORING]: { enabled: false },
      [FeatureCode.COMPANY_PROSPECTING]: { enabled: false },
      [FeatureCode.PORTFOLIO_MANAGEMENT]: { enabled: false },
      [FeatureCode.RISK_ASSESSMENT]: { enabled: false },
      [FeatureCode.API_ACCESS]: { enabled: false },
      [FeatureCode.THIRD_PARTY_INTEGRATIONS]: { enabled: false },
      [FeatureCode.PRIORITY_SUPPORT]: { enabled: false },
      [FeatureCode.DEDICATED_SUPPORT]: { enabled: false }
    },
    isPopular: false,
    isVisible: true,
    sortOrder: 1,
    tags: ['gratuit', 'débutant', 'limitation']
  },
  {
    id: 'sme-standard',
    name: 'PME Standard',
    description: 'Plan complet pour PME avec accès aux demandes de financement',
    customerType: CustomerType.SME,
    billingPeriod: BillingPeriod.MONTHLY,
    monthlyPriceUSD: 20,
    annualPriceUSD: 200, // 2 mois gratuits
    annualDiscountPercentage: 16.67, // (240-200)/240 * 100
    tokenAllocation: {
      monthlyTokens: 2000000,
      tokenRollover: true,
      maxRolloverMonths: 3
    },
    features: {
      [FeatureCode.COMMERCIAL_MANAGEMENT]: { enabled: true, description: 'Illimité' },
      [FeatureCode.CUSTOMER_MANAGEMENT]: { enabled: true },
      [FeatureCode.SALES_TRACKING]: { enabled: true },
      [FeatureCode.INVENTORY_MANAGEMENT]: { enabled: true },
      [FeatureCode.ACCOUNTING_BASIC]: { enabled: true },
      [FeatureCode.ACCOUNTING_ADVANCED]: { enabled: true },
      [FeatureCode.FINANCIAL_REPORTS]: { enabled: true },
      [FeatureCode.TAX_MANAGEMENT]: { enabled: true },
      [FeatureCode.AI_CHAT_ASSISTANCE]: { enabled: true },
      [FeatureCode.DOCUMENT_ANALYSIS]: { enabled: true },
      [FeatureCode.PREDICTIVE_ANALYTICS]: { enabled: true },
      [FeatureCode.MULTI_USER_ACCESS]: { enabled: true, limit: 5, description: '5 utilisateurs max' },
      [FeatureCode.USER_INVITATIONS]: { enabled: true },
      [FeatureCode.ROLE_MANAGEMENT]: { enabled: true },
      [FeatureCode.FINANCING_REQUESTS]: { enabled: true, limit: 3, description: '3 demandes/mois' },
      [FeatureCode.CREDIT_SCORING]: { enabled: true },
      [FeatureCode.COMPANY_PROSPECTING]: { enabled: false },
      [FeatureCode.PORTFOLIO_MANAGEMENT]: { enabled: false },
      [FeatureCode.RISK_ASSESSMENT]: { enabled: false },
      [FeatureCode.API_ACCESS]: { enabled: true, limit: 1000, description: '1000 calls/jour' },
      [FeatureCode.THIRD_PARTY_INTEGRATIONS]: { enabled: true, limit: 3, description: '3 intégrations' },
      [FeatureCode.PRIORITY_SUPPORT]: { enabled: true },
      [FeatureCode.DEDICATED_SUPPORT]: { enabled: false }
    },
    isPopular: true,
    isVisible: true,
    sortOrder: 2,
    tags: ['populaire', 'complet', 'financement']
  },
  
  // Plans Institution Financière
  {
    id: 'financial-freemium',
    name: 'Institution Freemium',
    description: 'Accès gratuit pour les institutions financières avec prospection limitée',
    customerType: CustomerType.FINANCIAL_INSTITUTION,
    billingPeriod: BillingPeriod.MONTHLY,
    monthlyPriceUSD: 0,
    annualPriceUSD: 0,
    annualDiscountPercentage: 0,
    tokenAllocation: {
      monthlyTokens: 500000,
      tokenRollover: false,
      maxRolloverMonths: 0
    },
    features: {
      [FeatureCode.COMMERCIAL_MANAGEMENT]: { enabled: false },
      [FeatureCode.CUSTOMER_MANAGEMENT]: { enabled: false },
      [FeatureCode.SALES_TRACKING]: { enabled: false },
      [FeatureCode.INVENTORY_MANAGEMENT]: { enabled: false },
      [FeatureCode.ACCOUNTING_BASIC]: { enabled: false },
      [FeatureCode.ACCOUNTING_ADVANCED]: { enabled: false },
      [FeatureCode.FINANCIAL_REPORTS]: { enabled: false },
      [FeatureCode.TAX_MANAGEMENT]: { enabled: false },
      [FeatureCode.AI_CHAT_ASSISTANCE]: { enabled: true },
      [FeatureCode.DOCUMENT_ANALYSIS]: { enabled: true, limit: 20, description: '20 documents/mois' },
      [FeatureCode.PREDICTIVE_ANALYTICS]: { enabled: false },
      [FeatureCode.MULTI_USER_ACCESS]: { enabled: false },
      [FeatureCode.USER_INVITATIONS]: { enabled: false },
      [FeatureCode.ROLE_MANAGEMENT]: { enabled: false },
      [FeatureCode.FINANCING_REQUESTS]: { enabled: false },
      [FeatureCode.CREDIT_SCORING]: { enabled: false },
      [FeatureCode.COMPANY_PROSPECTING]: { enabled: true, limit: 10, description: '10 entreprises fixes' },
      [FeatureCode.PORTFOLIO_MANAGEMENT]: { enabled: true, limit: 10 },
      [FeatureCode.RISK_ASSESSMENT]: { enabled: true, limit: 10 },
      [FeatureCode.API_ACCESS]: { enabled: false },
      [FeatureCode.THIRD_PARTY_INTEGRATIONS]: { enabled: false },
      [FeatureCode.PRIORITY_SUPPORT]: { enabled: false },
      [FeatureCode.DEDICATED_SUPPORT]: { enabled: false }
    },
    isPopular: false,
    isVisible: true,
    sortOrder: 3,
    tags: ['gratuit', 'institution', 'prospection-limitée']
  },
  {
    id: 'financial-professional',
    name: 'Institution Professional',
    description: 'Plan professionnel pour institutions financières',
    customerType: CustomerType.FINANCIAL_INSTITUTION,
    billingPeriod: BillingPeriod.MONTHLY,
    monthlyPriceUSD: 100,
    annualPriceUSD: 1000, // 2 mois gratuits
    annualDiscountPercentage: 16.67,
    tokenAllocation: {
      monthlyTokens: 10000000,
      tokenRollover: true,
      maxRolloverMonths: 6
    },
    features: {
      [FeatureCode.COMMERCIAL_MANAGEMENT]: { enabled: false },
      [FeatureCode.CUSTOMER_MANAGEMENT]: { enabled: false },
      [FeatureCode.SALES_TRACKING]: { enabled: false },
      [FeatureCode.INVENTORY_MANAGEMENT]: { enabled: false },
      [FeatureCode.ACCOUNTING_BASIC]: { enabled: false },
      [FeatureCode.ACCOUNTING_ADVANCED]: { enabled: false },
      [FeatureCode.FINANCIAL_REPORTS]: { enabled: false },
      [FeatureCode.TAX_MANAGEMENT]: { enabled: false },
      [FeatureCode.AI_CHAT_ASSISTANCE]: { enabled: true },
      [FeatureCode.DOCUMENT_ANALYSIS]: { enabled: true },
      [FeatureCode.PREDICTIVE_ANALYTICS]: { enabled: true },
      [FeatureCode.MULTI_USER_ACCESS]: { enabled: true, limit: 20, description: '20 utilisateurs max' },
      [FeatureCode.USER_INVITATIONS]: { enabled: true },
      [FeatureCode.ROLE_MANAGEMENT]: { enabled: true },
      [FeatureCode.FINANCING_REQUESTS]: { enabled: false },
      [FeatureCode.CREDIT_SCORING]: { enabled: false },
      [FeatureCode.COMPANY_PROSPECTING]: { enabled: true, description: 'Prospection illimitée' },
      [FeatureCode.PORTFOLIO_MANAGEMENT]: { enabled: true },
      [FeatureCode.RISK_ASSESSMENT]: { enabled: true },
      [FeatureCode.API_ACCESS]: { enabled: true, limit: 10000, description: '10000 calls/jour' },
      [FeatureCode.THIRD_PARTY_INTEGRATIONS]: { enabled: true },
      [FeatureCode.PRIORITY_SUPPORT]: { enabled: true },
      [FeatureCode.DEDICATED_SUPPORT]: { enabled: true }
    },
    isPopular: true,
    isVisible: true,
    sortOrder: 4,
    tags: ['populaire', 'institution', 'professionnel']
  }
];

/**
 * Configuration des packages d'achat de tokens
 */
export const TOKEN_PURCHASE_PACKAGES: TokenPurchasePackage[] = [
  {
    id: 'tokens-starter',
    name: 'Pack Starter',
    description: 'Parfait pour compléter votre allocation mensuelle',
    tokenAmount: 500000,
    priceUSD: 5,
    pricePerMillionTokens: 10,
    bonusPercentage: 0,
    customerTypes: [CustomerType.SME],
    isVisible: true,
    sortOrder: 1
  },
  {
    id: 'tokens-business',
    name: 'Pack Business',
    description: 'Pour les besoins intensifs en IA',
    tokenAmount: 2000000,
    priceUSD: 18,
    pricePerMillionTokens: 9,
    bonusPercentage: 10, // 200k tokens bonus
    customerTypes: [CustomerType.SME],
    isVisible: true,
    sortOrder: 2
  },
  {
    id: 'tokens-enterprise',
    name: 'Pack Enterprise',
    description: 'Volume important avec bonus attractif',
    tokenAmount: 10000000,
    priceUSD: 80,
    pricePerMillionTokens: 8,
    bonusPercentage: 25, // 2.5M tokens bonus
    customerTypes: [CustomerType.SME, CustomerType.FINANCIAL_INSTITUTION],
    isVisible: true,
    sortOrder: 3
  },
  {
    id: 'tokens-institutional',
    name: 'Pack Institutional',
    description: 'Conçu pour les institutions financières',
    tokenAmount: 50000000,
    priceUSD: 350,
    pricePerMillionTokens: 7,
    bonusPercentage: 30, // 15M tokens bonus
    customerTypes: [CustomerType.FINANCIAL_INSTITUTION],
    isVisible: true,
    sortOrder: 4
  }
];

/**
 * Configuration générale de la tarification
 */
export const PRICING_CONFIG = {
  // Devise principale
  baseCurrency: 'USD',
  
  // Réductions annuelles par défaut
  defaultAnnualDiscountPercentage: 16.67, // Équivalent à 2 mois gratuits
  
  // Prix par million de tokens par défaut
  defaultTokenPricePerMillion: 10,
  
  // Configuration des remises en volume pour tokens
  volumeDiscounts: [
    { minTokens: 1000000, discountPercentage: 5 },
    { minTokens: 5000000, discountPercentage: 10 },
    { minTokens: 10000000, discountPercentage: 15 },
    { minTokens: 50000000, discountPercentage: 20 }
  ],
  
  // Paramètres de rollover des tokens
  defaultTokenRolloverMonths: 3,
  maxTokenRolloverMonths: 6,
  
  // Limites par défaut pour les fonctionnalités
  defaultFeatureLimits: {
    freeUsers: 1,
    standardUsers: 5,
    premiumUsers: 20,
    enterpriseUsers: 100
  },
  
  // Configuration des périodes d'essai
  trialPeriods: {
    sme: {
      durationDays: 14,
      includedTokens: 500000
    },
    financial: {
      durationDays: 30,
      includedTokens: 2000000
    }
  }
};

/**
 * Utilitaires pour récupérer les configurations
 */
export class PricingConfigService {
  /**
   * Récupère un plan par son ID
   */
  static getPlanById(planId: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
  }
  
  /**
   * Récupère les plans disponibles pour un type de client
   */
  static getPlansByCustomerType(customerType: CustomerType): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS.filter(plan => 
      plan.customerType === customerType && plan.isVisible
    ).sort((a, b) => a.sortOrder - b.sortOrder);
  }
  
  /**
   * Récupère un package de tokens par son ID
   */
  static getTokenPackageById(packageId: string): TokenPurchasePackage | undefined {
    return TOKEN_PURCHASE_PACKAGES.find(pkg => pkg.id === packageId);
  }
  
  /**
   * Récupère les packages de tokens disponibles pour un type de client
   */
  static getTokenPackagesByCustomerType(customerType: CustomerType): TokenPurchasePackage[] {
    return TOKEN_PURCHASE_PACKAGES.filter(pkg => 
      pkg.customerTypes.includes(customerType) && pkg.isVisible
    ).sort((a, b) => a.sortOrder - b.sortOrder);
  }
  
  /**
   * Calcule le prix annuel avec réduction
   */
  static calculateAnnualPrice(monthlyPrice: number, discountPercentage: number = PRICING_CONFIG.defaultAnnualDiscountPercentage): number {
    const annualPriceWithoutDiscount = monthlyPrice * 12;
    return annualPriceWithoutDiscount * (1 - discountPercentage / 100);
  }
  
  /**
   * Vérifie si une fonctionnalité est disponible pour un plan
   */
  static isFeatureAvailable(planId: string, featureCode: FeatureCode): boolean {
    const plan = this.getPlanById(planId);
    return plan ? plan.features[featureCode]?.enabled || false : false;
  }
  
  /**
   * Récupère la limite d'une fonctionnalité pour un plan
   */
  static getFeatureLimit(planId: string, featureCode: FeatureCode): number | undefined {
    const plan = this.getPlanById(planId);
    return plan ? plan.features[featureCode]?.limit : undefined;
  }
  
  /**
   * Calcule les tokens bonus pour un achat
   */
  static calculateBonusTokens(packageId: string): number {
    const pkg = this.getTokenPackageById(packageId);
    if (!pkg) return 0;
    return Math.floor(pkg.tokenAmount * pkg.bonusPercentage / 100);
  }
}
