/**
 * Topics Kafka standardisés pour tous les services
 * Centralisation pour assurer la cohérence
 */

export class StandardKafkaTopics {
  // Commerce Operations - Compatible avec BusinessOperationEventTopics
  static readonly COMMERCE_OPERATION_CREATED = 'commerce.operation.created';
  static readonly COMMERCE_OPERATION_UPDATED = 'commerce.operation.updated';
  static readonly COMMERCE_OPERATION_DELETED = 'commerce.operation.deleted';
  
  // Accounting Operations
  static readonly ACCOUNTING_JOURNAL_ENTRY = 'accounting.journal.entry';
  static readonly ACCOUNTING_JOURNAL_STATUS = 'accounting.journal.status';
  
  // Portfolio Analysis
  static readonly PORTFOLIO_ANALYSIS_REQUEST = 'portfolio.analysis.request';
  static readonly PORTFOLIO_ANALYSIS_RESPONSE = 'portfolio.analysis.response';
  static readonly PORTFOLIO_CHAT_MESSAGE = 'portfolio.chat.message';
  static readonly PORTFOLIO_CHAT_RESPONSE = 'portfolio.chat.response';
  
  // Mobile Transactions
  static readonly MOBILE_TRANSACTION_CREATED = 'mobile.transaction.created';
  
  // Adha AI General
  static readonly ADHA_AI_EVENTS = 'adha-ai-events';
  
  // User Events
  static readonly USER_CREATED = 'user.created';
  static readonly USER_UPDATED = 'user.updated';
  static readonly USER_STATUS_CHANGED = 'user.status.changed';
  static readonly USER_ROLE_CHANGED = 'user.role.changed';
  
  // Customer Events
  static readonly CUSTOMER_CREATED = 'customer.created';
  static readonly CUSTOMER_UPDATED = 'customer.updated';
  static readonly CUSTOMER_DELETED = 'customer.deleted';
  static readonly CUSTOMER_SYNC_REQUEST = 'customer.sync.request';
  static readonly CUSTOMER_SYNC_RESPONSE = 'customer.sync.response';
  
  // Organization Events
  static readonly ORGANIZATION_CREATED = 'organization.created';
  static readonly ORGANIZATION_UPDATED = 'organization.updated';
  static readonly ORGANIZATION_SYNC_REQUEST = 'organization.sync.request';
  static readonly ORGANIZATION_SYNC_RESPONSE = 'organization.sync.response';
  
  // Token Events
  static readonly TOKEN_PURCHASE = 'token.purchase';
  static readonly TOKEN_USAGE = 'token.usage';
  static readonly TOKEN_ALLOCATED = 'token.allocated';
  static readonly TOKEN_ALERT = 'token.alert';
  
  // Subscription Events
  static readonly SUBSCRIPTION_CREATED = 'subscription.created';
  static readonly SUBSCRIPTION_EXPIRED = 'subscription.expired';
  static readonly SUBSCRIPTION_STATUS_CHANGED = 'subscription.status.changed';
  
  // Portfolio/Contract Events
  static readonly FUNDING_REQUEST_CREATED = 'funding.request.created';
  static readonly FUNDING_REQUEST_ACKNOWLEDGED = 'funding.request.acknowledged';
  static readonly FUNDING_REQUEST_ERROR = 'funding.request.error';
  static readonly FUNDING_REQUEST_STATUS_CHANGED = 'funding.request.status.changed';
  static readonly CONTRACT_CREATED = 'contract.created';
  static readonly CONTRACT_STATUS_CHANGED = 'contract.status.changed';
  static readonly CONTRACT_RESTRUCTURED = 'contract.restructured';
  static readonly DISBURSEMENT_COMPLETED = 'disbursement.completed';
  static readonly REPAYMENT_RECEIVED = 'repayment.received';
  static readonly PAYMENT_SCHEDULE_UPDATED = 'payment.schedule.updated';
  
  // Document Events
  static readonly DOCUMENT_UPLOADED = 'document.uploaded';
  static readonly DOCUMENT_UPDATED = 'document.updated';
  static readonly DOCUMENT_STATUS_CHANGED = 'document.status.changed';
  
