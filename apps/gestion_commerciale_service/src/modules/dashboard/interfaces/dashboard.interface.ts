import { Currency } from '../enums/currency.enum';
import { OperationType } from '../enums/operation-type.enum';

/**
 * Structure du modèle DashboardData selon la documentation
 */
export interface DashboardData {
  salesTodayCdf: number;      // Montant des ventes du jour en Francs Congolais
  salesTodayUsd: number;      // Montant des ventes du jour en Dollars US
  clientsServedToday: number; // Nombre de clients uniques servis aujourd'hui
  receivables: number;        // Montant total des créances (à recevoir)
  expenses: number;           // Total des dépenses du jour
}

/**
 * Structure du modèle OperationJournalEntry selon la documentation
 */
export interface OperationJournalEntry {
  id: string;                           // Identifiant unique de l'opération
  date: string;                         // Date et heure de l'opération (ISO string)
  description: string;                  // Description de l'opération
  type: OperationType;                  // Type d'opération
  amount: number;                       // Montant de l'opération (positif pour entrées, négatif pour sorties)
  currencyCode: string;                 // Code de la devise (CDF, USD, etc.)
  isDebit: boolean;                     // Indique si c'est un débit
  isCredit: boolean;                    // Indique si c'est un crédit
  balanceAfter: number;                 // Solde total après l'opération
  relatedDocumentId?: string;           // ID du document lié (vente, achat, etc.) - optionnel
  quantity?: number;                    // Quantité pour les mouvements de stock - optionnel
  productId?: string;                   // ID du produit pour les mouvements de stock - optionnel
  productName?: string;                 // Nom du produit pour les mouvements de stock - optionnel
  paymentMethod?: string;               // Méthode de paiement - optionnel
  balancesByCurrency?: Record<string, number>; // Soldes par devise - optionnel
}

/**
 * Structure de réponse standard selon la documentation
 */
export interface ApiResponse<T = any> {
  success: boolean;           // Indique si la requête a réussi
  message: string;            // Message descriptif du résultat
  statusCode: number;         // Code de statut HTTP
  data: T;                    // Données retournées (peut être null)
  error?: string;             // Message d'erreur détaillé (optionnel)
}

/**
 * Structure des ventes du jour
 */
export interface SalesToday {
  cdf: number;
  usd: number;
}

// Interfaces existantes maintenues pour la compatibilité
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

export interface DashboardDataDetailed {
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
