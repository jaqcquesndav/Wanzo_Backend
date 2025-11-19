/**
 * Utilitaires de transformation de données entre formats
 * camelCase ↔ snake_case pour compatibilité entre microservices
 */

/**
 * Convertit un objet camelCase en snake_case
 */
export function camelToSnake(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => camelToSnake(item));
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  const result: any = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = camelToSnake(obj[key]);
    }
  }
  
  return result;
}

/**
 * Convertit un objet snake_case en camelCase
 */
export function snakeToCamel(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => snakeToCamel(item));
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  const result: any = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = snakeToCamel(obj[key]);
    }
  }
  
  return result;
}

/**
 * Transforme les informations bancaires de camelCase (gestion_commerciale) 
 * vers snake_case (portfolio)
 */
export function transformBankAccountToPortfolio(account: any): any {
  if (!account) return null;
  
  return {
    id: account.id || `bank-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: account.accountName,
    bank_name: account.bankName,
    account_number: account.accountNumber,
    currency: account.currency || 'XOF',
    balance: account.balance || 0,
    is_default: account.isDefault || false,
    status: account.status || 'active',
    bank_code: account.bankCode,
    branch_code: account.branchCode,
    swift_code: account.swiftCode,
    rib: account.rib,
    iban: account.iban,
    created_at: account.createdAt ? new Date(account.createdAt).toISOString() : new Date().toISOString(),
    updated_at: account.updatedAt ? new Date(account.updatedAt).toISOString() : new Date().toISOString(),
  };
}

/**
 * Transforme les informations Mobile Money de camelCase (gestion_commerciale)
 * vers snake_case (portfolio)
 */
export function transformMobileMoneyAccountToPortfolio(account: any): any {
  if (!account) return null;
  
  return {
    id: account.id || `mm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    account_name: account.accountName,
    phone_number: account.phoneNumber,
    provider: account.operator, // Code déjà standardisé (AM, OM, MP, etc.)
    provider_name: account.operatorName,
    currency: account.currency || 'XOF',
    is_primary: account.isDefault || false,
    is_active: account.status === 'active',
    account_status: account.verificationStatus || 'pending',
    purpose: account.purpose || 'collection',
    balance: account.balance || 0,
    daily_limit: account.dailyLimit,
    monthly_limit: account.monthlyLimit,
    service_number: account.serviceNumber,
    created_at: account.createdAt ? new Date(account.createdAt).toISOString() : new Date().toISOString(),
    updated_at: account.updatedAt ? new Date(account.updatedAt).toISOString() : new Date().toISOString(),
  };
}

/**
 * Transforme les informations bancaires de snake_case (portfolio)
 * vers camelCase (gestion_commerciale)
 */
export function transformBankAccountFromPortfolio(account: any): any {
  if (!account) return null;
  
  return {
    id: account.id,
    accountName: account.name || account.account_name,
    bankName: account.bank_name,
    accountNumber: account.account_number,
    currency: account.currency,
    balance: account.balance,
    isDefault: account.is_default,
    status: account.status,
    bankCode: account.bank_code,
    branchCode: account.branch_code,
    swiftCode: account.swift_code,
    rib: account.rib,
    iban: account.iban,
    createdAt: account.created_at ? new Date(account.created_at) : undefined,
    updatedAt: account.updated_at ? new Date(account.updated_at) : undefined,
  };
}

/**
 * Transforme les informations Mobile Money de snake_case (portfolio)
 * vers camelCase (gestion_commerciale)
 */
export function transformMobileMoneyAccountFromPortfolio(account: any): any {
  if (!account) return null;
  
  return {
    id: account.id,
    accountName: account.account_name,
    phoneNumber: account.phone_number,
    operator: account.provider, // Code standardisé
    operatorName: account.provider_name,
    currency: account.currency,
    isDefault: account.is_primary,
    status: account.is_active ? 'active' : 'inactive',
    verificationStatus: account.account_status,
    purpose: account.purpose,
    balance: account.balance,
    dailyLimit: account.daily_limit,
    monthlyLimit: account.monthly_limit,
    serviceNumber: account.service_number,
    createdAt: account.created_at ? new Date(account.created_at) : undefined,
    updatedAt: account.updated_at ? new Date(account.updated_at) : undefined,
  };
}

/**
 * Valide qu'un objet compte bancaire contient les champs requis
 */
export function validateBankAccount(account: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!account.accountNumber && !account.account_number) {
    errors.push('Account number is required');
  }
  
  if (!account.bankName && !account.bank_name) {
    errors.push('Bank name is required');
  }
  
  if (!account.accountName && !account.name && !account.account_name) {
    errors.push('Account holder name is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valide qu'un objet compte Mobile Money contient les champs requis
 */
export function validateMobileMoneyAccount(account: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!account.phoneNumber && !account.phone_number) {
    errors.push('Phone number is required');
  }
  
  if (!account.operator && !account.provider) {
    errors.push('Operator/provider is required');
  }
  
  if (!account.accountName && !account.account_name) {
    errors.push('Account holder name is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