  // Customer Institution Events
  static readonly CUSTOMER_INSTITUTION_CREATED = 'customer.institution.created';
  static readonly CUSTOMER_INSTITUTION_UPDATED = 'customer.institution.updated';
  static readonly CUSTOMER_INSTITUTION_DELETED = 'customer.institution.deleted';
  static readonly CUSTOMER_INSTITUTION_VALIDATED = 'customer.institution.validated';
  static readonly CUSTOMER_INSTITUTION_SUSPENDED = 'customer.institution.suspended';
  
  // Customer SME Events
  static readonly CUSTOMER_SME_CREATED = 'customer.sme.created';
  static readonly CUSTOMER_SME_UPDATED = 'customer.sme.updated';
  static readonly CUSTOMER_SME_DELETED = 'customer.sme.deleted';
  static readonly CUSTOMER_SME_VALIDATED = 'customer.sme.validated';
  static readonly CUSTOMER_SME_SUSPENDED = 'customer.sme.suspended';
  
  // Customer Status Events
  static readonly CUSTOMER_STATUS_CHANGED = 'customer.status.changed';
  static readonly CUSTOMER_VALIDATED = 'customer.validated';
  static readonly CUSTOMER_SUSPENDED = 'customer.suspended';
  static readonly CUSTOMER_REACTIVATED = 'customer.reactivated';
  
  // Customer Admin Events
  static readonly CUSTOMER_ADMIN_ACTION = 'customer.admin.action';
  static readonly CUSTOMER_UPDATE_REQUEST = 'customer.update.request';
  
  // User Login/Logout Events
  static readonly USER_LOGIN = 'user.login';
  static readonly USER_LOGOUT = 'user.logout';
  static readonly USER_DOCUMENT_UPLOADED = 'user.document.uploaded';
  
  // Subscription Events Extended
  static readonly SUBSCRIPTION_EVENT = 'subscription.event';
  
  // Sync Events
  static readonly USER_SYNC_REQUEST = 'user.sync.request';
  static readonly USER_LOGIN_NOTIFICATION = 'user.login.notification';
  
  // Dead Letter Queue
  static readonly DLQ_FAILED_MESSAGES = 'dlq.failed.messages';
  
  /**
   * Obtient tous les topics sous forme de tableau
   */
  static getAllTopics(): string[] {
    return Object.values(StandardKafkaTopics).filter(value => typeof value === 'string');
  }
  
  /**
   * Valide qu'un topic fait partie des topics standardisés
   */
  static isValidTopic(topic: string): boolean {
    return StandardKafkaTopics.getAllTopics().includes(topic);
  }
  
  /**
   * Obtient les topics par catégorie
   */
  static getCommerceTopics(): string[] {
    return [
      StandardKafkaTopics.COMMERCE_OPERATION_CREATED,
      StandardKafkaTopics.COMMERCE_OPERATION_UPDATED,
      StandardKafkaTopics.COMMERCE_OPERATION_DELETED,
    ];
  }
  
  static getAccountingTopics(): string[] {
    return [
      StandardKafkaTopics.ACCOUNTING_JOURNAL_ENTRY,
      StandardKafkaTopics.ACCOUNTING_JOURNAL_STATUS,
    ];
  }
  
  static getPortfolioTopics(): string[] {
    return [
      StandardKafkaTopics.PORTFOLIO_ANALYSIS_REQUEST,
      StandardKafkaTopics.PORTFOLIO_ANALYSIS_RESPONSE,
      StandardKafkaTopics.PORTFOLIO_CHAT_MESSAGE,
      StandardKafkaTopics.PORTFOLIO_CHAT_RESPONSE,
    ];
  }
  
  static getUserTopics(): string[] {
    return [
      StandardKafkaTopics.USER_CREATED,
      StandardKafkaTopics.USER_UPDATED,
      StandardKafkaTopics.USER_STATUS_CHANGED,
      StandardKafkaTopics.USER_ROLE_CHANGED,
    ];
  }
}

// Export pour compatibilité avec l'existant
export const BusinessOperationEventTopics = {
  OPERATION_CREATED: StandardKafkaTopics.COMMERCE_OPERATION_CREATED,
  OPERATION_UPDATED: StandardKafkaTopics.COMMERCE_OPERATION_UPDATED,
  OPERATION_DELETED: StandardKafkaTopics.COMMERCE_OPERATION_DELETED,
} as const;

