/**
 * Token Type Enum
 * Types of tokens in the system
 */
export enum TokenType {
  PURCHASED = 'purchased',
  BONUS = 'bonus',
  REWARD = 'reward',
}

/**
 * Token Transaction Type Enum
 * Types of token transactions
 */
export enum TokenTransactionType {
  PURCHASE = 'purchase',
  USAGE = 'usage',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
  EXPIRY = 'expiry',
  BONUS = 'bonus',
  ALLOCATION = 'allocation',
}
