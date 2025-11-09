/**
 * Configuration centralisée des plans d'abonnement et de la tarification
 * Nouvelle approche basée sur les fonctionnalités métier monétisables
 */

import { BusinessFeature, BusinessFeaturesByCustomerType } from '@wanzobe/shared';

export enum CustomerType {
  SME = 'sme',
  FINANCIAL_INSTITUTION = 'financial_institution'
}

export enum BillingPeriod {
  MONTHLY = 'monthly',
  ANNUAL = 'annual'
}

// Maintenir la compatibilité avec l'ancien système
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

// === NOUVELLES INTERFACES POUR FONCTIONNALITÉS MÉTIER ===

export interface BusinessFeatureConfig {
  enabled: boolean;
  limit: number; // -1 = illimité, 0 = désactivé, >0 = limite
  periodType: 'daily' | 'monthly' | 'yearly';
  description?: string;
  warningThreshold?: number; // % pour déclencher les alertes (défaut: 80%)
}

export interface TokenAllocation {
  monthlyTokens: number;
  tokenRollover: boolean;
  maxRolloverMonths: number;
}

// Interface pour les restrictions métier par plan
export interface BusinessPlanRestrictions {
  // === FONCTIONNALITÉS COMPTABLES ===
  [BusinessFeature.ACCOUNTING_ENTRIES_MONTHLY]?: BusinessFeatureConfig;
  [BusinessFeature.AUTOMATED_ACCOUNTING_ENTRIES]?: BusinessFeatureConfig;
  [BusinessFeature.FINANCIAL_REPORTS_GENERATION]?: BusinessFeatureConfig;
  [BusinessFeature.TAX_COMPUTATION_REQUESTS]?: BusinessFeatureConfig;
  [BusinessFeature.CASH_FLOW_ANALYSIS]?: BusinessFeatureConfig;
  
  // === GESTION COMMERCIALE ===
  [BusinessFeature.ACTIVE_CUSTOMERS_LIMIT]?: BusinessFeatureConfig;
  [BusinessFeature.INVOICES_GENERATION_MONTHLY]?: BusinessFeatureConfig;
  [BusinessFeature.SALES_TRANSACTIONS_MONTHLY]?: BusinessFeatureConfig;
  [BusinessFeature.INVENTORY_ITEMS_LIMIT]?: BusinessFeatureConfig;
  [BusinessFeature.SALES_REPORTS_MONTHLY]?: BusinessFeatureConfig;
  
  // === FINANCEMENT PME ===
  [BusinessFeature.FINANCING_REQUESTS_MONTHLY]?: BusinessFeatureConfig;
  [BusinessFeature.CREDIT_AMOUNT_LIMIT_USD]?: BusinessFeatureConfig;
  [BusinessFeature.CREDIT_SCORING_REQUESTS]?: BusinessFeatureConfig;
  [BusinessFeature.LOAN_SIMULATION_REQUESTS]?: BusinessFeatureConfig;
  [BusinessFeature.BUSINESS_VALUATION_REQUESTS]?: BusinessFeatureConfig;
  
  // === PORTFOLIO INSTITUTION ===
  [BusinessFeature.PORTFOLIO_USERS_LIMIT]?: BusinessFeatureConfig;
  [BusinessFeature.PROSPECTABLE_COMPANIES_LIMIT]?: BusinessFeatureConfig;
  [BusinessFeature.MANAGED_PORTFOLIOS_LIMIT]?: BusinessFeatureConfig;
  [BusinessFeature.CREDIT_APPLICATIONS_MONTHLY]?: BusinessFeatureConfig;
  [BusinessFeature.RISK_ASSESSMENTS_MONTHLY]?: BusinessFeatureConfig;
  [BusinessFeature.REGULATORY_REPORTING]?: BusinessFeatureConfig;
  
  // === INTELLIGENCE ARTIFICIELLE ===
  [BusinessFeature.AI_CHAT_TOKENS_MONTHLY]?: BusinessFeatureConfig;
  [BusinessFeature.DOCUMENT_ANALYSIS_REQUESTS]?: BusinessFeatureConfig;
  [BusinessFeature.PREDICTIVE_ANALYTICS_REQUESTS]?: BusinessFeatureConfig;
  [BusinessFeature.AUTOMATED_INSIGHTS_GENERATION]?: BusinessFeatureConfig;
  [BusinessFeature.FRAUD_DETECTION_SCANS]?: BusinessFeatureConfig;
  
