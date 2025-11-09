/**
 * Énumération exhaustive des fonctionnalités métier monétisables dans Wanzo
 * Chaque feature correspond à une restriction d'abonnement avec valeur business claire
 */

export enum BusinessFeature {
  // === FONCTIONNALITÉS COMPTABLES ===
  ACCOUNTING_ENTRIES_MONTHLY = 'accounting_entries_monthly',
  AUTOMATED_ACCOUNTING_ENTRIES = 'automated_accounting_entries',
  FINANCIAL_REPORTS_GENERATION = 'financial_reports_generation',
  FINANCIAL_STATEMENT_EXPORT = 'financial_statement_export',
  TAX_COMPUTATION_REQUESTS = 'tax_computation_requests',
  BUDGET_MANAGEMENT = 'budget_management',
  CASH_FLOW_ANALYSIS = 'cash_flow_analysis',
  
  // === GESTION COMMERCIALE ===
  ACTIVE_CUSTOMERS_LIMIT = 'active_customers_limit',
  INVOICES_GENERATION_MONTHLY = 'invoices_generation_monthly',
  SALES_TRANSACTIONS_MONTHLY = 'sales_transactions_monthly',
  INVENTORY_ITEMS_LIMIT = 'inventory_items_limit',
  PRODUCT_CATALOG_SIZE = 'product_catalog_size',
  SALES_REPORTS_MONTHLY = 'sales_reports_monthly',
  CUSTOMER_ANALYTICS_ACCESS = 'customer_analytics_access',
  
  // === FINANCEMENT PME ===
  FINANCING_REQUESTS_MONTHLY = 'financing_requests_monthly',
  CREDIT_AMOUNT_LIMIT_USD = 'credit_amount_limit_usd',
  CREDIT_SCORING_REQUESTS = 'credit_scoring_requests',
  LOAN_SIMULATION_REQUESTS = 'loan_simulation_requests',
  FINANCIAL_HEALTH_ANALYSIS = 'financial_health_analysis',
  BUSINESS_VALUATION_REQUESTS = 'business_valuation_requests',
  
  // === PORTFOLIO INSTITUTION ===
  PORTFOLIO_USERS_LIMIT = 'portfolio_users_limit',
  PROSPECTABLE_COMPANIES_LIMIT = 'prospectable_companies_limit',
  MANAGED_PORTFOLIOS_LIMIT = 'managed_portfolios_limit',
  CREDIT_APPLICATIONS_MONTHLY = 'credit_applications_monthly',
  RISK_ASSESSMENTS_MONTHLY = 'risk_assessments_monthly',
  COMPANY_SCREENING_REQUESTS = 'company_screening_requests',
  PORTFOLIO_ANALYTICS_ACCESS = 'portfolio_analytics_access',
  REGULATORY_REPORTING = 'regulatory_reporting',
  
  // === INTELLIGENCE ARTIFICIELLE ===
  AI_CHAT_TOKENS_MONTHLY = 'ai_chat_tokens_monthly',
  DOCUMENT_ANALYSIS_REQUESTS = 'document_analysis_requests',
  PREDICTIVE_ANALYTICS_REQUESTS = 'predictive_analytics_requests',
  AUTOMATED_INSIGHTS_GENERATION = 'automated_insights_generation',
  MARKET_ANALYSIS_REQUESTS = 'market_analysis_requests',
  FRAUD_DETECTION_SCANS = 'fraud_detection_scans',
  SENTIMENT_ANALYSIS_REQUESTS = 'sentiment_analysis_requests',
  
  // === COLLABORATION & UTILISATEURS ===
  ACTIVE_USERS_LIMIT = 'active_users_limit',
  USER_ROLES_LIMIT = 'user_roles_limit',
  CONCURRENT_SESSIONS_LIMIT = 'concurrent_sessions_limit',
  TEAM_WORKSPACES_LIMIT = 'team_workspaces_limit',
  SHARED_DOCUMENTS_LIMIT = 'shared_documents_limit',
  
