import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { BusinessFeature } from '../enums/business-features.enum';
import { FeatureAccessGuard } from '../guards/feature-access.guard';

export const FEATURE_ACCESS_KEY = 'feature_access';

/**
 * Interface pour les métadonnées du décorateur de contrôle d'accès
 */
export interface FeatureAccessMetadata {
  feature: BusinessFeature;
  amount?: number;
  actionType?: string;
  bypassForAdmin?: boolean;
  customErrorMessage?: string;
}

/**
 * Décorateur pour contrôler l'accès aux fonctionnalités métier
 * Utilise le AccessControlService pour vérifier les limites d'abonnement
 * 
 * @param feature - La fonctionnalité métier à vérifier
 * @param amount - Quantité à consommer (défaut: 1)
 * @param options - Options supplémentaires
 * 
 * @example
 * ```typescript
 * @FeatureAccess(BusinessFeature.ACCOUNTING_ENTRIES_MONTHLY, 1, {
 *   actionType: 'create',
 *   customErrorMessage: 'Limite d\'écritures comptables atteinte'
 * })
 * async createJournalEntry(@Body() entryData: CreateJournalEntryDto) {
 *   // La vérification se fait automatiquement avant cette méthode
 *   return this.journalEntryService.create(entryData);
 * }
 * ```
 */
export const FeatureAccess = (
  feature: BusinessFeature,
  amount: number = 1,
  options: {
    actionType?: string;
    bypassForAdmin?: boolean;
    customErrorMessage?: string;
  } = {}
) => {
  return applyDecorators(
    SetMetadata(FEATURE_ACCESS_KEY, {
      feature,
      amount,
      actionType: options.actionType || 'use',
      bypassForAdmin: options.bypassForAdmin || false,
      customErrorMessage: options.customErrorMessage
    } as FeatureAccessMetadata),
    UseGuards(FeatureAccessGuard)
  );
};

/**
 * Décorateurs spécialisés pour les fonctionnalités courantes
 */

// Comptabilité
export const RequireAccountingEntries = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.ACCOUNTING_ENTRIES_MONTHLY, amount, {
    actionType: 'create_entry',
    customErrorMessage: 'Limite d\'écritures comptables atteinte pour ce mois'
  });

export const RequireAutomatedAccounting = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.AUTOMATED_ACCOUNTING_ENTRIES, amount, {
    actionType: 'automated_entry',
    customErrorMessage: 'Limite d\'écritures automatisées ADHA atteinte'
  });

export const RequireFinancialReports = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.FINANCIAL_REPORTS_GENERATION, amount, {
    actionType: 'generate_report',
    customErrorMessage: 'Limite de rapports financiers atteinte'
  });

// Gestion commerciale
export const RequireCustomerCreation = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.ACTIVE_CUSTOMERS_LIMIT, amount, {
    actionType: 'create_customer',
    customErrorMessage: 'Limite de clients actifs atteinte'
  });

export const RequireInvoiceGeneration = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.INVOICES_GENERATION_MONTHLY, amount, {
    actionType: 'generate_invoice',
    customErrorMessage: 'Limite de facturation mensuelle atteinte'
  });

export const RequireSalesTransaction = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.SALES_TRANSACTIONS_MONTHLY, amount, {
    actionType: 'create_sale',
    customErrorMessage: 'Limite de transactions de vente atteinte'
  });

// Financement
export const RequireFinancingRequest = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.FINANCING_REQUESTS_MONTHLY, amount, {
    actionType: 'submit_request',
    customErrorMessage: 'Limite de demandes de financement mensuelle atteinte'
  });

export const RequireCreditScoring = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.CREDIT_SCORING_REQUESTS, amount, {
    actionType: 'calculate_score',
    customErrorMessage: 'Limite de calculs de cote crédit atteinte'
  });

export const RequireLoanSimulation = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.LOAN_SIMULATION_REQUESTS, amount, {
    actionType: 'simulate_loan',
    customErrorMessage: 'Limite de simulations de prêt atteinte'
  });

// Portfolio Institution
export const RequirePortfolioUser = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.PORTFOLIO_USERS_LIMIT, amount, {
    actionType: 'add_user',
    customErrorMessage: 'Limite d\'utilisateurs de portefeuille atteinte'
  });

export const RequireCompanyProspection = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.PROSPECTABLE_COMPANIES_LIMIT, amount, {
    actionType: 'add_prospect',
    customErrorMessage: 'Limite d\'entreprises prospectables atteinte'
  });

