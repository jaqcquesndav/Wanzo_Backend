/**
 * Standardisation des codes opérateurs Mobile Money
 * Utiliser partout dans l'architecture pour éviter les incohérences
 */

export enum MobileMoneyOperatorCode {
  AIRTEL_MONEY = 'AM',
  ORANGE_MONEY = 'OM',
  MPESA = 'MP',
  AFRICELL = 'AF',
  WAVE = 'WAVE'
}

export enum MobileMoneyOperatorName {
  AIRTEL_MONEY = 'Airtel Money',
  ORANGE_MONEY = 'Orange Money',
  MPESA = 'M-Pesa',
  AFRICELL = 'Africell Money',
  WAVE = 'Wave'
}

/**
 * Mapping bidirectionnel entre codes et noms
 */
export const MOBILE_MONEY_OPERATOR_MAP = {
  [MobileMoneyOperatorCode.AIRTEL_MONEY]: MobileMoneyOperatorName.AIRTEL_MONEY,
  [MobileMoneyOperatorCode.ORANGE_MONEY]: MobileMoneyOperatorName.ORANGE_MONEY,
  [MobileMoneyOperatorCode.MPESA]: MobileMoneyOperatorName.MPESA,
  [MobileMoneyOperatorCode.AFRICELL]: MobileMoneyOperatorName.AFRICELL,
  [MobileMoneyOperatorCode.WAVE]: MobileMoneyOperatorName.WAVE,
} as const;

/**
 * Mapping inverse: nom → code
 */
export const MOBILE_MONEY_OPERATOR_REVERSE_MAP = {
  [MobileMoneyOperatorName.AIRTEL_MONEY]: MobileMoneyOperatorCode.AIRTEL_MONEY,
  [MobileMoneyOperatorName.ORANGE_MONEY]: MobileMoneyOperatorCode.ORANGE_MONEY,
  [MobileMoneyOperatorName.MPESA]: MobileMoneyOperatorCode.MPESA,
  [MobileMoneyOperatorName.AFRICELL]: MobileMoneyOperatorCode.AFRICELL,
  [MobileMoneyOperatorName.WAVE]: MobileMoneyOperatorCode.WAVE,
} as const;

/**
 * Utilitaire pour convertir un code en nom
 */
export function getOperatorName(code: MobileMoneyOperatorCode | string): string {
  return MOBILE_MONEY_OPERATOR_MAP[code as MobileMoneyOperatorCode] || code;
}

/**
 * Utilitaire pour convertir un nom en code
 */
export function getOperatorCode(name: MobileMoneyOperatorName | string): string {
  return MOBILE_MONEY_OPERATOR_REVERSE_MAP[name as MobileMoneyOperatorName] || name;
}

/**
 * Type pour les opérateurs valides (union type)
 */
export type MobileMoneyOperator = MobileMoneyOperatorCode | MobileMoneyOperatorName;

/**
 * Valider si une chaîne est un code opérateur valide
 */
export function isValidOperatorCode(code: string): code is MobileMoneyOperatorCode {
  return Object.values(MobileMoneyOperatorCode).includes(code as MobileMoneyOperatorCode);
}

/**
 * Valider si une chaîne est un nom opérateur valide
 */
export function isValidOperatorName(name: string): name is MobileMoneyOperatorName {
  return Object.values(MobileMoneyOperatorName).includes(name as MobileMoneyOperatorName);
}

/**
 * Normaliser un opérateur (code ou nom) vers le code standard
 */
export function normalizeOperator(operator: string): MobileMoneyOperatorCode | null {
  // Si c'est déjà un code valide
  if (isValidOperatorCode(operator)) {
    return operator as MobileMoneyOperatorCode;
  }
  
  // Si c'est un nom, convertir en code
  if (isValidOperatorName(operator)) {
    return getOperatorCode(operator) as MobileMoneyOperatorCode;
  }
  
  // Essayer de normaliser avec des variantes courantes
  const normalized = operator.toUpperCase().trim();
  
  if (normalized.includes('AIRTEL')) return MobileMoneyOperatorCode.AIRTEL_MONEY;
  if (normalized.includes('ORANGE')) return MobileMoneyOperatorCode.ORANGE_MONEY;
  if (normalized.includes('MPESA') || normalized.includes('M-PESA')) return MobileMoneyOperatorCode.MPESA;
  if (normalized.includes('AFRICELL')) return MobileMoneyOperatorCode.AFRICELL;
  if (normalized.includes('WAVE')) return MobileMoneyOperatorCode.WAVE;
  
  return null;
}