  // === INTÉGRATIONS & API ===
  API_CALLS_DAILY = 'api_calls_daily',
  THIRD_PARTY_INTEGRATIONS_LIMIT = 'third_party_integrations_limit',
  WEBHOOK_ENDPOINTS_LIMIT = 'webhook_endpoints_limit',
  DATA_EXPORT_REQUESTS_MONTHLY = 'data_export_requests_monthly',
  BULK_DATA_OPERATIONS = 'bulk_data_operations',
  
  // === ANALYTICS & REPORTING ===
  CUSTOM_REPORTS_MONTHLY = 'custom_reports_monthly',
  DASHBOARD_WIDGETS_LIMIT = 'dashboard_widgets_limit',
  DATA_RETENTION_MONTHS = 'data_retention_months',
  ADVANCED_CHARTS_LIMIT = 'advanced_charts_limit',
  SCHEDULED_REPORTS_LIMIT = 'scheduled_reports_limit',
  
  // === CONFORMITÉ & SÉCURITÉ ===
  AUDIT_LOGS_RETENTION_DAYS = 'audit_logs_retention_days',
  COMPLIANCE_CHECKS_MONTHLY = 'compliance_checks_monthly',
  SECURITY_SCANS_MONTHLY = 'security_scans_monthly',
  BACKUP_FREQUENCY_DAYS = 'backup_frequency_days',
  
  // === SUPPORT & SERVICES ===
  PRIORITY_SUPPORT_TICKETS = 'priority_support_tickets',
  DEDICATED_ACCOUNT_MANAGER = 'dedicated_account_manager',
  TRAINING_SESSIONS_MONTHLY = 'training_sessions_monthly',
  CUSTOM_DEVELOPMENT_HOURS = 'custom_development_hours',
  
  // === MOBILE & ACCÈS ===
  MOBILE_APP_ACCESS = 'mobile_app_access',
  OFFLINE_MODE_ACCESS = 'offline_mode_access',
  MULTI_DEVICE_SYNC = 'multi_device_sync',
  
  // === FONCTIONNALITÉS AVANCÉES ===
  WHITE_LABEL_CUSTOMIZATION = 'white_label_customization',
  CUSTOM_BRANDING = 'custom_branding',
  ADVANCED_PERMISSIONS = 'advanced_permissions',
  WORKFLOW_AUTOMATION_RULES = 'workflow_automation_rules',
  CUSTOM_FIELDS_LIMIT = 'custom_fields_limit',
  ADVANCED_ANALYTICS_FEATURES = 'advanced_analytics_features',
  COMPLIANCE_MONITORING_TOOLS = 'compliance_monitoring_tools'
}

/**
 * Configuration des fonctionnalités par type de client
 */