  // === COLLABORATION & UTILISATEURS ===
  [BusinessFeature.ACTIVE_USERS_LIMIT]?: BusinessFeatureConfig;
  [BusinessFeature.USER_ROLES_LIMIT]?: BusinessFeatureConfig;
  [BusinessFeature.CONCURRENT_SESSIONS_LIMIT]?: BusinessFeatureConfig;
  [BusinessFeature.TEAM_WORKSPACES_LIMIT]?: BusinessFeatureConfig;
  
  // === INTÉGRATIONS & API ===
  [BusinessFeature.API_CALLS_DAILY]?: BusinessFeatureConfig;
  [BusinessFeature.THIRD_PARTY_INTEGRATIONS_LIMIT]?: BusinessFeatureConfig;
  [BusinessFeature.DATA_EXPORT_REQUESTS_MONTHLY]?: BusinessFeatureConfig;
  [BusinessFeature.WEBHOOK_ENDPOINTS_LIMIT]?: BusinessFeatureConfig;
  
  // === ANALYTICS & REPORTING ===
  [BusinessFeature.CUSTOM_REPORTS_MONTHLY]?: BusinessFeatureConfig;
  [BusinessFeature.DASHBOARD_WIDGETS_LIMIT]?: BusinessFeatureConfig;
  [BusinessFeature.SCHEDULED_REPORTS_LIMIT]?: BusinessFeatureConfig;
  
  // === CONFORMITÉ & SÉCURITÉ ===
  [BusinessFeature.AUDIT_LOGS_RETENTION_DAYS]?: BusinessFeatureConfig;
  [BusinessFeature.COMPLIANCE_CHECKS_MONTHLY]?: BusinessFeatureConfig;
  [BusinessFeature.SECURITY_SCANS_MONTHLY]?: BusinessFeatureConfig;
  
  // === SUPPORT & SERVICES ===
  [BusinessFeature.PRIORITY_SUPPORT_TICKETS]?: BusinessFeatureConfig;
  [BusinessFeature.DEDICATED_ACCOUNT_MANAGER]?: BusinessFeatureConfig;
  [BusinessFeature.TRAINING_SESSIONS_MONTHLY]?: BusinessFeatureConfig;
  
  // === FONCTIONNALITÉS AVANCÉES ===
  [BusinessFeature.WHITE_LABEL_CUSTOMIZATION]?: BusinessFeatureConfig;
  [BusinessFeature.CUSTOM_BRANDING]?: BusinessFeatureConfig;
  [BusinessFeature.WORKFLOW_AUTOMATION_RULES]?: BusinessFeatureConfig;
  [BusinessFeature.ADVANCED_ANALYTICS_FEATURES]?: BusinessFeatureConfig;
  [BusinessFeature.COMPLIANCE_MONITORING_TOOLS]?: BusinessFeatureConfig;
  [BusinessFeature.COMPANY_SCREENING_REQUESTS]?: BusinessFeatureConfig;
  [BusinessFeature.CUSTOM_DEVELOPMENT_HOURS]?: BusinessFeatureConfig;
  [BusinessFeature.PORTFOLIO_ANALYTICS_ACCESS]?: BusinessFeatureConfig;
}

// Maintenir la compatibilité avec l'ancienne interface
export interface FeatureLimit {
  enabled: boolean;
  limit?: number;
  description?: string;
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

// === NOUVELLE INTERFACE POUR LES PLANS MÉTIER ===

export interface BusinessSubscriptionPlan {
  id: string;
  name: string;
  description: string;
  customerType: CustomerType;
  billingPeriod: BillingPeriod;
  
  // Tarification
  monthlyPriceUSD: number;
  annualPriceUSD: number;
  annualDiscountPercentage: number;
  
  // Configuration des restrictions métier
  businessRestrictions: BusinessPlanRestrictions;
  
  // Allocation de tokens IA
  tokenAllocation: TokenAllocation;
  
  // Métadonnées
  isPopular: boolean;
  isVisible: boolean;
  sortOrder: number;
  tags: string[];
  category: 'freemium' | 'starter' | 'professional' | 'enterprise' | 'custom';
  
  // Nouvelle propriété pour les bénéfices marketing
  marketingBenefits: string[];
  valueProposition: string;
  targetAudience: string;
}

// Maintenir la compatibilité avec l'ancienne interface
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  customerType: CustomerType;
  billingPeriod: BillingPeriod;
  
  // Tarification
  monthlyPriceUSD: number;
  annualPriceUSD: number;
  annualDiscountPercentage: number;
  
  // Allocation de tokens
  tokenAllocation: TokenAllocation;
  
