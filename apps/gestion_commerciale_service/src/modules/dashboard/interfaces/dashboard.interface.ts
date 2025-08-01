import { Currency } from '../enums/currency.enum';
import { OperationType } from '../enums/operation-type.enum';

export interface DashboardSummary {
  salesTodayCdf: number;
  salesTodayUsd: number;
  salesThisWeekCdf: number;
  salesThisWeekUsd: number;
  salesThisMonthCdf: number;
  salesThisMonthUsd: number;
  totalCustomers: number;
  newCustomersToday: number;
  totalTransactions: number;
  transactionsToday: number;
  expensesTodayCdf: number;
  expensesTodayUsd: number;
  expensesThisWeekCdf: number;
  expensesThisWeekUsd: number;
  expensesThisMonthCdf: number;
  expensesThisMonthUsd: number;
  profitTodayCdf: number;
  profitTodayUsd: number;
  profitThisWeekCdf: number;
  profitThisWeekUsd: number;
  profitThisMonthCdf: number;
  profitThisMonthUsd: number;
}

export interface RecentSale {
  id: string;
  date: Date;
  customerName: string;
  totalAmount: number;
  currency: Currency;
  status: string;
}

export interface RecentCustomer {
  id: string;
  name: string;
  phone: string;
  registrationDate: Date;
  totalPurchases: number;
  totalAmountCdf: number;
}

export interface DailySales {
  date: string; // Format: YYYY-MM-DD
  amount: number;
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

export interface JournalEntry {
  id: string;
  date: Date;
  operationType: OperationType;
  entityId?: string;
  description: string;
  amount: number;
  currency: Currency;
  userName?: string;
}

export interface DashboardData {
  date: Date;
  summary: DashboardSummary;
  recentSales: RecentSale[];
  recentCustomers: RecentCustomer[];
  salesByDayCdf: DailySales[];
  salesByDayUsd: DailySales[];
  topSellingProducts: TopSellingProduct[];
  lowStockProducts: LowStockProduct[];
  journalEntries: JournalEntry[];
}