export const BusinessFeaturesByCustomerType = {
  SME: [
    // Comptabilité
    BusinessFeature.ACCOUNTING_ENTRIES_MONTHLY,
    BusinessFeature.AUTOMATED_ACCOUNTING_ENTRIES,
    BusinessFeature.FINANCIAL_REPORTS_GENERATION,
    BusinessFeature.TAX_COMPUTATION_REQUESTS,
    BusinessFeature.CASH_FLOW_ANALYSIS,
    
    // Commercial
    BusinessFeature.ACTIVE_CUSTOMERS_LIMIT,
    BusinessFeature.INVOICES_GENERATION_MONTHLY,
    BusinessFeature.SALES_TRANSACTIONS_MONTHLY,
    BusinessFeature.INVENTORY_ITEMS_LIMIT,
    BusinessFeature.SALES_REPORTS_MONTHLY,
    
    // Financement
    BusinessFeature.FINANCING_REQUESTS_MONTHLY,
    BusinessFeature.CREDIT_AMOUNT_LIMIT_USD,
    BusinessFeature.CREDIT_SCORING_REQUESTS,
    BusinessFeature.LOAN_SIMULATION_REQUESTS,
    
    // IA & Analytics
    BusinessFeature.AI_CHAT_TOKENS_MONTHLY,
    BusinessFeature.DOCUMENT_ANALYSIS_REQUESTS,
    BusinessFeature.PREDICTIVE_ANALYTICS_REQUESTS,
    
    // Collaboration
    BusinessFeature.ACTIVE_USERS_LIMIT,
    BusinessFeature.CONCURRENT_SESSIONS_LIMIT,
    
    // Intégrations
    BusinessFeature.API_CALLS_DAILY,
    BusinessFeature.THIRD_PARTY_INTEGRATIONS_LIMIT,
    BusinessFeature.DATA_EXPORT_REQUESTS_MONTHLY
  ],
  
  FINANCIAL_INSTITUTION: [
    // Portfolio Management
    BusinessFeature.PORTFOLIO_USERS_LIMIT,
    BusinessFeature.PROSPECTABLE_COMPANIES_LIMIT,
    BusinessFeature.MANAGED_PORTFOLIOS_LIMIT,
    BusinessFeature.CREDIT_APPLICATIONS_MONTHLY,
    BusinessFeature.RISK_ASSESSMENTS_MONTHLY,
    BusinessFeature.PORTFOLIO_ANALYTICS_ACCESS,
    BusinessFeature.REGULATORY_REPORTING,
    
    // Intelligence & Analysis
    BusinessFeature.COMPANY_SCREENING_REQUESTS,
    BusinessFeature.MARKET_ANALYSIS_REQUESTS,
    BusinessFeature.FRAUD_DETECTION_SCANS,
    BusinessFeature.PREDICTIVE_ANALYTICS_REQUESTS,
    
    // IA Avancée
    BusinessFeature.AI_CHAT_TOKENS_MONTHLY,
    BusinessFeature.AUTOMATED_INSIGHTS_GENERATION,
    BusinessFeature.SENTIMENT_ANALYSIS_REQUESTS,
    
    // Collaboration Avancée
    BusinessFeature.ACTIVE_USERS_LIMIT,
    BusinessFeature.USER_ROLES_LIMIT,
    BusinessFeature.TEAM_WORKSPACES_LIMIT,
    
    // Conformité
    BusinessFeature.AUDIT_LOGS_RETENTION_DAYS,
    BusinessFeature.COMPLIANCE_CHECKS_MONTHLY,
    BusinessFeature.SECURITY_SCANS_MONTHLY,
    
    // Intégrations Enterprise
    BusinessFeature.API_CALLS_DAILY,
    BusinessFeature.WEBHOOK_ENDPOINTS_LIMIT,
    BusinessFeature.BULK_DATA_OPERATIONS
  ]
} as const;

/**
 * Métadonnées des fonctionnalités pour l'affichage et la configuration
 */
export interface BusinessFeatureMetadata {
  displayName: string;
  description: string;
  unit: string;
  category: 'core' | 'advanced' | 'premium' | 'enterprise';
  monetizationPriority: 'high' | 'medium' | 'low';
  defaultLimit: number;
  unlimitedValue: number; // -1 pour illimité
}

