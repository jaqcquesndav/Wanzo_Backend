export interface SalesByDay {
  date: string;
  amount: number;
}

export interface SalesByDayDetailed {
  date: string;
  amountCdf: number;
  amountUsd: number;
  count: number;
}

export interface TopSellingProduct {
  productId: string;
  name: string;
  quantitySold: number;
  totalRevenueCdf: number;
}

export interface LowStockProduct {
  productId: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  totalPurchasesCdf: number;
  totalPurchasesUsd: number;
  purchaseCount: number;
}

export interface SalesSummary {
  period: string;
  startDate: string;
  endDate: string;
  salesCdf: number;
  salesUsd: number;
  transactionCount: number;
  averageTransactionCdf: number;
  averageTransactionUsd: number;
  salesByDay: SalesByDayDetailed[];
}

export interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  averagePurchaseCdf: number;
  averagePurchaseUsd: number;
  topCustomers: TopCustomer[];
}

export interface JournalEntry {
  id: string;
  date: string;
  type: string;
  description: string;
  amountCdf: number;
  amountUsd: number;
  user: string;
}

export interface JournalResponse {
  items: JournalEntry[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}