export const UserEventTopics = {
  USER_CREATED: StandardKafkaTopics.USER_CREATED,
  USER_UPDATED: StandardKafkaTopics.USER_UPDATED,
  USER_STATUS_CHANGED: StandardKafkaTopics.USER_STATUS_CHANGED,
  USER_ROLE_CHANGED: StandardKafkaTopics.USER_ROLE_CHANGED,
  USER_DELETED: StandardKafkaTopics.USER_UPDATED, // Map to existing topic
  USER_PASSWORD_RESET: StandardKafkaTopics.USER_UPDATED, // Map to existing topic
} as const;

export const CustomerEventTopics = {
  CUSTOMER_CREATED: StandardKafkaTopics.CUSTOMER_CREATED,
  CUSTOMER_UPDATED: StandardKafkaTopics.CUSTOMER_UPDATED,
  CUSTOMER_DELETED: StandardKafkaTopics.CUSTOMER_DELETED,
  CUSTOMER_STATUS_CHANGED: StandardKafkaTopics.CUSTOMER_STATUS_CHANGED,
  CUSTOMER_VALIDATED: StandardKafkaTopics.CUSTOMER_VALIDATED,
  CUSTOMER_SUSPENDED: StandardKafkaTopics.CUSTOMER_SUSPENDED,
  CUSTOMER_REACTIVATED: StandardKafkaTopics.CUSTOMER_REACTIVATED,
  CUSTOMER_SYNC_REQUEST: StandardKafkaTopics.CUSTOMER_SYNC_REQUEST,
  CUSTOMER_SYNC_RESPONSE: StandardKafkaTopics.CUSTOMER_SYNC_RESPONSE,
} as const;

export const TokenEventTopics = {
  TOKEN_PURCHASE: StandardKafkaTopics.TOKEN_PURCHASE,
  TOKEN_USAGE: StandardKafkaTopics.TOKEN_USAGE,
  TOKEN_ALLOCATED: StandardKafkaTopics.TOKEN_ALLOCATED,
  TOKEN_ALERT: StandardKafkaTopics.TOKEN_ALERT,
} as const;

export const SubscriptionEventTopics = {
  SUBSCRIPTION_CREATED: StandardKafkaTopics.SUBSCRIPTION_CREATED,
  SUBSCRIPTION_EXPIRED: StandardKafkaTopics.SUBSCRIPTION_EXPIRED,
  SUBSCRIPTION_STATUS_CHANGED: StandardKafkaTopics.SUBSCRIPTION_STATUS_CHANGED,
  SUBSCRIPTION_UPDATED: StandardKafkaTopics.SUBSCRIPTION_STATUS_CHANGED, // Map to existing
  SUBSCRIPTION_CANCELLED: StandardKafkaTopics.SUBSCRIPTION_STATUS_CHANGED, // Map to existing
  SUBSCRIPTION_RENEWED: StandardKafkaTopics.SUBSCRIPTION_CREATED, // Map to existing
  SUBSCRIPTION_PLAN_CHANGED: StandardKafkaTopics.SUBSCRIPTION_STATUS_CHANGED, // Map to existing
} as const;

export const PortfolioEventTopics = {
  FUNDING_REQUEST_STATUS_CHANGED: StandardKafkaTopics.FUNDING_REQUEST_STATUS_CHANGED,
  CONTRACT_CREATED: StandardKafkaTopics.CONTRACT_CREATED,
  CONTRACT_STATUS_CHANGED: StandardKafkaTopics.CONTRACT_STATUS_CHANGED,
  CONTRACT_RESTRUCTURED: StandardKafkaTopics.CONTRACT_RESTRUCTURED,
  DISBURSEMENT_COMPLETED: StandardKafkaTopics.DISBURSEMENT_COMPLETED,
  REPAYMENT_RECEIVED: StandardKafkaTopics.REPAYMENT_RECEIVED,
  PAYMENT_SCHEDULE_UPDATED: StandardKafkaTopics.PAYMENT_SCHEDULE_UPDATED,
  DOCUMENT_UPLOADED: StandardKafkaTopics.DOCUMENT_UPLOADED,
  DOCUMENT_UPDATED: StandardKafkaTopics.DOCUMENT_UPDATED,
  DOCUMENT_STATUS_CHANGED: StandardKafkaTopics.DOCUMENT_STATUS_CHANGED,
} as const;