export const BusinessFeaturesMetadata: Partial<Record<BusinessFeature, BusinessFeatureMetadata>> = {
  [BusinessFeature.ACCOUNTING_ENTRIES_MONTHLY]: {
    displayName: 'Écritures comptables',
    description: 'Nombre d\'écritures comptables créables par mois',
    unit: 'écritures/mois',
    category: 'core',
    monetizationPriority: 'high',
    defaultLimit: 100,
    unlimitedValue: -1
  },
  
  [BusinessFeature.AUTOMATED_ACCOUNTING_ENTRIES]: {
    displayName: 'Comptabilité automatisée',
    description: 'Écritures générées automatiquement par ADHA IA',
    unit: 'écritures auto/mois',
    category: 'advanced',
    monetizationPriority: 'high',
    defaultLimit: 50,
    unlimitedValue: -1
  },
  
  [BusinessFeature.FINANCING_REQUESTS_MONTHLY]: {
    displayName: 'Demandes de financement',
    description: 'Nombre de demandes de crédit soumissibles par mois',
    unit: 'demandes/mois',
    category: 'premium',
    monetizationPriority: 'high',
    defaultLimit: 2,
    unlimitedValue: -1
  },
  
  [BusinessFeature.CREDIT_AMOUNT_LIMIT_USD]: {
    displayName: 'Montant de crédit max',
    description: 'Montant total de crédit sollicitable',
    unit: 'USD',
    category: 'premium',
    monetizationPriority: 'high',
    defaultLimit: 50000,
    unlimitedValue: -1
  },
  
  [BusinessFeature.PORTFOLIO_USERS_LIMIT]: {
    displayName: 'Utilisateurs portfolio',
    description: 'Nombre d\'utilisateurs pouvant gérer les portefeuilles',
    unit: 'utilisateurs',
    category: 'core',
    monetizationPriority: 'high',
    defaultLimit: 5,
    unlimitedValue: -1
  },
  
  [BusinessFeature.PROSPECTABLE_COMPANIES_LIMIT]: {
    displayName: 'Entreprises prospectables',
    description: 'Nombre d\'entreprises dans la base de prospection',
    unit: 'entreprises',
    category: 'advanced',
    monetizationPriority: 'high',
    defaultLimit: 100,
    unlimitedValue: -1
  },
  
  [BusinessFeature.CREDIT_SCORING_REQUESTS]: {
    displayName: 'Calculs de cote crédit',
    description: 'Analyses de cote crédit via XGBoost par mois',
    unit: 'calculs/mois',
    category: 'premium',
    monetizationPriority: 'high',
    defaultLimit: 10,
    unlimitedValue: -1
  },
  
  [BusinessFeature.AI_CHAT_TOKENS_MONTHLY]: {
    displayName: 'Tokens IA Chat',
    description: 'Tokens pour assistance IA conversationnelle',
    unit: 'tokens/mois',
    category: 'advanced',
    monetizationPriority: 'medium',
    defaultLimit: 500000,
    unlimitedValue: -1
  },
  
  [BusinessFeature.ACTIVE_USERS_LIMIT]: {
    displayName: 'Utilisateurs actifs',
    description: 'Nombre d\'utilisateurs actifs simultanés',
    unit: 'utilisateurs',
    category: 'core',
    monetizationPriority: 'high',
    defaultLimit: 3,
    unlimitedValue: -1
  },
  
  [BusinessFeature.API_CALLS_DAILY]: {
    displayName: 'Appels API',
    description: 'Nombre d\'appels API autorisés par jour',
    unit: 'appels/jour',
    category: 'advanced',
    monetizationPriority: 'medium',
    defaultLimit: 1000,
    unlimitedValue: -1
  },
  
  // ... (on peut ajouter le reste selon les besoins)
  
  // Valeurs par défaut pour les autres features
  [BusinessFeature.FINANCIAL_REPORTS_GENERATION]: {
    displayName: 'Rapports financiers',
    description: 'Génération de rapports financiers automatisés',
    unit: 'rapports/mois',
    category: 'advanced',
    monetizationPriority: 'medium',
    defaultLimit: 10,
    unlimitedValue: -1
  },
  
  [BusinessFeature.DOCUMENT_ANALYSIS_REQUESTS]: {
    displayName: 'Analyse de documents',
    description: 'Documents analysés par IA par mois',
    unit: 'documents/mois',
    category: 'advanced',
    monetizationPriority: 'medium',
    defaultLimit: 20,
    unlimitedValue: -1
  },
  
  // Ajout rapide des autres (à compléter selon besoins)
  ...Object.values(BusinessFeature)
    .filter(feature => !Object.keys({
      [BusinessFeature.ACCOUNTING_ENTRIES_MONTHLY]: true,
      [BusinessFeature.AUTOMATED_ACCOUNTING_ENTRIES]: true,
      [BusinessFeature.FINANCING_REQUESTS_MONTHLY]: true,
      [BusinessFeature.CREDIT_AMOUNT_LIMIT_USD]: true,
      [BusinessFeature.PORTFOLIO_USERS_LIMIT]: true,
      [BusinessFeature.PROSPECTABLE_COMPANIES_LIMIT]: true,
      [BusinessFeature.CREDIT_SCORING_REQUESTS]: true,
      [BusinessFeature.AI_CHAT_TOKENS_MONTHLY]: true,
      [BusinessFeature.ACTIVE_USERS_LIMIT]: true,
      [BusinessFeature.API_CALLS_DAILY]: true,
      [BusinessFeature.FINANCIAL_REPORTS_GENERATION]: true,
      [BusinessFeature.DOCUMENT_ANALYSIS_REQUESTS]: true
    }).includes(feature))
    .reduce((acc, feature) => ({
      ...acc,
      [feature]: {
        displayName: feature.replace(/_/g, ' ').toLowerCase(),
        description: `Configuration pour ${feature}`,
        unit: 'unités',
        category: 'core' as const,
        monetizationPriority: 'low' as const,
        defaultLimit: 10,
        unlimitedValue: -1
      }
    }), {})
};

