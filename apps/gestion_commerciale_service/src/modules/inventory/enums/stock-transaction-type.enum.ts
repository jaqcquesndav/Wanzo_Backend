/**
 * Enum représentant les types de transactions de stock
 */
export enum StockTransactionType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  ADJUSTMENT = 'adjustment',
  TRANSFER_IN = 'transferIn',
  TRANSFER_OUT = 'transferOut',
  RETURNED = 'returned',
  DAMAGED = 'damaged',
  LOST = 'lost',
  INITIAL_STOCK = 'initialStock'
}