export const RequireRiskAssessment = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.RISK_ASSESSMENTS_MONTHLY, amount, {
    actionType: 'assess_risk',
    customErrorMessage: 'Limite d\'évaluations de risque mensuelle atteinte'
  });

export const RequireCreditApplication = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.CREDIT_APPLICATIONS_MONTHLY, amount, {
    actionType: 'process_application',
    customErrorMessage: 'Limite de demandes de crédit mensuelles atteinte'
  });

// IA et Analytics
export const RequireAITokens = (amount: number) =>
  FeatureAccess(BusinessFeature.AI_CHAT_TOKENS_MONTHLY, amount, {
    actionType: 'use_ai',
    customErrorMessage: 'Tokens IA épuisés pour ce mois'
  });

export const RequireDocumentAnalysis = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.DOCUMENT_ANALYSIS_REQUESTS, amount, {
    actionType: 'analyze_document',
    customErrorMessage: 'Limite d\'analyses de documents atteinte'
  });

export const RequirePredictiveAnalytics = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.PREDICTIVE_ANALYTICS_REQUESTS, amount, {
    actionType: 'run_analytics',
    customErrorMessage: 'Limite d\'analyses prédictives atteinte'
  });

// Collaboration
export const RequireActiveUser = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.ACTIVE_USERS_LIMIT, amount, {
    actionType: 'activate_user',
    customErrorMessage: 'Limite d\'utilisateurs actifs atteinte'
  });

export const RequireUserRole = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.USER_ROLES_LIMIT, amount, {
    actionType: 'create_role',
    customErrorMessage: 'Limite de rôles personnalisés atteinte'
  });

// API et Intégrations
export const RequireAPICall = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.API_CALLS_DAILY, amount, {
    actionType: 'api_call',
    customErrorMessage: 'Limite d\'appels API quotidienne atteinte'
  });

export const RequireIntegration = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.THIRD_PARTY_INTEGRATIONS_LIMIT, amount, {
    actionType: 'add_integration',
    customErrorMessage: 'Limite d\'intégrations tierces atteinte'
  });

export const RequireDataExport = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.DATA_EXPORT_REQUESTS_MONTHLY, amount, {
    actionType: 'export_data',
    customErrorMessage: 'Limite d\'exports de données mensuelles atteinte'
  });

// Reports et Analytics
export const RequireCustomReport = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.CUSTOM_REPORTS_MONTHLY, amount, {
    actionType: 'generate_custom_report',
    customErrorMessage: 'Limite de rapports personnalisés mensuels atteinte'
  });

export const RequireDashboardWidget = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.DASHBOARD_WIDGETS_LIMIT, amount, {
    actionType: 'add_widget',
    customErrorMessage: 'Limite de widgets de tableau de bord atteinte'
  });

// Support et Services
export const RequirePrioritySupport = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.PRIORITY_SUPPORT_TICKETS, amount, {
    actionType: 'create_ticket',
    customErrorMessage: 'Support prioritaire non disponible dans votre plan'
  });

export const RequireTrainingSession = (amount: number = 1) =>
  FeatureAccess(BusinessFeature.TRAINING_SESSIONS_MONTHLY, amount, {
    actionType: 'book_session',
    customErrorMessage: 'Limite de sessions de formation mensuelles atteinte'
  });

/**
 * Décorateur pour marquer les endpoints qui consomment après succès
 * Utilisé quand on veut vérifier l'accès mais consommer seulement après le succès de l'opération
 */
export const FeatureAccessWithPostConsumption = (
  feature: BusinessFeature,
  amount: number = 1,
  options: {
    actionType?: string;
    customErrorMessage?: string;
  } = {}
) => {
  return applyDecorators(
    SetMetadata('feature_access_post_consumption', {
      feature,
      amount,
      actionType: options.actionType || 'use',
      customErrorMessage: options.customErrorMessage
    }),
    UseGuards(FeatureAccessGuard)
  );
};

/**
 * Décorateur pour vérifier seulement l'accès sans consommer
 * Utile pour les endpoints de lecture ou de vérification
 */
export const CheckFeatureAccess = (
  feature: BusinessFeature,
  options: {
    customErrorMessage?: string;
  } = {}
) => {
  return applyDecorators(
    SetMetadata('feature_check_only', {
      feature,
      amount: 0,
      actionType: 'check',
      customErrorMessage: options.customErrorMessage
    }),
    UseGuards(FeatureAccessGuard)
  );
};