  // Fonctionnalités incluses (ancienne approche)
  features: PlanFeatures;
  
  // Métadonnées
  isPopular: boolean;
  isVisible: boolean;
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
 * NOUVEAUX PLANS D'ABONNEMENT BASÉS SUR LES FONCTIONNALITÉS MÉTIER
 * Approche centrée sur la valeur business et la monétisation
 */
export const BUSINESS_SUBSCRIPTION_PLANS: BusinessSubscriptionPlan[] = [
  // === PLANS PME ===
  
  {
    id: 'sme-freemium-2025',
    name: 'PME Découverte',
    description: 'Parfait pour découvrir Wanzo avec les fonctionnalités essentielles',
    customerType: CustomerType.SME,
    billingPeriod: BillingPeriod.MONTHLY,
    monthlyPriceUSD: 0,
    annualPriceUSD: 0,
    annualDiscountPercentage: 0,
    
    businessRestrictions: {
      // Comptabilité limitée mais fonctionnelle
      [BusinessFeature.ACCOUNTING_ENTRIES_MONTHLY]: {
        enabled: true,
        limit: 50,
        periodType: 'monthly',
        description: '50 écritures comptables par mois'
      },
      [BusinessFeature.AUTOMATED_ACCOUNTING_ENTRIES]: {
        enabled: false,
        limit: 0,
        periodType: 'monthly',
        description: 'Comptabilité automatisée non incluse'
      },
      [BusinessFeature.FINANCIAL_REPORTS_GENERATION]: {
        enabled: true,
        limit: 3,
        periodType: 'monthly',
        description: '3 rapports financiers par mois'
      },
      
      // Gestion commerciale de base
      [BusinessFeature.ACTIVE_CUSTOMERS_LIMIT]: {
        enabled: true,
        limit: 25,
        periodType: 'monthly',
        description: '25 clients actifs maximum'
      },
      [BusinessFeature.INVOICES_GENERATION_MONTHLY]: {
        enabled: true,
        limit: 30,
        periodType: 'monthly',
        description: '30 factures par mois'
      },
      [BusinessFeature.INVENTORY_ITEMS_LIMIT]: {
        enabled: true,
        limit: 50,
        periodType: 'monthly',
        description: '50 articles en stock'
      },
      
      // Pas de financement
      [BusinessFeature.FINANCING_REQUESTS_MONTHLY]: {
        enabled: false,
        limit: 0,
        periodType: 'monthly',
        description: 'Demandes de financement non incluses'
      },
      [BusinessFeature.CREDIT_SCORING_REQUESTS]: {
        enabled: false,
        limit: 0,
        periodType: 'monthly'
      },
      
      // IA limitée
      [BusinessFeature.AI_CHAT_TOKENS_MONTHLY]: {
        enabled: true,
        limit: 100000,
        periodType: 'monthly',
        description: '100K tokens IA par mois'
      },
      [BusinessFeature.DOCUMENT_ANALYSIS_REQUESTS]: {
        enabled: true,
        limit: 5,
        periodType: 'monthly',
        description: '5 analyses de documents par mois'
      },
      
      // Collaboration basique
      [BusinessFeature.ACTIVE_USERS_LIMIT]: {
        enabled: true,
        limit: 2,
        periodType: 'monthly',
        description: '2 utilisateurs (propriétaire + 1 employé)'
      },
      
      // API limitée
      [BusinessFeature.API_CALLS_DAILY]: {
        enabled: true,
        limit: 100,
        periodType: 'daily',
        description: '100 appels API par jour'
      }
    },
    
    tokenAllocation: {
      monthlyTokens: 100000,
      tokenRollover: false,
      maxRolloverMonths: 0
    },
    
    isPopular: false,
    isVisible: true,
    sortOrder: 1,
    tags: ['gratuit', 'débutant', 'pme'],
    category: 'freemium',
    marketingBenefits: [
      'Comptabilité simplifiée',
      'Facturation automatique',
      'Gestion stock de base',
      'Assistant IA inclus'
    ],
    valueProposition: 'Démarrez gratuitement avec les outils essentiels pour votre PME',
    targetAudience: 'Très petites entreprises et entrepreneurs individuels'
  },

  {
    id: 'sme-starter-2025',
    name: 'PME Starter',
    description: 'Plan complet pour PME en croissance avec financement',
    customerType: CustomerType.SME,
    billingPeriod: BillingPeriod.MONTHLY,
    monthlyPriceUSD: 29,
    annualPriceUSD: 290, // 2 mois gratuits
    annualDiscountPercentage: 16.67,
    
    businessRestrictions: {
      // Comptabilité étendue
      [BusinessFeature.ACCOUNTING_ENTRIES_MONTHLY]: {
        enabled: true,
        limit: 300,
        periodType: 'monthly',
        description: '300 écritures comptables par mois'
      },
      [BusinessFeature.AUTOMATED_ACCOUNTING_ENTRIES]: {
        enabled: true,
        limit: 100,
        periodType: 'monthly',
        description: '100 écritures automatisées ADHA par mois'
      },
      [BusinessFeature.FINANCIAL_REPORTS_GENERATION]: {
        enabled: true,
        limit: 15,
        periodType: 'monthly',
        description: '15 rapports financiers par mois'
      },
      [BusinessFeature.TAX_COMPUTATION_REQUESTS]: {
        enabled: true,
        limit: 5,
        periodType: 'monthly',
        description: '5 calculs fiscaux par mois'
      },
      [BusinessFeature.CASH_FLOW_ANALYSIS]: {
        enabled: true,
        limit: 10,
        periodType: 'monthly',
        description: '10 analyses de trésorerie par mois'
      },
      
      // Gestion commerciale complète
      [BusinessFeature.ACTIVE_CUSTOMERS_LIMIT]: {
        enabled: true,
        limit: 200,
        periodType: 'monthly',
        description: '200 clients actifs'
      },
      [BusinessFeature.INVOICES_GENERATION_MONTHLY]: {
        enabled: true,
        limit: 150,
        periodType: 'monthly',
        description: '150 factures par mois'
      },
      [BusinessFeature.SALES_TRANSACTIONS_MONTHLY]: {
        enabled: true,
        limit: 500,
        periodType: 'monthly',
        description: '500 transactions de vente par mois'
      },
      [BusinessFeature.INVENTORY_ITEMS_LIMIT]: {
        enabled: true,
        limit: 500,
        periodType: 'monthly',
        description: '500 articles en stock'
      },
      [BusinessFeature.SALES_REPORTS_MONTHLY]: {
        enabled: true,
        limit: 20,
        periodType: 'monthly',
        description: '20 rapports de vente par mois'
      },
      
      // FINANCEMENT - Fonctionnalité clé
      [BusinessFeature.FINANCING_REQUESTS_MONTHLY]: {
        enabled: true,
        limit: 3,
        periodType: 'monthly',
        description: '3 demandes de financement par mois',
        warningThreshold: 70
      },
      [BusinessFeature.CREDIT_AMOUNT_LIMIT_USD]: {
        enabled: true,
        limit: 50000,
        periodType: 'yearly',
        description: 'Jusqu\'à 50 000$ de crédit sollicitable'
      },
      [BusinessFeature.CREDIT_SCORING_REQUESTS]: {
        enabled: true,
        limit: 8,
        periodType: 'monthly',
        description: '8 calculs de cote crédit par mois'
      },
      [BusinessFeature.LOAN_SIMULATION_REQUESTS]: {
        enabled: true,
        limit: 20,
        periodType: 'monthly',
        description: '20 simulations de prêt par mois'
      },
      
      // IA renforcée
      [BusinessFeature.AI_CHAT_TOKENS_MONTHLY]: {
        enabled: true,
        limit: 1500000,
        periodType: 'monthly',
        description: '1.5M tokens IA par mois'
      },
      [BusinessFeature.DOCUMENT_ANALYSIS_REQUESTS]: {
        enabled: true,
        limit: 50,
        periodType: 'monthly',
        description: '50 analyses de documents par mois'
      },
      [BusinessFeature.PREDICTIVE_ANALYTICS_REQUESTS]: {
        enabled: true,
        limit: 15,
        periodType: 'monthly',
        description: '15 analyses prédictives par mois'
      },
      
      // Collaboration équipe
      [BusinessFeature.ACTIVE_USERS_LIMIT]: {
        enabled: true,
        limit: 8,
        periodType: 'monthly',
        description: '8 utilisateurs actifs'
      },
      [BusinessFeature.USER_ROLES_LIMIT]: {
        enabled: true,
        limit: 5,
        periodType: 'monthly',
        description: '5 rôles personnalisés'
      },
      [BusinessFeature.CONCURRENT_SESSIONS_LIMIT]: {
        enabled: true,
        limit: 15,
        periodType: 'daily',
        description: '15 sessions simultanées'
      },
      
      // Intégrations
      [BusinessFeature.API_CALLS_DAILY]: {
        enabled: true,
        limit: 2000,
        periodType: 'daily',
        description: '2000 appels API par jour'
      },
      [BusinessFeature.THIRD_PARTY_INTEGRATIONS_LIMIT]: {
        enabled: true,
        limit: 5,
        periodType: 'monthly',
        description: '5 intégrations tierces'
      }
    },
    
    tokenAllocation: {
      monthlyTokens: 1500000,
      tokenRollover: true,
      maxRolloverMonths: 3
    },
    
    isPopular: true,
    isVisible: true,
    sortOrder: 2,
    tags: ['populaire', 'pme', 'financement', 'croissance'],
    category: 'starter',
    marketingBenefits: [
      'Comptabilité automatisée ADHA',
      'Demandes de financement incluses',
      'Cote crédit professionnelle',
      'Équipe jusqu\'à 8 personnes',
      'Intégrations avancées'
    ],
    valueProposition: 'Tout ce dont votre PME a besoin pour croître et accéder au financement',
    targetAudience: 'PME en croissance, 5-20 employés, besoin de financement'
  },

  {
    id: 'sme-professional-2025',
    name: 'PME Professional',
    description: 'Solution complète pour PME établies avec besoins avancés',
    customerType: CustomerType.SME,
    billingPeriod: BillingPeriod.MONTHLY,
    monthlyPriceUSD: 79,
    annualPriceUSD: 790, // 2 mois gratuits
    annualDiscountPercentage: 16.67,
    
    businessRestrictions: {
      // Comptabilité illimitée
      [BusinessFeature.ACCOUNTING_ENTRIES_MONTHLY]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Écritures comptables illimitées'
      },
      [BusinessFeature.AUTOMATED_ACCOUNTING_ENTRIES]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Comptabilité automatisée illimitée'
      },
      [BusinessFeature.FINANCIAL_REPORTS_GENERATION]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Rapports financiers illimités'
      },
      [BusinessFeature.TAX_COMPUTATION_REQUESTS]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Calculs fiscaux illimités'
      },
      [BusinessFeature.CASH_FLOW_ANALYSIS]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Analyses de trésorerie illimitées'
      },
      
      // Commercial étendu
      [BusinessFeature.ACTIVE_CUSTOMERS_LIMIT]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Clients illimités'
      },
      [BusinessFeature.INVOICES_GENERATION_MONTHLY]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Facturation illimitée'
      },
      [BusinessFeature.SALES_TRANSACTIONS_MONTHLY]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Transactions illimitées'
      },
      [BusinessFeature.INVENTORY_ITEMS_LIMIT]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Stock illimité'
      },
      
      // Financement premium
      [BusinessFeature.FINANCING_REQUESTS_MONTHLY]: {
        enabled: true,
        limit: 10,
        periodType: 'monthly',
        description: '10 demandes de financement par mois'
      },
      [BusinessFeature.CREDIT_AMOUNT_LIMIT_USD]: {
        enabled: true,
        limit: 250000,
        periodType: 'yearly',
        description: 'Jusqu\'à 250 000$ de crédit sollicitable'
      },
      [BusinessFeature.CREDIT_SCORING_REQUESTS]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Cote crédit illimitée'
      },
      [BusinessFeature.BUSINESS_VALUATION_REQUESTS]: {
        enabled: true,
        limit: 5,
        periodType: 'monthly',
        description: '5 évaluations d\'entreprise par mois'
      },
      
      // IA avancée
      [BusinessFeature.AI_CHAT_TOKENS_MONTHLY]: {
        enabled: true,
        limit: 5000000,
        periodType: 'monthly',
        description: '5M tokens IA par mois'
      },
      [BusinessFeature.DOCUMENT_ANALYSIS_REQUESTS]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Analyse de documents illimitée'
      },
      [BusinessFeature.PREDICTIVE_ANALYTICS_REQUESTS]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Analytics prédictifs illimités'
      },
      [BusinessFeature.AUTOMATED_INSIGHTS_GENERATION]: {
        enabled: true,
        limit: 100,
        periodType: 'monthly',
        description: '100 insights automatisés par mois'
      },
      
      // Équipe élargie
      [BusinessFeature.ACTIVE_USERS_LIMIT]: {
        enabled: true,
        limit: 25,
        periodType: 'monthly',
        description: '25 utilisateurs actifs'
      },
      [BusinessFeature.USER_ROLES_LIMIT]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Rôles illimités'
      },
      [BusinessFeature.TEAM_WORKSPACES_LIMIT]: {
        enabled: true,
        limit: 10,
        periodType: 'monthly',
        description: '10 espaces de travail équipe'
      },
      
      // Intégrations entreprise
      [BusinessFeature.API_CALLS_DAILY]: {
        enabled: true,
        limit: 10000,
        periodType: 'daily',
        description: '10 000 appels API par jour'
      },
      [BusinessFeature.THIRD_PARTY_INTEGRATIONS_LIMIT]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Intégrations illimitées'
      },
      [BusinessFeature.WEBHOOK_ENDPOINTS_LIMIT]: {
        enabled: true,
        limit: 20,
        periodType: 'monthly',
        description: '20 webhooks'
      },
      
      // Support premium
      [BusinessFeature.PRIORITY_SUPPORT_TICKETS]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Support prioritaire 24/7'
      },
      [BusinessFeature.TRAINING_SESSIONS_MONTHLY]: {
        enabled: true,
        limit: 4,
        periodType: 'monthly',
        description: '4 sessions de formation par mois'
      }
    },
    
    tokenAllocation: {
      monthlyTokens: 5000000,
      tokenRollover: true,
      maxRolloverMonths: 6
    },
    
    isPopular: false,
    isVisible: true,
    sortOrder: 3,
    tags: ['premium', 'pme', 'illimité', 'support-prioritaire'],
    category: 'professional',
    marketingBenefits: [
      'Fonctionnalités illimitées',
      'Financement jusqu\'à 250K$',
      'Support prioritaire 24/7',
      'Équipe jusqu\'à 25 personnes',
      'IA avancée 5M tokens',
      'Intégrations entreprise'
    ],
    valueProposition: 'Solution complète sans limites pour les PME ambitieuses',
    targetAudience: 'PME établies, 20+ employés, besoins de financement importants'
  },

  // === PLANS INSTITUTION FINANCIÈRE ===

  {
    id: 'institution-freemium-2025',
    name: 'Institution Découverte',
    description: 'Découvrez la prospection intelligente et l\'analyse de risque',
    customerType: CustomerType.FINANCIAL_INSTITUTION,
    billingPeriod: BillingPeriod.MONTHLY,
    monthlyPriceUSD: 0,
    annualPriceUSD: 0,
    annualDiscountPercentage: 0,
    
    businessRestrictions: {
      // Portfolio basique
      [BusinessFeature.PORTFOLIO_USERS_LIMIT]: {
        enabled: true,
        limit: 3,
        periodType: 'monthly',
        description: '3 gestionnaires de portefeuille'
      },
      [BusinessFeature.PROSPECTABLE_COMPANIES_LIMIT]: {
        enabled: true,
        limit: 50,
        periodType: 'monthly',
        description: '50 entreprises dans la base de prospection'
      },
      [BusinessFeature.MANAGED_PORTFOLIOS_LIMIT]: {
        enabled: true,
        limit: 1,
        periodType: 'monthly',
        description: '1 portefeuille gérable'
      },
      
      // Analyse limitée
      [BusinessFeature.CREDIT_APPLICATIONS_MONTHLY]: {
        enabled: true,
        limit: 10,
        periodType: 'monthly',
        description: '10 demandes de crédit traitables par mois'
      },
      [BusinessFeature.RISK_ASSESSMENTS_MONTHLY]: {
        enabled: true,
        limit: 15,
        periodType: 'monthly',
        description: '15 évaluations de risque par mois'
      },
      [BusinessFeature.CREDIT_SCORING_REQUESTS]: {
        enabled: true,
        limit: 5,
        periodType: 'monthly',
        description: '5 calculs de cote crédit par mois'
      },
      
      // IA de base
      [BusinessFeature.AI_CHAT_TOKENS_MONTHLY]: {
        enabled: true,
        limit: 300000,
        periodType: 'monthly',
        description: '300K tokens IA par mois'
      },
      [BusinessFeature.DOCUMENT_ANALYSIS_REQUESTS]: {
        enabled: true,
        limit: 20,
        periodType: 'monthly',
        description: '20 analyses de documents par mois'
      },
      
      // Collaboration basique
      [BusinessFeature.ACTIVE_USERS_LIMIT]: {
        enabled: true,
        limit: 5,
        periodType: 'monthly',
        description: '5 utilisateurs actifs'
      },
      
      // API limitée
      [BusinessFeature.API_CALLS_DAILY]: {
        enabled: true,
        limit: 500,
        periodType: 'daily',
        description: '500 appels API par jour'
      }
    },
    
    tokenAllocation: {
      monthlyTokens: 300000,
      tokenRollover: false,
      maxRolloverMonths: 0
    },
    
    isPopular: false,
    isVisible: true,
    sortOrder: 4,
    tags: ['gratuit', 'institution', 'prospection'],
    category: 'freemium',
    marketingBenefits: [
      'Prospection intelligente',
      'Évaluation de risque',
      'Cote crédit XGBoost',
      'Portfolio management'
    ],
    valueProposition: 'Découvrez la puissance de l\'analyse prédictive pour vos portefeuilles',
    targetAudience: 'Petites institutions financières, coopératives de crédit'
  },

  {
    id: 'institution-professional-2025',
    name: 'Institution Professional',
    description: 'Solution complète pour institutions financières modernes',
    customerType: CustomerType.FINANCIAL_INSTITUTION,
    billingPeriod: BillingPeriod.MONTHLY,
    monthlyPriceUSD: 199,
    annualPriceUSD: 1990, // 2 mois gratuits
    annualDiscountPercentage: 16.67,
    
    businessRestrictions: {
      // Portfolio étendu
      [BusinessFeature.PORTFOLIO_USERS_LIMIT]: {
        enabled: true,
        limit: 25,
        periodType: 'monthly',
        description: '25 gestionnaires de portefeuille'
      },
      [BusinessFeature.PROSPECTABLE_COMPANIES_LIMIT]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Base de prospection illimitée'
      },
      [BusinessFeature.MANAGED_PORTFOLIOS_LIMIT]: {
        enabled: true,
        limit: 15,
        periodType: 'monthly',
        description: '15 portefeuilles gérables'
      },
      
      // Analyse avancée
      [BusinessFeature.CREDIT_APPLICATIONS_MONTHLY]: {
        enabled: true,
        limit: 500,
        periodType: 'monthly',
        description: '500 demandes de crédit par mois'
      },
      [BusinessFeature.RISK_ASSESSMENTS_MONTHLY]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Évaluations de risque illimitées'
      },
      [BusinessFeature.CREDIT_SCORING_REQUESTS]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Cote crédit illimitée'
      },
      [BusinessFeature.COMPANY_SCREENING_REQUESTS]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Screening d\'entreprises illimité'
      },
      
      // Analytics et conformité
      [BusinessFeature.PORTFOLIO_ANALYTICS_ACCESS]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Analytics de portefeuille avancés'
      },
      [BusinessFeature.REGULATORY_REPORTING]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Rapports réglementaires automatisés'
      },
      [BusinessFeature.COMPLIANCE_CHECKS_MONTHLY]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Vérifications de conformité illimitées'
      },
      
      // IA institution
      [BusinessFeature.AI_CHAT_TOKENS_MONTHLY]: {
        enabled: true,
        limit: 8000000,
        periodType: 'monthly',
        description: '8M tokens IA par mois'
      },
      [BusinessFeature.DOCUMENT_ANALYSIS_REQUESTS]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Analyse de documents illimitée'
      },
      [BusinessFeature.PREDICTIVE_ANALYTICS_REQUESTS]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Analytics prédictifs illimités'
      },
      [BusinessFeature.FRAUD_DETECTION_SCANS]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Détection de fraude illimitée'
      },
      [BusinessFeature.AUTOMATED_INSIGHTS_GENERATION]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Insights automatisés illimités'
      },
      
      // Collaboration entreprise
      [BusinessFeature.ACTIVE_USERS_LIMIT]: {
        enabled: true,
        limit: 50,
        periodType: 'monthly',
        description: '50 utilisateurs actifs'
      },
      [BusinessFeature.USER_ROLES_LIMIT]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Rôles personnalisés illimités'
      },
      [BusinessFeature.TEAM_WORKSPACES_LIMIT]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Espaces de travail illimités'
      },
      
      // Intégrations enterprise
      [BusinessFeature.API_CALLS_DAILY]: {
        enabled: true,
        limit: 50000,
        periodType: 'daily',
        description: '50 000 appels API par jour'
      },
      [BusinessFeature.THIRD_PARTY_INTEGRATIONS_LIMIT]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Intégrations illimitées'
      },
      [BusinessFeature.WEBHOOK_ENDPOINTS_LIMIT]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Webhooks illimités'
      },
      
      // Sécurité et conformité
      [BusinessFeature.AUDIT_LOGS_RETENTION_DAYS]: {
        enabled: true,
        limit: 365,
        periodType: 'daily',
        description: 'Logs d\'audit 365 jours'
      },
      [BusinessFeature.SECURITY_SCANS_MONTHLY]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Scans de sécurité illimités'
      },
      
      // Support dédié
      [BusinessFeature.PRIORITY_SUPPORT_TICKETS]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Support prioritaire 24/7'
      },
      [BusinessFeature.DEDICATED_ACCOUNT_MANAGER]: {
        enabled: true,
        limit: 1,
        periodType: 'monthly',
        description: 'Account manager dédié'
      },
      [BusinessFeature.TRAINING_SESSIONS_MONTHLY]: {
        enabled: true,
        limit: 8,
        periodType: 'monthly',
        description: '8 sessions de formation par mois'
      }
    },
    
    tokenAllocation: {
      monthlyTokens: 8000000,
      tokenRollover: true,
      maxRolloverMonths: 6
    },
    
    isPopular: true,
    isVisible: true,
    sortOrder: 5,
    tags: ['populaire', 'institution', 'enterprise', 'conformité'],
    category: 'professional',
    marketingBenefits: [
      'Prospection illimitée',
      'Analytics prédictifs avancés',
      'Conformité réglementaire',
      'Account manager dédié',
      'Sécurité enterprise',
      'Équipe jusqu\'à 50 personnes',
      'API haute performance'
    ],
    valueProposition: 'La solution complète pour digitaliser votre institution financière',
    targetAudience: 'Banques, institutions de microfinance, fonds d\'investissement'
  },

  {
    id: 'institution-enterprise-2025',
    name: 'Institution Enterprise',
    description: 'Solution sur-mesure pour grandes institutions financières',
    customerType: CustomerType.FINANCIAL_INSTITUTION,
    billingPeriod: BillingPeriod.MONTHLY,
    monthlyPriceUSD: 599,
    annualPriceUSD: 5990, // 2 mois gratuits
    annualDiscountPercentage: 16.67,
    
    businessRestrictions: {
      // Tout illimité
      [BusinessFeature.PORTFOLIO_USERS_LIMIT]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Utilisateurs illimités'
      },
      [BusinessFeature.PROSPECTABLE_COMPANIES_LIMIT]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Base de données complète'
      },
      [BusinessFeature.MANAGED_PORTFOLIOS_LIMIT]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Portefeuilles illimités'
      },
      [BusinessFeature.CREDIT_APPLICATIONS_MONTHLY]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Demandes de crédit illimitées'
      },
      [BusinessFeature.RISK_ASSESSMENTS_MONTHLY]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Évaluations de risque illimitées'
      },
      
      // IA premium
      [BusinessFeature.AI_CHAT_TOKENS_MONTHLY]: {
        enabled: true,
        limit: 25000000,
        periodType: 'monthly',
        description: '25M tokens IA par mois'
      },
      
      // Fonctionnalités enterprise exclusives
      [BusinessFeature.WHITE_LABEL_CUSTOMIZATION]: {
        enabled: true,
        limit: 1,
        periodType: 'monthly',
        description: 'Solution white-label complète'
      },
      [BusinessFeature.CUSTOM_BRANDING]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Branding personnalisé'
      },
      [BusinessFeature.WORKFLOW_AUTOMATION_RULES]: {
        enabled: true,
        limit: -1,
        periodType: 'monthly',
        description: 'Automatisation workflow illimitée'
      },
      
      // Support premium
      [BusinessFeature.DEDICATED_ACCOUNT_MANAGER]: {
        enabled: true,
        limit: 1,
        periodType: 'monthly',
        description: 'Account manager dédié'
      },
      [BusinessFeature.CUSTOM_DEVELOPMENT_HOURS]: {
        enabled: true,
        limit: 20,
        periodType: 'monthly',
        description: '20h développement custom par mois'
      }
    },
    
    tokenAllocation: {
      monthlyTokens: 25000000,
      tokenRollover: true,
      maxRolloverMonths: 12
    },
    
    isPopular: false,
    isVisible: true,
    sortOrder: 6,
    tags: ['enterprise', 'white-label', 'custom', 'illimité'],
    category: 'enterprise',
    marketingBenefits: [
      'Solution white-label',
      'Développement sur-mesure',
      'Branding personnalisé',
      'Support dédié premium',
      'Architecture scalable',
      'Conformité international',
      'SLA 99.9% garanti'
    ],
    valueProposition: 'Votre propre plateforme financière avec la technologie Wanzo',
    targetAudience: 'Grandes banques, groupes financiers internationaux'
  }
];

// Maintenir la compatibilité avec l'ancienne configuration
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
