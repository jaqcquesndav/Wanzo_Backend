/**
 * Énumération des types d'opérations pour le journal
 */
export enum OperationType {
  SALE_CASH = 'saleCash',
  SALE_CREDIT = 'saleCredit',
  SALE_INSTALLMENT = 'saleInstallment',
  STOCK_IN = 'stockIn',
  STOCK_OUT = 'stockOut',
  CASH_IN = 'cashIn',
  CASH_OUT = 'cashOut',
  CUSTOMER_PAYMENT = 'customerPayment',
  SUPPLIER_PAYMENT = 'supplierPayment',
  FINANCING_REQUEST = 'financingRequest',
  FINANCING_APPROVED = 'financingApproved',
  FINANCING_REPAYMENT = 'financingRepayment',
  OTHER = 'other'
}