/**
 * Groupes de fonctionnalités pour l'affichage dans les plans
 */
export const BusinessFeatureGroups = {
  ACCOUNTING: {
    name: 'Comptabilité',
    features: [
      BusinessFeature.ACCOUNTING_ENTRIES_MONTHLY,
      BusinessFeature.AUTOMATED_ACCOUNTING_ENTRIES,
      BusinessFeature.FINANCIAL_REPORTS_GENERATION,
      BusinessFeature.TAX_COMPUTATION_REQUESTS
    ]
  },
  
  COMMERCIAL: {
    name: 'Gestion Commerciale',
    features: [
      BusinessFeature.ACTIVE_CUSTOMERS_LIMIT,
      BusinessFeature.INVOICES_GENERATION_MONTHLY,
      BusinessFeature.SALES_TRANSACTIONS_MONTHLY,
      BusinessFeature.INVENTORY_ITEMS_LIMIT
    ]
  },
  
  FINANCING: {
    name: 'Financement',
    features: [
      BusinessFeature.FINANCING_REQUESTS_MONTHLY,
      BusinessFeature.CREDIT_AMOUNT_LIMIT_USD,
      BusinessFeature.CREDIT_SCORING_REQUESTS,
      BusinessFeature.LOAN_SIMULATION_REQUESTS
    ]
  },
  
  PORTFOLIO: {
    name: 'Gestion de Portefeuille',
    features: [
      BusinessFeature.PORTFOLIO_USERS_LIMIT,
      BusinessFeature.PROSPECTABLE_COMPANIES_LIMIT,
      BusinessFeature.MANAGED_PORTFOLIOS_LIMIT,
      BusinessFeature.RISK_ASSESSMENTS_MONTHLY
    ]
  },
  
  AI_ANALYTICS: {
    name: 'IA & Analytics',
    features: [
      BusinessFeature.AI_CHAT_TOKENS_MONTHLY,
      BusinessFeature.DOCUMENT_ANALYSIS_REQUESTS,
      BusinessFeature.PREDICTIVE_ANALYTICS_REQUESTS,
      BusinessFeature.AUTOMATED_INSIGHTS_GENERATION
    ]
  },
  
  COLLABORATION: {
    name: 'Collaboration',
    features: [
      BusinessFeature.ACTIVE_USERS_LIMIT,
      BusinessFeature.USER_ROLES_LIMIT,
      BusinessFeature.CONCURRENT_SESSIONS_LIMIT,
      BusinessFeature.TEAM_WORKSPACES_LIMIT
    ]
  }
} as const;